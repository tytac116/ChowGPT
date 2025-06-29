import React, { useState } from 'react'
import { Star, MapPin, Phone, Globe, Clock, Users, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { PhotoGallery } from './PhotoGallery'
import { Restaurant, AIMatchExplanation } from '../types/restaurant'
import { formatPrice, generateContextualMatchScore, getMatchScoreColor, getMatchScoreLabel } from '../lib/utils'
import { cn } from '../lib/utils'
import { useAppState } from '../contexts/AppStateContext'

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

  if (!restaurant) return null

  // Use real AI match score if available
  const matchScore = restaurant.aiMatchScore || generateContextualMatchScore(restaurant.id, searchQuery)
  const matchColors = getMatchScoreColor(matchScore)
  const matchLabel = getMatchScoreLabel(matchScore)
  
  // Create AI explanation from real backend data
  const aiExplanation = {
    matchPercentage: Math.round(matchScore),
    matchReasons: restaurant.llmReasoning ? 
      parseMatchReasons(restaurant.llmReasoning, true) : 
      ['Good match for your search criteria'],
    concernReasons: restaurant.llmReasoning ? 
      parseMatchReasons(restaurant.llmReasoning, false) : 
      [],
    summary: restaurant.llmReasoning || 
      `This restaurant scores ${Math.round(matchScore)}% match for your search "${searchQuery}".`
  }

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
              <img
                src={restaurant.imageUrls[currentImageIndex]}
                alt={`${restaurant.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => openGallery(currentImageIndex)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
                }}
              />
              
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
                {aiExplanation.matchPercentage}% Match
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

              {/* Real AI Match Analysis - Keep as fake for now as requested */}
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
                
                {/* AI Score Breakdown */}
                {(restaurant.vectorScore || restaurant.keywordScore || restaurant.llmScore) && (
                  <div className="mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-md">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {Math.round(restaurant.vectorScore || 0)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Vector</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {Math.round(restaurant.keywordScore || 0)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Keyword</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {Math.round(restaurant.llmScore || 0)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">AI</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {/* Keep fake for now as user requested */}
                  {matchScore >= 90 ? 'Excellent match for your search criteria. This restaurant ticks all the boxes!' :
                   matchScore >= 80 ? 'Great match! This restaurant should meet most of your requirements.' :
                   matchScore >= 60 ? 'Good match with some relevant features for your search.' :
                   'Partial match - some aspects align with your search criteria.'}
                </p>
                
                {/* Fake Match Reasons - Keep as requested */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      What matches your search:
                    </h4>
                    <ul className="space-y-1">
                    {matchScore >= 80 && (
                      <>
                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Excellent cuisine matching your preferences
                        </li>
                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Perfect location and atmosphere
                        </li>
                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Great value for the experience
                        </li>
                      </>
                    )}
                    {matchScore >= 60 && matchScore < 80 && (
                      <>
                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Good cuisine variety
                        </li>
                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Suitable atmosphere
                        </li>
                      </>
                    )}
                    {matchScore < 60 && (
                      <li className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        Some relevant features
                      </li>
                    )}
                    </ul>
                  </div>

                {/* Fake Concerns - Keep as requested */}
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
                  {restaurant.reviewsTags.slice(0, 8).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                  {restaurant.reviewsTags.length > 8 && (
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full text-sm">
                      +{restaurant.reviewsTags.length - 8} more
                    </span>
                  )}
                </div>
              </div>

              {/* Recent Reviews - Enhanced */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Reviews</h3>
                <div className="space-y-4">
                  {restaurant.reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">{review.author}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
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