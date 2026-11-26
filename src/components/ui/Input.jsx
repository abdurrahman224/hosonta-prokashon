import { forwardRef, useId } from 'react'
import FormField from './FormField'

const SIZE_CLASSES = {
  sm: 'h-8 px-2.5 text-xs rounded-lg',
  md: 'h-10 px-3 text-sm rounded-lg',
  lg: 'h-11 px-3.5 text-sm rounded-xl',
}

/**
 * Shared text input primitive using neutral surface/borders and brand focus state.
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    required = false,
    leftIcon,
    rightElement,
    size = 'md',
    id,
    className = '',
    inputClassName = '',
    ...rest
  },
  ref,
) {
  const generatedId = useId()
  const fieldId = id || generatedId

  return (
    <FormField
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      helperText={helperText}
      className={className}
    >
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          className={`w-full border bg-surface text-ink placeholder:text-ink-subtle outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 ${
            error ? 'border-status-danger' : 'border-line hover:border-line-strong'
          } ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} ${
            leftIcon ? 'pl-9' : ''
          } ${rightElement ? 'pr-9' : ''} ${inputClassName}`}
          {...rest}
        />
        {rightElement && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        )}
      </div>
    </FormField>
  )
})

export default Input
