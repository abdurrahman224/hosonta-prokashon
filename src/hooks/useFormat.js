import { formatCurrency, formatDate, formatNumber, formatPhone, formatRelativeTime } from '../utils/format'

export function useFormat() {
  return {
    formatNumber: value => formatNumber(value, 'bn'),
    formatCurrency: value => formatCurrency(value, 'bn'),
    formatDate: (value, style) => formatDate(value, 'bn', style),
    formatRelativeTime: value => formatRelativeTime(value, 'bn'),
    formatPhone: value => formatPhone(value, 'bn'),
  }
}

export default useFormat
