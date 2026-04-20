const STYLES    = ['', 'casual', 'formal', 'streetwear'];
const OCCASIONS = ['', 'daily', 'office', 'party'];
const BUDGETS   = ['', 'low', 'medium', 'high'];
const COLORS    = ['', 'warm', 'cool', 'neutral'];

const LABEL = { '': 'Any' };

function SelectGroup({ label, icon, field, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>
        {icon} {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(field, opt)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200"
              style={{
                background: active
                  ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                  : 'rgba(255,255,255,0.05)',
                color: active ? '#fff' : '#94a3b8',
                border: active
                  ? '1px solid transparent'
                  : '1px solid rgba(255,255,255,0.1)',
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {LABEL[opt] ?? opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PreferencesForm({ preferences, onChange }) {
  const handle = (field, value) => {
    // Toggle off if already selected
    onChange((prev) => ({ ...prev, [field]: prev[field] === value ? '' : value }));
  };

  return (
    <div className="glass-card p-5 fade-in">
      <h2 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>
        🎛️ Style Preferences <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SelectGroup label="Style"    icon="✨" field="style"            options={STYLES}    value={preferences.style}            onChange={handle} />
        <SelectGroup label="Occasion" icon="📅" field="occasion"         options={OCCASIONS} value={preferences.occasion}         onChange={handle} />
        <SelectGroup label="Budget"   icon="💰" field="budget"           options={BUDGETS}   value={preferences.budget}           onChange={handle} />
        <SelectGroup label="Colors"   icon="🎨" field="color_preference" options={COLORS}    value={preferences.color_preference} onChange={handle} />
      </div>
    </div>
  );
}
