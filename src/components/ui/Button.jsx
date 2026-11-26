import { forwardRef } from 'react'
import { FiLoader } from 'react-icons/fi'

const VARIANT_CLASSES = {
  primary:
    'bg-brand text-ink border border-transparent hover:bg-brand-hover active:bg-brand-active font-semibold shadow-2xs',
  secondary:
    'bg-surface text-ink border border-line hover:bg-surface-muted hover:border-line-strong font-medium',
  outline:
    'bg-surface text-ink border border-line hover:bg-surface-muted hover:border-line-strong font-medium',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:bg-surface-muted hover:text-ink font-medium',
  danger:
    'bg-surface text-status-danger border border-line hover:bg-surface-muted hover:border-line-strong font-medium',
  'danger-ghost':
    'bg-transparent text-status-danger border border-transparent hover:bg-surface-muted font-medium',
}

const SIZE_CLASSES = {
  xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
  'icon-sm': 'h-7 w-7 p-0 rounded-lg justify-center',
  icon: 'h-8 w-8 p-0 rounded-lg justify-center',
  'icon-lg': 'h-10 w-10 p-0 rounded-xl justify-center',
}

/**
 * Shared button primitive.
 * Brand background is reserved strictly for the `primary` variant with dark text (#111111).
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center whitespace-nowrap transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary
      } ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <FiLoader className="animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  )
})

export default Button
