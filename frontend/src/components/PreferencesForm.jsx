const STYLES    = ['', 'casual', 'formal', 'streetwear'];
const OCCASIONS = ['', 'daily', 'office', 'party'];
const BUDGETS   = ['', 'low', 'medium', 'high'];
const COLORS    = ['', 'warm', 'cool', 'neutral'];
const LABEL = { '': 'Any' };

function ChipGroup({ label, field, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)' }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(field, opt)}
            className={`pref-chip ${value === opt ? 'active' : ''}`}
          >
            {LABEL[opt] ?? (opt.charAt(0).toUpperCase() + opt.slice(1))}
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

  return (
    <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--c-border)' }}>
        <p style={{ fontFamily: 'var(--f-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-black)' }}>
          Style Preferences
        </p>
        <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)' }}>
          Optional
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.25rem' }}>
        <ChipGroup label="Style"    field="style"            options={STYLES}    value={preferences.style}            onChange={handle} />
        <ChipGroup label="Occasion" field="occasion"         options={OCCASIONS} value={preferences.occasion}         onChange={handle} />
        <ChipGroup label="Budget"   field="budget"           options={BUDGETS}   value={preferences.budget}           onChange={handle} />
        <ChipGroup label="Colors"   field="color_preference" options={COLORS}    value={preferences.color_preference} onChange={handle} />
      </div>
    </div>
  );
}
