namespace WhatsApp.API.DTOs.User;

public class UpdateUserDto
{
    public string? FullName { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}
