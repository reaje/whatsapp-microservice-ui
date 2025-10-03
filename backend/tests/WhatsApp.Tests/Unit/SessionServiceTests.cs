using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text;
using System.Text.Json;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Enums;
using WhatsApp.Core.Interfaces;
using WhatsApp.Core.Models;
using WhatsApp.Infrastructure.Services;

namespace WhatsApp.Tests.Unit;

public class SessionServiceTests
{
    private readonly Mock<ISessionRepository> _sessionRepositoryMock;
    private readonly Mock<IWhatsAppProvider> _whatsAppProviderMock;
    private readonly Mock<IProviderFactory> _providerFactoryMock;
    private readonly Mock<ILogger<SessionService>> _loggerMock;
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<ISessionCacheService> _cacheServiceMock;
    private readonly SessionService _sessionService;

    public SessionServiceTests()
    {
        _sessionRepositoryMock = new Mock<ISessionRepository>();
        _whatsAppProviderMock = new Mock<IWhatsAppProvider>();
        _providerFactoryMock = new Mock<IProviderFactory>();
        _loggerMock = new Mock<ILogger<SessionService>>();
        _httpClientFactoryMock = new Mock<IHttpClientFactory>();
        _configurationMock = new Mock<IConfiguration>();
        _cacheServiceMock = new Mock<ISessionCacheService>();

        // Configure factory to return mocked provider for any ProviderType
        _providerFactoryMock
            .Setup(x => x.GetProvider(It.IsAny<ProviderType>()))
            .Returns(_whatsAppProviderMock.Object);

        // Cache sempre retorna null nos testes (simula cache miss)
        _cacheServiceMock.Setup(x => x.GetSessionStatusAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SessionStatus?)null);
        _cacheServiceMock.Setup(x => x.GetQRCodeAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);
        _cacheServiceMock.Setup(x => x.GetTenantSessionsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IEnumerable<WhatsAppSession>?)null);

        _sessionService = new SessionService(
            _sessionRepositoryMock.Object,
            _providerFactoryMock.Object,
            _loggerMock.Object,
            _httpClientFactoryMock.Object,
            _configurationMock.Object,
            _cacheServiceMock.Object);
    }

    [Fact]
    public async Task InitializeSessionAsync_Should_Create_New_Session_When_No_Existing_Session()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";
        var providerType = ProviderType.Baileys;

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession?)null);

        var sessionStatus = new SessionStatus
        {
            IsConnected = false,
            Status = "qr_ready",
            PhoneNumber = "5511999999999",
            QrCode = "test-qr-code",
            Metadata = new Dictionary<string, object>
            {
                { "sessionId", "test-session-id" }
            }
        };

        _whatsAppProviderMock
            .Setup(x => x.InitializeAsync("5511999999999", It.IsAny<TenantConfig>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessionStatus);

        _sessionRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<WhatsAppSession>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession s, CancellationToken ct) => s);

        // Act
        var result = await _sessionService.InitializeSessionAsync(tenantId, phoneNumber, providerType);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("qr_ready", result.Status);
        Assert.Equal("5511999999999", result.PhoneNumber);
        Assert.Equal("test-qr-code", result.QrCode);

        _sessionRepositoryMock.Verify(x => x.AddAsync(It.Is<WhatsAppSession>(s =>
            s.TenantId == tenantId &&
            s.PhoneNumber == "5511999999999" &&
            s.ProviderType == providerType
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task InitializeSessionAsync_Should_Delete_Existing_Session_Before_Creating_New()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";
        var providerType = ProviderType.Baileys;

        var existingSession = new WhatsAppSession
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PhoneNumber = "5511999999999",
            IsActive = true
        };

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingSession);

        _whatsAppProviderMock
            .Setup(x => x.DisconnectAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _sessionRepositoryMock
            .Setup(x => x.DeleteAsync(existingSession, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sessionStatus = new SessionStatus
        {
            IsConnected = false,
            Status = "qr_ready",
            PhoneNumber = "5511999999999"
        };

        _whatsAppProviderMock
            .Setup(x => x.InitializeAsync("5511999999999", It.IsAny<TenantConfig>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessionStatus);

        _sessionRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<WhatsAppSession>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession s, CancellationToken ct) => s);

        // Act
        var result = await _sessionService.InitializeSessionAsync(tenantId, phoneNumber, providerType);

        // Assert
        Assert.NotNull(result);
        _whatsAppProviderMock.Verify(x => x.DisconnectAsync(It.IsAny<CancellationToken>()), Times.Once);
        _sessionRepositoryMock.Verify(x => x.DeleteAsync(existingSession, It.IsAny<CancellationToken>()), Times.Once);
        _sessionRepositoryMock.Verify(x => x.AddAsync(It.IsAny<WhatsAppSession>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetSessionStatusAsync_Should_Return_NotFound_When_Session_Does_Not_Exist()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession?)null);

        // Act
        var result = await _sessionService.GetSessionStatusAsync(tenantId, phoneNumber);

        // Assert
        Assert.NotNull(result);
        Assert.False(result.IsConnected);
        Assert.Equal("not_found", result.Status);
        Assert.Equal(phoneNumber, result.PhoneNumber);
    }

    [Fact]
    public async Task GetSessionStatusAsync_Should_Return_Status_From_Database()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";

        var session = new WhatsAppSession
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PhoneNumber = "5511999999999",
            IsActive = true,
            SessionData = JsonDocument.Parse("{\"status\": \"connected\"}")
        };

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        var providerStatus = new SessionStatus
        {
            IsConnected = true,
            Status = "connected",
            PhoneNumber = "5511999999999"
        };

        _whatsAppProviderMock
            .Setup(x => x.GetStatusAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(providerStatus);

        // Act
        var result = await _sessionService.GetSessionStatusAsync(tenantId, phoneNumber);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsConnected);
        Assert.Equal("connected", result.Status);
    }

    [Fact]
    public async Task GetTenantSessionsAsync_Should_Return_All_Sessions_For_Tenant()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var sessions = new List<WhatsAppSession>
        {
            new WhatsAppSession { Id = Guid.NewGuid(), TenantId = tenantId, PhoneNumber = "5511999999999" },
            new WhatsAppSession { Id = Guid.NewGuid(), TenantId = tenantId, PhoneNumber = "5511888888888" }
        };

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessions);

        // Act
        var result = await _sessionService.GetTenantSessionsAsync(tenantId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task DisconnectSessionAsync_Should_Return_False_When_Session_Not_Found()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession?)null);

        // Act
        var result = await _sessionService.DisconnectSessionAsync(tenantId, phoneNumber);

        // Assert
        Assert.False(result);
        _whatsAppProviderMock.Verify(x => x.DisconnectAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DisconnectSessionAsync_Should_Disconnect_And_Update_Session()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";

        var session = new WhatsAppSession
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PhoneNumber = "5511999999999",
            IsActive = true
        };

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        _whatsAppProviderMock
            .Setup(x => x.DisconnectAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _sessionRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<WhatsAppSession>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession s, CancellationToken ct) => s);

        // Act
        var result = await _sessionService.DisconnectSessionAsync(tenantId, phoneNumber);

        // Assert
        Assert.True(result);
        Assert.False(session.IsActive);
        _whatsAppProviderMock.Verify(x => x.DisconnectAsync(It.IsAny<CancellationToken>()), Times.Once);
        _sessionRepositoryMock.Verify(x => x.UpdateAsync(session, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetQRCodeAsync_Should_Return_Null_When_Session_Not_Found()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession?)null);

        // Act
        var result = await _sessionService.GetQRCodeAsync(tenantId, phoneNumber);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetQRCodeAsync_Should_Return_QRCode_From_Session_Metadata()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var phoneNumber = "+5511999999999";
        var expectedQR = "test-qr-code";

        var sessionData = new Dictionary<string, object>
        {
            { "qrCode", expectedQR },
            { "status", "qr_ready" }
        };

        var session = new WhatsAppSession
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PhoneNumber = "5511999999999",
            IsActive = false,
            SessionData = JsonDocument.Parse(JsonSerializer.Serialize(sessionData))
        };

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, "5511999999999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        // Act
        var result = await _sessionService.GetQRCodeAsync(tenantId, phoneNumber);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedQR, result);
    }

    [Theory]
    [InlineData("+5511999999999", "5511999999999")]
    [InlineData("5511999999999", "5511999999999")]
    [InlineData("+55 11 99999-9999", "5511999999999")]
    [InlineData("  +5511999999999  ", "5511999999999")]
    public async Task InitializeSessionAsync_Should_Normalize_Phone_Number(string inputPhone, string expectedNormalized)
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var providerType = ProviderType.Baileys;

        _sessionRepositoryMock
            .Setup(x => x.GetByTenantAndPhoneAsync(tenantId, expectedNormalized, It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession?)null);

        var sessionStatus = new SessionStatus
        {
            IsConnected = false,
            Status = "qr_ready",
            PhoneNumber = expectedNormalized
        };

        _whatsAppProviderMock
            .Setup(x => x.InitializeAsync(expectedNormalized, It.IsAny<TenantConfig>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(sessionStatus);

        _sessionRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<WhatsAppSession>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((WhatsAppSession s, CancellationToken ct) => s);

        // Act
        var result = await _sessionService.InitializeSessionAsync(tenantId, inputPhone, providerType);

        // Assert
        _whatsAppProviderMock.Verify(x => x.InitializeAsync(expectedNormalized, It.IsAny<TenantConfig>(), It.IsAny<CancellationToken>()), Times.Once);
        _sessionRepositoryMock.Verify(x => x.AddAsync(It.Is<WhatsAppSession>(s =>
            s.PhoneNumber == expectedNormalized
        ), It.IsAny<CancellationToken>()), Times.Once);
    }
}
