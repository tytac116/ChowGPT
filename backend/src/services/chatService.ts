import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';
import { HybridSearchService } from './hybridSearch';
import { OPENAI_CONFIG } from '../config';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  memory: BufferMemory;
  chain: ConversationChain;
}

export class ChatService {
  private sessions: Map<string, ChatSession> = new Map();
  private hybridSearch: HybridSearchService;
  private model: ChatOpenAI;
  private streamingModel: ChatOpenAI;

  constructor() {
    if (!OPENAI_CONFIG) {
      throw new Error('OpenAI configuration is required for ChatService');
    }
    
    this.hybridSearch = new HybridSearchService();
    
    // Regular model for non-streaming
    this.model = new ChatOpenAI({
      openAIApiKey: OPENAI_CONFIG.apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
    });

    // Streaming model
    this.streamingModel = new ChatOpenAI({
      openAIApiKey: OPENAI_CONFIG.apiKey,
      modelName: 'gpt-4o-mini',
      temperature: 0.7,
      streaming: true,
    });
  }

  async createSession(sessionId: string): Promise<void> {
    if (this.sessions.has(sessionId)) {
      return;
    }

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'history',
    });

    const prompt = PromptTemplate.fromTemplate(`
You are ChowGPT, a friendly AI restaurant assistant for Cape Town, South Africa. You help users find the perfect dining experiences.

Your personality:
- Enthusiastic about Cape Town's food scene
- Helpful and conversational
- Always aim to understand the user's specific needs

When users ask about restaurants:
1. Ask clarifying questions about their preferences
2. Use the restaurant search results I provide to give specific recommendations
3. Include practical details like location, price range, and why it matches their needs
4. Provide Google Maps links: https://www.google.com/maps/search/?q=[Restaurant Name]+Cape Town
5. Include website links when available

Previous conversation:
{history}

User: {input}
Assistant: `);

    const chain = new ConversationChain({
      llm: this.model,
      memory,
      prompt,
    });

    this.sessions.set(sessionId, {
      sessionId,
      messages: [],
      memory,
      chain,
    });
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<string> {
    if (!this.sessions.has(sessionId)) {
      await this.createSession(sessionId);
    }

    const session = this.sessions.get(sessionId)!;

    try {
      const isRestaurantQuery = this.isRestaurantQuery(userMessage);
      let restaurantContext = '';

      if (isRestaurantQuery) {
        const searchResults = await this.hybridSearch.executeHybridSearch({
          originalQuery: userMessage,
          rewrittenQuery: userMessage,
          limit: 5
        });
        restaurantContext = this.formatRestaurantResults(searchResults);
      }

      const enhancedMessage = restaurantContext 
        ? `${userMessage}\n\nRelevant restaurants found:\n${restaurantContext}`
        : userMessage;

      const response = await session.chain.call({
        input: enhancedMessage,
      });

      session.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      session.messages.push({
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      });

      return response.response;
    } catch (error) {
      console.error('Chat error:', error);
      return "I'm sorry, I encountered an error. Could you please try asking again?";
    }
  }

  // New streaming method
  async sendStreamingMessage(
    sessionId: string, 
    userMessage: string,
    onToken: (token: string) => void,
    onComplete: (fullResponse: string) => void
  ): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      await this.createSession(sessionId);
    }

    const session = this.sessions.get(sessionId)!;

    try {
      const isRestaurantQuery = this.isRestaurantQuery(userMessage);
      let restaurantContext = '';

      if (isRestaurantQuery) {
        const searchResults = await this.hybridSearch.executeHybridSearch({
          originalQuery: userMessage,
          rewrittenQuery: userMessage,
          limit: 5
        });
        restaurantContext = this.formatRestaurantResults(searchResults);
      }

      const enhancedMessage = restaurantContext 
        ? `${userMessage}\n\nRelevant restaurants found:\n${restaurantContext}`
        : userMessage;

      // Build the full prompt manually for streaming
      const history = await session.memory.chatHistory.getMessages();
      const historyString = history.map(msg => `${msg._getType()}: ${msg.content}`).join('\n');
      
      const fullPrompt = `You are ChowGPT, a friendly AI restaurant assistant for Cape Town, South Africa. You help users find the perfect dining experiences.

Your personality:
- Enthusiastic about Cape Town's food scene
- Helpful and conversational
- Always aim to understand the user's specific needs

When users ask about restaurants:
1. Ask clarifying questions about their preferences
2. Use the restaurant search results I provide to give specific recommendations
3. Include practical details like location, price range, and why it matches their needs
4. Provide Google Maps links: https://www.google.com/maps/search/?q=[Restaurant Name]+Cape Town
5. Include website links when available

Previous conversation:
${historyString}

User: ${enhancedMessage}
Assistant: `;

      let fullResponse = '';

      // Stream the response
      const stream = await this.streamingModel.stream(fullPrompt);
      
      for await (const chunk of stream) {
        if (chunk.content) {
          const token = chunk.content.toString();
          fullResponse += token;
          onToken(token);
        }
      }

      // Store messages in session
      session.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      session.messages.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      });

      // Update memory
      await session.memory.saveContext(
        { input: enhancedMessage },
        { output: fullResponse }
      );

      onComplete(fullResponse);
    } catch (error) {
      console.error('Streaming chat error:', error);
      const errorMessage = "I'm sorry, I encountered an error. Could you please try asking again?";
      onToken(errorMessage);
      onComplete(errorMessage);
    }
  }

  getSessionMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private isRestaurantQuery(message: string): boolean {
    const restaurantKeywords = [
      'restaurant', 'food', 'eat', 'dining', 'meal', 'lunch', 'dinner',
      'cuisine', 'sushi', 'pizza', 'indian', 'italian', 'chinese', 'seafood',
      'recommend', 'suggest', 'find', 'looking for', 'hungry'
    ];

    const messageLower = message.toLowerCase();
    return restaurantKeywords.some(keyword => messageLower.includes(keyword));
  }

  private formatRestaurantResults(restaurants: any[]): string {
    if (restaurants.length === 0) {
      return 'No specific restaurants found, but I can still help with general recommendations.';
    }

    return restaurants.map((restaurant, index) => {
      const website = restaurant.website ? `\nWebsite: ${restaurant.website}` : '';
      const googleMapsUrl = `https://www.google.com/maps/search/?q=${encodeURIComponent((restaurant.title || restaurant.name) + ' Cape Town')}`;
      
      return `${index + 1}. **${restaurant.title || restaurant.name}**
   - Cuisine: ${restaurant.categoryName || restaurant.cuisine || 'Various'}
   - Location: ${restaurant.neighborhood || restaurant.address || restaurant.location}
   - Rating: ${restaurant.totalScore || restaurant.rating || 'N/A'}/5 (${restaurant.reviewsCount || 0} reviews)
   - Price: ${restaurant.price || restaurant.priceLevel || 'N/A'}
   - Google Maps: ${googleMapsUrl}${website}`;
    }).join('\n\n');
  }
}

export const chatService = new ChatService(); 