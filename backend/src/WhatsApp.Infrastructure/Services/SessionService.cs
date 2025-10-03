using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Interfaces;
using WhatsApp.Core.Models;

namespace WhatsApp.Infrastructure.Services;

public class SessionService : ISessionService
{
    private readonly ISessionRepository _sessionRepository;
    private readonly IWhatsAppProvider _whatsAppProvider;
    private readonly ILogger<SessionService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ISessionCacheService _cacheService;

    public SessionService(
        ISessionRepository sessionRepository,
        IWhatsAppProvider whatsAppProvider,
        ILogger<SessionService> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ISessionCacheService cacheService)
    {
        _sessionRepository = sessionRepository;
        _whatsAppProvider = whatsAppProvider;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _cacheService = cacheService;
    }

    /// <summary>
    /// Normalizes phone number by removing '+' and any non-numeric characters
    /// </summary>
    private static string NormalizePhoneNumber(string phoneNumber)
    {
        return phoneNumber.Replace("+", "").Trim();
    }

    public async Task<SessionStatus> InitializeSessionAsync(Guid tenantId, string phoneNumber, ProviderType providerType, CancellationToken cancellationToken = default)
    {
        // Normalize phone number (remove '+' and whitespaces)
        var normalizedPhone = NormalizePhoneNumber(phoneNumber);

        _logger.LogInformation("Initializing session for tenant {TenantId}, phone {PhoneNumber} (normalized: {NormalizedPhone}), provider {Provider}",
            tenantId, phoneNumber, normalizedPhone, providerType);

        // Check if session already exists
        var existingSession = await _sessionRepository.GetByTenantAndPhoneAsync(tenantId, normalizedPhone, cancellationToken);

        if (existingSession != null)
        {
            _logger.LogInformation("Found existing session for phone {PhoneNumber}. Deleting old session before creating new one.", normalizedPhone);

            try
            {
                // Try to disconnect from provider if session is active
                if (existingSession.IsActive)
                {
                    try
                    {
                        await _whatsAppProvider.DisconnectAsync(cancellationToken);
                        _logger.LogInformation("Disconnected existing active session for phone {PhoneNumber}", normalizedPhone);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to disconnect existing session, continuing with deletion");
                    }
                }

                // Delete old session from database
                await _sessionRepository.DeleteAsync(existingSession, cancellationToken);
                _logger.LogInformation("Deleted existing session for phone {PhoneNumber}", normalizedPhone);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting existing session for phone {PhoneNumber}", normalizedPhone);
                throw;
            }
        }

        // Create tenant config
        var config = new TenantConfig
        {
            TenantId = tenantId,
            PreferredProvider = providerType,
            ClientId = $"tenant-{tenantId}"
        };

        // Initialize provider
        var status = await _whatsAppProvider.InitializeAsync(normalizedPhone, config, cancellationToken);

        // Create new session in database
        var metadata = status.Metadata ?? new Dictionary<string, object>();
        metadata["status"] = status.Status; // Include status in metadata

        var newSession = new WhatsAppSession
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PhoneNumber = normalizedPhone,
            ProviderType = providerType,
            IsActive = status.IsConnected,
            SessionData = JsonDocument.Parse(JsonSerializer.Serialize(metadata)),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _sessionRepository.AddAsync(newSession, cancellationToken);

        // Invalidate cache quando nova sessão é criada
        await _cacheService.InvalidateSessionCacheAsync(tenantId, normalizedPhone, cancellationToken);

        _logger.LogInformation("New session created successfully for phone {PhoneNumber}", normalizedPhone);

        return status;
    }

    public async Task<SessionStatus> GetSessionStatusAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        var normalizedPhone = NormalizePhoneNumber(phoneNumber);
        _logger.LogInformation("Getting session status for tenant {TenantId}, phone {PhoneNumber} (normalized: {NormalizedPhone})", tenantId, phoneNumber, normalizedPhone);

        // Tentar cache primeiro
        var cachedStatus = await _cacheService.GetSessionStatusAsync(tenantId, normalizedPhone, cancellationToken);
        if (cachedStatus != null)
        {
            _logger.LogDebug("Returning cached session status for phone {PhoneNumber}", normalizedPhone);
            return cachedStatus;
        }

        var session = await _sessionRepository.GetByTenantAndPhoneAsync(tenantId, normalizedPhone, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("Session not found for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
            return new SessionStatus
            {
                IsConnected = false,
                Status = "not_found",
                PhoneNumber = phoneNumber
            };
        }

        // Try to get Baileys sessionId from metadata
        string? sessionId = null;
        try
        {
            if (session.SessionData != null)
            {
                var root = session.SessionData.RootElement;
                if (root.TryGetProperty("sessionId", out var sid))
                {
                    sessionId = sid.GetString();
                }
            }
        }
        catch { /* ignore */ }

        // If we have a sessionId, query Baileys directly to get real-time status
        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            try
            {
                var client = _httpClientFactory.CreateClient("BaileysService");
                var resp = await client.GetAsync($"/api/sessions/{sessionId}/status", cancellationToken);
                if (resp.IsSuccessStatusCode)
                {
                    var content = await resp.Content.ReadAsStringAsync(cancellationToken);
                    var doc = JsonDocument.Parse(content);
                    var statusStr = doc.RootElement.TryGetProperty("status", out var st) ? (st.GetString() ?? "unknown") : "unknown";
                    var qr = doc.RootElement.TryGetProperty("qrCode", out var qrEl) ? qrEl.GetString() : null;

                    var isConnected = statusStr == "connected" || statusStr == "already_connected";

                    // Persist latest status (and qr if present)
                    try
                    {
                        var metadata = new Dictionary<string, object>
                        {
                            { "status", statusStr },
                            { "sessionId", sessionId }
                        };
                        if (!string.IsNullOrWhiteSpace(qr))
                        {
                            metadata["qrCode"] = qr!;
                        }
                        session.SessionData = JsonDocument.Parse(JsonSerializer.Serialize(metadata));
                        session.IsActive = isConnected;
                        session.UpdatedAt = DateTime.UtcNow;
                        await _sessionRepository.UpdateAsync(session, cancellationToken);
                    }
                    catch { /* best-effort */ }

                    var statusResult = new SessionStatus
                    {
                        IsConnected = isConnected,
                        PhoneNumber = normalizedPhone,
                        Status = statusStr,
                        ConnectedAt = isConnected ? DateTime.UtcNow : null,
                        QrCode = qr,
                        Metadata = new Dictionary<string, object>
                        {
                            { "provider", "baileys" },
                            { "sessionId", sessionId }
                        }
                    };

                    // Cachear resultado
                    await _cacheService.SetSessionStatusAsync(tenantId, normalizedPhone, statusResult, cancellationToken: cancellationToken);

                    return statusResult;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get status from Baileys for session {SessionId}", sessionId);
            }
        }

        // Fallback to provider (may be stateless per request)
        var providerStatus = await _whatsAppProvider.GetStatusAsync(cancellationToken);

        // Update session if status changed
        if (session.IsActive != providerStatus.IsConnected)
        {
            session.IsActive = providerStatus.IsConnected;
            session.UpdatedAt = DateTime.UtcNow;
            await _sessionRepository.UpdateAsync(session, cancellationToken);
        }

        // Cachear resultado
        await _cacheService.SetSessionStatusAsync(tenantId, normalizedPhone, providerStatus, cancellationToken: cancellationToken);

        return providerStatus;
    }

    public async Task<IEnumerable<WhatsAppSession>> GetTenantSessionsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting all sessions for tenant {TenantId}", tenantId);

        // Tentar cache primeiro
        var cachedSessions = await _cacheService.GetTenantSessionsAsync(tenantId, cancellationToken);
        if (cachedSessions != null)
        {
            _logger.LogDebug("Returning cached tenant sessions for tenant {TenantId}", tenantId);
            return cachedSessions;
        }

        var sessions = await _sessionRepository.GetByTenantAsync(tenantId, cancellationToken);

        // Cachear resultado
        await _cacheService.SetTenantSessionsAsync(tenantId, sessions, cancellationToken: cancellationToken);

        return sessions;
    }

    public async Task<bool> DisconnectSessionAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        var normalizedPhone = NormalizePhoneNumber(phoneNumber);
        _logger.LogInformation("Disconnecting session for tenant {TenantId}, phone {PhoneNumber} (normalized: {NormalizedPhone})", tenantId, phoneNumber, normalizedPhone);

        var session = await _sessionRepository.GetByTenantAndPhoneAsync(tenantId, normalizedPhone, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("Session not found for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
            return false;
        }

        // Disconnect from provider
        await _whatsAppProvider.DisconnectAsync(cancellationToken);

        // Update session status
        session.IsActive = false;
        session.UpdatedAt = DateTime.UtcNow;
        await _sessionRepository.UpdateAsync(session, cancellationToken);

        // Invalidate cache
        await _cacheService.InvalidateSessionCacheAsync(tenantId, normalizedPhone, cancellationToken);

        _logger.LogInformation("Session disconnected successfully for phone {PhoneNumber}", phoneNumber);

        return true;
    }

    public async Task<string?> GetQRCodeAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        var normalizedPhone = NormalizePhoneNumber(phoneNumber);
        _logger.LogInformation("Getting QR code for tenant {TenantId}, phone {PhoneNumber} (normalized: {NormalizedPhone})", tenantId, phoneNumber, normalizedPhone);

        // Tentar cache primeiro
        var cachedQR = await _cacheService.GetQRCodeAsync(tenantId, normalizedPhone, cancellationToken);
        if (cachedQR != null)
        {
            _logger.LogDebug("Returning cached QR code for phone {PhoneNumber}", normalizedPhone);
            return cachedQR;
        }

        var session = await _sessionRepository.GetByTenantAndPhoneAsync(tenantId, normalizedPhone, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("Session not found for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);
            return null;
        }

        // 1) Try extract from DB metadata
        if (session.SessionData != null)
        {
            try
            {
                var sessionDataJson = session.SessionData.RootElement;
                if (sessionDataJson.TryGetProperty("qrCode", out var qrCodeElement))
                {
                    var qrCodeValue = qrCodeElement.GetString();
                    if (!string.IsNullOrWhiteSpace(qrCodeValue))
                    {
                        _logger.LogInformation("Found QR code in session metadata for phone {PhoneNumber}", normalizedPhone);

                        // Cachear QR code
                        await _cacheService.SetQRCodeAsync(tenantId, normalizedPhone, qrCodeValue, cancellationToken: cancellationToken);

                        return qrCodeValue;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting QR code from session metadata for phone {PhoneNumber}", normalizedPhone);
            }
        }

        // 2) Fallback: query Baileys service by sessionId in metadata
        try
        {
            string? sessionId = null;
            if (session.SessionData != null)
            {
                var root = session.SessionData.RootElement;
                if (root.TryGetProperty("sessionId", out var sid))
                {
                    sessionId = sid.GetString();
                }
            }

            if (!string.IsNullOrWhiteSpace(sessionId))
            {
                var client = _httpClientFactory.CreateClient("BaileysService");
                var resp = await client.GetAsync($"/api/sessions/{sessionId}/status", cancellationToken);
                if (resp.IsSuccessStatusCode)
                {
                    var content = await resp.Content.ReadAsStringAsync(cancellationToken);
                    var doc = JsonDocument.Parse(content);
                    if (doc.RootElement.TryGetProperty("qrCode", out var qrEl))
                    {
                        var qrValue = qrEl.GetString();
                        if (!string.IsNullOrWhiteSpace(qrValue))
                        {
                            // Persist QR for subsequent calls
                            try
                            {
                                var metadata = new Dictionary<string, object>
                                {
                                    { "status", doc.RootElement.TryGetProperty("status", out var st) ? (st.GetString() ?? "unknown") : "unknown" },
                                    { "sessionId", sessionId! },
                                    { "qrCode", qrValue! }
                                };
                                session.SessionData = JsonDocument.Parse(JsonSerializer.Serialize(metadata));
                                session.UpdatedAt = DateTime.UtcNow;
                                await _sessionRepository.UpdateAsync(session, cancellationToken);
                            }
                            catch { }

                            // Cachear QR code
                            await _cacheService.SetQRCodeAsync(tenantId, normalizedPhone, qrValue, cancellationToken: cancellationToken);

                            return qrValue;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch QR from Baileys service for phone {PhoneNumber}", normalizedPhone);
        }

        return null;
    }
}
