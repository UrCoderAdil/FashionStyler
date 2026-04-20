function Swatch({ hex, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div
        className="swatch"
        style={{ backgroundColor: hex, width: '100%', aspectRatio: '1' }}
        title={label || hex}
      />
      {label && (
        <span style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-muted)' }}>
          {label}
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--c-light)' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--c-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-black)', textTransform: 'capitalize' }}>
        {value}
      </span>
    </div>
  );
}

export default function AnalysisCard({ features }) {
  const {
    body_type = 'unknown',
    body_confidence = 0,
    color_season = 'unknown',
    color_confidence = 0,
    color_palette = {},
    style_tips = {},
    undertone = 'unknown',
    color_value = 'unknown',
    color_chroma = 'unknown',
  } = features;

  const seasonName = color_season.replace(/_/g, ' ');
  const bodyName = body_type.replace(/_/g, ' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── BODY TYPE ─────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--c-muted)' }}>
            Body Architecture
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--c-muted)' }}>
            {(body_confidence * 100).toFixed(0)}% confidence
          </span>
        </div>

        <h3 style={{ fontFamily: 'var(--f-accent)', fontSize: '2rem', fontStyle: 'italic', textTransform: 'capitalize', color: 'var(--c-black)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
          {bodyName}
        </h3>

        {/* Confidence bar */}
        <div className="score-bar-track" style={{ marginBottom: '1rem' }}>
          <div className="score-bar-fill" style={{ width: `${(body_confidence * 100).toFixed(0)}%`, background: 'var(--c-black)' }} />
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--c-charcoal)', lineHeight: 1.65, marginBottom: '1rem' }}>
          {style_tips.description}
        </p>

        {(style_tips.recommended?.length > 0 || style_tips.avoid?.length > 0) && (
          <div style={{ background: 'var(--c-cream)', border: '1px solid var(--c-border)', padding: '0.875rem', borderRadius: 'var(--r-sm)' }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.625rem', color: 'var(--c-black)' }}>
              Editorial Tips
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {style_tips.recommended?.map((tip, i) => (
                <li key={`do-${i}`} style={{ fontSize: '0.75rem', color: 'var(--c-charcoal)', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--c-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {tip}
                </li>
              ))}
              {style_tips.avoid?.map((tip, i) => (
                <li key={`avoid-${i}`} style={{ fontSize: '0.75rem', color: 'var(--c-muted)', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ flexShrink: 0 }}>–</span>
                  Avoid {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── COLOR SEASON ──────────────────────────── */}
      <section style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--c-muted)' }}>
            Chromatic Season
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--c-muted)' }}>
            {(color_confidence * 100).toFixed(0)}% match
          </span>
        </div>

        <h3 style={{ fontFamily: 'var(--f-accent)', fontSize: '2rem', fontStyle: 'italic', textTransform: 'capitalize', color: 'var(--c-black)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
          {seasonName}
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
          {[
            { key: 'Undertone', val: undertone },
            { key: 'Value',     val: color_value },
            { key: 'Chroma',    val: color_chroma },
          ].map(({ key, val }) => (
            <div key={key} style={{
              flex: 1, textAlign: 'center',
              padding: '0.5rem 0.25rem',
              background: 'var(--c-cream)',
              border: '1px solid var(--c-border)',
              borderRadius: 'var(--r-sm)',
            }}>
              <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)', marginBottom: '0.2rem' }}>{key}</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-black)', textTransform: 'capitalize' }}>{val}</p>
            </div>
          ))}
        </div>

        {color_palette.description && (
          <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--c-charcoal)', lineHeight: 1.6, marginBottom: '1rem' }}>
            "{color_palette.description}"
          </p>
        )}

        {color_palette.best_colors?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-black)', marginBottom: '0.5rem' }}>
              Your Palette
            </p>
            <div className="swatch-grid">
              {color_palette.best_colors.map((hex, i) => (
                <Swatch key={i} hex={hex} />
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {color_palette.metals?.length > 0 && (
            <div style={{ background: 'var(--c-cream)', border: '1px solid var(--c-border)', padding: '0.625rem', borderRadius: 'var(--r-sm)' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--c-muted)', marginBottom: '0.25rem' }}>Best Metals</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--c-black)', textTransform: 'capitalize' }}>{color_palette.metals.join(', ')}</p>
            </div>
          )}
          {color_palette.makeup_tips && (
            <div style={{ background: 'var(--c-cream)', border: '1px solid var(--c-border)', padding: '0.625rem', borderRadius: 'var(--r-sm)' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--c-muted)', marginBottom: '0.25rem' }}>Beauty Pulse</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--c-black)' }}>{color_palette.makeup_tips}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
