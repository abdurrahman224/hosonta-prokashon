import { forwardRef, useId } from 'react'
import FormField from './FormField'

const SIZE_CLASSES = {
  sm: 'h-8 px-2.5 text-xs rounded-lg',
  md: 'h-10 px-3 text-sm rounded-lg',
  lg: 'h-11 px-3.5 text-sm rounded-xl',
}

/**
 * Shared select dropdown primitive with neutral borders and brand focus outline.
 */
const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    required = false,
    options = [],
    placeholder,
    size = 'md',
    id,
    className = '',
    selectClassName = '',
    children,
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
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        className={`w-full border bg-surface text-ink outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 cursor-pointer ${
          error ? 'border-status-danger' : 'border-line hover:border-line-strong'
        } ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} ${selectClassName}`}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ),
        )}
        {children}
      </select>
    </FormField>
  )
})

export default Select
