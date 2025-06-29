import { Router } from 'express';
import { sendMessage, getChatHistory, clearSession } from './index';

const router = Router();

// POST /api/chat/message - Send a message to the chatbot
router.post('/message', sendMessage);

// GET /api/chat/history/:sessionId - Get chat history for a session
router.get('/history/:sessionId', getChatHistory);

// DELETE /api/chat/session/:sessionId - Clear a chat session
router.delete('/session/:sessionId', clearSession);

export default router; 