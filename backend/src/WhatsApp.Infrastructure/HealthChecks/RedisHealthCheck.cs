using Microsoft.Extensions.Diagnostics.HealthChecks;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.Infrastructure.HealthChecks;

/// <summary>
/// Health check para verificar a disponibilidade do Redis
/// </summary>
public class RedisHealthCheck : IHealthCheck
{
    private readonly ISessionCacheService _cacheService;

    public RedisHealthCheck(ISessionCacheService cacheService)
    {
        _cacheService = cacheService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var isHealthy = await _cacheService.IsHealthyAsync(cancellationToken);

            if (isHealthy)
            {
                return HealthCheckResult.Healthy("Redis cache is available and responding");
            }

            return HealthCheckResult.Degraded("Redis cache is not configured or not available");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Redis cache is unhealthy", ex);
        }
    }
}
