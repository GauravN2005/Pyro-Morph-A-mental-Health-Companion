import React from 'react'
import { motion } from 'framer-motion'

const variants = {
  primary: `
    bg-gradient-to-r from-violet-600 to-indigo-500
    text-white font-medium
    shadow-glow hover:shadow-[0_0_40px_rgba(124,77,255,0.6)]
    border border-violet-500/30
  `,
  secondary: `
    glass text-pale font-medium
    hover:border-violet-500/50 hover:bg-violet-500/10
    border border-border
  `,
  ghost: `
    text-soft hover:text-pale
    hover:bg-white/5
  `,
  danger: `
    bg-gradient-to-r from-red-600 to-rose-500
    text-white font-medium
    shadow-[0_0_20px_rgba(239,68,68,0.3)]
    hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]
    border border-red-500/30
  `,
  cyan: `
    bg-gradient-to-r from-cyan-500 to-indigo-500
    text-white font-medium
    shadow-glow-cyan hover:shadow-[0_0_40px_rgba(77,208,225,0.5)]
    border border-cyan-400/30
  `,
}

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
  icon: 'p-3 rounded-2xl',
  'icon-lg': 'p-5 rounded-full',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  ...props
}) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03, y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-300 cursor-pointer select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  )
}
