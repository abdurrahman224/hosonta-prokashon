const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

export function toEnglishDigits(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[০-৯]/g, digit =>
    String(BENGALI_DIGITS.indexOf(digit)),
  );
}

export function formatNumber(value, language = 'en') {
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';
  return new Intl.NumberFormat(locale).format(Number(toEnglishDigits(value)) || 0);
}

export function formatCurrency(value, language = 'en') {
  return `৳${formatNumber(value, language)}`;
}

export function formatDate(value, language, style = 'medium') {
  const isBn = language === 'bn';
  const formatStyle =
    typeof language === 'string' && ['short', 'medium', 'long'].includes(language)
      ? language
      : style;
  const options =
    formatStyle === 'short'
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? '');
  return new Intl.DateTimeFormat(isBn ? 'bn-BD' : 'en-GB', options).format(date);
}

export function formatRelativeTime(value, language = 'en') {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  const units =
    Math.abs(seconds) < 60
      ? ['second', seconds]
      : Math.abs(seconds) < 3600
        ? ['minute', seconds / 60]
        : Math.abs(seconds) < 86400
          ? ['hour', seconds / 3600]
          : ['day', seconds / 86400];
  return new Intl.RelativeTimeFormat(language === 'bn' ? 'bn-BD' : 'en', {
    numeric: 'auto',
  }).format(Math.round(units[1]), units[0]);
}

export function formatPhone(value, language = 'en') {
  const digits = toEnglishDigits(value ?? '')
    .replace(/\D/g, '')
    .replace(/^88/, '');
  const formatted = digits.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1-$2-$3');
  if (language === 'bn') {
    return formatted.replace(/\d/g, digit => BENGALI_DIGITS[digit]);
  }
  return formatted;
}
