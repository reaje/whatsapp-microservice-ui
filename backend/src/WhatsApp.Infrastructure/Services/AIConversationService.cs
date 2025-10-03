using Microsoft.Extensions.Logging;
using System.Text.Json;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.Infrastructure.Services;

public class AIConversationService : IAIConversationService
{
    private readonly IAIConversationRepository _conversationRepository;
    private readonly IAIAgentRepository _agentRepository;
    private readonly ILogger<AIConversationService> _logger;

    public AIConversationService(
        IAIConversationRepository conversationRepository,
        IAIAgentRepository agentRepository,
        ILogger<AIConversationService> logger)
    {
        _conversationRepository = conversationRepository;
        _agentRepository = agentRepository;
        _logger = logger;
    }

    public async Task<AIConversation> GetOrCreateConversationAsync(
        Guid tenantId,
        Guid agentId,
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting or creating conversation for session {SessionId}, agent {AgentId}",
            sessionId, agentId);

        var existing = await _conversationRepository.GetBySessionAsync(sessionId, cancellationToken);
        if (existing != null)
        {
            return existing;
        }

        // Verificar se agente existe
        var agent = await _agentRepository.GetByTenantAndIdAsync(tenantId, agentId, cancellationToken);
        if (agent == null)
        {
            throw new InvalidOperationException($"Agent {agentId} not found for tenant {tenantId}");
        }

        var conversation = new AIConversation
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            AgentId = agentId,
            SessionId = sessionId,
            Context = JsonDocument.Parse(JsonSerializer.Serialize(new
            {
                messages = new List<object>(),
                created_at = DateTime.UtcNow
            })),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _conversationRepository.AddAsync(conversation, cancellationToken);

        _logger.LogInformation("Created new conversation {ConversationId}", conversation.Id);

        return conversation;
    }

    public async Task UpdateContextAsync(Guid conversationId, object context, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating context for conversation {ConversationId}", conversationId);

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken);
        if (conversation == null)
        {
            throw new InvalidOperationException($"Conversation {conversationId} not found");
        }

        conversation.Context = JsonDocument.Parse(JsonSerializer.Serialize(context));
        conversation.UpdatedAt = DateTime.UtcNow;

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
    }

    public async Task<object?> GetContextAsync(Guid conversationId, CancellationToken cancellationToken = default)
    {
        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken);
        if (conversation?.Context == null)
        {
            return null;
        }

        return JsonSerializer.Deserialize<object>(conversation.Context.RootElement.GetRawText());
    }

    public async Task ClearContextAsync(Guid conversationId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Clearing context for conversation {ConversationId}", conversationId);

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, cancellationToken);
        if (conversation == null)
        {
            return;
        }

        conversation.Context = JsonDocument.Parse(JsonSerializer.Serialize(new
        {
            messages = new List<object>(),
            cleared_at = DateTime.UtcNow
        }));
        conversation.UpdatedAt = DateTime.UtcNow;

        await _conversationRepository.UpdateAsync(conversation, cancellationToken);
    }

    public async Task<int> CleanupOldConversationsAsync(int daysToKeep = 30, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Cleaning up conversations older than {DaysToKeep} days", daysToKeep);

        var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
        var count = await _conversationRepository.DeleteOlderThanAsync(cutoffDate, cancellationToken);

        _logger.LogInformation("Deleted {Count} old conversations", count);

        return count;
    }

    public async Task<string?> ProcessIncomingMessageAsync(
        Guid tenantId,
        Guid agentId,
        Guid sessionId,
        string from,
        string messageText,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Processing incoming message for agent {AgentId}, session {SessionId}", agentId, sessionId);

        try
        {
            // Obter ou criar conversa
            var conversation = await GetOrCreateConversationAsync(tenantId, agentId, sessionId, cancellationToken);

            // Obter agente
            var agent = await _agentRepository.GetByTenantAndIdAsync(tenantId, agentId, cancellationToken);
            if (agent == null || !agent.IsActive)
            {
                _logger.LogWarning("Agent {AgentId} not found or not active", agentId);
                return null;
            }

            // Obter contexto atual
            var contextJson = conversation.Context?.RootElement.GetRawText() ?? "{}";
            var context = JsonSerializer.Deserialize<Dictionary<string, object>>(contextJson) ?? new Dictionary<string, object>();

            // Adicionar mensagem do usuário ao contexto
            if (!context.ContainsKey("messages"))
            {
                context["messages"] = new List<Dictionary<string, object>>();
            }

            var messages = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(
                JsonSerializer.Serialize(context["messages"])) ?? new List<Dictionary<string, object>>();

            messages.Add(new Dictionary<string, object>
            {
                { "role", "user" },
                { "content", messageText },
                { "from", from },
                { "timestamp", DateTime.UtcNow }
            });

            // Processar com IA (STUB - aqui você integraria com OpenAI, Anthropic, etc.)
            var aiResponse = await GenerateAIResponseAsync(agent, messages, cancellationToken);

            // Adicionar resposta da IA ao contexto
            messages.Add(new Dictionary<string, object>
            {
                { "role", "assistant" },
                { "content", aiResponse },
                { "timestamp", DateTime.UtcNow }
            });

            context["messages"] = messages;
            context["last_interaction"] = DateTime.UtcNow;

            // Atualizar contexto
            await UpdateContextAsync(conversation.Id, context, cancellationToken);

            _logger.LogInformation("AI response generated successfully for conversation {ConversationId}", conversation.Id);

            return aiResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing incoming message for agent {AgentId}", agentId);
            return null;
        }
    }

    /// <summary>
    /// Gera resposta da IA baseado no agente e histórico de mensagens
    /// STUB: Aqui você integraria com OpenAI API, Anthropic Claude API, etc.
    /// </summary>
    private async Task<string> GenerateAIResponseAsync(
        AIAgent agent,
        List<Dictionary<string, object>> messages,
        CancellationToken cancellationToken)
    {
        // TODO: Integrar com provedor de IA real (OpenAI, Anthropic, etc.)
        // Por enquanto, retorna uma resposta simulada baseada no tipo do agente

        await Task.Delay(100, cancellationToken); // Simula chamada à API

        var agentType = agent.Type?.ToLower() ?? "general";

        return agentType switch
        {
            "atendimento" => "Olá! Sou o assistente de atendimento. Como posso ajudá-lo hoje?",
            "vendas" => "Olá! Estou aqui para ajudar você a encontrar o produto perfeito. O que você está procurando?",
            "suporte" => "Olá! Sou o suporte técnico. Por favor, descreva o problema que você está enfrentando.",
            _ => $"Olá! Recebi sua mensagem. Agente '{agent.Name}' configurado e pronto para atender."
        };

        // Exemplo de integração com OpenAI (descomente para usar):
        /*
        var config = agent.Configuration?.RootElement;
        var apiKey = config?.GetProperty("openai_api_key").GetString();
        var model = config?.GetProperty("model").GetString() ?? "gpt-4";

        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        var request = new
        {
            model = model,
            messages = messages.Select(m => new
            {
                role = m["role"].ToString(),
                content = m["content"].ToString()
            }).ToList()
        };

        var response = await httpClient.PostAsJsonAsync(
            "https://api.openai.com/v1/chat/completions",
            request,
            cancellationToken);

        var result = await response.Content.ReadFromJsonAsync<OpenAIResponse>(cancellationToken);
        return result?.Choices?.FirstOrDefault()?.Message?.Content ?? "Erro ao gerar resposta";
        */
    }
}
