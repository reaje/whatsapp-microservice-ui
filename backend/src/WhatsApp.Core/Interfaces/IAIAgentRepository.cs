using WhatsApp.Core.Entities;

namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Repositório para gerenciamento de agentes de IA
/// </summary>
public interface IAIAgentRepository : IRepository<AIAgent>
{
    /// <summary>
    /// Obtém todos os agentes de um tenant
    /// </summary>
    Task<IEnumerable<AIAgent>> GetByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém agentes ativos de um tenant
    /// </summary>
    Task<IEnumerable<AIAgent>> GetActiveByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém um agente por tenant e ID
    /// </summary>
    Task<AIAgent?> GetByTenantAndIdAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém um agente por tenant e nome
    /// </summary>
    Task<AIAgent?> GetByTenantAndNameAsync(Guid tenantId, string name, CancellationToken cancellationToken = default);
}
