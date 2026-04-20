import { useState } from 'react';

function ScoreBar({ label, value, color }) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
        <span>{label}</span>
        <span style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const TAG_COLORS = {
  casual:     '#8b5cf6',
  formal:     '#06b6d4',
  streetwear: '#ec4899',
  warm:       '#f59e0b',
  cool:       '#3b82f6',
  neutral:    '#64748b',
  low:        '#22c55e',
  medium:     '#f59e0b',
  high:       '#ef4444',
};

function Tag({ value }) {
  const color = TAG_COLORS[value] ?? '#64748b';
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {value}
    </span>
  );
}

export default function OutfitCard({ outfit, rank }) {
  const [imgError, setImgError] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
  const scores = outfit.scores || {};

  return (
    <div className="outfit-card flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ height: '220px', background: 'rgba(255,255,255,0.03)' }}>
        {!imgError ? (
          <img src={outfit.image_url} alt={`Outfit ${rank + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: '#64748b' }}>
            <span className="text-4xl">👗</span>
            <span className="text-xs">Image unavailable</span>
          </div>
        )}
        {/* Rank */}
        <div className="absolute top-2 left-2 text-base px-2 py-0.5 rounded-lg"
          style={{ background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(8px)' }}>
          {medal}
        </div>
        {/* Final score chip */}
        <div className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: 'white' }}>
          {(outfit.final_score * 100).toFixed(1)}%
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-3 flex-grow">
        {/* Metadata tags */}
        <div className="flex flex-wrap gap-1">
          {[outfit.style, outfit.color, outfit.fit, outfit.price_range].filter(Boolean).map((v) => (
            <Tag key={v} value={v} />
          ))}
        </div>

        {/* Score bars */}
        <div className="flex flex-col gap-1.5">
          <ScoreBar label="Visual Match"  value={scores.clip_similarity ?? 0} color="#a78bfa" />
          <ScoreBar label="Body Fit"      value={scores.body_match      ?? 0} color="#34d399" />
          <ScoreBar label="Skin Tone"     value={scores.skin_tone_match ?? 0} color="#f472b6" />
          <ScoreBar label="Your Style"    value={scores.pref_match      ?? 0} color="#facc15" />
        </div>

        {/* Explanation toggle */}
        {outfit.explanation && (
          <div>
            <button
              className="text-xs font-medium flex items-center gap-1 transition-colors duration-200"
              style={{ color: showExplanation ? '#a78bfa' : '#475569' }}
              onClick={() => setShowExplanation((v) => !v)}
            >
              {showExplanation ? '▾' : '▸'} Why this outfit?
            </button>
            {showExplanation && (
              <div className="mt-2 text-xs leading-relaxed rounded-lg p-3 whitespace-pre-line"
                style={{ background: 'rgba(139,92,246,0.07)', color: '#94a3b8', border: '1px solid rgba(139,92,246,0.15)' }}>
                {outfit.explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
