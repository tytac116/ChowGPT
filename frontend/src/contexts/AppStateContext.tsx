import React, { createContext, useContext, ReactNode } from 'react'
import { useSessionStorage } from '../hooks/useSessionStorage'
import { Restaurant } from '../types/restaurant'
import { FilterState, defaultFilterState } from '../types/filters'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface AppState {
  // Chat state
  chatMessages: Message[]
  setChatMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  
  // Restaurant finder state
  searchQuery: string
  setSearchQuery: (query: string) => void
  restaurants: Restaurant[]
  setRestaurants: (restaurants: Restaurant[]) => void
  filteredRestaurants: Restaurant[]
  setFilteredRestaurants: (restaurants: Restaurant[]) => void
  hasSearched: boolean
  setHasSearched: (searched: boolean) => void
  filters: FilterState
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void
  isFilterPanelOpen: boolean
  setIsFilterPanelOpen: (open: boolean) => void
  
  // UI state
  selectedRestaurant: Restaurant | null
  setSelectedRestaurant: (restaurant: Restaurant | null) => void
}

const AppStateContext = createContext<AppState | undefined>(undefined)

const initialChatMessage: Message = {
  id: '1',
  type: 'assistant',
  content: "Hello! I'm ChowGPT, your AI restaurant assistant for Cape Town. I can help you find the perfect dining experience based on your preferences, budget, and occasion. What kind of restaurant are you looking for today?",
  timestamp: new Date()
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Chat state with session storage
  const [chatMessages, setChatMessages] = useSessionStorage<Message[]>('chowgpt_chat_messages', [initialChatMessage])
  
  // Restaurant finder state with session storage
  const [searchQuery, setSearchQuery] = useSessionStorage<string>('chowgpt_search_query', '')
  const [restaurants, setRestaurants] = useSessionStorage<Restaurant[]>('chowgpt_restaurants', [])
  const [filteredRestaurants, setFilteredRestaurants] = useSessionStorage<Restaurant[]>('chowgpt_filtered_restaurants', [])
  const [hasSearched, setHasSearched] = useSessionStorage<boolean>('chowgpt_has_searched', false)
  const [filters, setFilters] = useSessionStorage<FilterState>('chowgpt_filters', defaultFilterState)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useSessionStorage<boolean>('chowgpt_filter_panel_open', false)
  
  // UI state (not persisted - should reset on page refresh)
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<Restaurant | null>(null)

  const value: AppState = {
    // Chat state
    chatMessages,
    setChatMessages,
    
    // Restaurant finder state
    searchQuery,
    setSearchQuery,
    restaurants,
    setRestaurants,
    filteredRestaurants,
    setFilteredRestaurants,
    hasSearched,
    setHasSearched,
    filters,
    setFilters,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    
    // UI state
    selectedRestaurant,
    setSelectedRestaurant
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}