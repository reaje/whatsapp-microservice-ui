using Microsoft.Extensions.Logging;
using Moq;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;
using WhatsApp.Infrastructure.Services;

namespace WhatsApp.Tests.Unit;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ILogger<UserService>> _loggerMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _loggerMock = new Mock<ILogger<UserService>>();

        _userService = new UserService(_userRepositoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetByIdAsync_Should_Return_User_When_Found()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Test User",
            Role = "User",
            IsActive = true
        };

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _userService.GetByIdAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("test@test.com", result.Email);
    }

    [Fact]
    public async Task GetAllByTenantIdAsync_Should_Return_All_Users_For_Tenant()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "user1@test.com", FullName = "User 1", Role = "User", IsActive = true },
            new User { Id = Guid.NewGuid(), TenantId = tenantId, Email = "user2@test.com", FullName = "User 2", Role = "Admin", IsActive = true }
        };

        _userRepositoryMock
            .Setup(x => x.GetAllByTenantIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(users);

        // Act
        var result = await _userService.GetAllByTenantIdAsync(tenantId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task CreateAsync_Should_Create_User_When_Valid()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var email = "newuser@test.com";
        var password = "Password@123";
        var fullName = "New User";
        var role = "User";

        _userRepositoryMock
            .Setup(x => x.ExistsAsync(email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userRepositoryMock
            .Setup(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => u);

        // Act
        var result = await _userService.CreateAsync(tenantId, email, password, fullName, role);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(tenantId, result.TenantId);
        Assert.Equal(email, result.Email);
        Assert.Equal(fullName, result.FullName);
        Assert.Equal(role, result.Role);
        Assert.True(result.IsActive);
        Assert.NotNull(result.PasswordHash);

        _userRepositoryMock.Verify(x => x.AddAsync(It.Is<User>(u =>
            u.TenantId == tenantId &&
            u.Email == email &&
            u.FullName == fullName &&
            u.Role == role
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_User_Already_Exists()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var email = "existing@test.com";

        _userRepositoryMock
            .Setup(x => x.ExistsAsync(email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _userService.CreateAsync(tenantId, email, "Password@123", "Test User", "User"));

        _userRepositoryMock.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("InvalidRole")]
    [InlineData("")]
    [InlineData("SuperAdmin")]
    public async Task CreateAsync_Should_Throw_When_Role_Invalid(string invalidRole)
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var email = "newuser@test.com";

        _userRepositoryMock
            .Setup(x => x.ExistsAsync(email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _userService.CreateAsync(tenantId, email, "Password@123", "Test User", invalidRole));
    }

    [Fact]
    public async Task UpdateAsync_Should_Update_User_When_Valid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Old Name",
            Role = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => u);

        // Act
        var result = await _userService.UpdateAsync(userId, "New Name", "Admin", false);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Name", result.FullName);
        Assert.Equal("Admin", result.Role);
        Assert.False(result.IsActive);

        _userRepositoryMock.Verify(x => x.UpdateAsync(It.Is<User>(u =>
            u.Id == userId &&
            u.FullName == "New Name" &&
            u.Role == "Admin" &&
            !u.IsActive
        ), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_Should_Only_Update_Provided_Fields()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Original Name",
            Role = "User",
            IsActive = true
        };

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => u);

        // Act - only update fullName
        var result = await _userService.UpdateAsync(userId, "New Name", null, null);

        // Assert
        Assert.Equal("New Name", result.FullName);
        Assert.Equal("User", result.Role); // Should remain unchanged
        Assert.True(result.IsActive); // Should remain unchanged
    }

    [Fact]
    public async Task UpdateAsync_Should_Throw_When_User_Not_Found()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _userService.UpdateAsync(userId, "New Name", null, null));
    }

    [Fact]
    public async Task UpdatePasswordAsync_Should_Update_Password_Hash()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            PasswordHash = "old-hash",
            FullName = "Test User",
            Role = "User",
            IsActive = true
        };

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => u);

        var newPassword = "NewPassword@123";

        // Act
        var result = await _userService.UpdatePasswordAsync(userId, newPassword);

        // Assert
        Assert.True(result);
        Assert.NotEqual("old-hash", user.PasswordHash);

        // Verify password can be validated with BCrypt
        Assert.True(BCrypt.Net.BCrypt.Verify(newPassword, user.PasswordHash));

        _userRepositoryMock.Verify(x => x.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdatePasswordAsync_Should_Throw_When_User_Not_Found()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _userService.UpdatePasswordAsync(userId, "NewPassword@123"));
    }

    [Fact]
    public async Task DeleteAsync_Should_Return_True_When_User_Deleted()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock
            .Setup(x => x.DeleteAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _userService.DeleteAsync(userId);

        // Assert
        Assert.True(result);
        _userRepositoryMock.Verify(x => x.DeleteAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_Should_Return_False_When_User_Not_Found()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock
            .Setup(x => x.DeleteAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _userService.DeleteAsync(userId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeactivateAsync_Should_Set_IsActive_To_False()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "test@test.com",
            FullName = "Test User",
            Role = "User",
            IsActive = true
        };

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken ct) => u);

        // Act
        var result = await _userService.DeactivateAsync(userId);

        // Assert
        Assert.True(result);
        Assert.False(user.IsActive);
        _userRepositoryMock.Verify(x => x.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeactivateAsync_Should_Return_False_When_User_Not_Found()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepositoryMock
            .Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userService.DeactivateAsync(userId);

        // Assert
        Assert.False(result);
        _userRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
