using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.Infrastructure.Providers;

/// <summary>
/// Factory para criação e gerenciamento de providers de WhatsApp
/// Implementa pattern Factory + Strategy para seleção dinâmica de providers
/// </summary>
public class ProviderFactory : IProviderFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ProviderFactory> _logger;
    private readonly ITenantRepository _tenantRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly Dictionary<ProviderType, DateTime> _lastHealthChecks;
    private readonly Dictionary<ProviderType, bool> _healthStatus;

    public ProviderFactory(
        IServiceProvider serviceProvider,
        ILogger<ProviderFactory> logger,
        ITenantRepository tenantRepository,
        ISessionRepository sessionRepository)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _tenantRepository = tenantRepository;
        _sessionRepository = sessionRepository;
        _lastHealthChecks = new Dictionary<ProviderType, DateTime>();
        _healthStatus = new Dictionary<ProviderType, bool>
        {
            { ProviderType.Baileys, true },  // Baileys sempre disponível por padrão
            { ProviderType.MetaApi, false }  // Meta API ainda não implementado
        };
    }

    public IWhatsAppProvider GetProvider(ProviderType providerType)
    {
        _logger.LogDebug("Getting provider for type: {ProviderType}", providerType);

        return providerType switch
        {
            ProviderType.Baileys => _serviceProvider.GetRequiredService<BaileysProvider>(),
            ProviderType.MetaApi => _serviceProvider.GetRequiredService<MetaApiProvider>(),
            _ => throw new ArgumentException($"Unsupported provider type: {providerType}", nameof(providerType))
        };
    }

    public IWhatsAppProvider GetProviderForTenant(Guid tenantId, ProviderType? preferredProvider = null)
    {
        _logger.LogInformation("Getting provider for tenant {TenantId}, preferred: {PreferredProvider}",
            tenantId, preferredProvider);

        // Se provider preferencial foi especificado, tentar usá-lo
        if (preferredProvider.HasValue)
        {
            var isHealthy = _healthStatus.GetValueOrDefault(preferredProvider.Value, false);
            if (isHealthy)
            {
                _logger.LogInformation("Using preferred provider {Provider} for tenant {TenantId}",
                    preferredProvider.Value, tenantId);
                return GetProvider(preferredProvider.Value);
            }
            else
            {
                _logger.LogWarning("Preferred provider {Provider} is not healthy for tenant {TenantId}, falling back",
                    preferredProvider.Value, tenantId);
            }
        }

        // Fallback para Baileys (sempre disponível)
        _logger.LogInformation("Using fallback provider Baileys for tenant {TenantId}", tenantId);
        return GetProvider(ProviderType.Baileys);
    }

    public async Task<bool> IsProviderHealthyAsync(ProviderType providerType, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Checking health for provider: {ProviderType}", providerType);

        // Cache de 5 minutos para health checks
        if (_lastHealthChecks.TryGetValue(providerType, out var lastCheck))
        {
            if (DateTime.UtcNow - lastCheck < TimeSpan.FromMinutes(5))
            {
                return _healthStatus.GetValueOrDefault(providerType, false);
            }
        }

        // Executar health check
        bool isHealthy = false;

        try
        {
            var provider = GetProvider(providerType);
            var status = await provider.GetStatusAsync(cancellationToken);

            // Considerar saudável se não retornou erro crítico
            isHealthy = status.Status != "critical_error";

            _logger.LogInformation("Provider {ProviderType} health check: {IsHealthy}", providerType, isHealthy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking health for provider {ProviderType}", providerType);
            isHealthy = false;
        }

        // Atualizar cache
        _lastHealthChecks[providerType] = DateTime.UtcNow;
        _healthStatus[providerType] = isHealthy;

        return isHealthy;
    }

    public async Task<Dictionary<ProviderType, ProviderStats>> GetProviderStatsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Getting provider statistics");

        var stats = new Dictionary<ProviderType, ProviderStats>();

        foreach (var providerType in Enum.GetValues<ProviderType>())
        {
            try
            {
                var isHealthy = await IsProviderHealthyAsync(providerType, cancellationToken);

                // Buscar sessões ativas para este provider
                var allSessions = await _sessionRepository.GetAllAsync(cancellationToken);
                var providerSessions = allSessions.Where(s => s.ProviderType == providerType).ToList();
                var activeSessions = providerSessions.Count(s => s.IsActive);

                stats[providerType] = new ProviderStats
                {
                    ProviderType = providerType,
                    IsHealthy = isHealthy,
                    TotalSessions = providerSessions.Count,
                    ActiveSessions = activeSessions,
                    MessagesSentToday = 0, // TODO: Implementar contador de mensagens
                    LastHealthCheck = _lastHealthChecks.GetValueOrDefault(providerType, DateTime.MinValue),
                    AverageResponseTime = TimeSpan.Zero, // TODO: Implementar medição de tempo
                    SuccessRate = isHealthy ? 1.0 : 0.0
                };

                _logger.LogInformation("Provider {ProviderType} stats: {ActiveSessions}/{TotalSessions} sessions active",
                    providerType, activeSessions, providerSessions.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stats for provider {ProviderType}", providerType);

                stats[providerType] = new ProviderStats
                {
                    ProviderType = providerType,
                    IsHealthy = false,
                    LastHealthCheck = DateTime.UtcNow,
                    SuccessRate = 0.0
                };
            }
        }

        return stats;
    }
}
