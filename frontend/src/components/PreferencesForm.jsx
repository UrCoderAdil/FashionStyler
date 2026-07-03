const PREFS = [
  {
    field: 'style',
    label: '✦ Style',
    options: [
      { v: '',           l: 'Any' },
      { v: 'casual',     l: 'Casual' },
      { v: 'formal',     l: 'Formal' },
      { v: 'streetwear', l: 'Streetwear' },
    ],
  },
  {
    field: 'occasion',
    label: '📅 Occasion',
    options: [
      { v: '',       l: 'Any' },
      { v: 'daily',  l: 'Daily' },
      { v: 'office', l: 'Office' },
      { v: 'party',  l: 'Party' },
    ],
  },
  {
    field: 'budget',
    label: '💰 Budget',
    options: [
      { v: '',       l: 'Any' },
      { v: 'low',    l: 'Budget' },
      { v: 'medium', l: 'Mid-range' },
      { v: 'high',   l: 'Luxury' },
    ],
  },
  {
    field: 'color_preference',
    label: '🎨 Colors',
    options: [
      { v: '',        l: 'Any' },
      { v: 'warm',    l: 'Warm' },
      { v: 'cool',    l: 'Cool' },
      { v: 'neutral', l: 'Neutral' },
    ],
  },
];

function ChipGroup({ label, field, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)' }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {options.map(({ v, l }) => (
          <button
            key={v || '__any'}
            type="button"
            onClick={() => onChange(field, v)}
            className={`pref-chip ${value === v ? 'active' : ''}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PreferencesForm({ preferences, onChange }) {
  const handle = (field, value) => {
    onChange((prev) => ({ ...prev, [field]: prev[field] === value ? '' : value }));
  };

  const activeCount = Object.values(preferences).filter(Boolean).length;

  return (
    <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--c-border)' }}>
        <p style={{ fontFamily: 'var(--f-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-black)' }}>
          Style Preferences
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {activeCount > 0 && (
            <span style={{
              fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em',
              background: 'var(--c-accent)', color: '#fff',
              padding: '0.2rem 0.5rem', borderRadius: 'var(--r-pill)',
            }}>
              {activeCount} active
            </span>
          )}
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)' }}>
            Optional
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.25rem' }}>
        {PREFS.map((p) => (
          <ChipGroup
            key={p.field}
            label={p.label}
            field={p.field}
            options={p.options}
            value={preferences[p.field]}
            onChange={handle}
          />
        ))}
      </div>
    </div>
  );
}
