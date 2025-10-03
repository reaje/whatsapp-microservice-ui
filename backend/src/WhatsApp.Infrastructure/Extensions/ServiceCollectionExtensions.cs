using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WhatsApp.Core.Interfaces;
using WhatsApp.Infrastructure.Data;
using WhatsApp.Infrastructure.Data.Repositories;
using WhatsApp.Infrastructure.Providers;
using WhatsApp.Infrastructure.Services;

namespace WhatsApp.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database Context
        services.AddDbContext<SupabaseContext>(options =>
        {
            var connectionString = configuration.GetConnectionString("RulesEngineDatabase");
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorCodesToAdd: null);
                npgsqlOptions.CommandTimeout(30);
            });

            // Enable sensitive data logging in development
            if (configuration["ASPNETCORE_ENVIRONMENT"] == "Development")
            {
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
            }
        });

        // Repositories
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<ISessionRepository, SessionRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IUserRepository, WhatsApp.Infrastructure.Repositories.UserRepository>();

        // Services
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IMessageService, MessageService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();

        // Cache Services
        services.AddSingleton<ISessionCacheService, RedisSessionCacheService>();

        // Webhook Services
        services.AddScoped<IWebhookDeliveryService, WebhookDeliveryService>();

        // HttpClient for Baileys Service
        services.AddHttpClient("BaileysService", client =>
        {
            var baileysUrl = configuration["BaileysService:Url"] ?? "http://localhost:3000";
            client.BaseAddress = new Uri(baileysUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        // HttpClient for Webhook Delivery
        services.AddHttpClient("WebhookClient", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent", "WhatsApp-Microservice-Webhook/1.0");
        });

        // Providers
        services.AddScoped<BaileysProvider>();
        services.AddScoped<MetaApiProvider>();
        services.AddScoped<IProviderFactory, ProviderFactory>();

        return services;
    }

    public static IServiceCollection AddSupabaseClient(this IServiceCollection services, IConfiguration configuration)
    {
        var supabaseUrl = configuration["Supabase:Url"];
        var supabaseAnonKey = configuration["Supabase:AnonKey"];

        if (!string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseAnonKey))
        {
            services.AddScoped(_ =>
            {
                var options = new Supabase.SupabaseOptions
                {
                    AutoConnectRealtime = true
                };

                return new Supabase.Client(supabaseUrl, supabaseAnonKey, options);
            });
        }

        return services;
    }
}