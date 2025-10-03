using WhatsApp.Core.Entities;

namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Serviço para gerenciamento de agentes de IA
/// </summary>
public interface IAIAgentService
{
    /// <summary>
    /// Cria um novo agente de IA
    /// </summary>
    Task<AIAgent> CreateAgentAsync(Guid tenantId, string name, string? type, object? configuration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém um agente por ID
    /// </summary>
    Task<AIAgent?> GetAgentByIdAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém todos os agentes de um tenant
    /// </summary>
    Task<IEnumerable<AIAgent>> GetAllAgentsAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém agentes ativos de um tenant
    /// </summary>
    Task<IEnumerable<AIAgent>> GetActiveAgentsAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Atualiza um agente
    /// </summary>
    Task<AIAgent> UpdateAgentAsync(Guid tenantId, Guid agentId, string? name, string? type, object? configuration, bool? isActive, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deleta um agente
    /// </summary>
    Task<bool> DeleteAgentAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ativa/desativa um agente
    /// </summary>
    Task<bool> ToggleAgentAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default);
}
