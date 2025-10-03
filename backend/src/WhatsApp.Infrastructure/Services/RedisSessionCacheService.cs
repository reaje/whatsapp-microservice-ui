using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;
using WhatsApp.Core.Models;

namespace WhatsApp.Infrastructure.Services;

/// <summary>
/// Implementação de cache de sessões usando Redis
/// </summary>
public class RedisSessionCacheService : ISessionCacheService
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly IDatabase? _db;
    private readonly ILogger<RedisSessionCacheService> _logger;
    private readonly bool _isEnabled;

    // Prefixos para chaves Redis
    private const string SESSION_STATUS_PREFIX = "session:status:";
    private const string SESSION_QR_PREFIX = "session:qr:";
    private const string TENANT_SESSIONS_PREFIX = "tenant:sessions:";

    // TTL padrão: 5 minutos para status, 2 minutos para QR code
    private static readonly TimeSpan DefaultStatusTTL = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan DefaultQRTTL = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan DefaultSessionsTTL = TimeSpan.FromMinutes(10);

    public RedisSessionCacheService(
        IConfiguration configuration,
        ILogger<RedisSessionCacheService> logger)
    {
        _logger = logger;

        var redisConnectionString = configuration["Redis:ConnectionString"];

        if (string.IsNullOrWhiteSpace(redisConnectionString))
        {
            _logger.LogWarning("Redis connection string not configured. Cache will be disabled.");
            _isEnabled = false;
            return;
        }

        try
        {
            var options = ConfigurationOptions.Parse(redisConnectionString);
            options.ConnectRetry = 3;
            options.ConnectTimeout = 5000;
            options.SyncTimeout = 5000;
            options.AbortOnConnectFail = false;

            _redis = ConnectionMultiplexer.Connect(options);
            _db = _redis.GetDatabase();
            _isEnabled = true;

            _logger.LogInformation("Redis connection established successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to Redis. Cache will be disabled.");
            _isEnabled = false;
        }
    }

    private string GetStatusKey(Guid tenantId, string phoneNumber) =>
        $"{SESSION_STATUS_PREFIX}{tenantId}:{phoneNumber}";

    private string GetQRKey(Guid tenantId, string phoneNumber) =>
        $"{SESSION_QR_PREFIX}{tenantId}:{phoneNumber}";

    private string GetTenantSessionsKey(Guid tenantId) =>
        $"{TENANT_SESSIONS_PREFIX}{tenantId}";

    public async Task SetSessionStatusAsync(Guid tenantId, string phoneNumber, SessionStatus status, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return;

        try
        {
            var key = GetStatusKey(tenantId, phoneNumber);
            var json = JsonSerializer.Serialize(status);
            await _db.StringSetAsync(key, json, expiry ?? DefaultStatusTTL);

            _logger.LogDebug("Cached session status for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache session status for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
        }
    }

    public async Task<SessionStatus?> GetSessionStatusAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return null;

        try
        {
            var key = GetStatusKey(tenantId, phoneNumber);
            var json = await _db.StringGetAsync(key);

            if (json.IsNullOrEmpty) return null;

            var status = JsonSerializer.Deserialize<SessionStatus>(json!);
            _logger.LogDebug("Cache HIT for session status: tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);

            return status;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cached session status for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
            return null;
        }
    }

    public async Task SetQRCodeAsync(Guid tenantId, string phoneNumber, string qrCode, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return;

        try
        {
            var key = GetQRKey(tenantId, phoneNumber);
            await _db.StringSetAsync(key, qrCode, expiry ?? DefaultQRTTL);

            _logger.LogDebug("Cached QR code for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache QR code for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
        }
    }

    public async Task<string?> GetQRCodeAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return null;

        try
        {
            var key = GetQRKey(tenantId, phoneNumber);
            var qrCode = await _db.StringGetAsync(key);

            if (qrCode.IsNullOrEmpty) return null;

            _logger.LogDebug("Cache HIT for QR code: tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
            return qrCode!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cached QR code for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
            return null;
        }
    }

    public async Task SetTenantSessionsAsync(Guid tenantId, IEnumerable<WhatsAppSession> sessions, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return;

        try
        {
            var key = GetTenantSessionsKey(tenantId);
            var json = JsonSerializer.Serialize(sessions);
            await _db.StringSetAsync(key, json, expiry ?? DefaultSessionsTTL);

            _logger.LogDebug("Cached tenant sessions for tenant {TenantId}", tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache tenant sessions for tenant {TenantId}", tenantId);
        }
    }

    public async Task<IEnumerable<WhatsAppSession>?> GetTenantSessionsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return null;

        try
        {
            var key = GetTenantSessionsKey(tenantId);
            var json = await _db.StringGetAsync(key);

            if (json.IsNullOrEmpty) return null;

            var sessions = JsonSerializer.Deserialize<IEnumerable<WhatsAppSession>>(json!);
            _logger.LogDebug("Cache HIT for tenant sessions: tenant {TenantId}", tenantId);

            return sessions;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cached tenant sessions for tenant {TenantId}", tenantId);
            return null;
        }
    }

    public async Task InvalidateSessionCacheAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return;

        try
        {
            var statusKey = GetStatusKey(tenantId, phoneNumber);
            var qrKey = GetQRKey(tenantId, phoneNumber);
            var tenantSessionsKey = GetTenantSessionsKey(tenantId);

            await _db.KeyDeleteAsync(new RedisKey[] { statusKey, qrKey, tenantSessionsKey });

            _logger.LogDebug("Invalidated cache for session: tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to invalidate session cache for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
        }
    }

    public async Task InvalidateTenantCacheAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return;

        try
        {
            // Remove cache de todas as sessões do tenant
            var server = _redis!.GetServer(_redis.GetEndPoints()[0]);
            var pattern = $"{SESSION_STATUS_PREFIX}{tenantId}:*";
            var qrPattern = $"{SESSION_QR_PREFIX}{tenantId}:*";
            var tenantKey = GetTenantSessionsKey(tenantId);

            var keysToDelete = new List<RedisKey>();

            await foreach (var key in server.KeysAsync(pattern: pattern))
            {
                keysToDelete.Add(key);
            }

            await foreach (var key in server.KeysAsync(pattern: qrPattern))
            {
                keysToDelete.Add(key);
            }

            keysToDelete.Add(tenantKey);

            if (keysToDelete.Count > 0)
            {
                await _db.KeyDeleteAsync(keysToDelete.ToArray());
            }

            _logger.LogDebug("Invalidated all cache for tenant {TenantId}", tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to invalidate tenant cache for tenant {TenantId}", tenantId);
        }
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        if (!_isEnabled || _db == null) return false;

        try
        {
            await _db.PingAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
