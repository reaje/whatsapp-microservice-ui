using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WhatsApp.API.Extensions;

namespace WhatsApp.API.Hubs;

/// <summary>
/// Hub SignalR para notificações em tempo real de mensagens WhatsApp
/// </summary>
[Authorize]
public class MessagesHub : Hub
{
    private readonly ILogger<MessagesHub> _logger;

    public MessagesHub(ILogger<MessagesHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var tenantId = Context.GetHttpContext()?.GetTenantId();
        var userId = Context.User?.FindFirst("sub")?.Value;

        if (tenantId.HasValue)
        {
            // Adicionar conexão ao grupo do tenant
            var groupName = $"tenant_{tenantId.Value}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            _logger.LogInformation("Client {ConnectionId} connected to MessagesHub, tenant {TenantId}, user {UserId}",
                Context.ConnectionId, tenantId, userId);
        }
        else
        {
            _logger.LogWarning("Client {ConnectionId} connected without tenant ID", Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var tenantId = Context.GetHttpContext()?.GetTenantId();

        _logger.LogInformation("Client {ConnectionId} disconnected from MessagesHub, tenant {TenantId}",
            Context.ConnectionId, tenantId);

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Cliente se inscreve para receber notificações de uma sessão específica
    /// </summary>
    public async Task SubscribeToSession(string phoneNumber)
    {
        var tenantId = Context.GetHttpContext()?.GetTenantId();

        if (!tenantId.HasValue)
        {
            _logger.LogWarning("SubscribeToSession called without tenant ID");
            return;
        }

        var groupName = $"session_{tenantId.Value}_{phoneNumber}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Client {ConnectionId} subscribed to session {PhoneNumber}",
            Context.ConnectionId, phoneNumber);
    }

    /// <summary>
    /// Cliente cancela inscrição de uma sessão específica
    /// </summary>
    public async Task UnsubscribeFromSession(string phoneNumber)
    {
        var tenantId = Context.GetHttpContext()?.GetTenantId();

        if (!tenantId.HasValue)
        {
            _logger.LogWarning("UnsubscribeFromSession called without tenant ID");
            return;
        }

        var groupName = $"session_{tenantId.Value}_{phoneNumber}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Client {ConnectionId} unsubscribed from session {PhoneNumber}",
            Context.ConnectionId, phoneNumber);
    }
}
