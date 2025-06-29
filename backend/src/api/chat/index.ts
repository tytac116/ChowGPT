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
 * POST /api/chat/stream
 * Send a message to the chatbot with streaming response
 */
export async function sendStreamingMessage(req: Request, res: Response) {
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

    console.log(`💬 Streaming chat message from session ${sessionId}: ${message}`);

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'start', sessionId })}\n\n`);

    let fullResponse = '';

    // Stream the response
    await chatService.sendStreamingMessage(
      sessionId,
      message.trim(),
      (token: string) => {
        // Send each token as it arrives
        fullResponse += token;
        res.write(`data: ${JSON.stringify({ 
          type: 'token', 
          token, 
          sessionId 
        })}\n\n`);
      },
      (complete: string) => {
        // Send completion message
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          response: complete, 
          sessionId,
          timestamp: new Date()
        })}\n\n`);
        
        console.log(`🤖 Streaming complete for session ${sessionId}: ${complete.substring(0, 100)}...`);
        res.end();
      }
    );

  } catch (error) {
    console.error('❌ Streaming chat API error:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: 'Failed to process streaming message',
      details: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`);
    res.end();
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