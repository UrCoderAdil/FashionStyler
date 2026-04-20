import { useRef, useState } from 'react';

const BODY_ICON = '🏋️';
const SKIN_ICON = '🎨';

const bodyLabels = {
  broad_shoulders: 'Broad Shoulders',
  wide_hips: 'Wide Hips',
  balanced: 'Balanced / Athletic',
  unknown: 'Unknown',
};

const skinLabels = {
  warm: 'Warm Skin Tone',
  cool: 'Cool Skin Tone',
  unknown: 'Unknown',
};

const bodyTips = {
  broad_shoulders: 'V-neck tops & straight-cut trousers will look great on you!',
  wide_hips: 'High-waist fits and A-line cuts balance your silhouette perfectly.',
  balanced: 'Lucky you — almost any silhouette works! Tailored and structured fits are 🔥',
  unknown: "We couldn't detect a body type — try a clearer full-body photo.",
};

const skinTips = {
  warm: 'Earthy tones — beige, terracotta, olive, mustard — are your best friends.',
  cool: 'Jewel tones — cobalt blue, emerald, deep plum — make your complexion pop.',
  unknown: "We couldn't detect skin tone — try a photo with better lighting.",
};

export default function AnalysisCard({ features }) {
  const body = features.body_type || 'unknown';
  const skin = features.skin_tone || 'unknown';

  return (
    <div className="glass-card p-6 fade-in">
      <h2 className="text-lg font-semibold mb-5" style={{ color: '#e2e8f0' }}>
        ✨ Your Style Profile
      </h2>
      <div className="flex flex-wrap gap-3 mb-5">
        <span className="feature-badge">
          <span>{BODY_ICON}</span>
          <span>{bodyLabels[body] || body}</span>
        </span>
        <span
          className="feature-badge"
          style={{
            background: 'rgba(236,72,153,0.1)',
            borderColor: 'rgba(236,72,153,0.3)',
          }}
        >
          <span>{SKIN_ICON}</span>
          <span>{skinLabels[skin] || skin}</span>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <div
          className="rounded-xl p-4 text-sm leading-relaxed"
          style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          <span className="font-semibold" style={{ color: '#a78bfa' }}>Body Type Tip: </span>
          {bodyTips[body]}
        </div>
        <div
          className="rounded-xl p-4 text-sm leading-relaxed"
          style={{ background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.15)' }}
        >
          <span className="font-semibold" style={{ color: '#f472b6' }}>Skin Tone Tip: </span>
          {skinTips[skin]}
        </div>
      </div>
    </div>
  );
}
