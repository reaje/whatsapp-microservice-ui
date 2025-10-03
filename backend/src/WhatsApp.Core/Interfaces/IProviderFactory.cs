using WhatsApp.Core.Enums;

namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Factory para criação e gerenciamento de providers de WhatsApp
/// </summary>
public interface IProviderFactory
{
    /// <summary>
    /// Obtém uma instância de provider baseado no tipo
    /// </summary>
    IWhatsAppProvider GetProvider(ProviderType providerType);

    /// <summary>
    /// Obtém o provider preferencial do tenant, com fallback para Baileys
    /// </summary>
    IWhatsAppProvider GetProviderForTenant(Guid tenantId, ProviderType? preferredProvider = null);

    /// <summary>
    /// Valida se um provider está disponível e saudável
    /// </summary>
    Task<bool> IsProviderHealthyAsync(ProviderType providerType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém estatísticas de uso dos providers
    /// </summary>
    Task<Dictionary<ProviderType, ProviderStats>> GetProviderStatsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Estatísticas de uso de um provider
/// </summary>
public class ProviderStats
{
    public ProviderType ProviderType { get; set; }
    public bool IsHealthy { get; set; }
    public int TotalSessions { get; set; }
    public int ActiveSessions { get; set; }
    public int MessagesSentToday { get; set; }
    public DateTime LastHealthCheck { get; set; }
    public TimeSpan AverageResponseTime { get; set; }
    public double SuccessRate { get; set; }
}
