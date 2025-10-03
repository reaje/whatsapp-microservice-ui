using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhatsApp.API.Extensions;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AIAgentController : ControllerBase
{
    private readonly IAIAgentService _aiAgentService;
    private readonly WhatsApp.Infrastructure.Services.AIAgentTemplateService _templateService;
    private readonly ILogger<AIAgentController> _logger;

    public AIAgentController(
        IAIAgentService aiAgentService,
        ILogger<AIAgentController> logger)
    {
        _aiAgentService = aiAgentService;
        _templateService = new WhatsApp.Infrastructure.Services.AIAgentTemplateService();
        _logger = logger;
    }

    private AIAgentResponse MapToResponse(AIAgent agent)
    {
        return new AIAgentResponse
        {
            Id = agent.Id,
            TenantId = agent.TenantId,
            Name = agent.Name,
            Type = agent.Type,
            Configuration = agent.Configuration?.RootElement.GetRawText(),
            IsActive = agent.IsActive,
            CreatedAt = agent.CreatedAt,
            UpdatedAt = agent.UpdatedAt
        };
    }

    /// <summary>
    /// Lista todos os agentes de IA do tenant
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AIAgentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllAgents(CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Getting all AI agents for tenant {TenantId}", tenantId);

        var agents = await _aiAgentService.GetAllAgentsAsync(tenantId, cancellationToken);

        return Ok(agents.Select(MapToResponse));
    }

    /// <summary>
    /// Lista agentes ativos do tenant
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<AIAgentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActiveAgents(CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Getting active AI agents for tenant {TenantId}", tenantId);

        var agents = await _aiAgentService.GetActiveAgentsAsync(tenantId, cancellationToken);

        return Ok(agents.Select(MapToResponse));
    }

    /// <summary>
    /// Obtém um agente específico por ID
    /// </summary>
    [HttpGet("{agentId}")]
    [ProducesResponseType(typeof(AIAgentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAgent([FromRoute] Guid agentId, CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Getting AI agent {AgentId} for tenant {TenantId}", agentId, tenantId);

        var agent = await _aiAgentService.GetAgentByIdAsync(tenantId, agentId, cancellationToken);

        if (agent == null)
        {
            return NotFound(new { error = "Agent not found" });
        }

        return Ok(MapToResponse(agent));
    }

    /// <summary>
    /// Cria um novo agente de IA
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AIAgentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateAgent([FromBody] CreateAIAgentRequest request, CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Creating AI agent for tenant {TenantId}", tenantId);

        try
        {
            var agent = await _aiAgentService.CreateAgentAsync(
                tenantId,
                request.Name,
                request.Type,
                request.Configuration,
                cancellationToken);

            return CreatedAtAction(nameof(GetAgent), new { agentId = agent.Id }, MapToResponse(agent));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza um agente existente
    /// </summary>
    [HttpPut("{agentId}")]
    [ProducesResponseType(typeof(AIAgentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateAgent(
        [FromRoute] Guid agentId,
        [FromBody] UpdateAIAgentRequest request,
        CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Updating AI agent {AgentId} for tenant {TenantId}", agentId, tenantId);

        try
        {
            var agent = await _aiAgentService.UpdateAgentAsync(
                tenantId,
                agentId,
                request.Name,
                request.Type,
                request.Configuration,
                request.IsActive,
                cancellationToken);

            return Ok(MapToResponse(agent));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Deleta um agente
    /// </summary>
    [HttpDelete("{agentId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteAgent([FromRoute] Guid agentId, CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Deleting AI agent {AgentId} for tenant {TenantId}", agentId, tenantId);

        var success = await _aiAgentService.DeleteAgentAsync(tenantId, agentId, cancellationToken);

        if (!success)
        {
            return NotFound(new { error = "Agent not found" });
        }

        return Ok(new { message = "Agent deleted successfully" });
    }

    /// <summary>
    /// Ativa/desativa um agente
    /// </summary>
    [HttpPost("{agentId}/toggle")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ToggleAgent([FromRoute] Guid agentId, CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Toggling AI agent {AgentId} for tenant {TenantId}", agentId, tenantId);

        var success = await _aiAgentService.ToggleAgentAsync(tenantId, agentId, cancellationToken);

        if (!success)
        {
            return NotFound(new { error = "Agent not found" });
        }

        return Ok(new { message = "Agent toggled successfully" });
    }

    /// <summary>
    /// Lista todos os templates de agentes disponíveis
    /// </summary>
    [HttpGet("templates")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetTemplates()
    {
        _logger.LogInformation("Getting AI agent templates");

        var templates = _templateService.GetAllTemplates();

        return Ok(templates);
    }

    /// <summary>
    /// Cria um agente a partir de um template
    /// </summary>
    [HttpPost("templates/{templateId}/create")]
    [ProducesResponseType(typeof(AIAgentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateFromTemplate(
        [FromRoute] string templateId,
        [FromBody] CreateFromTemplateRequest request,
        CancellationToken cancellationToken)
    {
        var tenantId = HttpContext.GetTenantId();
        _logger.LogInformation("Creating AI agent from template {TemplateId} for tenant {TenantId}", templateId, tenantId);

        var template = _templateService.GetTemplateById(templateId);
        if (template == null)
        {
            return NotFound(new { error = $"Template '{templateId}' not found" });
        }

        try
        {
            var agent = await _aiAgentService.CreateAgentAsync(
                tenantId,
                request.Name ?? template.Name,
                template.Type,
                template.Configuration,
                cancellationToken);

            return CreatedAtAction(nameof(GetAgent), new { agentId = agent.Id }, MapToResponse(agent));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

#region Request DTOs

public class CreateAIAgentRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Configuration { get; set; }
}

public class UpdateAIAgentRequest
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Configuration { get; set; }
    public bool? IsActive { get; set; }
}

public class CreateFromTemplateRequest
{
    public string? Name { get; set; }
}

public class AIAgentResponse
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Configuration { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

#endregion
