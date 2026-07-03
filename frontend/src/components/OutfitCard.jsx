import { useState, useRef, useCallback } from 'react';
import RadarChart from './RadarChart';

function getMatchTier(score) {
  if (score >= 0.85) return { tier: 'tier-perfect', label: 'Perfect Match', color: '#22c55e' };
  if (score >= 0.70) return { tier: 'tier-strong',  label: 'Strong Match',  color: '#60a5fa' };
  if (score >= 0.55) return { tier: 'tier-good',    label: 'Good Match',    color: 'var(--c-gold)' };
  return               { tier: 'tier-decent', label: 'Decent Match',  color: 'var(--c-muted)' };
}

function AnimatedBar({ value, color = 'var(--c-black)' }) {
  const pct = Math.min(1, Math.max(0, value ?? 0)) * 100;
  return (
    <div className="score-bar-track">
      <div
        className="score-bar-fill"
        style={{ width: `${pct}%`, background: color, transition: 'width 1s var(--ease-out)' }}
      />
    </div>
  );
}

export default function OutfitCard({ outfit, rank, isFav, onToggleFav, onTryOn, onShare }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef(null);

  const scores = outfit.scores || {};
  const matchPct = ((outfit.final_score || 0) * 100).toFixed(0);
  const { tier, label: tierLabel, color: tierColor } = getMatchTier(outfit.final_score || 0);

  const description =
    outfit.description ||
    outfit.explanation?.split('\n')[0]?.replace('Recommended because:', '').trim();

  /* ── 3D tilt effect ───────────────────────── */
  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0)';
    card.style.transition = 'transform 0.4s var(--ease-out)';
  }, []);

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (card) card.style.transition = 'transform 0.05s ease';
  }, []);

  return (
    <div
      ref={cardRef}
      className={`outfit-card-magazine ${tier}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{ transformStyle: 'preserve-3d' }}
    >

      {/* ── IMAGE ─────────────────────────── */}
      <div className="card-image-wrap">
        <div className="card-rank-badge">{rank + 1}</div>

        <div className={`match-badge ${tier}`}>
          {matchPct}% · {tierLabel}
        </div>

        {/* Favorites */}
        <button
          className={`fav-btn ${isFav ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          title={isFav ? 'Remove from saved' : 'Save look'}
          style={{ top: '2.5rem' }}
        >
          {isFav ? '♥' : '♡'}
        </button>

        {!imgError ? (
          <img
            src={outfit.image_url}
            alt={`Look ${rank + 1}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--c-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem', opacity: 0.3 }}>👗</span>
          </div>
        )}

        <button className="try-on-btn" onClick={onTryOn}>Virtual Try-On →</button>
      </div>

      {/* ── CONTENT ───────────────────────── */}
      <div style={{ padding: '1rem 1.125rem 1.125rem' }}>

        <div style={{ marginBottom: '0.25rem' }}>
          <h4 style={{ fontFamily: 'var(--f-accent)', fontSize: '1.1rem', fontStyle: 'italic', textTransform: 'capitalize', color: 'var(--c-black)', lineHeight: 1.2 }}>
            {outfit.style} Ensemble
          </h4>
        </div>

        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>
          {outfit.brand || 'Designer'} · {outfit.actual_price || outfit.price_range}
          {outfit.occasion && ` · ${outfit.occasion}`}
        </p>

        {description && (
          <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--c-charcoal)', lineHeight: 1.6, marginBottom: '0.875rem', borderLeft: '2px solid var(--c-accent)', paddingLeft: '0.625rem' }}>
            "{description}"
          </p>
        )}

        {/* Main score bar */}
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)' }}>Overall Match</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: tierColor, fontFamily: 'var(--f-mono)' }}>{matchPct}%</span>
          </div>
          <AnimatedBar value={outfit.final_score} color={tierColor} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {outfit.product_url && (
            <a
              href={outfit.product_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-black)', textDecoration: 'none', borderBottom: '1.5px solid var(--c-black)', paddingBottom: '1px', transition: 'color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--c-accent)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--c-black)'}
            >
              Shop ↗
            </a>
          )}
          <button
            onClick={onShare}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-black)', borderBottom: '1.5px solid var(--c-black)', paddingBottom: '1px', transition: 'color 0.15s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--c-accent)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--c-black)'}
          >
            Share
          </button>
          <button
            onClick={() => { setShowRadar(!showRadar); setShowDetails(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: showRadar ? 'var(--c-accent)' : 'var(--c-muted)', borderBottom: `1.5px solid ${showRadar ? 'var(--c-accent)' : 'var(--c-muted)'}`, paddingBottom: '1px', transition: 'color 0.15s' }}
          >
            ⬡ Radar
          </button>
        </div>

        {/* Radar chart */}
        {showRadar && (
          <div className="fade-in" style={{ marginBottom: '0.875rem', display: 'flex', justifyContent: 'center' }}>
            <RadarChart scores={scores} size={160} />
          </div>
        )}

        {/* Technical scores toggle */}
        <button
          onClick={() => { setShowDetails(!showDetails); setShowRadar(false); }}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em',
            color: 'var(--c-muted)', padding: '0.375rem 0',
            borderTop: '1px solid var(--c-border)', textAlign: 'center',
            transition: 'color 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--c-black)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--c-muted)'}
        >
          <span style={{ display: 'inline-block', transform: showDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          {showDetails ? 'Hide Score Breakdown' : 'Score Breakdown'}
        </button>

        {showDetails && (
          <div className="fade-in" style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { label: 'Visual Similarity',  key: 'clip_similarity', color: '#60a5fa' },
              { label: 'Body Fit',            key: 'body_match',      color: '#22c55e' },
              { label: 'Color Harmony',       key: 'skin_tone_match', color: 'var(--c-gold)' },
              { label: 'Style Preference',    key: 'pref_match',      color: 'var(--c-accent)' },
            ].map(({ label, key, color }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--c-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color, fontFamily: 'var(--f-mono)' }}>
                    {((scores[key] ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <AnimatedBar value={scores[key]} color={color} />
              </div>
            ))}

            {outfit.explanation && (
              <p style={{ marginTop: '0.375rem', fontSize: '0.7rem', color: 'var(--c-muted)', lineHeight: 1.6, fontStyle: 'italic', borderTop: '1px solid var(--c-border)', paddingTop: '0.625rem' }}>
                {outfit.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
