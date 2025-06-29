import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: string) {
  return price.replace(/R/g, 'R ')
}

// Enhanced match score generation with predefined scenarios for demonstration
export function generateMatchScore(): number {
  const random = Math.random()
  
  // Create a weighted distribution for more realistic match scores
  if (random < 0.15) {
    // 15% chance of excellent matches (90-100%)
    return Math.floor(Math.random() * 11) + 90
  } else if (random < 0.35) {
    // 20% chance of very good matches (80-89%)
    return Math.floor(Math.random() * 10) + 80
  } else if (random < 0.60) {
    // 25% chance of good matches (70-79%)
    return Math.floor(Math.random() * 10) + 70
  } else if (random < 0.80) {
    // 20% chance of fair matches (60-69%)
    return Math.floor(Math.random() * 10) + 60
  } else if (random < 0.95) {
    // 15% chance of poor matches (40-59%)
    return Math.floor(Math.random() * 20) + 40
  } else {
    // 5% chance of very poor matches (20-39%)
    return Math.floor(Math.random() * 20) + 20
  }
}

// Get color classes based on match percentage
export function getMatchScoreColor(score: number): {
  bg: string
  text: string
  border?: string
  glow?: string
} {
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

// Get match score label
export function getMatchScoreLabel(score: number): string {
  if (score >= 95) return 'Perfect Match'
  if (score >= 85) return 'Excellent Match'
  if (score >= 75) return 'Very Good Match'
  if (score >= 65) return 'Good Match'
  if (score >= 55) return 'Fair Match'
  if (score >= 40) return 'Poor Match'
  return 'Very Poor Match'
}

// Predefined match scores for consistent demonstration
const predefinedMatchScores: Record<string, number> = {
  '1': 97,  // The Test Kitchen - Perfect Match
  '2': 73,  // Kloof Street House - Good Match
  '3': 85,  // Ocean Basket - Excellent Match
  '4': 94,  // La Colombe - Perfect Match
  '5': 68,  // Mama Africa - Good Match
  '6': 81,  // Two Oceans - Very Good Match
  '7': 92,  // Nobu - Excellent Match
  '8': 42,  // Café Caprice - Poor Match
  '9': 89,  // Greenhouse - Excellent Match
  '10': 76, // Codfather - Very Good Match
  '11': 35, // New poor match restaurant
  '12': 58, // New fair match restaurant
}

// Generate consistent match scores for restaurants based on search context
export function generateContextualMatchScore(restaurantId: string, searchQuery?: string): number {
  // Use predefined scores for consistent demonstration
  let baseScore = predefinedMatchScores[restaurantId] || 70
  
  // Adjust based on search context if provided
  if (searchQuery) {
    const queryLower = searchQuery.toLowerCase()
    let adjustment = 0
    
    // Boost scores for relevant matches
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
    
    // Apply adjustment
    baseScore = Math.min(99, Math.max(20, baseScore + adjustment))
  }
  
  return baseScore
}