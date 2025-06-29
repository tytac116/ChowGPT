import React, { useState, useEffect } from 'react'
import { Star, MapPin, Phone, Globe, Clock, Users, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { PhotoGallery } from './PhotoGallery'
import { Restaurant, AIMatchExplanation } from '../types/restaurant'
import { apiService, AIExplanationResponse } from '@/lib/api'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useAppState } from '../contexts/AppStateContext'

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

interface RestaurantModalProps {
  restaurant: (Restaurant & {
    aiMatchScore?: number
    vectorScore?: number
    keywordScore?: number
    llmScore?: number
    llmReasoning?: string
    description?: string
  }) | null
  isOpen: boolean
  onClose: () => void
}

export function RestaurantModal({ restaurant, isOpen, onClose }: RestaurantModalProps) {
  const { searchQuery } = useAppState()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [modalLoaded, setModalLoaded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [aiExplanationLoading, setAiExplanationLoading] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<AIExplanationResponse | null>(null)

  // Generate AI explanation when modal opens
  useEffect(() => {
    if (isOpen && restaurant && searchQuery) {
      generateAIExplanation()
    }
  }, [isOpen, restaurant?.id, searchQuery])

  const generateAIExplanation = async () => {
    if (!restaurant || !searchQuery) return

    try {
      setAiExplanationLoading(true)
      console.log(`🤖 Generating AI explanation for ${restaurant.title} with query: "${searchQuery}"`)
      
      const explanation = await apiService.generateAIExplanation(restaurant.id, searchQuery)
      setAiExplanation(explanation)
      console.log('✅ AI explanation generated:', explanation)
    } catch (error) {
      console.error('❌ Failed to generate AI explanation:', error)
      setAiExplanation(null)
    } finally {
      setAiExplanationLoading(false)
    }
  }

  // Reset loading states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setModalLoaded(false)
      setImageLoaded(false)
      // Small delay to ensure modal renders first
      const timer = setTimeout(() => {
        setModalLoaded(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setModalLoaded(false)
      setImageLoaded(false)
      setAiExplanationLoading(false)
      setAiExplanation(null)
    }
  }, [isOpen])

  // Reset image loaded state when current image changes
  useEffect(() => {
    setImageLoaded(false)
  }, [currentImageIndex])

  if (!restaurant) return null

  // Use real AI match score if available
  const matchScore = restaurant.aiMatchScore || generateContextualMatchScore(restaurant.id, searchQuery)
  const matchColors = getMatchScoreColor(matchScore)
  const matchLabel = getMatchScoreLabel(matchScore)
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === restaurant.imageUrls.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? restaurant.imageUrls.length - 1 : prev - 1
    )
  }

  const openGallery = (index: number) => {
    setCurrentImageIndex(index)
    setIsGalleryOpen(true)
  }

  const formatOpeningHours = (hours: typeof restaurant.openingHours) => {
    return Object.entries(hours).map(([day, time]) => ({
      day: day.charAt(0).toUpperCase() + day.slice(1),
      time
    }))
  }

  return (
    <>
      <Modal open={isOpen} onOpenChange={onClose}>
        <div className="flex flex-col lg:flex-row max-h-[90vh]">
          {/* Left Column - Images */}
          <div className="lg:w-1/2 relative">
            <div className="relative h-64 lg:h-full">
              {/* Loading State */}
              {!modalLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                  <div className="text-gray-500 dark:text-gray-400">Loading...</div>
                </div>
              )}
              
              {/* Image Loading State */}
              {modalLoaded && !imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
                  <div className="text-gray-500 dark:text-gray-400">Loading image...</div>
                </div>
              )}
              
              {/* Main Image */}
              {modalLoaded && (
                <img
                  src={restaurant.imageUrls[currentImageIndex]}
                  alt={`${restaurant.title} - Image ${currentImageIndex + 1}`}
                  className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onClick={() => openGallery(currentImageIndex)}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    // If image fails to load, hide it and show placeholder
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    setImageLoaded(true)
                  }}
                />
              )}
              
              {/* Image Navigation */}
              {restaurant.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {restaurant.imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index)
                          openGallery(index)
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Enhanced Match Score Badge */}
              <div className={cn(
                "absolute top-4 right-4 px-4 py-2 rounded-full font-semibold shadow-lg",
                matchColors.bg,
                matchColors.text,
                matchColors.glow && `shadow-lg ${matchColors.glow}`
              )}>
                {Math.round(matchScore)}% Match
              </div>

              {/* Match Quality Label */}
              <div className={cn(
                "absolute top-4 left-4 px-3 py-1 rounded-md text-sm font-medium shadow-md",
                matchScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                matchScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              )}>
                {matchLabel}
              </div>

              {/* Gallery Hint */}
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Click to view gallery
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:w-1/2 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {restaurant.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {restaurant.categoryName}
                </p>
                
                {/* Restaurant Description - NEW */}
                {restaurant.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {restaurant.description}
                  </p>
                )}
                
                {/* Rating & Reviews - Enhanced */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {restaurant.totalScore?.toFixed(1) || '4.2'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{restaurant.reviewsCount || 0} reviews</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">
                    {formatPrice(restaurant.price) || 'R150-300'}
                  </div>
                </div>
              </div>

              {/* Real AI Match Analysis - Using actual AI explanation */}
              <div className={cn(
                "border rounded-lg p-4",
                matchScore >= 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                matchScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              )}>
                <div className="flex items-center space-x-2 mb-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    matchScore >= 80 ? 'bg-green-500' :
                    matchScore >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  )} />
                  <h3 className={cn(
                    "font-semibold",
                    matchScore >= 80 ? 'text-green-800 dark:text-green-200' :
                    matchScore >= 60 ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-red-800 dark:text-red-200'
                  )}>
                    AI Match Analysis - {matchLabel}
                  </h3>
                </div>

                {/* Search Query Reminder */}
                {searchQuery && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-medium">Your search:</span> "{searchQuery}"
                    </p>
                  </div>
                )}
                
                {/* AI Analysis Loading State */}
                {aiExplanationLoading && (
                  <div className="flex items-center space-x-3 mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      AI is generating match explanation...
                    </span>
                  </div>
                )}
                
                {/* Real AI Analysis Results */}
                {aiExplanation && !aiExplanationLoading && (
                  <>
                    {/* Overall Assessment */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {aiExplanation.explanation.overallAssessment}
                    </p>
                    
                    {/* What Matches */}
                    {aiExplanation.explanation.whatMatches && aiExplanation.explanation.whatMatches.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          What matches your search:
                        </h4>
                        <ul className="space-y-1">
                          {aiExplanation.explanation.whatMatches.map((match: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {match}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Things to Consider */}
                    {aiExplanation.explanation.thingsToConsider && aiExplanation.explanation.thingsToConsider.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Things to consider:
                        </h4>
                        <ul className="space-y-1">
                          {aiExplanation.explanation.thingsToConsider.map((consideration: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              {consideration}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Fallback if AI explanation fails */}
                {!aiExplanation && !aiExplanationLoading && (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                      {matchScore >= 90 ? 'Excellent match for your search criteria. This restaurant should meet your needs well!' :
                       matchScore >= 80 ? 'Great match! This restaurant aligns well with most of your requirements.' :
                       matchScore >= 60 ? 'Good match with several relevant features for your search.' :
                       'Partial match - some aspects align with your search criteria.'}
                    </p>
                    
                    {/* Basic fallback matching */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        What matches your search:
                      </h4>
                      <ul className="space-y-1">
                        {/* Show real categories that match */}
                        {(restaurant.categories || []).slice(0, 3).map((category, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {category}
                          </li>
                        ))}
                        {/* Add location if available */}
                        {restaurant.neighborhood && (
                          <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            Located in {restaurant.neighborhood}
                          </li>
                        )}
                        {/* Add rating info if good */}
                        {restaurant.totalScore >= 4.0 && (
                          <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            Highly rated ({restaurant.totalScore.toFixed(1)} stars)
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Basic fallback considerations */}
                    {matchScore < 90 && (
                      <div>
                        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          Things to consider:
                        </h4>
                        <ul className="space-y-1">
                          {matchScore < 80 && (
                            <>
                              <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                May not fully match all preferences
                              </li>
                              <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                Consider checking recent reviews
                              </li>
                            </>
                          )}
                          {matchScore >= 80 && matchScore < 90 && (
                            <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              Minor aspects might not align perfectly
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Contact Info - Enhanced */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{restaurant.address || `${restaurant.neighborhood}, Cape Town`}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${restaurant.phone}`} className="hover:text-primary-600 transition-colors">
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <Globe className="h-4 w-4" />
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 transition-colors">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Opening Hours */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Opening Hours
                </h3>
                <div className="space-y-2">
                  {formatOpeningHours(restaurant.openingHours).map(({ day, time }) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{day}</span>
                      <span className={`${time === 'Closed' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {/* Use real categories instead of reviewsTags */}
                  {(restaurant.categories || []).slice(0, 8).map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                  {/* Show additional categories if there are more than 8 */}
                  {(restaurant.categories || []).length > 8 && (
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full text-sm">
                      +{(restaurant.categories || []).length - 8} more
                    </span>
                  )}
                  {/* Fallback if no categories */}
                  {(!restaurant.categories || restaurant.categories.length === 0) && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {restaurant.categoryName || 'Restaurant'}
                    </span>
                  )}
                </div>
              </div>

              {/* Recent Reviews - Enhanced */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Reviews</h3>
                <div className="space-y-4">
                  {restaurant.reviews.slice(0, 5).map((review) => (
                    <div key={review.reviewId || review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {review.reviewerName || review.author || 'Anonymous'}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {review.publishedAt || review.date || 'Recently'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                {restaurant.website && (
                  <Button 
                    variant="primary" 
                    onClick={() => window.open(restaurant.website, '_blank')}
                    className="flex-1"
                  >
                    Visit Website
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Photo Gallery */}
      <PhotoGallery
        images={restaurant.imageUrls}
        initialIndex={currentImageIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        restaurantName={restaurant.title}
      />
    </>
  )
}

// Helper function to parse match reasons from LLM reasoning
function parseMatchReasons(reasoning: string, isPositive: boolean): string[] {
  if (!reasoning) return []
  
  // This is a simple parser - could be enhanced based on actual LLM response format
  const sentences = reasoning.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Look for positive or negative indicators
  const positiveWords = ['good', 'great', 'excellent', 'perfect', 'ideal', 'matches', 'suitable']
  const negativeWords = ['however', 'but', 'although', 'concern', 'issue', 'problem', 'lacking']
  
  return sentences
    .filter(sentence => {
      const hasPositive = positiveWords.some(word => sentence.toLowerCase().includes(word))
      const hasNegative = negativeWords.some(word => sentence.toLowerCase().includes(word))
      
      return isPositive ? hasPositive && !hasNegative : hasNegative
    })
    .slice(0, 3)
    .map(s => s.trim())
}