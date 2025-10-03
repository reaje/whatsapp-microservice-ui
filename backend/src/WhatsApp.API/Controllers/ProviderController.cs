using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhatsApp.API.Extensions;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ProviderController : ControllerBase
{
    private readonly IProviderFactory _providerFactory;
    private readonly ILogger<ProviderController> _logger;

    public ProviderController(
        IProviderFactory providerFactory,
        ILogger<ProviderController> logger)
    {
        _providerFactory = providerFactory;
        _logger = logger;
    }

    /// <summary>
    /// Obtém estatísticas de todos os providers disponíveis
    /// </summary>
    /// <remarks>
    /// Retorna estatísticas detalhadas de todos os providers (Baileys e Meta API), incluindo:
    /// - Total de sessões ativas
    /// - Status de saúde do provider
    /// - Último health check
    /// - Taxa de sucesso de envio
    /// - Tempo médio de resposta
    ///
    /// Exemplo de resposta:
    ///
    ///     GET /api/v1/provider/stats
    ///     {
    ///       "Baileys": {
    ///         "providerType": "Baileys",
    ///         "isHealthy": true,
    ///         "totalSessions": 5,
    ///         "activeSessions": 3,
    ///         "messagesSentToday": 120,
    ///         "lastHealthCheck": "2025-10-03T14:30:00Z",
    ///         "averageResponseTime": "00:00:01.234",
    ///         "successRate": 0.98
    ///       },
    ///       "MetaApi": {
    ///         "providerType": "MetaApi",
    ///         "isHealthy": false,
    ///         "totalSessions": 0,
    ///         "activeSessions": 0
    ///       }
    ///     }
    /// </remarks>
    /// <response code="200">Retorna estatísticas de todos os providers</response>
    /// <response code="401">Não autenticado ou tenant inválido</response>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(Dictionary<ProviderType, ProviderStats>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProviderStats(CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Getting provider stats for tenant {TenantId}", tenantId);

        var stats = await _providerFactory.GetProviderStatsAsync(cancellationToken);

        return Ok(stats);
    }

    /// <summary>
    /// Verifica a saúde de um provider específico
    /// </summary>
    /// <param name="providerType">Tipo do provider (Baileys ou MetaApi)</param>
    /// <remarks>
    /// Executa health check no provider especificado e retorna o status atual.
    ///
    /// O resultado é cacheado por 5 minutos para evitar sobrecarga.
    ///
    /// Exemplo de resposta:
    ///
    ///     GET /api/v1/provider/Baileys/health
    ///     {
    ///       "providerType": "Baileys",
    ///       "isHealthy": true,
    ///       "checkedAt": "2025-10-03T14:30:00Z",
    ///       "message": "Provider Baileys is healthy and operational"
    ///     }
    /// </remarks>
    /// <response code="200">Retorna status de saúde do provider</response>
    /// <response code="401">Não autenticado ou tenant inválido</response>
    [HttpGet("{providerType}/health")]
    [ProducesResponseType(typeof(ProviderHealthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckProviderHealth(
        [FromRoute] ProviderType providerType,
        CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Checking health for provider {ProviderType}, tenant {TenantId}",
            providerType, tenantId);

        var isHealthy = await _providerFactory.IsProviderHealthyAsync(providerType, cancellationToken);

        var response = new ProviderHealthResponse
        {
            ProviderType = providerType,
            IsHealthy = isHealthy,
            CheckedAt = DateTime.UtcNow,
            Message = isHealthy
                ? $"Provider {providerType} is healthy and operational"
                : $"Provider {providerType} is not healthy or not available"
        };

        return Ok(response);
    }

    /// <summary>
    /// Obtém o status detalhado de um provider específico
    /// </summary>
    /// <param name="providerType">Tipo do provider (Baileys ou MetaApi)</param>
    /// <remarks>
    /// Retorna o status completo do provider, incluindo metadados e configurações.
    ///
    /// Diferente do endpoint /health, este retorna informações mais detalhadas
    /// sobre o estado interno do provider.
    ///
    /// Exemplo de resposta (Baileys):
    ///
    ///     GET /api/v1/provider/Baileys/status
    ///     {
    ///       "isConnected": true,
    ///       "status": "connected",
    ///       "metadata": {
    ///         "provider": "baileys",
    ///         "version": "6.0.0",
    ///         "uptime": "2h 15m"
    ///       }
    ///     }
    /// </remarks>
    /// <response code="200">Retorna status detalhado do provider</response>
    /// <response code="401">Não autenticado ou tenant inválido</response>
    [HttpGet("{providerType}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProviderStatus(
        [FromRoute] ProviderType providerType,
        CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Getting status for provider {ProviderType}, tenant {TenantId}",
            providerType, tenantId);

        var provider = _providerFactory.GetProvider(providerType);
        var status = await provider.GetStatusAsync(cancellationToken);

        return Ok(status);
    }

    /// <summary>
    /// Obtém o provider recomendado para o tenant atual
    /// </summary>
    /// <param name="preferredProvider">Provider preferencial (opcional). Se não saudável, faz fallback para Baileys</param>
    /// <remarks>
    /// Retorna o provider recomendado baseado na saúde e disponibilidade.
    ///
    /// **Lógica de seleção:**
    /// 1. Se `preferredProvider` for especificado e estiver saudável → usa ele
    /// 2. Se `preferredProvider` não estiver saudável → fallback para Baileys
    /// 3. Se nenhum `preferredProvider` especificado → usa Baileys (padrão)
    ///
    /// **Baileys sempre disponível** - É o provider padrão e sempre considerado saudável.
    ///
    /// Exemplo de request:
    ///
    ///     GET /api/v1/provider/recommended?preferredProvider=MetaApi
    ///
    /// Exemplo de resposta (fallback para Baileys porque MetaApi não está disponível):
    ///
    ///     {
    ///       "providerType": "Baileys",
    ///       "isHealthy": true,
    ///       "reason": "Preferred provider MetaApi is not healthy, using fallback: Baileys"
    ///     }
    /// </remarks>
    /// <response code="200">Retorna provider recomendado</response>
    /// <response code="401">Não autenticado ou tenant inválido</response>
    [HttpGet("recommended")]
    [ProducesResponseType(typeof(RecommendedProviderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRecommendedProvider(
        [FromQuery] ProviderType? preferredProvider = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Getting recommended provider for tenant {TenantId}, preferred: {PreferredProvider}",
            tenantId, preferredProvider);

        var provider = _providerFactory.GetProviderForTenant(tenantId, preferredProvider);
        var status = await provider.GetStatusAsync(cancellationToken);

        // Inferir o tipo do provider baseado no status
        var providerType = status.Metadata != null && status.Metadata.ContainsKey("provider")
            ? status.Metadata["provider"].ToString() == "baileys" ? ProviderType.Baileys : ProviderType.MetaApi
            : ProviderType.Baileys;

        var response = new RecommendedProviderResponse
        {
            ProviderType = providerType,
            IsHealthy = status.IsConnected || status.Status != "critical_error",
            Reason = preferredProvider.HasValue
                ? $"Using preferred provider: {preferredProvider.Value}"
                : "Using default provider: Baileys"
        };

        return Ok(response);
    }
}

#region Response DTOs

public class ProviderHealthResponse
{
    public ProviderType ProviderType { get; set; }
    public bool IsHealthy { get; set; }
    public DateTime CheckedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class RecommendedProviderResponse
{
    public ProviderType ProviderType { get; set; }
    public bool IsHealthy { get; set; }
    public string Reason { get; set; } = string.Empty;
}

#endregion
