function FilterSidebar({
  title = 'ফিল্টার',
  activeCount = 0,
  onReset,
  children,
}) {
  return (
    <aside className="hidden lg:block">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="font-heading font-semibold text-dark">{title}</p>
          {activeCount > 0 && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="text-sm font-semibold text-primary-hover transition hover:text-dark"
            >
              সব মুছুন
            </button>
          )}
        </div>
        {children}
      </div>
    </aside>
  );
}

export default FilterSidebar;
