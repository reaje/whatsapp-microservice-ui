import { Router } from 'express';
import { SessionManager } from '../services/SessionManager';

export function createSessionRoutes(sessionManager: SessionManager): Router {
  const router = Router();

  // POST /api/sessions/initialize
  router.post('/initialize', async (req, res) => {
    try {
      const { sessionId, phoneNumber } = req.body;

      if (!sessionId || !phoneNumber) {
        return res.status(400).json({ error: 'sessionId and phoneNumber are required' });
      }

      const result = await sessionManager.initializeSession(sessionId, phoneNumber);

      res.json(result);
    } catch (error: any) {
      console.error('Error initializing session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/sessions/:sessionId/status
  router.get('/:sessionId/status', (req, res) => {
    try {
      const { sessionId } = req.params;

      const status = sessionManager.getSessionStatus(sessionId);

      res.json(status);
    } catch (error: any) {
      console.error('Error getting session status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/sessions
  router.get('/', (req, res) => {
    try {
      const sessions = sessionManager.getAllSessions();

      res.json({ sessions });
    } catch (error: any) {
      console.error('Error getting sessions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/sessions/:sessionId
  router.delete('/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;

      const success = await sessionManager.disconnectSession(sessionId);

      if (!success) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({ message: 'Session disconnected successfully' });
    } catch (error: any) {
      console.error('Error disconnecting session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}