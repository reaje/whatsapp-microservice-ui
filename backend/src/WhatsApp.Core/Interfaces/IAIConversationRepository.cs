using WhatsApp.Core.Entities;

namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Repositório para gerenciamento de conversas de IA
/// </summary>
public interface IAIConversationRepository : IRepository<AIConversation>
{
    /// <summary>
    /// Obtém uma conversa por sessão
    /// </summary>
    Task<AIConversation?> GetBySessionAsync(Guid sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém conversas de um agente
    /// </summary>
    Task<IEnumerable<AIConversation>> GetByAgentAsync(Guid agentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém conversas de um tenant
    /// </summary>
    Task<IEnumerable<AIConversation>> GetByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deleta conversas antigas (limpeza de contexto)
    /// </summary>
    Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);
}
