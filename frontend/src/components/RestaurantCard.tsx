import React from 'react'
import { Star, MapPin, Users, DollarSign, ExternalLink } from 'lucide-react'
import { Restaurant } from '../types/restaurant'
import { formatPrice, generateMatchScore } from '../lib/utils'
import { cn } from '../lib/utils'

interface RestaurantCardProps {
  restaurant: Restaurant
  onClick: () => void
  className?: string
}

export function RestaurantCard({ restaurant, onClick, className }: RestaurantCardProps) {
  const matchScore = generateMatchScore()

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={restaurant.imageUrls[0]}
          alt={restaurant.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          {matchScore}% Match
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {restaurant.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {restaurant.categoryName}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {restaurant.totalScore}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span className="text-sm">{restaurant.reviewsCount} reviews</span>
          </div>
        </div>

        {/* Location & Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{restaurant.neighborhood}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">{formatPrice(restaurant.price)}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {restaurant.reviewsTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs"
            >
              {tag}
            </span>
          ))}
          {restaurant.reviewsTags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md text-xs">
              +{restaurant.reviewsTags.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}