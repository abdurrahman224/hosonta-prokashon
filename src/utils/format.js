const BENGALI_LOCALE = 'bn-BD'

export function formatNumber(value) {
  return new Intl.NumberFormat(BENGALI_LOCALE).format(Number(value) || 0)
}

export function formatCurrency(value) {
  return `৳${formatNumber(value)}`
}

export function formatDate(value, _language, style = 'medium') {
  const formatStyle = typeof _language === 'string' && ['short', 'medium', 'long'].includes(_language) ? _language : style
  const options = formatStyle === 'short'
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'long', year: 'numeric' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value ?? '')
  return new Intl.DateTimeFormat(BENGALI_LOCALE, options).format(date)
}

export function formatRelativeTime(value) {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000
  const units = Math.abs(seconds) < 60
    ? ['second', seconds]
    : Math.abs(seconds) < 3600
      ? ['minute', seconds / 60]
      : Math.abs(seconds) < 86400
        ? ['hour', seconds / 3600]
        : ['day', seconds / 86400]
  return new Intl.RelativeTimeFormat(BENGALI_LOCALE, { numeric: 'auto' }).format(
    Math.round(units[1]),
    units[0],
  )
}

export function formatPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').replace(/^88/, '')
  const formatted = digits.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1-$2-$3')
  return formatted.replace(/\d/g, digit => '০১২৩৪৫৬৭৮৯'[digit])
}
