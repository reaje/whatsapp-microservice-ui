using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.Infrastructure.Services;

/// <summary>
/// Serviço para entrega de webhooks com retry e assinatura HMAC
/// </summary>
public class WebhookDeliveryService : IWebhookDeliveryService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WebhookDeliveryService> _logger;

    public WebhookDeliveryService(
        IHttpClientFactory httpClientFactory,
        ILogger<WebhookDeliveryService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<WebhookDeliveryResult> DeliverIncomingMessageAsync(
        Guid tenantId,
        string webhookUrl,
        object payload,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Delivering incoming message webhook to tenant {TenantId}", tenantId);
        return await DeliverWebhookAsync(webhookUrl, "message.received", payload, cancellationToken: cancellationToken);
    }

    public async Task<WebhookDeliveryResult> DeliverMessageStatusAsync(
        Guid tenantId,
        string webhookUrl,
        object payload,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Delivering message status webhook to tenant {TenantId}", tenantId);
        return await DeliverWebhookAsync(webhookUrl, "message.status", payload, cancellationToken: cancellationToken);
    }

    public async Task<WebhookDeliveryResult> DeliverSessionEventAsync(
        Guid tenantId,
        string webhookUrl,
        string eventType,
        object payload,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Delivering session event webhook ({EventType}) to tenant {TenantId}", eventType, tenantId);
        return await DeliverWebhookAsync(webhookUrl, $"session.{eventType}", payload, cancellationToken: cancellationToken);
    }

    public async Task<WebhookDeliveryResult> DeliverWebhookAsync(
        string webhookUrl,
        string eventType,
        object payload,
        string? secret = null,
        int maxRetries = 3,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var result = new WebhookDeliveryResult
        {
            Success = false,
            Attempts = 0
        };

        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            result.Attempts = attempt + 1;

            try
            {
                var client = _httpClientFactory.CreateClient("WebhookClient");
                client.Timeout = TimeSpan.FromSeconds(10);

                var webhookPayload = new
                {
                    @event = eventType,
                    timestamp = DateTime.UtcNow.ToString("o"),
                    data = payload
                };

                var jsonPayload = JsonSerializer.Serialize(webhookPayload);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                // Adicionar assinatura HMAC se secret fornecido
                if (!string.IsNullOrEmpty(secret))
                {
                    var signature = GenerateHmacSignature(jsonPayload, secret);
                    content.Headers.Add("X-WhatsApp-Signature", signature);
                }

                content.Headers.Add("X-WhatsApp-Event", eventType);
                content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

                _logger.LogDebug("Sending webhook to {Url}, attempt {Attempt}/{MaxRetries}", webhookUrl, attempt + 1, maxRetries + 1);

                var response = await client.PostAsync(webhookUrl, content, cancellationToken);

                result.StatusCode = (int)response.StatusCode;
                result.ResponseBody = await response.Content.ReadAsStringAsync(cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    result.Success = true;
                    stopwatch.Stop();
                    result.TotalDuration = stopwatch.Elapsed;

                    _logger.LogInformation("Webhook delivered successfully to {Url} in {Duration}ms after {Attempts} attempt(s)",
                        webhookUrl, stopwatch.ElapsedMilliseconds, result.Attempts);

                    return result;
                }
                else
                {
                    _logger.LogWarning("Webhook delivery failed with status {StatusCode}: {ResponseBody}",
                        result.StatusCode, result.ResponseBody);
                }
            }
            catch (TaskCanceledException ex)
            {
                result.Error = "Request timeout";
                _logger.LogWarning(ex, "Webhook delivery timed out (attempt {Attempt}/{MaxRetries})", attempt + 1, maxRetries + 1);
            }
            catch (HttpRequestException ex)
            {
                result.Error = $"HTTP request error: {ex.Message}";
                _logger.LogWarning(ex, "Webhook delivery HTTP error (attempt {Attempt}/{MaxRetries})", attempt + 1, maxRetries + 1);
            }
            catch (Exception ex)
            {
                result.Error = $"Unexpected error: {ex.Message}";
                _logger.LogError(ex, "Unexpected error delivering webhook (attempt {Attempt}/{MaxRetries})", attempt + 1, maxRetries + 1);
            }

            // Backoff exponencial antes de retry (exceto na última tentativa)
            if (attempt < maxRetries)
            {
                var delayMs = (int)Math.Pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s...
                _logger.LogDebug("Waiting {DelayMs}ms before retry", delayMs);
                await Task.Delay(delayMs, cancellationToken);
            }
        }

        stopwatch.Stop();
        result.TotalDuration = stopwatch.Elapsed;

        _logger.LogError("Webhook delivery failed after {Attempts} attempts to {Url}", result.Attempts, webhookUrl);

        return result;
    }

    /// <summary>
    /// Gera assinatura HMAC-SHA256 para o payload
    /// </summary>
    private static string GenerateHmacSignature(string payload, string secret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret);
        var payloadBytes = Encoding.UTF8.GetBytes(payload);

        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(payloadBytes);

        return "sha256=" + BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
    }
}
