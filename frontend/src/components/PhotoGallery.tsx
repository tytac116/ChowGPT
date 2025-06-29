import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react'
import { Button } from './ui/Button'
import { cn } from '../lib'

interface PhotoGalleryProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  restaurantName: string
}

export function PhotoGallery({ 
  images, 
  initialIndex, 
  isOpen, 
  onClose, 
  restaurantName 
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure proper mounting before animation
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  const handleArrowClick = (direction: 'next' | 'prev') => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (direction === 'next') {
      goToNext()
    } else {
      goToPrevious()
    }
  }

  const handleThumbnailClick = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    goToImage(index)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not any child elements
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    // Prevent closing when clicking on the image
    e.stopPropagation()
  }

  const handleHeaderButtonClick = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation()
    action()
  }

  if (!isOpen) return null

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm transition-all duration-300 ease-out",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={handleBackdropClick}
    >
      {/* Header */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-[61] bg-gradient-to-b from-black/50 to-transparent transition-all duration-300 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}>
        <div className="flex items-center justify-between p-6">
          <div className="text-white">
            <h2 className="text-xl font-semibold">{restaurantName}</h2>
            <p className="text-white/70 text-sm">
              {currentIndex + 1} of {images.length} photos
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 transition-all duration-200 transform hover:scale-110"
              onClick={handleHeaderButtonClick(() => {
                // Mock share functionality
                if (navigator.share) {
                  navigator.share({
                    title: `${restaurantName} - Photo`,
                    url: images[currentIndex]
                  })
                }
              })}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 transition-all duration-200 transform hover:scale-110"
              onClick={handleHeaderButtonClick(() => {
                // Mock download functionality
                const link = document.createElement('a')
                link.href = images[currentIndex]
                link.download = `${restaurantName}-photo-${currentIndex + 1}.jpg`
                link.click()
              })}
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 transition-all duration-200 transform hover:scale-110"
              onClick={handleHeaderButtonClick(onClose)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="flex items-center justify-center h-full p-4 pt-20 pb-32">
        <div 
          className={cn(
            "relative max-w-7xl max-h-full transition-all duration-500 ease-out",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          onClick={handleImageClick}
        >
          <img
            src={images[currentIndex]}
            alt={`${restaurantName} - Photo ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 select-none"
            key={currentIndex} // Force re-render for smooth transitions
            draggable={false}
            onClick={handleImageClick}
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handleArrowClick('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all duration-200 hover:scale-110 active:scale-95 z-10 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Previous image"
                type="button"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <button
                onClick={handleArrowClick('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all duration-200 hover:scale-110 active:scale-95 z-10 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Next image"
                type="button"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent transition-all duration-300 ease-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="p-6">
            <div className="flex justify-center space-x-2 overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={handleThumbnailClick(index)}
                  className={cn(
                    'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50',
                    index === currentIndex
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-white/30 hover:border-white/60'
                  )}
                  aria-label={`View image ${index + 1}`}
                  type="button"
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}