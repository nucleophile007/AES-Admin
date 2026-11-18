import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm'
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
}

export function Button({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'default',
  disabled = false,
  onClick,
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-1.5 font-medium transition focus:outline-none focus-visible:ring-4'
  
  const variantClasses: Record<'default' | 'ghost' | 'outline', string> = {
    default: 'bg-brand-700 text-white shadow-card hover:bg-brand-800 focus-visible:ring-brand-100',
    ghost: 'bg-transparent text-ink-soft hover:bg-canvas hover:text-ink focus-visible:ring-brand-100',
    outline: 'border border-line bg-surface text-ink-soft shadow-card hover:bg-canvas hover:text-ink focus-visible:ring-brand-100'
  }
  
  const sizeClasses = {
    default: 'h-10 px-4 text-sm rounded-lg',
    sm: 'h-8 px-3 text-xs rounded-lg'
  }
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`
  
  return (
    <button 
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
