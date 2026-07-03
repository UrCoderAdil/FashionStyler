import { useState, useEffect, useRef } from 'react';
import RadarChart from './RadarChart';

/* ── Circular progress indicator ─────────────────────────── */
function CircularProgress({ value, size = 64, label, color = 'var(--c-accent)' }) {
  const circleRef = useRef(null);
  const r = (size / 2) - 5;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDasharray = circumference;
    el.style.strokeDashoffset = circumference;
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)';
      el.style.strokeDashoffset = circumference * (1 - pct);
    });
    return () => cancelAnimationFrame(raf);
  }, [pct, circumference]);

  const isDark = document.documentElement.dataset.theme === 'dark';

  return (
    <div className="circular-progress-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.08)' : 'var(--c-light)'}
          strokeWidth="4"
        />
        <circle
          ref={circleRef}
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          style={{ filter: isDark ? `drop-shadow(0 0 4px ${color})` : 'none' }}
        />
        <text
          x="50%" y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%', fontSize: `${size * 0.2}px`, fontWeight: 700, fill: isDark ? '#f0ede8' : '#0c0c0c', fontFamily: 'var(--f-mono)' }}
        >
          {(pct * 100).toFixed(0)}
        </text>
      </svg>
      <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)' }}>
        {label}
      </span>
    </div>
  );
}

/* ── Swatch with copy-on-click ─────────────────────────────── */
function Swatch({ hex }) {
  const [copied, setCopied] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="swatch" style={{ backgroundColor: hex }} onClick={handleClick} title={hex}>
      <span className="swatch-tooltip">{copied ? '✓ Copied' : hex}</span>
    </div>
  );
}

/* ── Animated stat row ─────────────────────────────────────── */
function InfoPill({ label, value }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.2rem',
      padding: '0.5rem 0.75rem',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--r-md)',
      flex: 1, textAlign: 'center',
    }}>
      <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-black)', textTransform: 'capitalize' }}>{value}</span>
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
    measurements = {},
  } = features;

  const [tab, setTab] = useState('body');

  const seasonName = color_season.replace(/_/g, ' ');
  const bodyName   = body_type.replace(/_/g, ' ');

  const dummyScores = {
    clip_similarity: 0,
    body_match: body_confidence,
    skin_tone_match: color_confidence,
    pref_match: 0.5,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Confidence circles */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.75rem 0' }}>
        <CircularProgress value={body_confidence} label="Body" color="var(--c-accent)" />
        <CircularProgress value={color_confidence} label="Color" color="var(--c-gold)" />
        <CircularProgress value={(body_confidence + color_confidence) / 2} label="Overall" color="var(--c-info, #3b82f6)" />
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.375rem', padding: '0.25rem', background: 'var(--c-light)', borderRadius: 'var(--r-md)' }}>
        {['body', 'color', 'chart'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '0.375rem 0', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--r-sm)',
              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              background: tab === t ? 'var(--c-white)' : 'transparent',
              color: tab === t ? 'var(--c-black)' : 'var(--c-muted)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {t === 'chart' ? '⬡ Radar' : t === 'body' ? '🦴 Body' : '🎨 Color'}
          </button>
        ))}
      </div>

      {/* ── BODY TAB ── */}
      {tab === 'body' && (
        <div style={{ animation: 'fadeSlideUp 0.3s var(--ease-out) both' }}>
          <h3 style={{ fontFamily: 'var(--f-accent)', fontSize: '1.75rem', fontStyle: 'italic', textTransform: 'capitalize', color: 'var(--c-black)', lineHeight: 1.1, marginBottom: '0.625rem' }}>
            {bodyName}
          </h3>

          <p style={{ fontSize: '0.78rem', color: 'var(--c-charcoal)', lineHeight: 1.65, marginBottom: '1rem' }}>
            {style_tips.description}
          </p>

          {measurements.shoulder_hip_ratio && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <InfoPill label="S/H Ratio" value={measurements.shoulder_hip_ratio?.toFixed(2)} />
              <InfoPill label="Shoulder" value={`${measurements.shoulder_width_px?.toFixed(0)}px`} />
              <InfoPill label="Hip" value={`${measurements.hip_width_px?.toFixed(0)}px`} />
            </div>
          )}

          {(style_tips.recommended?.length > 0 || style_tips.avoid?.length > 0) && (
            <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.875rem', borderRadius: 'var(--r-md)' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.625rem', color: 'var(--c-black)' }}>
                Editorial Tips
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {style_tips.recommended?.map((tip, i) => (
                  <li key={`do-${i}`} style={{ fontSize: '0.72rem', color: 'var(--c-charcoal)', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>✓</span> {tip}
                  </li>
                ))}
                {style_tips.avoid?.map((tip, i) => (
                  <li key={`av-${i}`} style={{ fontSize: '0.72rem', color: 'var(--c-muted)', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ flexShrink: 0, color: 'var(--c-accent)' }}>–</span> Avoid {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── COLOR TAB ── */}
      {tab === 'color' && (
        <div style={{ animation: 'fadeSlideUp 0.3s var(--ease-out) both' }}>
          <h3 style={{ fontFamily: 'var(--f-accent)', fontSize: '1.75rem', fontStyle: 'italic', textTransform: 'capitalize', color: 'var(--c-black)', lineHeight: 1.1, marginBottom: '0.625rem' }}>
            {seasonName}
          </h3>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
            {[
              { key: 'Undertone', val: undertone },
              { key: 'Value',     val: color_value },
              { key: 'Chroma',    val: color_chroma },
            ].map(({ key, val }) => (
              <InfoPill key={key} label={key} value={val} />
            ))}
          </div>

          {color_palette.description && (
            <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--c-charcoal)', lineHeight: 1.6, marginBottom: '0.875rem', borderLeft: '2px solid var(--c-accent)', paddingLeft: '0.625rem' }}>
              "{color_palette.description}"
            </p>
          )}

          {color_palette.best_colors?.length > 0 && (
            <div style={{ marginBottom: '0.875rem' }}>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)', marginBottom: '0.5rem' }}>
                Your Palette · Click to copy hex
              </p>
              <div className="swatch-grid">
                {color_palette.best_colors.map((hex, i) => (
                  <Swatch key={i} hex={hex} />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            {color_palette.metals?.length > 0 && (
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.625rem', borderRadius: 'var(--r-md)' }}>
                <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)', marginBottom: '0.2rem' }}>Best Metals</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--c-gold)', textTransform: 'capitalize', fontWeight: 600 }}>{color_palette.metals.join(', ')}</p>
              </div>
            )}
            {color_palette.makeup_tips && (
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0.625rem', borderRadius: 'var(--r-md)' }}>
                <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)', marginBottom: '0.2rem' }}>Beauty</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--c-charcoal)', lineHeight: 1.4 }}>{color_palette.makeup_tips}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CHART TAB ── */}
      {tab === 'chart' && (
        <div style={{ animation: 'fadeSlideUp 0.3s var(--ease-out) both', display: 'flex', justifyContent: 'center' }}>
          <RadarChart
            scores={dummyScores}
            size={180}
          />
        </div>
      )}
    </div>
  );
}
