using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;
using WhatsApp.Infrastructure.Services;

namespace WhatsApp.Tests.Unit;

public class TenantServiceTests
{
    private readonly Mock<ITenantRepository> _tenantRepositoryMock;
    private readonly Mock<ILogger<TenantService>> _loggerMock;
    private readonly TenantService _tenantService;

    public TenantServiceTests()
    {
        _tenantRepositoryMock = new Mock<ITenantRepository>();
        _loggerMock = new Mock<ILogger<TenantService>>();

        _tenantService = new TenantService(_tenantRepositoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetByClientIdAsync_Should_Return_Tenant_When_Found()
    {
        // Arrange
        var clientId = "test-client-001";
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            Name = "Test Tenant",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _tenantRepositoryMock
            .Setup(x => x.GetByClientIdAsync(clientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        // Act
        var result = await _tenantService.GetByClientIdAsync(clientId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(clientId, result.ClientId);
        Assert.Equal("Test Tenant", result.Name);
    }

    [Fact]
    public async Task GetByClientIdAsync_Should_Return_Null_When_Not_Found()
    {
        // Arrange
        var clientId = "non-existent-client";

        _tenantRepositoryMock
            .Setup(x => x.GetByClientIdAsync(clientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        // Act
        var result = await _tenantService.GetByClientIdAsync(clientId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByIdAsync_Should_Return_Tenant_When_Found()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant
        {
            Id = tenantId,
            ClientId = "test-client-001",
            Name = "Test Tenant",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _tenantRepositoryMock
            .Setup(x => x.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        // Act
        var result = await _tenantService.GetByIdAsync(tenantId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(tenantId, result.Id);
    }

    [Fact]
    public async Task CreateAsync_Should_Create_Tenant_When_Valid()
    {
        // Arrange
        var clientId = "new-client-001";
        var name = "New Tenant";
        var settings = JsonDocument.Parse("{\"key\": \"value\"}");

        _tenantRepositoryMock
            .Setup(x => x.GetByClientIdAsync(clientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        _tenantRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<Tenant>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant t, CancellationToken ct) => t);

        // Act
        var result = await _tenantService.CreateAsync(clientId, name, settings);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(clientId, result.ClientId);
        Assert.Equal(name, result.Name);
        Assert.NotNull(result.Settings);

        _tenantRepositoryMock.Verify(x => x.AddAsync(It.Is<Tenant>(t =>
            t.ClientId == clientId &&
            t.Name == name
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_Tenant_Already_Exists()
    {
        // Arrange
        var clientId = "existing-client";
        var existingTenant = new Tenant
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            Name = "Existing Tenant",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _tenantRepositoryMock
            .Setup(x => x.GetByClientIdAsync(clientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTenant);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tenantService.CreateAsync(clientId, "New Name"));

        _tenantRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Tenant>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateSettingsAsync_Should_Update_Settings_When_Tenant_Exists()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenant = new Tenant
        {
            Id = tenantId,
            ClientId = "test-client-001",
            Name = "Test Tenant",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var newSettings = JsonDocument.Parse("{\"newKey\": \"newValue\"}");

        _tenantRepositoryMock
            .Setup(x => x.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        _tenantRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<Tenant>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant t, CancellationToken ct) => t);

        // Act
        var result = await _tenantService.UpdateSettingsAsync(tenantId, newSettings);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(newSettings, result.Settings);

        _tenantRepositoryMock.Verify(x => x.UpdateAsync(It.Is<Tenant>(t =>
            t.Id == tenantId &&
            t.Settings == newSettings
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateSettingsAsync_Should_Throw_When_Tenant_Not_Found()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var newSettings = JsonDocument.Parse("{\"key\": \"value\"}");

        _tenantRepositoryMock
            .Setup(x => x.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _tenantService.UpdateSettingsAsync(tenantId, newSettings));

        _tenantRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Tenant>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ValidateTenantAsync_Should_Return_True_When_Tenant_Exists()
    {
        // Arrange
        var clientId = "valid-client";
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            ClientId = clientId,
            Name = "Test Tenant",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _tenantRepositoryMock
            .Setup(x => x.GetByClientIdAsync(clientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenant);

        // Act
        var result = await _tenantService.ValidateTenantAsync(clientId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ValidateTenantAsync_Should_Return_False_When_Tenant_Not_Exists()
    {
        // Arrange
        var clientId = "invalid-client";

        _tenantRepositoryMock
            .Setup(x => x.GetByClientIdAsync(clientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        // Act
        var result = await _tenantService.ValidateTenantAsync(clientId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetAllAsync_Should_Return_All_Tenants()
    {
        // Arrange
        var tenants = new List<Tenant>
        {
            new Tenant { Id = Guid.NewGuid(), ClientId = "client-001", Name = "Tenant 1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Tenant { Id = Guid.NewGuid(), ClientId = "client-002", Name = "Tenant 2", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _tenantRepositoryMock
            .Setup(x => x.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenants);

        // Act
        var result = await _tenantService.GetAllAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }
}
