const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

const colorClasses = {
  'rose-gold': 'border-rose-gold border-t-transparent',
  white: 'border-white border-t-transparent',
  dark: 'border-jewel-dark border-t-transparent',
}

/**
 * Animated spinning ring indicator.
 * @param {{ size?: 'sm'|'md'|'lg', color?: string, className?: string }} props
 */
export default function Spinner({ size = 'md', color = 'rose-gold', className = '' }) {
  const sizeClass = sizeClasses[size] ?? sizeClasses.md
  const colorClass = colorClasses[color] ?? colorClasses['rose-gold']

  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block rounded-full animate-spin',
        sizeClass,
        colorClass,
        className,
      ].join(' ')}
    />
  )
}
