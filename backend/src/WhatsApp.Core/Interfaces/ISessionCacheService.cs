using WhatsApp.Core.Entities;
using WhatsApp.Core.Models;

namespace WhatsApp.Core.Interfaces;

/// <summary>
/// Interface para cache de sessões WhatsApp usando Redis
/// </summary>
public interface ISessionCacheService
{
    /// <summary>
    /// Armazena o status de uma sessão no cache
    /// </summary>
    Task SetSessionStatusAsync(Guid tenantId, string phoneNumber, SessionStatus status, TimeSpan? expiry = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém o status de uma sessão do cache
    /// </summary>
    Task<SessionStatus?> GetSessionStatusAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Armazena o QR code de uma sessão no cache
    /// </summary>
    Task SetQRCodeAsync(Guid tenantId, string phoneNumber, string qrCode, TimeSpan? expiry = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém o QR code de uma sessão do cache
    /// </summary>
    Task<string?> GetQRCodeAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Armazena a lista de sessões de um tenant no cache
    /// </summary>
    Task SetTenantSessionsAsync(Guid tenantId, IEnumerable<WhatsAppSession> sessions, TimeSpan? expiry = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtém a lista de sessões de um tenant do cache
    /// </summary>
    Task<IEnumerable<WhatsAppSession>?> GetTenantSessionsAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove o cache de uma sessão específica
    /// </summary>
    Task InvalidateSessionCacheAsync(Guid tenantId, string phoneNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove o cache de todas as sessões de um tenant
    /// </summary>
    Task InvalidateTenantCacheAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifica se o cache está disponível
    /// </summary>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}
