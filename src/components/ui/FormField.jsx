/**
 * Consistent field wrapper providing label, required indicator, helper text, and error messaging.
 */
function FormField({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  className = '',
  children,
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-ink"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-status-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-status-danger" role="alert">
          {error}
        </p>
      ) : (
        helperText && <p className="text-xs text-ink-muted">{helperText}</p>
      )}
    </div>
  )
}

export default FormField
