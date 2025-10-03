using WhatsApp.Core.Entities;

namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Serviço para gerenciamento de contexto de conversação de IA
/// </summary>
public interface IAIConversationService
{
    /// <summary>
    /// Obtém ou cria uma conversa para uma sessão
    /// </summary>
    Task<AIConversation> GetOrCreateConversationAsync(Guid tenantId, Guid agentId, Guid sessionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Atualiza o contexto de uma conversa
    /// </summary>
    Task UpdateContextAsync(Guid conversationId, object context, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém o contexto de uma conversa
    /// </summary>
    Task<object?> GetContextAsync(Guid conversationId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Limpa o contexto de uma conversa
    /// </summary>
    Task ClearContextAsync(Guid conversationId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deleta conversas antigas (mais de X dias)
    /// </summary>
    Task<int> CleanupOldConversationsAsync(int daysToKeep = 30, CancellationToken cancellationToken = default);

    /// <summary>
    /// Processa mensagem recebida com IA e retorna resposta
    /// </summary>
    Task<string?> ProcessIncomingMessageAsync(Guid tenantId, Guid agentId, Guid sessionId, string from, string messageText, CancellationToken cancellationToken = default);
}
