namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Serviço para entrega de webhooks a endpoints configurados pelos tenants
/// </summary>
public interface IWebhookDeliveryService
{
    /// <summary>
    /// Envia webhook de mensagem recebida para o tenant
    /// </summary>
    Task<WebhookDeliveryResult> DeliverIncomingMessageAsync(
        Guid tenantId,
        string webhookUrl,
        object payload,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Envia webhook de status de mensagem para o tenant
    /// </summary>
    Task<WebhookDeliveryResult> DeliverMessageStatusAsync(
        Guid tenantId,
        string webhookUrl,
        object payload,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Envia webhook de evento de sessão (conectada/desconectada/qr_code)
    /// </summary>
    Task<WebhookDeliveryResult> DeliverSessionEventAsync(
        Guid tenantId,
        string webhookUrl,
        string eventType,
        object payload,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Envia webhook genérico com retry automático
    /// </summary>
    Task<WebhookDeliveryResult> DeliverWebhookAsync(
        string webhookUrl,
        string eventType,
        object payload,
        string? secret = null,
        int maxRetries = 3,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Resultado da entrega de um webhook
/// </summary>
public class WebhookDeliveryResult
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public string? Error { get; set; }
    public int Attempts { get; set; }
    public TimeSpan TotalDuration { get; set; }
}
