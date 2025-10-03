using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Interfaces;
using WhatsApp.Core.Models;

namespace WhatsApp.Infrastructure.Providers;

/// <summary>
/// Provider para Meta WhatsApp Business API
/// STUB: Implementação básica para integração futura
/// </summary>
public class MetaApiProvider : IWhatsAppProvider
{
    private readonly ILogger<MetaApiProvider> _logger;
    private readonly IConfiguration _configuration;
    private SessionStatus _currentStatus;

    public event EventHandler<IncomingMessage>? OnMessageReceived;
    public event EventHandler<SessionStatus>? OnStatusChanged;

    public MetaApiProvider(
        ILogger<MetaApiProvider> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

        _currentStatus = new SessionStatus
        {
            IsConnected = false,
            Status = "not_configured",
            Metadata = new Dictionary<string, object>
            {
                { "provider", "meta_api" },
                { "implementation", "stub" }
            }
        };
    }

    public Task<SessionStatus> InitializeAsync(string phoneNumber, TenantConfig config, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("MetaApiProvider.InitializeAsync called but not implemented yet. Phone: {PhoneNumber}", phoneNumber);

        return Task.FromResult(new SessionStatus
        {
            IsConnected = false,
            Status = "not_implemented",
            PhoneNumber = phoneNumber,
            Metadata = new Dictionary<string, object>
            {
                { "provider", "meta_api" },
                { "implementation", "stub" },
                { "error", "Meta API Provider not implemented yet. Please use Baileys provider." }
            }
        });
    }

    public Task<MessageResult> SendTextAsync(string to, string content, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("MetaApiProvider.SendTextAsync called but not implemented yet");

        return Task.FromResult(new MessageResult
        {
            MessageId = string.Empty,
            Status = MessageStatus.Failed,
            Provider = "meta_api",
            Timestamp = DateTime.UtcNow,
            Error = "Meta API Provider not implemented yet. Please use Baileys provider."
        });
    }

    public Task<MessageResult> SendMediaAsync(string to, byte[] media, MessageType mediaType, string? caption = null, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("MetaApiProvider.SendMediaAsync called but not implemented yet");

        return Task.FromResult(new MessageResult
        {
            MessageId = string.Empty,
            Status = MessageStatus.Failed,
            Provider = "meta_api",
            Timestamp = DateTime.UtcNow,
            Error = "Meta API Provider not implemented yet. Please use Baileys provider."
        });
    }

    public Task<MessageResult> SendLocationAsync(string to, double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("MetaApiProvider.SendLocationAsync called but not implemented yet");

        return Task.FromResult(new MessageResult
        {
            MessageId = string.Empty,
            Status = MessageStatus.Failed,
            Provider = "meta_api",
            Timestamp = DateTime.UtcNow,
            Error = "Meta API Provider not implemented yet. Please use Baileys provider."
        });
    }

    public Task<MessageResult> SendAudioAsync(string to, byte[] audio, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("MetaApiProvider.SendAudioAsync called but not implemented yet");

        return Task.FromResult(new MessageResult
        {
            MessageId = string.Empty,
            Status = MessageStatus.Failed,
            Provider = "meta_api",
            Timestamp = DateTime.UtcNow,
            Error = "Meta API Provider not implemented yet. Please use Baileys provider."
        });
    }

    public Task<SessionStatus> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_currentStatus);
    }

    public Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("MetaApiProvider.DisconnectAsync called");

        _currentStatus = new SessionStatus
        {
            IsConnected = false,
            Status = "disconnected"
        };

        return Task.CompletedTask;
    }
}
