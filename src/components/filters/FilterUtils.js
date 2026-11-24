export function buildActiveChips(sections, values, formatNumber = String) {
  return sections.flatMap(section => {
    const value = values[section.key];

    if (section.type === 'range') {
      const [low, high] = value ?? [section.min, section.max];
      if (low <= section.min && high >= section.max) return [];
      const prefix = section.prefix ?? '';
      return [{
        key: section.key,
        label: `${prefix}${formatNumber(low)} - ${prefix}${formatNumber(high)}`,
      }];
    }

    if (!value) return [];
    const option = section.options?.find(item => item.id === value);
    return [{ key: section.key, label: option?.label ?? String(value) }];
  });
}

export function withCounts(items, counts, selected = '') {
  return items
    .map(item => ({ ...item, count: counts.get(item.id) ?? 0 }))
    .filter(item => item.count > 0 || item.id === selected)
    .sort((a, b) => b.count - a.count);
}
