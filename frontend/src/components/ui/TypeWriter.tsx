import React, { useState, useEffect } from 'react'

interface TypeWriterProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export function TypeWriter({ text, speed = 50, className = '', onComplete }: TypeWriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  useEffect(() => {
    // Reset when text changes
    setDisplayText('')
    setCurrentIndex(0)
  }, [text])

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

interface SearchingAnimationProps {
  searchQuery: string
  className?: string
}

export function SearchingAnimation({ searchQuery, className = '' }: SearchingAnimationProps) {
  const [stage, setStage] = useState(0)
  
  const stages = [
    "We are searching for",
    `"${searchQuery}"`,
    "🔍 Analyzing Cape Town restaurants...",
    "🤖 AI is finding your perfect match...",
    "⚡ Almost done..."
  ]

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="text-lg text-gray-600 dark:text-gray-400">
        {stage < stages.length && (
          <TypeWriter
            text={stages[stage]}
            speed={stage === 1 ? 30 : 50} // Slower for the query
            onComplete={() => {
              if (stage < stages.length - 1) {
                setTimeout(() => setStage(prev => prev + 1), stage === 1 ? 800 : 1000)
              }
            }}
          />
        )}
      </div>
      
      {/* Progress indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              stage >= i + 2 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animation: stage >= i + 2 ? 'pulse 1s infinite' : 'none'
            }}
          />
        ))}
      </div>
    </div>
  )
} 