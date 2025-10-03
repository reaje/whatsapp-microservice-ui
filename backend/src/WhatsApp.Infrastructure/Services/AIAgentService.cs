using Microsoft.Extensions.Logging;
using System.Text.Json;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.Infrastructure.Services;

public class AIAgentService : IAIAgentService
{
    private readonly IAIAgentRepository _aiAgentRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly ILogger<AIAgentService> _logger;

    public AIAgentService(
        IAIAgentRepository aiAgentRepository,
        ITenantRepository tenantRepository,
        ILogger<AIAgentService> logger)
    {
        _aiAgentRepository = aiAgentRepository;
        _tenantRepository = tenantRepository;
        _logger = logger;
    }

    public async Task<AIAgent> CreateAgentAsync(
        Guid tenantId,
        string name,
        string? type,
        object? configuration,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating AI agent {Name} for tenant {TenantId}", name, tenantId);

        // Verificar se tenant existe
        var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);
        if (tenant == null)
        {
            throw new InvalidOperationException($"Tenant {tenantId} not found");
        }

        // Verificar se já existe agente com mesmo nome
        var existing = await _aiAgentRepository.GetByTenantAndNameAsync(tenantId, name, cancellationToken);
        if (existing != null)
        {
            throw new InvalidOperationException($"Agent with name '{name}' already exists for this tenant");
        }

        var agent = new AIAgent
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = name,
            Type = type ?? "general",
            Configuration = configuration != null
                ? JsonDocument.Parse(JsonSerializer.Serialize(configuration))
                : null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _aiAgentRepository.AddAsync(agent, cancellationToken);

        _logger.LogInformation("AI agent {AgentId} created successfully", agent.Id);

        return agent;
    }

    public async Task<AIAgent?> GetAgentByIdAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default)
    {
        return await _aiAgentRepository.GetByTenantAndIdAsync(tenantId, agentId, cancellationToken);
    }

    public async Task<IEnumerable<AIAgent>> GetAllAgentsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _aiAgentRepository.GetByTenantAsync(tenantId, cancellationToken);
    }

    public async Task<IEnumerable<AIAgent>> GetActiveAgentsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _aiAgentRepository.GetActiveByTenantAsync(tenantId, cancellationToken);
    }

    public async Task<AIAgent> UpdateAgentAsync(
        Guid tenantId,
        Guid agentId,
        string? name,
        string? type,
        object? configuration,
        bool? isActive,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating AI agent {AgentId} for tenant {TenantId}", agentId, tenantId);

        var agent = await _aiAgentRepository.GetByTenantAndIdAsync(tenantId, agentId, cancellationToken);
        if (agent == null)
        {
            throw new InvalidOperationException($"Agent {agentId} not found for tenant {tenantId}");
        }

        // Verificar nome duplicado se nome foi alterado
        if (!string.IsNullOrEmpty(name) && name != agent.Name)
        {
            var existing = await _aiAgentRepository.GetByTenantAndNameAsync(tenantId, name, cancellationToken);
            if (existing != null && existing.Id != agentId)
            {
                throw new InvalidOperationException($"Agent with name '{name}' already exists for this tenant");
            }
            agent.Name = name;
        }

        if (!string.IsNullOrEmpty(type))
        {
            agent.Type = type;
        }

        if (configuration != null)
        {
            agent.Configuration = JsonDocument.Parse(JsonSerializer.Serialize(configuration));
        }

        if (isActive.HasValue)
        {
            agent.IsActive = isActive.Value;
        }

        agent.UpdatedAt = DateTime.UtcNow;

        await _aiAgentRepository.UpdateAsync(agent, cancellationToken);

        _logger.LogInformation("AI agent {AgentId} updated successfully", agentId);

        return agent;
    }

    public async Task<bool> DeleteAgentAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting AI agent {AgentId} for tenant {TenantId}", agentId, tenantId);

        var agent = await _aiAgentRepository.GetByTenantAndIdAsync(tenantId, agentId, cancellationToken);
        if (agent == null)
        {
            return false;
        }

        await _aiAgentRepository.DeleteAsync(agent, cancellationToken);

        _logger.LogInformation("AI agent {AgentId} deleted successfully", agentId);

        return true;
    }

    public async Task<bool> ToggleAgentAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Toggling AI agent {AgentId} for tenant {TenantId}", agentId, tenantId);

        var agent = await _aiAgentRepository.GetByTenantAndIdAsync(tenantId, agentId, cancellationToken);
        if (agent == null)
        {
            return false;
        }

        agent.IsActive = !agent.IsActive;
        agent.UpdatedAt = DateTime.UtcNow;

        await _aiAgentRepository.UpdateAsync(agent, cancellationToken);

        _logger.LogInformation("AI agent {AgentId} toggled to {IsActive}", agentId, agent.IsActive);

        return true;
    }
}
