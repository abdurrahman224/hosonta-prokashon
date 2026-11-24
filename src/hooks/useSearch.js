import { useMemo, useState } from 'react'
import useDebounce from './useDebounce'

function getSearchableValues(field) {
  if (field == null) return []
  if (typeof field === 'object') return Object.values(field).filter(Boolean).map(String)
  return [String(field)]
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFC')
    .toLocaleLowerCase()
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
}

function useSearch(items = [], keys = [], controlledQuery) {
  const [internalQuery, setInternalQuery] = useState('')
  const query = controlledQuery ?? internalQuery
  const debouncedQuery = useDebounce(query)

  const results = useMemo(() => {
    const normalizedQuery = normalize(debouncedQuery).trim()

    if (!normalizedQuery) {
      return items
    }

    return items.filter((item) =>
      keys.some((key) =>
        getSearchableValues(item[key]).some((value) =>
          normalize(value).includes(normalizedQuery),
        ),
      ),
    )
  }, [debouncedQuery, items, keys])

  return {
    query,
    setQuery: setInternalQuery,
    results,
    isSearching: query !== debouncedQuery,
  }
}

export default useSearch
