import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Card from './Card.jsx'

/**
 * Standard UI Modal with glassmorphism and backdrop blur.
 */
export default function Modal({ 
  show, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = 'max-w-lg',
  noPadding = false 
}) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
      // Small delay to trigger entry transition
      const timer = setTimeout(() => setActive(true), 10)
      return () => clearTimeout(timer)
    } else {
      setActive(false)
      document.body.style.overflow = 'unset'
    }
  }, [show])

  if (!show) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${active ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      {/* Container */}
      <div className={`relative w-full ${maxWidth} transition-all duration-300 ease-out transform ${active ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <Card className={`shadow-2xl border-white/10 dark:border-white/5 overflow-hidden ${noPadding ? '' : 'p-6'}`} noPadding>
          
          {/* Header */}
          {(title || subtitle) && (
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-white dark:bg-slate-900">
              <div>
                {title && <h3 className="font-semibold text-slate-900 dark:text-white leading-none">{title}</h3>}
                {subtitle && <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose}
                className="p-1 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Content */}
          <div>
            {children}
          </div>
          
        </Card>
      </div>
    </div>
  )
}
