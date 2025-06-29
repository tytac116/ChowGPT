import React, { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, children, className }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (open) {
      // Small delay to ensure proper mounting before animation
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300 ease-out",
            isVisible ? "opacity-100" : "opacity-0"
          )} 
        />
        <Dialog.Content 
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 ease-out",
            isVisible 
              ? "opacity-100 scale-100 -translate-x-1/2 -translate-y-1/2" 
              : "opacity-0 scale-95 -translate-x-1/2 -translate-y-1/2",
            className
          )}
          style={{
            transformOrigin: 'center center'
          }}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Modal</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {children}
          </div>
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 z-10 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 transform hover:scale-110">
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}