import React from 'react'
import { Star, MapPin, Users, DollarSign, ExternalLink } from 'lucide-react'
import { Restaurant } from '../types/restaurant'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Direct utility implementations to avoid import issues
const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

const formatPrice = (price: string) => {
  return price.replace(/R/g, 'R ')
}

const getMatchScoreColor = (score: number): {
  bg: string
  text: string
  border?: string
  glow?: string
} => {
  if (score >= 95) {
    return {
      bg: 'bg-emerald-500',
      text: 'text-white',
      border: 'border-emerald-400',
      glow: 'shadow-emerald-500/30'
    }
  } else if (score >= 85) {
    return {
      bg: 'bg-green-500',
      text: 'text-white',
      border: 'border-green-400',
      glow: 'shadow-green-500/25'
    }
  } else if (score >= 75) {
    return {
      bg: 'bg-lime-500',
      text: 'text-white',
      border: 'border-lime-400',
      glow: 'shadow-lime-500/20'
    }
  } else if (score >= 65) {
    return {
      bg: 'bg-yellow-500',
      text: 'text-gray-900',
      border: 'border-yellow-400',
      glow: 'shadow-yellow-500/20'
    }
  } else if (score >= 55) {
    return {
      bg: 'bg-orange-500',
      text: 'text-white',
      border: 'border-orange-400',
      glow: 'shadow-orange-500/20'
    }
  } else if (score >= 40) {
    return {
      bg: 'bg-red-500',
      text: 'text-white',
      border: 'border-red-400',
      glow: 'shadow-red-500/20'
    }
  } else {
    return {
      bg: 'bg-red-700',
      text: 'text-white',
      border: 'border-red-600',
      glow: 'shadow-red-700/25'
    }
  }
}

const getMatchScoreLabel = (score: number): string => {
  if (score >= 95) return 'Perfect Match'
  if (score >= 85) return 'Excellent Match'
  if (score >= 75) return 'Very Good Match'
  if (score >= 65) return 'Good Match'
  if (score >= 55) return 'Fair Match'
  if (score >= 40) return 'Poor Match'
  return 'Very Poor Match'
}

const predefinedMatchScores: Record<string, number> = {
  '1': 97, '2': 73, '3': 85, '4': 94, '5': 68, '6': 81, '7': 92, '8': 42, '9': 89, '10': 76, '11': 35, '12': 58,
}

const generateContextualMatchScore = (restaurantId: string, searchQuery?: string): number => {
  let baseScore = predefinedMatchScores[restaurantId] || 70
  
  if (searchQuery) {
    const queryLower = searchQuery.toLowerCase()
    let adjustment = 0
    
    if (queryLower.includes('fine dining')) {
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '7') adjustment += 3
      if (restaurantId === '8' || restaurantId === '11') adjustment -= 10
    }
    
    if (queryLower.includes('seafood')) {
      if (restaurantId === '3' || restaurantId === '6' || restaurantId === '10') adjustment += 5
      if (restaurantId === '5' || restaurantId === '8') adjustment -= 8
    }
    
    if (queryLower.includes('romantic')) {
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '9') adjustment += 4
      if (restaurantId === '8' || restaurantId === '11') adjustment -= 12
    }
    
    if (queryLower.includes('family')) {
      if (restaurantId === '3' || restaurantId === '2') adjustment += 6
      if (restaurantId === '1' || restaurantId === '7') adjustment -= 5
    }
    
    if (queryLower.includes('budget') || queryLower.includes('cheap')) {
      if (restaurantId === '2' || restaurantId === '3' || restaurantId === '8') adjustment += 8
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '7') adjustment -= 15
    }
    
    if (queryLower.includes('expensive') || queryLower.includes('luxury')) {
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '7') adjustment += 5
      if (restaurantId === '8' || restaurantId === '11' || restaurantId === '12') adjustment -= 10
    }
    
    baseScore = Math.min(99, Math.max(20, baseScore + adjustment))
  }
  
  return baseScore
}
import { useAppState } from '../contexts/AppStateContext'

interface RestaurantCardProps {
  restaurant: Restaurant & {
    aiMatchScore?: number
    vectorScore?: number
    keywordScore?: number
    llmScore?: number
    llmReasoning?: string
  }
  onClick: () => void
  className?: string
}

export function RestaurantCard({ restaurant, onClick, className }: RestaurantCardProps) {
  const { searchQuery } = useAppState()
  
  // Use real AI match score if available, otherwise fall back to contextual scoring
  const matchScore = restaurant.aiMatchScore || generateContextualMatchScore(restaurant.id, searchQuery)
  const matchColors = getMatchScoreColor(matchScore)
  const matchLabel = getMatchScoreLabel(matchScore)

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-out overflow-hidden transform hover:-translate-y-2 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={restaurant.imageUrls[0]}
          alt={restaurant.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback to default image if load fails
            const target = e.target as HTMLImageElement
            target.src = 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
          }}
        />
        
        {/* AI Match Score Badge - Enhanced with Real Data */}
        <div className={cn(
          "absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold transform transition-all duration-300 group-hover:scale-110 shadow-lg",
          matchColors.bg,
          matchColors.text,
          matchColors.glow && `shadow-lg ${matchColors.glow}`
        )}>
          {Math.round(matchScore)}% Match
        </div>
        
        {/* Match Quality Indicator with AI Reasoning Hint */}
        <div className={cn(
          "absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2",
          matchScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
          matchScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        )}>
          {matchLabel}
        </div>
        
        {/* AI-Powered Badge for restaurants with LLM scores */}
        {restaurant.llmScore && (
          <div className="absolute bottom-3 left-3 bg-primary-500 text-white px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
            🤖 AI Analyzed
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 line-clamp-1">
              {restaurant.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200 line-clamp-1">
              {restaurant.categoryName}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
        </div>

        {/* Rating & Reviews - Enhanced with Real Data */}
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {restaurant.totalScore?.toFixed(1) || '4.2'}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm">{restaurant.reviewsCount || 0} reviews</span>
          </div>
        </div>

        {/* Location & Price - Updated for South African Rands */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 flex-1 min-w-0">
            <MapPin className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
            <span className="text-sm truncate">{restaurant.neighborhood || 'Cape Town'}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 flex-shrink-0">
            <DollarSign className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium">{formatPrice(restaurant.price) || 'R150-300'}</span>
          </div>
        </div>

        {/* Tags - Enhanced with Better Display */}
        <div className="flex flex-wrap gap-2">
          {restaurant.reviewsTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs transition-all duration-200 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-700 dark:group-hover:text-primary-300 line-clamp-1"
            >
              {tag}
            </span>
          ))}
          {restaurant.reviewsTags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs transition-all duration-200 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
              +{restaurant.reviewsTags.length - 3} more
            </span>
          )}
        </div>

        {/* AI Score Breakdown - Only show on hover if real scores are available */}
        {(restaurant.vectorScore || restaurant.keywordScore || restaurant.llmScore) && (
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Vector:</span>
                <span>{Math.round(restaurant.vectorScore || 0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Keyword:</span>
                <span>{Math.round(restaurant.keywordScore || 0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>AI:</span>
                <span>{Math.round(restaurant.llmScore || 0)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}