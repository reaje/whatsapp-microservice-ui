using Microsoft.Extensions.Logging;
using System.Text.Json;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Interfaces;
using WhatsApp.Core.Models;

namespace WhatsApp.Infrastructure.Services;

public class MessageService : IMessageService
{
    private readonly ISessionRepository _sessionRepository;
    private readonly IMessageRepository _messageRepository;
    private readonly IWhatsAppProvider _whatsAppProvider;
    private readonly ISessionService _sessionService;
    private readonly ILogger<MessageService> _logger;

    public MessageService(
        ISessionRepository sessionRepository,
        IMessageRepository messageRepository,
        IWhatsAppProvider whatsAppProvider,
        ISessionService sessionService,
        ILogger<MessageService> logger)
    {
        _sessionRepository = sessionRepository;
        _messageRepository = messageRepository;
        _whatsAppProvider = whatsAppProvider;
        _sessionService = sessionService;
        _logger = logger;
    }

    private async Task EnsureProviderInitializedAsync(WhatsAppSession session, Guid tenantId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Initializing provider for session {SessionId}, tenant {TenantId}", session.Id, tenantId);

        var tenantConfig = new TenantConfig
        {
            TenantId = tenantId,
            PreferredProvider = ProviderType.Baileys
        };

        await _whatsAppProvider.InitializeAsync(session.PhoneNumber, tenantConfig, cancellationToken);
    }

    /// <summary>
    /// Gets an active session or attempts to reactivate the last session for the tenant
    /// </summary>
    private async Task<WhatsAppSession?> GetOrReactivateSessionAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Looking for active session for tenant {TenantId}", tenantId);

        // Try to get active session first
        var activeSessions = await _sessionRepository.GetActivesessionsByTenantAsync(tenantId, cancellationToken);
        var activeSession = activeSessions.FirstOrDefault();

        if (activeSession != null)
        {
            _logger.LogInformation("Found active session {SessionId} for tenant {TenantId}", activeSession.Id, tenantId);
            return activeSession;
        }

        _logger.LogWarning("No active session found for tenant {TenantId}. Attempting to reactivate last session...", tenantId);

        // No active session found, try to get the last session
        var lastSession = await _sessionRepository.GetLastSessionByTenantAsync(tenantId, cancellationToken);

        if (lastSession == null)
        {
            _logger.LogWarning("No sessions found for tenant {TenantId}", tenantId);
            return null;
        }

        _logger.LogInformation("Found last session {SessionId} (phone: {PhoneNumber}) for tenant {TenantId}. Attempting reactivation...",
            lastSession.Id, lastSession.PhoneNumber, tenantId);

        try
        {
            // Attempt to reinitialize the session
            var status = await _sessionService.InitializeSessionAsync(
                tenantId,
                lastSession.PhoneNumber,
                lastSession.ProviderType,
                cancellationToken);

            if (status.IsConnected)
            {
                _logger.LogInformation("Successfully reactivated session for phone {PhoneNumber}, tenant {TenantId}",
                    lastSession.PhoneNumber, tenantId);

                // Refresh session from database to get updated IsActive status
                var reactivatedSession = await _sessionRepository.GetByTenantAndPhoneAsync(
                    tenantId,
                    lastSession.PhoneNumber,
                    cancellationToken);

                return reactivatedSession;
            }
            else
            {
                _logger.LogWarning("Failed to reactivate session for phone {PhoneNumber}, tenant {TenantId}. Session not connected.",
                    lastSession.PhoneNumber, tenantId);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reactivating session for phone {PhoneNumber}, tenant {TenantId}",
                lastSession.PhoneNumber, tenantId);
            return null;
        }
    }

    public async Task<MessageResult> SendTextAsync(Guid tenantId, string to, string content, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sending text message for tenant {TenantId} to {To}", tenantId, to);

        // Get active session or attempt to reactivate
        var session = await GetOrReactivateSessionAsync(tenantId, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("No session available for tenant {TenantId} after reactivation attempt", tenantId);
            return new MessageResult
            {
                MessageId = string.Empty,
                Status = MessageStatus.Failed,
                Provider = "none",
                Timestamp = DateTime.UtcNow,
                Error = "No WhatsApp session available. Please scan QR code to reconnect."
            };
        }

        // Initialize provider with session
        await EnsureProviderInitializedAsync(session, tenantId, cancellationToken);

        // Send message via provider
        var result = await _whatsAppProvider.SendTextAsync(to, content, cancellationToken);

        // Save message to database
        var message = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SessionId = session.Id,
            MessageId = result.MessageId,
            FromNumber = session.PhoneNumber,
            ToNumber = to,
            MessageType = MessageType.Text,
            Content = JsonDocument.Parse(JsonSerializer.Serialize(new { text = content })),
            Status = result.Status,
            AiProcessed = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _messageRepository.AddAsync(message, cancellationToken);

        _logger.LogInformation("Text message sent successfully: {MessageId}", result.MessageId);

        return result;
    }

    public async Task<MessageResult> SendMediaAsync(Guid tenantId, string to, byte[] media, MessageType mediaType, string? caption = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sending media message for tenant {TenantId} to {To}, type {MediaType}", tenantId, to, mediaType);

        // Get active session or attempt to reactivate
        var session = await GetOrReactivateSessionAsync(tenantId, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("No session available for tenant {TenantId} after reactivation attempt", tenantId);
            return new MessageResult
            {
                MessageId = string.Empty,
                Status = MessageStatus.Failed,
                Provider = "none",
                Timestamp = DateTime.UtcNow,
                Error = "No WhatsApp session available. Please scan QR code to reconnect."
            };
        }

        // Initialize provider with session
        await EnsureProviderInitializedAsync(session, tenantId, cancellationToken);

        var result = await _whatsAppProvider.SendMediaAsync(to, media, mediaType, caption, cancellationToken);

        var message = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SessionId = session.Id,
            MessageId = result.MessageId,
            FromNumber = session.PhoneNumber,
            ToNumber = to,
            MessageType = mediaType,
            Content = JsonDocument.Parse(JsonSerializer.Serialize(new
            {
                mediaType = mediaType.ToString(),
                caption = caption,
                size = media.Length
            })),
            Status = result.Status,
            AiProcessed = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _messageRepository.AddAsync(message, cancellationToken);

        _logger.LogInformation("Media message sent successfully: {MessageId}", result.MessageId);

        return result;
    }

    public async Task<MessageResult> SendLocationAsync(Guid tenantId, string to, double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sending location message for tenant {TenantId} to {To}", tenantId, to);

        // Get active session or attempt to reactivate
        var session = await GetOrReactivateSessionAsync(tenantId, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("No session available for tenant {TenantId} after reactivation attempt", tenantId);
            return new MessageResult
            {
                MessageId = string.Empty,
                Status = MessageStatus.Failed,
                Provider = "none",
                Timestamp = DateTime.UtcNow,
                Error = "No WhatsApp session available. Please scan QR code to reconnect."
            };
        }

        // Initialize provider with session
        await EnsureProviderInitializedAsync(session, tenantId, cancellationToken);

        var result = await _whatsAppProvider.SendLocationAsync(to, latitude, longitude, cancellationToken);

        var message = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SessionId = session.Id,
            MessageId = result.MessageId,
            FromNumber = session.PhoneNumber,
            ToNumber = to,
            MessageType = MessageType.Location,
            Content = JsonDocument.Parse(JsonSerializer.Serialize(new
            {
                latitude = latitude,
                longitude = longitude
            })),
            Status = result.Status,
            AiProcessed = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _messageRepository.AddAsync(message, cancellationToken);

        _logger.LogInformation("Location message sent successfully: {MessageId}", result.MessageId);

        return result;
    }

    public async Task<MessageResult> SendAudioAsync(Guid tenantId, string to, byte[] audio, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Sending audio message for tenant {TenantId} to {To}", tenantId, to);

        // Get active session or attempt to reactivate
        var session = await GetOrReactivateSessionAsync(tenantId, cancellationToken);

        if (session == null)
        {
            _logger.LogWarning("No session available for tenant {TenantId} after reactivation attempt", tenantId);
            return new MessageResult
            {
                MessageId = string.Empty,
                Status = MessageStatus.Failed,
                Provider = "none",
                Timestamp = DateTime.UtcNow,
                Error = "No WhatsApp session available. Please scan QR code to reconnect."
            };
        }

        // Initialize provider with session
        await EnsureProviderInitializedAsync(session, tenantId, cancellationToken);

        var result = await _whatsAppProvider.SendAudioAsync(to, audio, cancellationToken);

        var message = new Message
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SessionId = session.Id,
            MessageId = result.MessageId,
            FromNumber = session.PhoneNumber,
            ToNumber = to,
            MessageType = MessageType.Audio,
            Content = JsonDocument.Parse(JsonSerializer.Serialize(new { size = audio.Length })),
            Status = result.Status,
            AiProcessed = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _messageRepository.AddAsync(message, cancellationToken);

        _logger.LogInformation("Audio message sent successfully: {MessageId}", result.MessageId);

        return result;
    }

    public async Task<MessageResult?> GetMessageStatusAsync(Guid tenantId, string messageId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting message status for tenant {TenantId}, messageId {MessageId}", tenantId, messageId);

        var message = await _messageRepository.GetByMessageIdAsync(messageId, cancellationToken);

        if (message == null || message.TenantId != tenantId)
        {
            _logger.LogWarning("Message {MessageId} not found for tenant {TenantId}", messageId, tenantId);
            return null;
        }

        return new MessageResult
        {
            MessageId = message.MessageId ?? string.Empty,
            Status = message.Status,
            Provider = "baileys", // TODO: Get from session/message metadata
            Timestamp = message.UpdatedAt
        };
    }

    public async Task<IEnumerable<object>> GetMessageHistoryAsync(Guid tenantId, string phoneNumber, int limit = 50, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting message history for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);

        var messages = await _messageRepository.GetByPhoneNumberAsync(tenantId, phoneNumber, limit, cancellationToken);

        return messages.Select(m => new
        {
            id = m.Id.ToString(),
            sessionId = m.SessionId.ToString(),
            messageId = m.MessageId,
            fromNumber = m.FromNumber,
            toNumber = m.ToNumber,
            type = m.MessageType.ToString().ToLower(),
            content = m.Content != null
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(m.Content.RootElement.GetRawText())
                : new Dictionary<string, object>(),
            status = m.Status.ToString().ToLower(),
            timestamp = m.CreatedAt,
            aiProcessed = m.AiProcessed
        }).ToList();
    }

    public async Task<IEnumerable<object>> GetConversationsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting conversations for tenant {TenantId}", tenantId);

        var conversationsDict = await _messageRepository.GetLatestMessagePerContactAsync(tenantId, cancellationToken);

        return conversationsDict.Select(kvp => new
        {
            id = kvp.Key, // Phone number as ID
            name = kvp.Key, // For now, use phone as name (can be enhanced with contact info)
            phoneNumber = kvp.Key,
            avatar = (string?)null,
            unreadCount = 0, // TODO: Calculate unread count
            lastMessage = new
            {
                id = kvp.Value.Id.ToString(),
                sessionId = kvp.Value.SessionId.ToString(),
                messageId = kvp.Value.MessageId,
                fromNumber = kvp.Value.FromNumber,
                toNumber = kvp.Value.ToNumber,
                type = kvp.Value.MessageType.ToString().ToLower(),
                content = kvp.Value.Content != null
                    ? JsonSerializer.Deserialize<Dictionary<string, object>>(kvp.Value.Content.RootElement.GetRawText())
                    : new Dictionary<string, object>(),
                status = kvp.Value.Status.ToString().ToLower(),
                timestamp = kvp.Value.CreatedAt
            }
        }).OrderByDescending(c => c.lastMessage.timestamp).ToList();
    }
}