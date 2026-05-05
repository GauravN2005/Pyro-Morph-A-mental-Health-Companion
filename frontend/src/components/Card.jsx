import React from 'react'
import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
  ...props
}) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={onClick}
      className={`
        glass rounded-3xl shadow-card
        ${hover ? 'cursor-pointer hover:border-violet-500/40 hover:shadow-glow transition-all duration-300' : ''}
        ${glow ? 'animate-[glowPulse_3s_ease-in-out_infinite]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
