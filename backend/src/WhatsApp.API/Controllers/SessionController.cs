using Microsoft.AspNetCore.Mvc;
using WhatsApp.API.DTOs;
using WhatsApp.API.Extensions;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class SessionController : ControllerBase
{
    private readonly ISessionService _sessionService;
    private readonly IRealtimeNotificationService _realtimeNotificationService;
    private readonly ILogger<SessionController> _logger;

    public SessionController(
        ISessionService sessionService,
        IRealtimeNotificationService realtimeNotificationService,
        ILogger<SessionController> logger)
    {
        _sessionService = sessionService;
        _realtimeNotificationService = realtimeNotificationService;
        _logger = logger;
    }

    /// <summary>
    /// Initialize a new WhatsApp session
    /// </summary>
    [HttpPost("initialize")]
    [ProducesResponseType(typeof(SessionStatusResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Initialize([FromBody] InitializeSessionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = HttpContext.GetTenantId();

            _logger.LogInformation("Initializing session for tenant {TenantId}, phone {PhoneNumber}", tenantId, request.PhoneNumber);

            var status = await _sessionService.InitializeSessionAsync(tenantId, request.PhoneNumber, request.ProviderType, cancellationToken);

            var response = new SessionStatusResponseDto
            {
                IsConnected = status.IsConnected,
                PhoneNumber = status.PhoneNumber,
                Status = status.Status,
                ConnectedAt = status.ConnectedAt,
                Metadata = status.Metadata,
                Provider = request.ProviderType.ToString().ToLowerInvariant(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Notify connected clients via SignalR
            _ = Task.Run(async () =>
            {
                try
                {
                    await _realtimeNotificationService.NotifySessionEventAsync(
                        tenantId,
                        request.PhoneNumber,
                        "initialized",
                        new { status = status.Status, qrCode = status.QrCode },
                        CancellationToken.None);

                    // If QR code is available, send separate notification
                    if (!string.IsNullOrEmpty(status.QrCode))
                    {
                        await _realtimeNotificationService.NotifyQRCodeAsync(
                            tenantId,
                            request.PhoneNumber,
                            status.QrCode,
                            CancellationToken.None);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send realtime notification for session initialization");
                }
            }, CancellationToken.None);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing session");
            return StatusCode(500, new { error = "Internal server error initializing session" });
        }
    }

    /// <summary>
    /// Get session status for a phone number
    /// </summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(SessionStatusResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetStatus([FromQuery] string phoneNumber, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(phoneNumber))
            {
                return BadRequest(new { error = "Phone number is required" });
            }

            var tenantId = HttpContext.GetTenantId();

            _logger.LogInformation("Getting session status for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);

            var status = await _sessionService.GetSessionStatusAsync(tenantId, phoneNumber, cancellationToken);

            if (status.Status == "not_found")
            {
                return NotFound(new { error = "Session not found" });
            }

            var response = new SessionStatusResponseDto
            {
                IsConnected = status.IsConnected,
                PhoneNumber = status.PhoneNumber,
                Status = status.Status,
                ConnectedAt = status.ConnectedAt,
                Metadata = status.Metadata,
                Provider = "baileys", // Default for now
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session status");
            return StatusCode(500, new { error = "Internal server error getting session status" });
        }
    }

    /// <summary>
    /// Get all sessions for the current tenant
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<SessionStatusResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        try
        {
            var tenantId = HttpContext.GetTenantId();

            _logger.LogInformation("Getting all sessions for tenant {TenantId}", tenantId);

            var sessions = await _sessionService.GetTenantSessionsAsync(tenantId, cancellationToken);

            _logger.LogInformation("Found {Count} sessions for tenant {TenantId}", sessions.Count(), tenantId);

            var response = sessions.Select(s =>
            {
                // Extract status from session data if available
                string status = "disconnected";
                if (s.SessionData != null)
                {
                    try
                    {
                        var sessionDataJson = s.SessionData.RootElement;
                        if (sessionDataJson.TryGetProperty("status", out var statusElement))
                        {
                            status = statusElement.GetString() ?? (s.IsActive ? "connected" : "disconnected");
                        }
                        else
                        {
                            status = s.IsActive ? "connected" : "disconnected";
                        }
                    }
                    catch
                    {
                        status = s.IsActive ? "connected" : "disconnected";
                    }
                }
                else
                {
                    status = s.IsActive ? "connected" : "disconnected";
                }

                return new SessionStatusResponseDto
                {
                    IsConnected = s.IsActive,
                    PhoneNumber = s.PhoneNumber,
                    Status = status,
                    ConnectedAt = s.IsActive ? s.UpdatedAt : null,
                    Metadata = null,
                    Provider = s.ProviderType.ToString().ToLowerInvariant(),
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                };
            });

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting sessions");
            return StatusCode(500, new { error = "Internal server error getting sessions" });
        }
    }

    /// <summary>
    /// Disconnect a WhatsApp session
    /// </summary>
    [HttpDelete("disconnect")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Disconnect([FromQuery] string phoneNumber, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(phoneNumber))
            {
                return BadRequest(new { error = "Phone number is required" });
            }

            var tenantId = HttpContext.GetTenantId();

            _logger.LogInformation("Disconnecting session for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);

            var success = await _sessionService.DisconnectSessionAsync(tenantId, phoneNumber, cancellationToken);

            if (!success)
            {
                return NotFound(new { error = "Session not found" });
            }

            // Notify connected clients via SignalR
            _ = Task.Run(async () =>
            {
                try
                {
                    await _realtimeNotificationService.NotifySessionEventAsync(
                        tenantId,
                        phoneNumber,
                        "disconnected",
                        new { timestamp = DateTime.UtcNow },
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send realtime notification for session disconnection");
                }
            }, CancellationToken.None);

            return Ok(new { message = "Session disconnected successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disconnecting session");
            return StatusCode(500, new { error = "Internal server error disconnecting session" });
        }
    }

    /// <summary>
    /// Get QR code for session authentication (Baileys only)
    /// </summary>
    [HttpGet("qrcode")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetQRCode([FromQuery] string phoneNumber, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrEmpty(phoneNumber))
            {
                return BadRequest(new { error = "Phone number is required" });
            }

            var tenantId = HttpContext.GetTenantId();

            _logger.LogInformation("Getting QR code for tenant {TenantId}, phone {PhoneNumber}", tenantId, phoneNumber);

            var qrCode = await _sessionService.GetQRCodeAsync(tenantId, phoneNumber, cancellationToken);

            if (qrCode == null)
            {
                return NotFound(new { error = "Session not found" });
            }

            // Notify connected clients via SignalR
            _ = Task.Run(async () =>
            {
                try
                {
                    await _realtimeNotificationService.NotifyQRCodeAsync(
                        tenantId,
                        phoneNumber,
                        qrCode,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send realtime QR code notification");
                }
            }, CancellationToken.None);

            return Ok(new { qrCode = qrCode });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting QR code");
            return StatusCode(500, new { error = "Internal server error getting QR code" });
        }
    }
}
