import React from 'react'
import { motion } from 'framer-motion'

export default function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        {label && (
          <p className="text-pale font-medium text-sm">{label}</p>
        )}
        {description && (
          <p className="text-muted text-xs mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0
          ${enabled
            ? 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-glow-sm'
            : 'bg-border'
          }
        `}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  )
}
