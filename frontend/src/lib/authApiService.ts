import { useAuth } from '@clerk/clerk-react';
import { apiService } from './api';
import type { 
  BackendSearchRequest, 
  SearchResponse, 
  AIExplanationResponse, 
  ChatResponse, 
  ChatHistoryResponse 
} from './api';

// Custom hook to create an authenticated API service
export function useAuthApiService() {
  const { getToken } = useAuth();

  return {
    // Search restaurants with authentication
    searchRestaurants: async (request: BackendSearchRequest): Promise<SearchResponse> => {
      const token = await getToken();
      return apiService.searchRestaurants(request, token || undefined);
    },

    // Generate AI explanation with authentication
    generateAIExplanation: async (restaurantId: string, userQuery: string): Promise<AIExplanationResponse> => {
      const token = await getToken();
      return apiService.generateAIExplanation(restaurantId, userQuery, token || undefined);
    },

    // Get restaurant by ID with authentication
    getRestaurantById: async (id: string): Promise<any> => {
      const token = await getToken();
      return apiService.getRestaurantById(id, token || undefined);
    },

    // Get search suggestions with authentication
    getSearchSuggestions: async (query: string): Promise<{ suggestions: string[] }> => {
      const token = await getToken();
      return apiService.getSearchSuggestions(query, token || undefined);
    },

    // Send chat message with authentication
    sendChatMessage: async (message: string, sessionId: string): Promise<ChatResponse> => {
      const token = await getToken();
      return apiService.sendChatMessage(message, sessionId, token || undefined);
    },

    // Send streaming chat message with authentication
    sendStreamingChatMessage: async (
      message: string,
      sessionId: string,
      onToken: (token: string) => void,
      onComplete: (response: string) => void,
      onError?: (error: string) => void
    ): Promise<void> => {
      const token = await getToken();
      return apiService.sendStreamingChatMessage(message, sessionId, onToken, onComplete, onError, token || undefined);
    },

    // Get chat history with authentication
    getChatHistory: async (sessionId: string): Promise<ChatHistoryResponse> => {
      const token = await getToken();
      return apiService.getChatHistory(sessionId, token || undefined);
    },

    // Clear chat session with authentication
    clearChatSession: async (sessionId: string): Promise<void> => {
      const token = await getToken();
      return apiService.clearChatSession(sessionId, token || undefined);
    }
  };
} 