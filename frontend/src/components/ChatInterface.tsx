import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, ChefHat } from 'lucide-react'
import { Button } from './ui/Button'
import { useAppState } from '../contexts/AppStateContext'
import { apiService, ChatMessage } from '../lib/api'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Direct cn implementation to avoid import issues
const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
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

// Generate a unique session ID for this browser session
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export function ChatInterface() {
  const { chatMessages, setChatMessages } = useAppState()
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId] = useState(() => generateSessionId())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await apiService.getChatHistory(sessionId)
        if (history.messages.length > 0) {
          const formattedMessages = history.messages.map(msg => ({
            id: `${msg.timestamp}_${msg.role}`,
            type: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }))
          setChatMessages(formattedMessages)
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
        // Don't show error to user, just start with empty chat
      }
    }

    loadChatHistory()
  }, [sessionId, setChatMessages])

  // Convert stored messages to proper Date objects
  const messages = chatMessages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp)
  }))

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Send message to ChatService
      const response = await apiService.sendChatMessage(userMessage.content, sessionId)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      }

      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send chat message:', error)
      
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    inputRef.current?.focus()
  }

  const formatMessage = (content: string) => {
    // Enhanced formatting for restaurant recommendations
    let formatted = content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Make Google Maps links clickable
      .replace(/(https:\/\/www\.google\.com\/maps\/search\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">Google Maps</a>')
      // Make website links clickable
      .replace(/(https:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">Visit Website</a>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>')

    return formatted
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
            className={cn(
              "flex items-start space-x-3 max-w-4xl",
              message.type === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              message.type === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}>
              {message.type === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message Content */}
            <div className={cn(
              "flex-1 px-4 py-3 rounded-2xl max-w-3xl",
              message.type === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            )}>
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
              <div className={cn(
                "text-xs mt-2 opacity-70",
                message.type === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3 max-w-4xl mr-auto">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Questions (only show when no messages) */}
        {messages.length === 0 && !isTyping && (
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
                placeholder="Ask me about restaurants in Cape Town..."
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
                disabled={isTyping}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="p-3 rounded-2xl"
              variant="primary"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Helper Text */}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Press Enter to send, Shift + Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}