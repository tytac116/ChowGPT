import React, { useState } from 'react'
import { Star, MapPin, Phone, Globe, Clock, Users, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { PhotoGallery } from './PhotoGallery'
import { Restaurant, AIMatchExplanation } from '../types/restaurant'
import { formatPrice, generateMatchScore } from '../lib/utils'
import { mockAIExplanations } from '../data/mockRestaurants'

interface RestaurantModalProps {
  restaurant: Restaurant | null
  isOpen: boolean
  onClose: () => void
}

export function RestaurantModal({ restaurant, isOpen, onClose }: RestaurantModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  if (!restaurant) return null

  const matchScore = generateMatchScore()
  const aiExplanation = mockAIExplanations[restaurant.id] || {
    matchPercentage: matchScore,
    matchReasons: ['Good match for your search'],
    concernReasons: [],
    summary: 'This restaurant matches your search criteria.'
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

              {/* Match Score Badge */}
              <div className="absolute top-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-full font-semibold">
                {aiExplanation.matchPercentage}% Match
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
                
                {/* Rating & Reviews */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {restaurant.totalScore}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{restaurant.reviewsCount} reviews</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {formatPrice(restaurant.price)}
                  </div>
                </div>
              </div>

              {/* AI Match Explanation */}
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-3">
                  AI Match Analysis
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {aiExplanation.summary}
                </p>
                
                {/* Match Reasons */}
                {aiExplanation.matchReasons.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      What matches your search:
                    </h4>
                    <ul className="space-y-1">
                      {aiExplanation.matchReasons.map((reason, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concern Reasons */}
                {aiExplanation.concernReasons.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Things to consider:
                    </h4>
                    <ul className="space-y-1">
                      {aiExplanation.concernReasons.map((reason, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.address}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <Globe className="h-4 w-4" />
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
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
                      <span className="text-gray-600 dark:text-gray-400">{day}</span>
                      <span className={`${time === 'Closed' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {restaurant.reviewsTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Reviews */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Reviews</h3>
                <div className="space-y-4">
                  {restaurant.reviews.slice(0, 3).map((review) => (
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.text}</p>
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