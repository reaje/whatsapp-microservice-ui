using Microsoft.AspNetCore.SignalR;
using WhatsApp.API.Hubs;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.API.Services;

/// <summary>
/// Serviço para envio de notificações em tempo real via SignalR
/// </summary>
public class RealtimeNotificationService : IRealtimeNotificationService
{
    private readonly IHubContext<MessagesHub> _hubContext;
    private readonly ILogger<RealtimeNotificationService> _logger;

    public RealtimeNotificationService(
        IHubContext<MessagesHub> hubContext,
        ILogger<RealtimeNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyNewMessageAsync(Guid tenantId, string phoneNumber, object message, CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantGroupName = $"tenant_{tenantId}";
            var sessionGroupName = $"session_{tenantId}_{phoneNumber}";

            _logger.LogInformation("Sending new message notification to tenant {TenantId}, session {PhoneNumber}", tenantId, phoneNumber);

            // Enviar para todos os clientes do tenant
            await _hubContext.Clients.Group(tenantGroupName).SendAsync("ReceiveMessage", message, cancellationToken);

            // Enviar para clientes inscritos nesta sessão específica
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("ReceiveMessage", message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending new message notification for tenant {TenantId}", tenantId);
        }
    }

    public async Task NotifyMessageStatusAsync(Guid tenantId, string messageId, string status, CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantGroupName = $"tenant_{tenantId}";

            _logger.LogInformation("Sending message status notification to tenant {TenantId}, message {MessageId}, status {Status}",
                tenantId, messageId, status);

            var payload = new
            {
                messageId,
                status,
                timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients.Group(tenantGroupName).SendAsync("MessageStatusUpdate", payload, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message status notification for tenant {TenantId}", tenantId);
        }
    }

    public async Task NotifySessionEventAsync(Guid tenantId, string phoneNumber, string eventType, object data, CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantGroupName = $"tenant_{tenantId}";
            var sessionGroupName = $"session_{tenantId}_{phoneNumber}";

            _logger.LogInformation("Sending session event notification to tenant {TenantId}, session {PhoneNumber}, event {EventType}",
                tenantId, phoneNumber, eventType);

            var payload = new
            {
                phoneNumber,
                eventType,
                data,
                timestamp = DateTime.UtcNow
            };

            // Enviar para todos os clientes do tenant
            await _hubContext.Clients.Group(tenantGroupName).SendAsync("SessionEvent", payload, cancellationToken);

            // Enviar para clientes inscritos nesta sessão específica
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("SessionEvent", payload, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending session event notification for tenant {TenantId}", tenantId);
        }
    }

    public async Task NotifyQRCodeAsync(Guid tenantId, string phoneNumber, string qrCode, CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantGroupName = $"tenant_{tenantId}";
            var sessionGroupName = $"session_{tenantId}_{phoneNumber}";

            _logger.LogInformation("Sending QR code notification to tenant {TenantId}, session {PhoneNumber}", tenantId, phoneNumber);

            var payload = new
            {
                phoneNumber,
                qrCode,
                timestamp = DateTime.UtcNow
            };

            // Enviar para todos os clientes do tenant
            await _hubContext.Clients.Group(tenantGroupName).SendAsync("QRCodeUpdate", payload, cancellationToken);

            // Enviar para clientes inscritos nesta sessão específica
            await _hubContext.Clients.Group(sessionGroupName).SendAsync("QRCodeUpdate", payload, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending QR code notification for tenant {TenantId}", tenantId);
        }
    }
}
