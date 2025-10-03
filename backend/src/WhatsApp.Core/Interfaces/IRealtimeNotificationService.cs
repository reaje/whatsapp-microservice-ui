namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Serviço para envio de notificações em tempo real via SignalR
/// </summary>
public interface IRealtimeNotificationService
{
    /// <summary>
    /// Notifica todos os clientes de um tenant sobre uma nova mensagem
    /// </summary>
    Task NotifyNewMessageAsync(Guid tenantId, string phoneNumber, object message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Notifica todos os clientes de um tenant sobre atualização de status de mensagem
    /// </summary>
    Task NotifyMessageStatusAsync(Guid tenantId, string messageId, string status, CancellationToken cancellationToken = default);

    /// <summary>
    /// Notifica todos os clientes de um tenant sobre evento de sessão
    /// </summary>
    Task NotifySessionEventAsync(Guid tenantId, string phoneNumber, string eventType, object data, CancellationToken cancellationToken = default);

    /// <summary>
    /// Notifica todos os clientes de um tenant sobre QR code atualizado
    /// </summary>
    Task NotifyQRCodeAsync(Guid tenantId, string phoneNumber, string qrCode, CancellationToken cancellationToken = default);
}
