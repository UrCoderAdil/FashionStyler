const SORT_OPTIONS = [
  { value: 'match',  label: 'Best Match' },
  { value: 'visual', label: 'Visual' },
  { value: 'body',   label: 'Body Fit' },
  { value: 'color',  label: 'Color' },
];

const STYLE_FILTERS = ['', 'casual', 'formal', 'streetwear'];
const OCC_FILTERS   = ['', 'daily', 'office', 'party'];

export default function FilterBar({
  sort, setSort,
  styleFilter, setStyleFilter,
  occFilter, setOccFilter,
  showFavs, setShowFavs,
  favCount,
  total,
  filtered,
}) {
  return (
    <div className="filter-bar">
      {/* Sort */}
      <div className="filter-section">
        <span className="filter-label">Sort</span>
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`filter-chip ${sort === o.value ? 'active' : ''}`}
            onClick={() => setSort(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="filter-divider" />

      {/* Style filter */}
      <div className="filter-section">
        <span className="filter-label">Style</span>
        {STYLE_FILTERS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            className={`filter-chip ${styleFilter === s ? 'active' : ''}`}
            onClick={() => setStyleFilter(styleFilter === s ? '' : s)}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="filter-divider" />

      {/* Occasion filter */}
      <div className="filter-section">
        <span className="filter-label">Occasion</span>
        {OCC_FILTERS.map((o) => (
          <button
            key={o || 'all'}
            type="button"
            className={`filter-chip ${occFilter === o ? 'active' : ''}`}
            onClick={() => setOccFilter(occFilter === o ? '' : o)}
          >
            {o === '' ? 'All' : o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>

      {favCount > 0 && (
        <>
          <div className="filter-divider" />
          <button
            type="button"
            className={`filter-chip ${showFavs ? 'active' : ''}`}
            onClick={() => setShowFavs(!showFavs)}
          >
            ♥ Saved ({favCount})
          </button>
        </>
      )}

      <span className="results-count">
        {filtered}/{total} looks
      </span>
    </div>
  );
}
