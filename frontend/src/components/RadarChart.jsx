import { useEffect, useRef } from 'react';

const AXES = [
  { key: 'clip_similarity', label: 'Visual Match' },
  { key: 'body_match',      label: 'Body Fit' },
  { key: 'skin_tone_match', label: 'Color Harmony' },
  { key: 'pref_match',      label: 'Style Fit' },
];

function polarToXY(angle, radius, cx, cy) {
  return {
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  };
}

export default function RadarChart({ scores = {}, size = 200 }) {
  const pathRef = useRef(null);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.72;
  const step = (Math.PI * 2) / AXES.length;
  const levels = 4;

  const vals = AXES.map((a) => Math.min(1, Math.max(0, scores[a.key] ?? 0)));

  // Build polygon points for the data
  const dataPoints = AXES.map((_, i) => {
    const angle = i * step;
    const r = vals[i] * maxR;
    return polarToXY(angle, r, cx, cy);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z';

  // Animate on mount
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength?.() ?? 200;
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)';
      el.style.strokeDashoffset = '0';
    });
  }, [dataPath]);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const accentColor  = isDark ? '#e8274a' : '#8b1a2e';
  const gridColor    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const axisColor    = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const textColor    = isDark ? '#6b7280' : '#888';
  const fillColor    = isDark ? 'rgba(232,39,74,0.12)' : 'rgba(139,26,46,0.08)';

  return (
    <div className="radar-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Level rings */}
        {Array.from({ length: levels }, (_, i) => {
          const r = (maxR * (i + 1)) / levels;
          const pts = AXES.map((_, j) => {
            const { x, y } = polarToXY(j * step, r, cx, cy);
            return `${x.toFixed(2)},${y.toFixed(2)}`;
          }).join(' ');
          return (
            <polygon
              key={i}
              points={pts}
              fill="none"
              stroke={gridColor}
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const end = polarToXY(i * step, maxR, cx, cy);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={end.x.toFixed(2)} y2={end.y.toFixed(2)}
              stroke={axisColor}
              strokeWidth="1"
            />
          );
        })}

        {/* Data fill */}
        <polygon
          points={dataPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
          fill={fillColor}
        />

        {/* Data outline */}
        <path
          ref={pathRef}
          d={dataPath}
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data nodes */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={accentColor} opacity="0.9" />
        ))}

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const labelR = maxR + 20;
          const { x, y } = polarToXY(i * step, labelR, cx, cy);
          const pct = (vals[i] * 100).toFixed(0);
          return (
            <g key={i}>
              <text
                x={x.toFixed(2)}
                y={(y - 2).toFixed(2)}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                textTransform="uppercase"
                fill={textColor}
                letterSpacing="0.5"
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {axis.label}
              </text>
              <text
                x={x.toFixed(2)}
                y={(y + 8).toFixed(2)}
                textAnchor="middle"
                fontSize="7"
                fontWeight="600"
                fill={accentColor}
              >
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)', marginTop: '0.25rem' }}>
        ML Score Profile
      </p>
    </div>
  );
}
