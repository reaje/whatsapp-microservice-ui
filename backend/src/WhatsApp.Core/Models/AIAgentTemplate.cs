namespace WhatsApp.Core.Models;

/// <summary>
/// Template pré-configurado de agente de IA
/// </summary>
public class AIAgentTemplate
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public object Configuration { get; set; } = null!;
    public string[] UseCases { get; set; } = Array.Empty<string>();
}
