import { Router } from 'express';
import { sendMessage, sendStreamingMessage, getChatHistory, clearSession } from './index';
import { requireAuth, devBypassAuth } from '../../middleware/clerkAuth';

const router = Router();

// POST /api/chat/message - Send a message to the chatbot - Protected with authentication
router.post('/message', devBypassAuth, sendMessage);

// POST /api/chat/stream - Send a message with streaming response - Protected with authentication
router.post('/stream', devBypassAuth, sendStreamingMessage);

// GET /api/chat/history/:sessionId - Get chat history for a session - Protected with authentication
router.get('/history/:sessionId', devBypassAuth, getChatHistory);

// DELETE /api/chat/session/:sessionId - Clear a chat session - Protected with authentication
router.delete('/session/:sessionId', devBypassAuth, clearSession);

export default router; 