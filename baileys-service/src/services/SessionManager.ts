import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  ConnectionState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

interface SessionInfo {
  socket: WASocket;
  qrCode?: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_required';
  phoneNumber?: string;
  connectedAt?: Date;
}

export class SessionManager {
  private sessions: Map<string, SessionInfo> = new Map();
  private logger = pino({ level: process.env.LOG_LEVEL || 'info' });
  private sessionsPath: string;

  constructor(sessionsPath: string = './sessions') {
    this.sessionsPath = sessionsPath;

    // Create sessions directory if it doesn't exist
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }

  async initializeSession(sessionId: string, phoneNumber: string): Promise<{ qrCode?: string; status: string }> {
    this.logger.info({ sessionId, phoneNumber }, 'Initializing session');

    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      if (session.status === 'connected') {
        return { status: 'already_connected' };
      }
    }

    const sessionPath = path.join(this.sessionsPath, sessionId);

    // Create session directory
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      logger: this.logger.child({ sessionId }),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger)
      },
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true
    });

    const sessionInfo: SessionInfo = {
      socket,
      status: 'connecting',
      phoneNumber
    };

    this.sessions.set(sessionId, sessionInfo);

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      await this.handleConnectionUpdate(sessionId, update, sessionInfo);
    });

    // Save credentials on update
    socket.ev.on('creds.update', saveCreds);

    // Handle messages (for future webhook integration)
    socket.ev.on('messages.upsert', async (m) => {
      this.logger.info({ sessionId, messages: m.messages.length }, 'Received messages');
      // TODO: Send to webhook endpoint in .NET service
    });

    return { status: sessionInfo.status, qrCode: sessionInfo.qrCode };
  }

  private async handleConnectionUpdate(
    sessionId: string,
    update: Partial<ConnectionState>,
    sessionInfo: SessionInfo
  ) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      sessionInfo.qrCode = qr;
      sessionInfo.status = 'qr_required';
      this.logger.info({ sessionId }, 'QR Code generated');
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      this.logger.info(
        { sessionId, shouldReconnect },
        'Connection closed'
      );

      sessionInfo.status = 'disconnected';

      if (shouldReconnect) {
        // Reconnect after delay
        setTimeout(() => {
          this.initializeSession(sessionId, sessionInfo.phoneNumber!);
        }, 5000);
      } else {
        this.sessions.delete(sessionId);
      }
    } else if (connection === 'open') {
      sessionInfo.status = 'connected';
      sessionInfo.connectedAt = new Date();
      sessionInfo.phoneNumber = sessionInfo.socket.user?.id.split(':')[0];
      this.logger.info({ sessionId, phoneNumber: sessionInfo.phoneNumber }, 'Session connected');
    }
  }

  async sendTextMessage(
    sessionId: string,
    to: string,
    content: string
  ): Promise<{ messageId: string; status: string }> {
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'connected') {
      throw new Error('Session not connected');
    }

    // Format phone number for WhatsApp (add @s.whatsapp.net)
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    const result = await session.socket.sendMessage(jid, { text: content });

    this.logger.info({ sessionId, to, messageId: result?.key?.id }, 'Text message sent');

    return {
      messageId: result?.key?.id || '',
      status: 'sent'
    };
  }

  async sendMediaMessage(
    sessionId: string,
    to: string,
    mediaBuffer: Buffer,
    mediaType: 'image' | 'video' | 'document' | 'audio',
    caption?: string,
    fileName?: string
  ): Promise<{ messageId: string; status: string }> {
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'connected') {
      throw new Error('Session not connected');
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    let message: any = {};

    switch (mediaType) {
      case 'image':
        message = { image: mediaBuffer, caption };
        break;
      case 'video':
        message = { video: mediaBuffer, caption };
        break;
      case 'audio':
        message = { audio: mediaBuffer, mimetype: 'audio/mp4' };
        break;
      case 'document':
        message = { document: mediaBuffer, fileName, mimetype: 'application/pdf' };
        break;
    }

    const result = await session.socket.sendMessage(jid, message);

    this.logger.info({ sessionId, to, mediaType, messageId: result?.key?.id }, 'Media message sent');

    return {
      messageId: result?.key?.id || '',
      status: 'sent'
    };
  }

  async sendLocation(
    sessionId: string,
    to: string,
    latitude: number,
    longitude: number
  ): Promise<{ messageId: string; status: string }> {
    const session = this.sessions.get(sessionId);

    if (!session || session.status !== 'connected') {
      throw new Error('Session not connected');
    }

    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

    const result = await session.socket.sendMessage(jid, {
      location: { degreesLatitude: latitude, degreesLongitude: longitude }
    });

    this.logger.info({ sessionId, to, messageId: result?.key?.id }, 'Location sent');

    return {
      messageId: result?.key?.id || '',
      status: 'sent'
    };
  }

  async disconnectSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    await session.socket.logout();
    this.sessions.delete(sessionId);

    // Clean up session files
    const sessionPath = path.join(this.sessionsPath, sessionId);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    this.logger.info({ sessionId }, 'Session disconnected');

    return true;
  }

  getSessionStatus(sessionId: string): any {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { status: 'not_found' };
    }

    return {
      status: session.status,
      phoneNumber: session.phoneNumber,
      connectedAt: session.connectedAt,
      qrCode: session.qrCode
    };
  }

  getAllSessions(): { sessionId: string; status: string; phoneNumber?: string }[] {
    const sessions: any[] = [];

    this.sessions.forEach((session, sessionId) => {
      sessions.push({
        sessionId,
        status: session.status,
        phoneNumber: session.phoneNumber
      });
    });

    return sessions;
  }
}