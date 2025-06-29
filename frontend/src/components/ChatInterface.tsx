import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, ChefHat } from 'lucide-react'
import { Button } from './ui/Button'
import { apiService } from '../lib/api'

// Simple, clean message interface
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

const suggestedQuestions = [
  "What are the best seafood restaurants in Cape Town?",
  "Find me a romantic dinner spot with ocean views",
  "I need family-friendly restaurants under R300 per person",
  "What's the best African cuisine restaurant?",
  "Show me fine dining options for a special occasion",
  "Where can I find good vegetarian food?",
  "What restaurants are open late in the city center?",
  "Recommend wine estates with good food near Cape Town"
]

// Generate session ID once
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function ChatInterface() {
  // Simple state management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(generateSessionId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simple message sending function
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    // Add user message immediately - this should ALWAYS work
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    
    console.log('Adding user message:', userMsg)
    setMessages(prev => {
      const newMessages = [...prev, userMsg]
      console.log('Updated messages:', newMessages)
      return newMessages
    })

    // Create placeholder assistant message for streaming
    const assistantMsgId = `assistant_${Date.now()}`
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '', // Start empty for streaming
      timestamp: new Date(),
      isStreaming: true
    }

    // Add placeholder immediately
    setMessages(prev => [...prev, assistantMsg])

    try {
      // Try streaming first
      let streamingContent = ''
      let streamingWorked = false
      
      await apiService.sendStreamingChatMessage(
        userMessage,
        sessionId,
        (token: string) => {
          // Token received - streaming is working
          streamingWorked = true
          streamingContent += token
          
          // Update the streaming message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMsgId 
                ? { ...msg, content: streamingContent, isStreaming: true }
                : msg
            )
          )
        },
        (finalResponse: string) => {
          // Streaming complete
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMsgId 
                ? { ...msg, content: finalResponse, isStreaming: false }
                : msg
            )
          )
          setIsLoading(false)
          console.log('✅ Streaming completed successfully')
        },
        (error: string) => {
          console.error('❌ Streaming error:', error)
          // Fallback to regular API call
          fallbackToRegularChat()
        }
      )
      
      // If no tokens were received, fallback
      if (!streamingWorked) {
        console.log('🔄 No streaming tokens received, falling back to regular chat')
        fallbackToRegularChat()
      }
      
    } catch (error) {
      console.error('❌ Chat error:', error)
      fallbackToRegularChat()
    }

    // Fallback function for when streaming fails
    async function fallbackToRegularChat() {
      try {
        console.log('🔄 Using fallback regular chat API')
        const response = await apiService.sendChatMessage(userMessage, sessionId)
        
        // Update the placeholder with regular response
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMsgId 
              ? { ...msg, content: response.response, isStreaming: false }
              : msg
          )
        )
        
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        
        // Update with error message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMsgId 
              ? { 
                  ...msg, 
                  content: "I'm sorry, I encountered an error. Please try again.", 
                  isStreaming: false 
                }
              : msg
          )
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const formatMessage = (content: string) => {
    // Simple formatting for links and styling
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(https:\/\/www\.google\.com\/maps\/search\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">🗺️ Google Maps</a>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">🌐 $1</a>')
      .replace(/(https:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">🌐 Visit Website</a>')
      .replace(/(\d+(?:\.\d+)?\/5\.0?\s*\(\d+\s*reviews?\))/g, '<span class="text-yellow-600 dark:text-yellow-400 font-medium">⭐ $1</span>')
      .replace(/(R\s*\d+[\-–]\d+)/g, '<span class="text-green-600 dark:text-green-400 font-medium">💰 $1</span>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <ChefHat className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              ChowGPT Assistant
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered restaurant recommendations for Cape Town
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 max-w-4xl ${
              message.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}>
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 px-4 py-3 rounded-2xl max-w-3xl ${
              message.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}>
              <div className="flex items-start">
                <div 
                  className="text-sm leading-relaxed flex-1"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content || '•••') }}
                />
                {/* Animated typing cursor for streaming */}
                {message.isStreaming && message.role === 'assistant' && (
                  <span className="inline-block w-0.5 h-4 bg-primary-500 ml-2 animate-pulse"></span>
                )}
              </div>
              <div className={`text-xs mt-2 opacity-70 ${
                message.role === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.isStreaming && message.role === 'assistant' && (
                  <span className="ml-2 text-green-500 flex items-center">
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    streaming
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 max-w-4xl mr-auto">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 px-4 py-3 rounded-2xl max-w-3xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Questions (only show when no messages) */}
        {messages.length === 0 && !isLoading && (
          <div className="max-w-4xl mr-auto">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Try asking me about:
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLoading ? "AI is responding..." : "Ask me about restaurants in Cape Town..."}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32"
                rows={1}
                style={{
                  minHeight: '48px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                }}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`p-3 rounded-2xl transition-all ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              }`}
              variant="primary"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Helper Text */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            {isLoading ? "Please wait while AI responds..." : "Press Enter to send, Shift + Enter for new line"}
          </div>
        </div>
      </div>
    </div>
  )
}