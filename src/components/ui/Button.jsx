import { forwardRef } from 'react'
import Spinner from './Spinner'

const variantClasses = {
  primary:
    'bg-rose-gold text-white hover:opacity-90 focus-visible:ring-rose-gold disabled:opacity-50',
  secondary:
    'bg-ivory text-rose-gold border border-rose-gold hover:bg-blush focus-visible:ring-rose-gold disabled:opacity-50',
  ghost:
    'bg-transparent text-rose-gold hover:bg-blush focus-visible:ring-rose-gold disabled:opacity-40',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:opacity-50',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-base rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-lg rounded-2xl gap-2.5',
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    onClick,
    type = 'button',
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'cursor-pointer disabled:cursor-not-allowed',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && (
        <Spinner
          size="sm"
          color={variant === 'primary' || variant === 'danger' ? 'white' : 'rose-gold'}
        />
      )}
      {children}
    </button>
  )
})

export default Button
