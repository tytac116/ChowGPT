import { Request, Response } from 'express';
import { chatService } from '../../services/chatService';

interface ChatRequest {
  message: string;
  sessionId: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: Date;
}

interface ChatHistoryResponse {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  sessionId: string;
}

/**
 * POST /api/chat/message
 * Send a message to the chatbot
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const { message, sessionId }: ChatRequest = req.body;

    // Validate request
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string'
      });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'Session ID is required and must be a string'
      });
    }

    console.log(`💬 Chat message from session ${sessionId}: ${message}`);

    // Get response from chat service
    const response = await chatService.sendMessage(sessionId, message.trim());

    const chatResponse: ChatResponse = {
      response,
      sessionId,
      timestamp: new Date()
    };

    console.log(`🤖 Chat response to session ${sessionId}: ${response.substring(0, 100)}...`);

    res.json(chatResponse);

  } catch (error) {
    console.error('❌ Chat API error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/chat/history/:sessionId
 * Get chat history for a session
 */
export async function getChatHistory(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'Session ID is required and must be a string'
      });
    }

    const messages = chatService.getSessionMessages(sessionId);

    const historyResponse: ChatHistoryResponse = {
      messages,
      sessionId
    };

    res.json(historyResponse);

  } catch (error) {
    console.error('❌ Chat history API error:', error);
    res.status(500).json({
      error: 'Failed to retrieve chat history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/chat/session/:sessionId
 * Clear a chat session
 */
export async function clearSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        error: 'Session ID is required and must be a string'
      });
    }

    chatService.clearSession(sessionId);

    console.log(`🗑️ Cleared chat session: ${sessionId}`);

    res.json({
      success: true,
      message: 'Session cleared successfully',
      sessionId
    });

  } catch (error) {
    console.error('❌ Clear session API error:', error);
    res.status(500).json({
      error: 'Failed to clear session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 