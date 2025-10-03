using Microsoft.EntityFrameworkCore;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.Infrastructure.Data.Repositories;

public class AIAgentRepository : Repository<AIAgent>, IAIAgentRepository
{
    public AIAgentRepository(SupabaseContext context) : base(context)
    {
    }

    public async Task<IEnumerable<AIAgent>> GetByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<AIAgent>()
            .Where(a => a.TenantId == tenantId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AIAgent>> GetActiveByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<AIAgent>()
            .Where(a => a.TenantId == tenantId && a.IsActive)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<AIAgent?> GetByTenantAndIdAsync(Guid tenantId, Guid agentId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<AIAgent>()
            .Where(a => a.TenantId == tenantId && a.Id == agentId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<AIAgent?> GetByTenantAndNameAsync(Guid tenantId, string name, CancellationToken cancellationToken = default)
    {
        return await _context.Set<AIAgent>()
            .Where(a => a.TenantId == tenantId && a.Name == name)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
