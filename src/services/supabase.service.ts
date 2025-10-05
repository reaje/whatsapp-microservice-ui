import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/constants';
import type { Message } from '@/types';

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

export class SupabaseService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to new messages for a tenant
   * Recebe todas as mensagens do tenant em tempo real
   */
  subscribeToMessagesByTenant(
    tenantId: string,
    callback: (message: Message) => void
  ): RealtimeChannel {
    const channelName = `messages-tenant:${tenantId}`;

    // Remove existing channel if any
    this.unsubscribe(channelName);

    console.log(`[Supabase] Subscribing to messages for tenant: ${tenantId}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'whatsapp_service',
          table: 'messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Supabase] New message received:', payload.new);
          callback(this.mapMessage(payload.new as any));
        }
      )
      .subscribe((status) => {
        console.log(`[Supabase] Subscription status:`, status);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to new messages for a specific session
   * @deprecated Use subscribeToMessagesByTenant for better performance
   */
  subscribeToMessages(
    sessionId: string,
    callback: (message: Message) => void
  ): RealtimeChannel {
    const channelName = `messages:${sessionId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'whatsapp_service',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(this.mapMessage(payload.new as any));
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to message status updates for a tenant
   */
  subscribeToMessageStatusByTenant(
    tenantId: string,
    callback: (message: Message) => void
  ): RealtimeChannel {
    const channelName = `message-status-tenant:${tenantId}`;

    this.unsubscribe(channelName);

    console.log(`[Supabase] Subscribing to message status for tenant: ${tenantId}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'whatsapp_service',
          table: 'messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Supabase] Message status updated:', payload.new);
          callback(this.mapMessage(payload.new as any));
        }
      )
      .subscribe((status) => {
        console.log(`[Supabase] Status subscription status:`, status);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to message status updates for a specific message
   * @deprecated Use subscribeToMessageStatusByTenant for better performance
   */
  subscribeToMessageStatus(
    messageId: string,
    callback: (status: string) => void
  ): RealtimeChannel {
    const channelName = `message_status:${messageId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'whatsapp_service',
          table: 'messages',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          callback((payload.new as any).status);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to session status changes
   */
  subscribeToSessionStatus(
    tenantId: string,
    callback: (session: any) => void
  ): RealtimeChannel {
    const channelName = `sessions:${tenantId}`;

    this.unsubscribe(channelName);

    console.log(`[Supabase] Subscribing to sessions for tenant: ${tenantId}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'whatsapp_service',
          table: 'whatsapp_sessions',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[Supabase] Session status changed:', payload.new);
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`[Supabase] Session subscription status:`, status);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to typing indicators via Supabase Realtime Broadcast (per-tenant)
   */
  subscribeToTypingByTenant(
    tenantId: string,
    callback: (payload: { contactId: string; isTyping: boolean; source?: string }) => void
  ): RealtimeChannel {
    const channelName = `typing-tenant:${tenantId}`;

    this.unsubscribe(channelName);

    console.log(`[Supabase] Subscribing to typing events for tenant: ${tenantId}`);

    const channel = supabase
      .channel(channelName, { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        try {
          if (payload && typeof payload.contactId === 'string') {
            callback(payload as any);
          }
        } catch (e) {
          console.warn('[Supabase] Failed to handle typing payload', e);
        }
      })
      .subscribe((status) => {
        console.log(`[Supabase] Typing subscription status:`, status);
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Emit a typing indicator event for a tenant
   */
  async emitTyping(
    tenantId: string,
    contactId: string,
    isTyping: boolean,
    source: 'agent' | 'user' = 'agent'
  ): Promise<void> {
    const channelName = `typing-tenant:${tenantId}`;
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = supabase.channel(channelName, { config: { broadcast: { self: true } } });
      this.channels.set(channelName, channel);
      await channel.subscribe();
    }

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { contactId, isTyping, source },
    } as any);
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    for (const channel of this.channels.values()) {
      await channel.unsubscribe();
    }
    this.channels.clear();
  }

  /**
   * Query messages from database
   */
  async getMessages(sessionId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse().map(this.mapMessage);
  }

  private mapMessage(data: any): Message {
    return {
      id: data.id,
      sessionId: data.session_id,
      messageId: data.message_id,
      fromNumber: data.from_number,
      toNumber: data.to_number,
      type: data.message_type,
      content: data.content,
      status: data.status,
      timestamp: new Date(data.created_at),
      metadata: data.metadata,
    };
  }
}

export const supabaseService = new SupabaseService();
export { supabase };
