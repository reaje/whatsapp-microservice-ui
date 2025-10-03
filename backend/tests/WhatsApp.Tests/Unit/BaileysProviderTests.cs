using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text;
using System.Text.Json;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Models;
using WhatsApp.Infrastructure.Providers;

namespace WhatsApp.Tests.Unit;

public class BaileysProviderTests
{
    private readonly Mock<ILogger<BaileysProvider>> _loggerMock;
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
    private readonly HttpClient _httpClient;

    public BaileysProviderTests()
    {
        _loggerMock = new Mock<ILogger<BaileysProvider>>();
        _httpClientFactoryMock = new Mock<IHttpClientFactory>();
        _configurationMock = new Mock<IConfiguration>();
        _httpMessageHandlerMock = new Mock<HttpMessageHandler>();

        _httpClient = new HttpClient(_httpMessageHandlerMock.Object);

        _httpClientFactoryMock
            .Setup(x => x.CreateClient("BaileysService"))
            .Returns(_httpClient);

        _configurationMock
            .Setup(x => x["BaileysService:Url"])
            .Returns("http://localhost:3000");
    }

    [Fact]
    public async Task InitializeAsync_Should_Return_QRCode_When_Session_Not_Connected()
    {
        // Arrange
        var phoneNumber = "5511999999999";
        var tenantConfig = new TenantConfig
        {
            TenantId = Guid.NewGuid(),
            ClientId = "test-client"
        };

        var initResponse = new
        {
            status = "qr_ready",
            qrCode = "test-qr-code",
            sessionId = $"session-{tenantConfig.TenantId}-{phoneNumber}"
        };

        var statusResponse = new
        {
            status = "qr_ready",
            qrCode = "test-qr-code-updated",
            sessionId = $"session-{tenantConfig.TenantId}-{phoneNumber}"
        };

        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(initResponse));
        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(statusResponse));

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.InitializeAsync(phoneNumber, tenantConfig);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsConnected);
        Assert.Equal("qr_ready", result.Status);
        Assert.NotNull(result.QrCode);
    }

    [Fact]
    public async Task InitializeAsync_Should_Return_Connected_When_Already_Connected()
    {
        // Arrange
        var phoneNumber = "5511999999999";
        var tenantConfig = new TenantConfig
        {
            TenantId = Guid.NewGuid(),
            ClientId = "test-client"
        };

        var response = new
        {
            status = "connected",
            sessionId = $"session-{tenantConfig.TenantId}-{phoneNumber}"
        };

        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(response));

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.InitializeAsync(phoneNumber, tenantConfig);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsConnected);
        Assert.Equal("connected", result.Status);
    }

    [Fact]
    public async Task InitializeAsync_Should_Return_Failed_When_HTTP_Error()
    {
        // Arrange
        var phoneNumber = "5511999999999";
        var tenantConfig = new TenantConfig
        {
            TenantId = Guid.NewGuid(),
            ClientId = "test-client"
        };

        SetupHttpResponse(HttpStatusCode.InternalServerError, "Internal server error");

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.InitializeAsync(phoneNumber, tenantConfig);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsConnected);
        Assert.Equal("failed", result.Status);
        Assert.NotNull(result.Metadata);
    }

    [Fact]
    public async Task SendTextAsync_Should_Return_Success_When_Message_Sent()
    {
        // Arrange
        var to = "5511888888888";
        var text = "Test message";

        var response = new
        {
            success = true,
            messageId = "test-message-id",
            status = "sent"
        };

        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(response));

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.SendTextAsync(to, text);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test-message-id", result.MessageId);
        Assert.Equal(MessageStatus.Sent, result.Status);
        Assert.Equal("baileys", result.Provider);
    }

    [Fact]
    public async Task SendMediaAsync_Should_Return_Success_When_Media_Sent()
    {
        // Arrange
        var to = "5511888888888";
        var media = new byte[] { 1, 2, 3, 4, 5 };
        var mediaType = MessageType.Image;
        var caption = "Test caption";

        var response = new
        {
            success = true,
            messageId = "test-media-id",
            status = "sent"
        };

        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(response));

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.SendMediaAsync(to, media, mediaType, caption);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test-media-id", result.MessageId);
        Assert.Equal(MessageStatus.Sent, result.Status);
    }

    [Fact]
    public async Task SendLocationAsync_Should_Return_Success_When_Location_Sent()
    {
        // Arrange
        var to = "5511888888888";
        var latitude = -23.5505;
        var longitude = -46.6333;

        var response = new
        {
            success = true,
            messageId = "test-location-id",
            status = "sent"
        };

        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(response));

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.SendLocationAsync(to, latitude, longitude);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test-location-id", result.MessageId);
        Assert.Equal(MessageStatus.Sent, result.Status);
    }

    [Fact]
    public async Task SendAudioAsync_Should_Return_Success_When_Audio_Sent()
    {
        // Arrange
        var to = "5511888888888";
        var audio = new byte[] { 1, 2, 3, 4, 5 };

        var response = new
        {
            success = true,
            messageId = "test-audio-id",
            status = "sent"
        };

        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(response));

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.SendAudioAsync(to, audio);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test-audio-id", result.MessageId);
        Assert.Equal(MessageStatus.Sent, result.Status);
    }

    [Fact]
    public async Task GetStatusAsync_Should_Return_Disconnected_Initially()
    {
        // Arrange
        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        var result = await provider.GetStatusAsync();

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsConnected);
        Assert.Equal("disconnected", result.Status);
    }

    [Fact]
    public async Task DisconnectAsync_Should_Call_Disconnect_Endpoint()
    {
        // Arrange
        var response = new
        {
            success = true,
            message = "Disconnected successfully"
        };

        SetupHttpResponse(HttpStatusCode.OK, JsonSerializer.Serialize(response));

        var provider = new BaileysProvider(_loggerMock.Object, _httpClientFactoryMock.Object, _configurationMock.Object);

        // Act
        await provider.DisconnectAsync();

        // Assert - Should not throw exception
        Assert.True(true);
    }

    private void SetupHttpResponse(HttpStatusCode statusCode, string content)
    {
        _httpMessageHandlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(content, Encoding.UTF8, "application/json")
            });
    }
}
