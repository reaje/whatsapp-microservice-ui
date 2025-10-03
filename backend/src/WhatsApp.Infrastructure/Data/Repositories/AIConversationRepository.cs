using Microsoft.EntityFrameworkCore;
using WhatsApp.Core.Entities;
using WhatsApp.Core.Interfaces;

namespace WhatsApp.Infrastructure.Data.Repositories;

public class AIConversationRepository : Repository<AIConversation>, IAIConversationRepository
{
    public AIConversationRepository(SupabaseContext context) : base(context)
    {
    }

    public async Task<AIConversation?> GetBySessionAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<AIConversation>()
            .Include(c => c.Agent)
            .Where(c => c.SessionId == sessionId)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<AIConversation>> GetByAgentAsync(Guid agentId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<AIConversation>()
            .Where(c => c.AgentId == agentId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<AIConversation>> GetByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<AIConversation>()
            .Include(c => c.Agent)
            .Include(c => c.Session)
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
    {
        var oldConversations = await _context.Set<AIConversation>()
            .Where(c => c.UpdatedAt < cutoffDate)
            .ToListAsync(cancellationToken);

        _context.Set<AIConversation>().RemoveRange(oldConversations);
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
