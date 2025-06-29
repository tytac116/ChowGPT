import React, { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from './ui/Modal'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

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

  // Update current index when initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [initialIndex, isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
  }, [images.length])

  const goToNext = useCallback(() => {
    if (images.length <= 1) return
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
  }, [images.length])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen || images.length === 0) {
    return null
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      className="p-0 max-w-none max-h-none w-full h-full bg-black/95"
    >
    <div 
        className="relative w-full h-full flex items-center justify-center"
      onClick={handleBackdropClick}
    >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200 backdrop-blur-sm"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Image Counter */}
        <div className="absolute top-4 left-4 z-50">
          <div className="px-3 py-1 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
            {restaurantName}
          </div>
          <div className="px-3 py-1 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm mt-2">
            {currentIndex + 1} of {images.length} photos
          </div>
        </div>
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-200 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

        {/* Main Image */}
        <div className="flex items-center justify-center h-full p-4 pt-20 pb-32">
          <img
            src={images[currentIndex]}
            alt={`${restaurantName} - Photo ${currentIndex + 1}`}
            className={cn(
              "max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-500 ease-out select-none",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
            key={currentIndex}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
      </div>

        {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex space-x-2 p-2 rounded-lg bg-black/50 backdrop-blur-sm max-w-2xl overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all duration-200",
                    index === currentIndex
                      ? "border-white opacity-100" 
                      : "border-transparent opacity-60 hover:opacity-80"
                  )}
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
      )}
    </div>
    </Modal>
  )
}