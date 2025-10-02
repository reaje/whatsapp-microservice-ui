export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  sessionId: string;
  messageId: string;
  fromNumber: string;
  toNumber: string;
  type: MessageType;
  content: any;
  status: MessageStatus;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SendTextMessageRequest {
  to: string;
  content: string;
}

export interface SendMediaMessageRequest {
  to: string;
  mediaBase64: string;
  mediaType: 'image' | 'video' | 'document';
  caption?: string;
}

export interface SendAudioMessageRequest {
  to: string;
  audioBase64: string;
}

export interface SendLocationMessageRequest {
  to: string;
  latitude: number;
  longitude: number;
}

export interface MessageResponse {
  messageId: string;
  status: MessageStatus;
  provider: string;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount: number;
}
