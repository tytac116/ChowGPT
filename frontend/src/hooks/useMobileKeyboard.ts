import { useEffect, useRef } from 'react'

interface UseMobileKeyboardOptions {
  offset?: number // Additional offset from bottom in pixels
  behavior?: 'smooth' | 'auto'
  delay?: number // Delay before scrolling in milliseconds
}

export const useMobileKeyboard = (options: UseMobileKeyboardOptions = {}) => {
  const {
    offset = 20,
    behavior = 'smooth',
    delay = 300
  } = options

  const elementRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isSmallScreen = window.innerWidth <= 768

    if (!isMobile && !isSmallScreen) return

    let scrollTimeout: NodeJS.Timeout

    const handleFocus = () => {
      // Clear any existing timeout
      if (scrollTimeout) clearTimeout(scrollTimeout)
      
      // Wait for keyboard to appear, then scroll
      scrollTimeout = setTimeout(() => {
        if (element) {
          const elementRect = element.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          
          // Calculate if element is hidden behind keyboard
          // Assume keyboard takes up about 1/3 of screen height
          const keyboardHeight = viewportHeight * 0.35
          const visibleHeight = viewportHeight - keyboardHeight
          
          // Check if element is below the visible area
          if (elementRect.bottom > visibleHeight) {
            // Calculate scroll position needed
            const scrollTop = window.pageYOffset
            const elementTop = elementRect.top + scrollTop
            const targetScrollTop = elementTop - (visibleHeight - elementRect.height - offset)
            
            // Smooth scroll to position
            window.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: behavior
            })
          }
        }
      }, delay)
    }

    const handleBlur = () => {
      // Clear timeout on blur
      if (scrollTimeout) clearTimeout(scrollTimeout)
      
      // Optional: Scroll back to a more natural position
      // This is subtle and only happens if we're scrolled very far down
      setTimeout(() => {
        const scrollTop = window.pageYOffset
        const documentHeight = document.documentElement.scrollHeight
        const windowHeight = window.innerHeight
        
        // Only scroll back if we're near the bottom due to keyboard handling
        if (scrollTop + windowHeight > documentHeight - 100) {
          window.scrollTo({
            top: Math.max(0, scrollTop - 100),
            behavior: behavior
          })
        }
      }, 100)
    }

    // Add event listeners
    element.addEventListener('focus', handleFocus)
    element.addEventListener('blur', handleBlur)

    // Cleanup
    return () => {
      element.removeEventListener('focus', handleFocus)
      element.removeEventListener('blur', handleBlur)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [offset, behavior, delay])

  return elementRef
}

// Specific hook for textarea elements
export const useMobileKeyboardTextarea = (options: UseMobileKeyboardOptions = {}) => {
  const {
    offset = 20,
    behavior = 'smooth',
    delay = 300
  } = options

  const elementRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isSmallScreen = window.innerWidth <= 768

    if (!isMobile && !isSmallScreen) return

    let scrollTimeout: NodeJS.Timeout

    const handleFocus = () => {
      // Clear any existing timeout
      if (scrollTimeout) clearTimeout(scrollTimeout)
      
      // Wait for keyboard to appear, then scroll
      scrollTimeout = setTimeout(() => {
        if (element) {
          const elementRect = element.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          
          // Calculate if element is hidden behind keyboard
          // Assume keyboard takes up about 1/3 of screen height
          const keyboardHeight = viewportHeight * 0.35
          const visibleHeight = viewportHeight - keyboardHeight
          
          // Check if element is below the visible area
          if (elementRect.bottom > visibleHeight) {
            // Calculate scroll position needed
            const scrollTop = window.pageYOffset
            const elementTop = elementRect.top + scrollTop
            const targetScrollTop = elementTop - (visibleHeight - elementRect.height - offset)
            
            // Smooth scroll to position
            window.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: behavior
            })
          }
        }
      }, delay)
    }

    const handleBlur = () => {
      // Clear timeout on blur
      if (scrollTimeout) clearTimeout(scrollTimeout)
      
      // Optional: Scroll back to a more natural position
      // This is subtle and only happens if we're scrolled very far down
      setTimeout(() => {
        const scrollTop = window.pageYOffset
        const documentHeight = document.documentElement.scrollHeight
        const windowHeight = window.innerHeight
        
        // Only scroll back if we're near the bottom due to keyboard handling
        if (scrollTop + windowHeight > documentHeight - 100) {
          window.scrollTo({
            top: Math.max(0, scrollTop - 100),
            behavior: behavior
          })
        }
      }, 100)
    }

    // Add event listeners
    element.addEventListener('focus', handleFocus)
    element.addEventListener('blur', handleBlur)

    // Cleanup
    return () => {
      element.removeEventListener('focus', handleFocus)
      element.removeEventListener('blur', handleBlur)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [offset, behavior, delay])

  return elementRef
} 