using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;
using WhatsApp.Infrastructure.Data;
using WhatsApp.Infrastructure.Services;

namespace WhatsApp.Tests.Unit;

public class AuthServiceTests : IDisposable
{
    private readonly SupabaseContext _context;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly Mock<ITenantService> _tenantServiceMock;
    private readonly AuthService _authService;
    private readonly Tenant _testTenant;
    private readonly User _testUser;

    public AuthServiceTests()
    {
        // Load configuration from appsettings.Test.json
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.Test.json", optional: false)
            .Build();

        var connectionString = configuration.GetConnectionString("RulesEngineDatabase");

        // Setup real PostgreSQL database
        var options = new DbContextOptionsBuilder<SupabaseContext>()
            .UseNpgsql(connectionString)
            .Options;
        _context = new SupabaseContext(options);

        // Setup mocks
        _configurationMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<AuthService>>();
        _tenantServiceMock = new Mock<ITenantService>();

        // Setup JWT configuration
        _configurationMock.Setup(c => c["Jwt:Key"]).Returns("my-super-secret-key-with-at-least-32-characters-for-testing");
        _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("test-issuer");
        _configurationMock.Setup(c => c["Jwt:Audience"]).Returns("test-audience");
        _configurationMock.Setup(c => c.GetSection("Jwt:ExpiresInMinutes").Value).Returns("60");

        // Create test tenant
        _testTenant = new Tenant
        {
            Id = Guid.NewGuid(),
            ClientId = "test-client-001",
            Name = "Test Tenant",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Create test user with hashed password
        _testUser = new User
        {
            Id = Guid.NewGuid(),
            TenantId = _testTenant.Id,
            Email = "test@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test@123"),
            FullName = "Test User",
            Role = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tenants.Add(_testTenant);
        _context.Users.Add(_testUser);
        _context.SaveChanges();

        _authService = new AuthService(_context, _configurationMock.Object, _loggerMock.Object, _tenantServiceMock.Object);
    }

    [Fact]
    public async Task LoginAsync_Should_Throw_UnauthorizedAccessException_When_Tenant_Not_Found()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync("invalid-client", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync("invalid-client", "test@test.com", "Test@123"));
    }

    [Fact]
    public async Task LoginAsync_Should_Throw_UnauthorizedAccessException_When_User_Not_Found()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(_testTenant.ClientId, "nonexistent@test.com", "Test@123"));
    }

    [Fact]
    public async Task LoginAsync_Should_Throw_UnauthorizedAccessException_When_Password_Invalid()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(_testTenant.ClientId, "test@test.com", "WrongPassword"));
    }

    [Fact]
    public async Task LoginAsync_Should_Throw_UnauthorizedAccessException_When_User_Inactive()
    {
        // Arrange
        _testUser.IsActive = false;
        await _context.SaveChangesAsync();

        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _authService.LoginAsync(_testTenant.ClientId, "test@test.com", "Test@123"));
    }

    [Fact]
    public async Task LoginAsync_Should_Return_User_And_Token_When_Credentials_Valid()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act
        var result = await _authService.LoginAsync(_testTenant.ClientId, "test@test.com", "Test@123");

        // Assert
        Assert.NotNull(result.User);
        Assert.Equal("test@test.com", result.User.Email);
        Assert.NotNull(result.Token);
        Assert.True(result.ExpiresIn > 0);
        Assert.NotNull(_testUser.LastLoginAt);
    }

    [Fact]
    public async Task RegisterAsync_Should_Throw_ArgumentException_When_Tenant_Not_Found()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync("invalid-client", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _authService.RegisterAsync("invalid-client", "new@test.com", "Password@123", "New User", "User"));
    }

    [Fact]
    public async Task RegisterAsync_Should_Throw_InvalidOperationException_When_User_Already_Exists()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _authService.RegisterAsync(_testTenant.ClientId, "test@test.com", "Password@123", "Duplicate User", "User"));
    }

    [Fact]
    public async Task RegisterAsync_Should_Create_User_When_Valid()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        var newEmail = "newuser@test.com";
        var fullName = "New Test User";
        var role = "Admin";

        // Act
        var result = await _authService.RegisterAsync(_testTenant.ClientId, newEmail, "Password@123", fullName, role);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(newEmail.ToLower(), result.Email);
        Assert.Equal(fullName, result.FullName);
        Assert.Equal(role, result.Role);
        Assert.True(result.IsActive);
        Assert.NotEqual(default(Guid), result.Id);

        // Verify user was saved to database
        var savedUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == newEmail.ToLower());
        Assert.NotNull(savedUser);
    }

    [Fact]
    public async Task RegisterAsync_Should_Default_To_User_Role_When_Invalid_Role_Provided()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act
        var result = await _authService.RegisterAsync(_testTenant.ClientId, "newuser2@test.com", "Password@123", "User With Invalid Role", "InvalidRole");

        // Assert
        Assert.Equal("User", result.Role);
    }

    [Fact]
    public async Task GetUserByEmailAsync_Should_Return_Null_When_Tenant_Not_Found()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync("invalid-client", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Tenant?)null);

        // Act
        var result = await _authService.GetUserByEmailAsync("invalid-client", "test@test.com");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetUserByEmailAsync_Should_Return_Null_When_User_Not_Found()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act
        var result = await _authService.GetUserByEmailAsync(_testTenant.ClientId, "nonexistent@test.com");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetUserByEmailAsync_Should_Return_User_When_Found()
    {
        // Arrange
        _tenantServiceMock
            .Setup(x => x.GetByClientIdAsync(_testTenant.ClientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testTenant);

        // Act
        var result = await _authService.GetUserByEmailAsync(_testTenant.ClientId, "test@test.com");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("test@test.com", result.Email);
        Assert.NotNull(result.Tenant);
    }

    [Fact]
    public async Task ValidatePasswordAsync_Should_Return_True_When_Password_Correct()
    {
        // Act
        var result = await _authService.ValidatePasswordAsync(_testUser, "Test@123");

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ValidatePasswordAsync_Should_Return_False_When_Password_Incorrect()
    {
        // Act
        var result = await _authService.ValidatePasswordAsync(_testUser, "WrongPassword");

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void GenerateJwtToken_Should_Return_Valid_Token()
    {
        // Act
        var token = _authService.GenerateJwtToken(_testUser, _testTenant);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.Contains(".", token); // JWT format has dots
    }

    public void Dispose()
    {
        // Clean up test data
        try
        {
            if (_context != null)
            {
                // Remove test user and tenant
                var user = _context.Users.Find(_testUser.Id);
                if (user != null)
                {
                    _context.Users.Remove(user);
                }

                var tenant = _context.Tenants.Find(_testTenant.Id);
                if (tenant != null)
                {
                    _context.Tenants.Remove(tenant);
                }

                // Remove any users created during tests with "newuser" prefix
                var testUsers = _context.Users
                    .Where(u => u.Email.StartsWith("newuser") && u.TenantId == _testTenant.Id)
                    .ToList();
                _context.Users.RemoveRange(testUsers);

                _context.SaveChanges();
            }
        }
        catch
        {
            // Ignore cleanup errors
        }
        finally
        {
            _context?.Dispose();
        }
    }
}
