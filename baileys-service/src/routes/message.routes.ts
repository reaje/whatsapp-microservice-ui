import { Router } from 'express';
import { SessionManager } from '../services/SessionManager';

export function createMessageRoutes(sessionManager: SessionManager): Router {
  const router = Router();

  // POST /api/messages/text
  router.post('/text', async (req, res) => {
    try {
      const { sessionId, to, content } = req.body;

      if (!sessionId || !to || !content) {
        return res.status(400).json({ error: 'sessionId, to, and content are required' });
      }

      const result = await sessionManager.sendTextMessage(sessionId, to, content);

      res.json(result);
    } catch (error: any) {
      console.error('Error sending text message:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/messages/media
  router.post('/media', async (req, res) => {
    try {
      const { sessionId, to, mediaBase64, mediaType, caption, fileName } = req.body;

      if (!sessionId || !to || !mediaBase64 || !mediaType) {
        return res.status(400).json({
          error: 'sessionId, to, mediaBase64, and mediaType are required'
        });
      }

      const mediaBuffer = Buffer.from(mediaBase64, 'base64');

      const result = await sessionManager.sendMediaMessage(
        sessionId,
        to,
        mediaBuffer,
        mediaType,
        caption,
        fileName
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error sending media message:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/messages/location
  router.post('/location', async (req, res) => {
    try {
      const { sessionId, to, latitude, longitude } = req.body;

      if (!sessionId || !to || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          error: 'sessionId, to, latitude, and longitude are required'
        });
      }

      const result = await sessionManager.sendLocation(sessionId, to, latitude, longitude);

      res.json(result);
    } catch (error: any) {
      console.error('Error sending location:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/messages/audio
  router.post('/audio', async (req, res) => {
    try {
      const { sessionId, to, audioBase64 } = req.body;

      if (!sessionId || !to || !audioBase64) {
        return res.status(400).json({ error: 'sessionId, to, and audioBase64 are required' });
      }

      const audioBuffer = Buffer.from(audioBase64, 'base64');

      const result = await sessionManager.sendMediaMessage(sessionId, to, audioBuffer, 'audio');

      res.json(result);
    } catch (error: any) {
      console.error('Error sending audio:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}