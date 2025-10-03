using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using WhatsApp.API.DTOs;
using WhatsApp.API.Extensions;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class WebhookController : ControllerBase
{
    private readonly IMessageRepository _messageRepository;
    private readonly ISessionRepository _sessionRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly IWebhookDeliveryService _webhookDeliveryService;
    private readonly IRealtimeNotificationService _realtimeNotificationService;
    private readonly IAIConversationService _aiConversationService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        IMessageRepository messageRepository,
        ISessionRepository sessionRepository,
        ITenantRepository tenantRepository,
        IWebhookDeliveryService webhookDeliveryService,
        IRealtimeNotificationService realtimeNotificationService,
        IAIConversationService aiConversationService,
        IConfiguration configuration,
        ILogger<WebhookController> logger)
    {
        _messageRepository = messageRepository;
        _sessionRepository = sessionRepository;
        _tenantRepository = tenantRepository;
        _webhookDeliveryService = webhookDeliveryService;
        _realtimeNotificationService = realtimeNotificationService;
        _aiConversationService = aiConversationService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Webhook endpoint for receiving incoming WhatsApp messages
    /// </summary>
    [HttpPost("incoming-message")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> IncomingMessage([FromBody] IncomingMessageWebhookDto webhook, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = HttpContext.GetTenantId();

            _logger.LogInformation("Received incoming message webhook for tenant {TenantId}, from {From}", tenantId, webhook.From);

            // Find session by phone number
            var session = await _sessionRepository.GetByTenantAndPhoneAsync(tenantId, webhook.To, cancellationToken);

            if (session == null)
            {
                _logger.LogWarning("Session not found for incoming message. Tenant {TenantId}, To {To}", tenantId, webhook.To);
                return BadRequest(new { error = "Session not found for recipient phone number" });
            }

            // Save incoming message to database
            var content = new
            {
                text = webhook.TextContent,
                mediaUrl = webhook.MediaUrl,
                mediaMimeType = webhook.MediaMimeType
            };

            var message = new Message
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                SessionId = session.Id,
                MessageId = webhook.MessageId,
                FromNumber = webhook.From,
                ToNumber = webhook.To,
                MessageType = webhook.Type,
                Content = JsonDocument.Parse(JsonSerializer.Serialize(content)),
                Status = MessageStatus.Received,
                AiProcessed = false,
                CreatedAt = webhook.Timestamp,
                UpdatedAt = webhook.Timestamp
            };

            await _messageRepository.AddAsync(message, cancellationToken);

            _logger.LogInformation("Incoming message saved successfully: {MessageId}", webhook.MessageId);

            // Notify connected clients via SignalR
            _ = Task.Run(async () =>
            {
                try
                {
                    await _realtimeNotificationService.NotifyNewMessageAsync(tenantId, webhook.To, new
                    {
                        id = message.Id,
                        messageId = webhook.MessageId,
                        from = webhook.From,
                        to = webhook.To,
                        type = webhook.Type,
                        content = new
                        {
                            text = webhook.TextContent,
                            mediaUrl = webhook.MediaUrl,
                            mediaMimeType = webhook.MediaMimeType
                        },
                        timestamp = webhook.Timestamp
                    }, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send realtime notification for message {MessageId}", webhook.MessageId);
                }
            }, CancellationToken.None);

            // Forward webhook to tenant's configured webhook URL
            var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);
            if (tenant?.Settings != null)
            {
                try
                {
                    var settingsJson = tenant.Settings.RootElement;
                    if (settingsJson.TryGetProperty("webhook_url", out var webhookUrlElement))
                    {
                        var webhookUrl = webhookUrlElement.GetString();
                        if (!string.IsNullOrWhiteSpace(webhookUrl))
                        {
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    await _webhookDeliveryService.DeliverIncomingMessageAsync(tenantId, webhookUrl, webhook, CancellationToken.None);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "Failed to deliver webhook to tenant {TenantId}", tenantId);
                                }
                            }, CancellationToken.None);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse webhook_url from tenant settings");
                }
            }

            // Processar mensagem com agente de IA se configurado
            _ = Task.Run(async () =>
            {
                try
                {
                    // Verificar se há agente de IA configurado no tenant settings
                    if (tenant?.Settings != null)
                    {
                        var settingsJson = tenant.Settings.RootElement;
                        if (settingsJson.TryGetProperty("ai_agent_id", out var agentIdElement))
                        {
                            var agentIdStr = agentIdElement.GetString();
                            if (Guid.TryParse(agentIdStr, out var agentId))
                            {
                                // Processar mensagem com IA
                                var aiResponse = await _aiConversationService.ProcessIncomingMessageAsync(
                                    tenantId,
                                    agentId,
                                    session.Id,
                                    webhook.From,
                                    webhook.TextContent ?? "",
                                    CancellationToken.None);

                                // Se houver resposta da IA, enviar automaticamente
                                if (!string.IsNullOrWhiteSpace(aiResponse))
                                {
                                    _logger.LogInformation("AI agent generated response for message {MessageId}", webhook.MessageId);

                                    // TODO: Enviar resposta via MessageService
                                    // await _messageService.SendTextAsync(tenantId, session.Id, webhook.From, aiResponse);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process message with AI agent for tenant {TenantId}", tenantId);
                }
            }, CancellationToken.None);

            return Ok(new { message = "Webhook received and processed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing incoming message webhook");
            return StatusCode(500, new { error = "Internal server error processing webhook" });
        }
    }

    /// <summary>
    /// Webhook endpoint for receiving message status updates
    /// </summary>
    [HttpPost("status-update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> StatusUpdate([FromBody] MessageStatusUpdateWebhookDto webhook, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = HttpContext.GetTenantId();

            _logger.LogInformation("Received status update webhook for tenant {TenantId}, message {MessageId}, status {Status}",
                tenantId, webhook.MessageId, webhook.Status);

            // Find message by message ID
            var message = await _messageRepository.GetByMessageIdAsync(webhook.MessageId, cancellationToken);

            if (message == null)
            {
                _logger.LogWarning("Message not found for status update. MessageId {MessageId}", webhook.MessageId);
                return NotFound(new { error = "Message not found" });
            }

            // Verify tenant ownership
            if (message.TenantId != tenantId)
            {
                _logger.LogWarning("Tenant mismatch for status update. Expected {ExpectedTenantId}, Got {ActualTenantId}",
                    message.TenantId, tenantId);
                return Unauthorized(new { error = "Unauthorized to update this message" });
            }

            // Update message status
            message.Status = webhook.Status;
            message.UpdatedAt = webhook.Timestamp;

            // Store error if present
            if (!string.IsNullOrEmpty(webhook.Error))
            {
                var content = message.Content?.RootElement.Clone();
                var contentDict = JsonSerializer.Deserialize<Dictionary<string, object>>(content?.GetRawText() ?? "{}");
                if (contentDict != null)
                {
                    contentDict["error"] = webhook.Error;
                    message.Content = JsonDocument.Parse(JsonSerializer.Serialize(contentDict));
                }
            }

            await _messageRepository.UpdateAsync(message, cancellationToken);

            _logger.LogInformation("Message status updated successfully: {MessageId} -> {Status}", webhook.MessageId, webhook.Status);

            // Notify connected clients via SignalR
            _ = Task.Run(async () =>
            {
                try
                {
                    await _realtimeNotificationService.NotifyMessageStatusAsync(tenantId, webhook.MessageId, webhook.Status.ToString(), CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send realtime status notification for message {MessageId}", webhook.MessageId);
                }
            }, CancellationToken.None);

            // Forward webhook to tenant's configured webhook URL
            var tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);
            if (tenant?.Settings != null)
            {
                try
                {
                    var settingsJson = tenant.Settings.RootElement;
                    if (settingsJson.TryGetProperty("webhook_url", out var webhookUrlElement))
                    {
                        var webhookUrl = webhookUrlElement.GetString();
                        if (!string.IsNullOrWhiteSpace(webhookUrl))
                        {
                            _ = Task.Run(async () =>
                            {
                                try
                                {
                                    await _webhookDeliveryService.DeliverMessageStatusAsync(tenantId, webhookUrl, webhook, CancellationToken.None);
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "Failed to deliver status webhook to tenant {TenantId}", tenantId);
                                }
                            }, CancellationToken.None);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse webhook_url from tenant settings");
                }
            }

            return Ok(new { message = "Status update processed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing status update webhook");
            return StatusCode(500, new { error = "Internal server error processing webhook" });
        }
    }

    /// <summary>
    /// Webhook verification endpoint (for Meta WhatsApp Business API)
    /// </summary>
    [HttpGet("verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult Verify([FromQuery(Name = "hub.mode")] string mode,
                                 [FromQuery(Name = "hub.verify_token")] string verifyToken,
                                 [FromQuery(Name = "hub.challenge")] string challenge)
    {
        _logger.LogInformation("Received webhook verification request. Mode: {Mode}, Token: {Token}", mode, verifyToken);

        var expectedToken = _configuration["WhatsApp:MetaAPI:WebhookVerifyToken"];

        if (string.IsNullOrWhiteSpace(expectedToken))
        {
            _logger.LogWarning("Webhook verify token not configured in appsettings");
            return StatusCode(500, new { error = "Server configuration error" });
        }

        if (mode == "subscribe" && verifyToken == expectedToken)
        {
            _logger.LogInformation("Webhook verified successfully");
            return Ok(challenge);
        }

        _logger.LogWarning("Webhook verification failed. Invalid token or mode");
        return StatusCode(403, new { error = "Verification failed" });
    }
}