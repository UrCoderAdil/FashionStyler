import { useEffect, useState } from 'react';

/* Neural network node positions (cx, cy) in a 200×200 grid */
const NODES = [
  // Input layer
  { x: 30,  y: 40,  layer: 0 },
  { x: 30,  y: 100, layer: 0 },
  { x: 30,  y: 160, layer: 0 },
  // Hidden layer 1
  { x: 90,  y: 30,  layer: 1 },
  { x: 90,  y: 80,  layer: 1 },
  { x: 90,  y: 130, layer: 1 },
  { x: 90,  y: 175, layer: 1 },
  // Hidden layer 2
  { x: 150, y: 55,  layer: 2 },
  { x: 150, y: 110, layer: 2 },
  { x: 150, y: 160, layer: 2 },
  // Output
  { x: 200, y: 100, layer: 3 },
];

const EDGES = [
  // input → h1
  [0,3],[0,4],[0,5],[0,6],
  [1,3],[1,4],[1,5],[1,6],
  [2,3],[2,4],[2,5],[2,6],
  // h1 → h2
  [3,7],[3,8],[4,7],[4,8],[4,9],
  [5,7],[5,8],[5,9],[6,8],[6,9],
  // h2 → output
  [7,10],[8,10],[9,10],
];

function NeuralGraph({ step }) {
  const [lit, setLit] = useState(new Set());

  useEffect(() => {
    // Animate nodes lighting up based on loading step
    const maxLit = Math.floor((step / 5) * NODES.length);
    const next = new Set(Array.from({ length: maxLit }, (_, i) => i));
    setLit(next);
  }, [step]);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const accent = isDark ? '#e8274a' : '#8b1a2e';
  const dimEdge = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const litEdge = isDark ? 'rgba(232,39,74,0.4)' : 'rgba(139,26,46,0.3)';
  const dimNode = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <svg viewBox="0 0 230 200" width="230" height="200" style={{ overflow: 'visible' }}>
      {/* Edges */}
      {EDGES.map(([a, b], i) => {
        const na = NODES[a], nb = NODES[b];
        const isLit = lit.has(a) && lit.has(b);
        return (
          <line
            key={i}
            x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
            stroke={isLit ? litEdge : dimEdge}
            strokeWidth={isLit ? 1.5 : 0.8}
            style={{ transition: 'stroke 0.4s ease, stroke-width 0.4s ease' }}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map((n, i) => {
        const isLit = lit.has(i);
        return (
          <g key={i}>
            {isLit && (
              <circle
                cx={n.x} cy={n.y} r="9"
                fill={`${accent}22`}
                style={{ animation: 'ripple 1.5s infinite' }}
              />
            )}
            <circle
              cx={n.x} cy={n.y} r="5"
              fill={isLit ? accent : dimNode}
              stroke={isLit ? accent : 'transparent'}
              strokeWidth="1"
              style={{ transition: 'fill 0.4s ease', filter: isLit ? `drop-shadow(0 0 4px ${accent})` : 'none' }}
            />
          </g>
        );
      })}

      {/* Layer labels */}
      {[
        { x: 30,  label: 'Input' },
        { x: 90,  label: 'Feature' },
        { x: 150, label: 'Match' },
        { x: 200, label: 'Score' },
      ].map(({ x, label }) => (
        <text
          key={label}
          x={x} y="195"
          textAnchor="middle"
          fontSize="7"
          fill="var(--c-muted)"
          fontFamily="var(--f-mono)"
          letterSpacing="0.5"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

export default function LoadingSpinner({ steps, currentStep }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const iv = setInterval(() => setDots((d) => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(iv);
  }, []);

  const pct = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', padding: '2rem 0' }}>

      {/* Neural graph */}
      <div style={{ position: 'relative' }}>
        <NeuralGraph step={currentStep} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
        </div>
      </div>

      {/* Status */}
      <div style={{ maxWidth: '360px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: 'var(--f-accent)', fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--c-black)', marginBottom: '0.375rem' }}>
            Analyzing{dots}
          </p>
          <div style={{ display: 'flex', align: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--c-accent)' }}>
              {pct}%
            </span>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)' }}>
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="score-bar-track" style={{ marginBottom: '1.5rem', height: '3px' }}>
          <div
            className="score-bar-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, var(--c-accent), var(--c-gold))`,
              transition: 'width 0.6s var(--ease-out)',
            }}
          />
        </div>

        {/* Step list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  fontSize: '0.7rem',
                  fontFamily: isDone || isActive ? 'var(--f-mono)' : 'var(--f-body)',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'var(--c-black)' : isDone ? 'var(--c-border-dark)' : 'var(--c-light)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  transform: isActive ? 'translateX(6px)' : 'none',
                  transition: 'all 0.4s var(--ease-out)',
                  opacity: isDone ? 0.5 : 1,
                  letterSpacing: isActive ? '0.02em' : 'normal',
                }}
              >
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'var(--c-accent)' : isDone ? 'var(--c-border-dark)' : 'var(--c-border)',
                  boxShadow: isActive ? '0 0 0 3px var(--c-accent-soft)' : 'none',
                  transition: 'all 0.3s ease',
                }} />
                {isDone ? `✓ ${step}` : step}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
