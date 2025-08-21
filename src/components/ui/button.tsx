import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'ghost'
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
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    default: 'px-4 py-2 text-sm rounded-md',
    sm: 'px-3 py-1.5 text-sm rounded-md'
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
