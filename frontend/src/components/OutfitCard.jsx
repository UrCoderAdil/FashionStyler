import { useState } from 'react';

function ScoreBar({ label, value, accent = false }) {
  const pct = Math.min(1, Math.max(0, value || 0)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: accent ? 'var(--c-accent)' : 'var(--c-black)' }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: accent ? 'var(--c-accent)' : 'var(--c-black)' }}
        />
      </div>
    </div>
  );
}

export default function OutfitCard({ outfit, rank, onTryOn, onShare }) {
  const [showDetails, setShowDetails] = useState(false);
  const [imgError, setImgError] = useState(false);

  const scores = outfit.scores || {};
  const matchPct = ((outfit.final_score || 0) * 100).toFixed(0);
  const description =
    outfit.description ||
    outfit.explanation?.split('\n')[0]?.replace('Recommended because:', '').trim();

  return (
    <div className="outfit-card-magazine">

      {/* ── IMAGE ───────────────────────────────── */}
      <div className="card-image-wrap">
        <div className="card-rank-badge">{rank + 1}</div>

        {/* Match score badge */}
        <div style={{
          position: 'absolute', top: '0.875rem', right: '0.875rem', zIndex: 10,
          background: 'var(--c-white)', border: '1px solid var(--c-border)',
          padding: '0.25rem 0.5rem',
          fontSize: '0.6rem', fontWeight: 800,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: Number(matchPct) >= 80 ? 'var(--c-accent)' : 'var(--c-charcoal)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {matchPct}% match
        </div>

        {!imgError ? (
          <img
            src={outfit.image_url}
            alt={`Look ${rank + 1}`}
            style={{ width: '100%', display: 'block' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{
            aspectRatio: '3/4', background: 'var(--c-cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '3rem', opacity: 0.4 }}>👗</span>
          </div>
        )}

        <button className="try-on-btn" onClick={onTryOn}>Virtual Try-On</button>
      </div>

      {/* ── CONTENT ─────────────────────────────── */}
      <div style={{ padding: '1rem 1.125rem 1.125rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
          <h4 style={{ fontFamily: 'var(--f-accent)', fontSize: '1.2rem', fontStyle: 'italic', textTransform: 'capitalize', color: 'var(--c-black)', lineHeight: 1.1 }}>
            {outfit.style} Ensemble
          </h4>
        </div>

        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>
          {outfit.brand || 'Designer'} · {outfit.actual_price || outfit.price_range}
          {outfit.occasion && ` · ${outfit.occasion}`}
        </p>

        {description && (
          <p style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--c-charcoal)', lineHeight: 1.65, marginBottom: '1rem', borderLeft: '2px solid var(--c-border)', paddingLeft: '0.625rem' }}>
            "{description}"
          </p>
        )}

        {/* Action links */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {outfit.product_url && (
            <a
              href={outfit.product_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--c-black)',
                textDecoration: 'none', borderBottom: '1.5px solid var(--c-black)',
                paddingBottom: '1px', transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--c-accent)'; e.currentTarget.style.borderColor = 'var(--c-accent)'; }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--c-black)'; e.currentTarget.style.borderColor = 'var(--c-black)'; }}
            >
              Shop the Look ↗
            </a>
          )}
          <button
            onClick={onShare}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: 'var(--c-black)',
              borderBottom: '1.5px solid var(--c-black)', paddingBottom: '1px',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--c-accent)'; e.currentTarget.style.borderColor = 'var(--c-accent)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--c-black)'; e.currentTarget.style.borderColor = 'var(--c-black)'; }}
          >
            Share Style
          </button>
        </div>

        {/* Technical toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: 'var(--c-muted)', padding: '0.375rem 0',
            borderTop: '1px solid var(--c-light)', textAlign: 'center',
            transition: 'color 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--c-black)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--c-muted)'}
        >
          <span style={{ display: 'inline-block', transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          {showDetails ? 'Hide Technical Data' : 'View Technical Data'}
        </button>

        {showDetails && (
          <div className="fade-in" style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <ScoreBar label="Visual Similarity"     value={scores.clip_similarity} />
            <ScoreBar label="Body Fit"              value={scores.body_match}       accent />
            <ScoreBar label="Color Harmony"         value={scores.skin_tone_match} />
            <ScoreBar label="Preference Alignment"  value={scores.pref_match} />

            {outfit.explanation && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--c-muted)', lineHeight: 1.6, fontStyle: 'italic', borderTop: '1px solid var(--c-light)', paddingTop: '0.625rem' }}>
                {outfit.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
