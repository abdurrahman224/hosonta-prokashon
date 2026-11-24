import { useEffect, useState } from 'react';
import { FiChevronDown, FiSearch, FiSliders, FiX } from 'react-icons/fi';
import useFormat from '../../hooks/useFormat';

export function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-dark/10 bg-white">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-heading text-sm font-semibold text-dark"
      >
        {title}
        <FiChevronDown className={`text-dark-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-dark/10">{children}</div>}
    </div>
  );
}

export function OptionList({
  options,
  value,
  onChange,
  searchableAfter = 8,
  searchPlaceholder = 'খুঁজুন...',
  maxHeightClass = 'max-h-56',
}) {
  const { formatNumber } = useFormat();
  const [term, setTerm] = useState('');
  const shown = term
    ? options.filter(option => option.label.toLowerCase().includes(term.toLowerCase()))
    : options;

  return (
    <div>
      {options.length > searchableAfter && (
        <div className="relative border-b border-dark/10 p-2">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" />
          <input
            type="search"
            value={term}
            onChange={event => setTerm(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-md bg-cream py-2 pl-9 pr-3 text-sm text-dark outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}
      <ul role="radiogroup" className={`${maxHeightClass} overflow-y-auto [scrollbar-width:thin]`}>
        {shown.length === 0 && (
          <li className="px-4 py-3 text-sm text-dark-muted">কিছু পাওয়া যায়নি</li>
        )}
        {shown.map(option => {
          const selected = value === option.id;
          return (
            <li key={option.id} className="border-b border-dark/5 last:border-0">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(selected ? '' : option.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-cream ${
                  selected ? 'font-semibold text-dark' : 'text-dark/80'
                }`}
              >
                <span className="min-w-0 flex-1">
                  {option.label}
                  {option.count !== undefined && (
                    <span className="ml-1 text-dark-muted">({formatNumber(option.count)})</span>
                  )}
                </span>
                <span className={`h-4 w-4 shrink-0 rounded-full border transition ${
                  selected ? 'border-[5px] border-primary bg-white' : 'border-dark/30 bg-white'
                }`} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const sliderStyles = `
.pr-range { position: relative; height: 22px; }
.pr-range input[type=range] {
  position: absolute; inset: 0; width: 100%; height: 22px; margin: 0;
  background: none; pointer-events: none;
  -webkit-appearance: none; appearance: none;
}
.pr-range input[type=range]::-webkit-slider-runnable-track { background: transparent; height: 22px; }
.pr-range input[type=range]::-moz-range-track { background: transparent; }
.pr-range input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none; pointer-events: auto; cursor: grab;
  height: 20px; width: 20px; border-radius: 9999px;
  background: #fff; border: 2px solid currentColor;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.pr-range input[type=range]::-moz-range-thumb {
  pointer-events: auto; cursor: grab;
  height: 16px; width: 16px; border-radius: 9999px;
  background: #fff; border: 2px solid currentColor;
}
.pr-range input[type=range]:focus-visible::-webkit-slider-thumb { outline: 2px solid currentColor; outline-offset: 2px; }
`;

export function PriceRange({ min, max, value, onCommit, step }) {
  const [range, setRange] = useState(value);
  const [low, high] = value;

  useEffect(() => setRange([low, high]), [low, high]);

  const [from, to] = range;
  const stepSize = step ?? Math.max(1, Math.round((max - min) / 100));
  const percent = number => ((number - min) / (max - min || 1)) * 100;
  const clampNumber = (number, lowLimit, highLimit) =>
    Math.min(Math.max(number, lowLimit), highLimit);
  const commit = () => onCommit([from, to]);

  return (
    <div className="px-4 pb-4 pt-5 text-primary-hover">
      <style>{sliderStyles}</style>
      <div className="pr-range">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-dark/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${percent(from)}%`, right: `${100 - percent(to)}%` }}
        />
        <input
          type="range"
          aria-label="সর্বনিম্ন মান"
          min={min}
          max={max}
          step={stepSize}
          value={from}
          style={{ zIndex: from > max - stepSize * 5 ? 5 : 3 }}
          onChange={event => setRange([clampNumber(Number(event.target.value), min, to), to])}
          onPointerUp={commit}
          onKeyUp={commit}
        />
        <input
          type="range"
          aria-label="সর্বোচ্চ মান"
          min={min}
          max={max}
          step={stepSize}
          value={to}
          style={{ zIndex: 4 }}
          onChange={event => setRange([from, clampNumber(Number(event.target.value), from, max)])}
          onPointerUp={commit}
          onKeyUp={commit}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-dark">
        {[
          ['সর্বনিম্ন', from, number => setRange([clampNumber(number, min, to), to])],
          ['সর্বোচ্চ', to, number => setRange([from, clampNumber(number, from, max)])],
        ].map(([label, number, setter]) => (
          <label key={label} className="block">
            <input
              type="number"
              aria-label={label}
              inputMode="numeric"
              min={min}
              max={max}
              value={number}
              onChange={event => setter(Number(event.target.value) || 0)}
              onBlur={commit}
              onKeyDown={event => event.key === 'Enter' && event.currentTarget.blur()}
              className="w-full rounded-md border border-dark/10 bg-cream px-3 py-2 text-center text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function FilterPanel({ sections, values, onChange }) {
  return (
    <div className="space-y-3">
      {sections.map(section => {
        if (section.type === 'range') {
          return (
            <FilterSection key={section.key} title={section.title} defaultOpen={section.defaultOpen}>
              <PriceRange
                min={section.min}
                max={section.max}
                step={section.step}
                value={values[section.key] ?? [section.min, section.max]}
                onCommit={next => onChange(section.key, next)}
              />
            </FilterSection>
          );
        }

        if (!section.options?.length && !section.showWhenEmpty) return null;

        return (
          <FilterSection key={section.key} title={section.title} defaultOpen={section.defaultOpen}>
            <OptionList
              options={section.options ?? []}
              value={values[section.key] ?? ''}
              searchableAfter={section.searchableAfter}
              searchPlaceholder={section.searchPlaceholder}
              maxHeightClass={section.maxHeightClass}
              onChange={next => onChange(section.key, next)}
            />
          </FilterSection>
        );
      })}
    </div>
  );
}

export function FilterDrawer({
  open,
  onClose,
  title = 'ফিল্টার',
  activeCount = 0,
  onReset,
  resultLabel = 'ফলাফল দেখুন',
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="absolute inset-0 bg-dark/60" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark/10 px-4 py-3">
          <p className="font-heading font-semibold text-dark">{title}</p>
          <div className="flex items-center gap-3">
            {activeCount > 0 && onReset && (
              <button type="button" onClick={onReset} className="text-sm font-semibold text-primary-hover">সব মুছুন</button>
            )}
            <button type="button" onClick={onClose} aria-label="বন্ধ করুন" className="rounded-full p-1.5 text-dark hover:bg-dark/5">
              <FiX />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        <div className="border-t border-dark/10 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="w-full rounded-lg bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-gray">
            {resultLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FilterButton({ onClick, activeCount = 0, label = 'ফিল্টার', className = '' }) {
  const { formatNumber } = useFormat();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm font-semibold text-dark lg:hidden ${className}`}
    >
      <FiSliders />
      {label}
      {activeCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-dark">
          {formatNumber(activeCount)}
        </span>
      )}
    </button>
  );
}

export function ActiveFilterChips({ chips, onRemove }) {
  return chips.map(chip => (
    <button
      key={chip.key}
      type="button"
      onClick={() => onRemove(chip.key)}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-dark ring-1 ring-dark/10 transition hover:ring-primary"
    >
      <span className="truncate">{chip.label}</span>
      <FiX className="shrink-0" aria-label="মুছুন" />
    </button>
  ));
}
