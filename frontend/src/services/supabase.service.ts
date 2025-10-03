import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/constants';
import type { Message } from '@/types';

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

export class SupabaseService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to new messages for a session
   */
  subscribeToMessages(
    sessionId: string,
    callback: (message: Message) => void
  ): RealtimeChannel {
    const channelName = `messages:${sessionId}`;

    // Remove existing channel if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
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
   * Subscribe to message status updates
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
          schema: 'public',
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

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_sessions',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
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
