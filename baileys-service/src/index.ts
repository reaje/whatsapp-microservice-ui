import express from 'express';
import dotenv from 'dotenv';
import { SessionManager } from './services/SessionManager';
import { createSessionRoutes } from './routes/session.routes';
import { createMessageRoutes } from './routes/message.routes';
import pino from 'pino';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for media files
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Session Manager
const sessionManager = new SessionManager(process.env.SESSION_STORAGE_PATH || './sessions');

// Routes
app.use('/api/sessions', createSessionRoutes(sessionManager));
app.use('/api/messages', createMessageRoutes(sessionManager));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'baileys-whatsapp-service' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'WhatsApp Baileys Service',
    version: '1.0.0',
    endpoints: {
      sessions: {
        initialize: 'POST /api/sessions/initialize',
        status: 'GET /api/sessions/:sessionId/status',
        list: 'GET /api/sessions',
        disconnect: 'DELETE /api/sessions/:sessionId'
      },
      messages: {
        text: 'POST /api/messages/text',
        media: 'POST /api/messages/media',
        location: 'POST /api/messages/location',
        audio: 'POST /api/messages/audio'
      }
    }
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Baileys WhatsApp Service running on port ${PORT}`);
  logger.info(`📝 Documentation: http://localhost:${PORT}`);
  logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
});