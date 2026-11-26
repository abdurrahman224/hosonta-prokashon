import { forwardRef, useId } from 'react'
import FormField from './FormField'

/**
 * Shared multiline textarea primitive.
 */
const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    required = false,
    rows = 3,
    id,
    className = '',
    textareaClassName = '',
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 ${
          error ? 'border-status-danger' : 'border-line hover:border-line-strong'
        } ${textareaClassName}`}
        {...rest}
      />
    </FormField>
  )
})

export default Textarea
