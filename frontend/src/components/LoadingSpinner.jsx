export default function LoadingSpinner({ steps, currentStep }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem', padding: '2rem 0' }}>

      {/* Page flip animation */}
      <div className="flip-loader">
        {['STYLE', 'AI', 'MODE'].map((word, i) => (
          <div key={word} className="flip-page" style={{ animationDelay: `${i * 0.28}s` }}>
            <span style={{ fontFamily: 'var(--f-accent)', fontStyle: i === 1 ? 'italic' : 'normal', fontSize: '1.5rem', letterSpacing: '0.05em' }}>
              {word}
            </span>
          </div>
        ))}
      </div>

      {/* Step tracker */}
      <div style={{ maxWidth: '320px', width: '100%' }}>
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--f-accent)', fontSize: '1.75rem', fontStyle: 'italic', color: 'var(--c-black)', marginBottom: '0.25rem' }}>
            Curating your look…
          </p>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--c-accent)' }}>
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="score-bar-track" style={{ marginBottom: '1.5rem', height: '2px' }}>
          <div
            className="score-bar-fill"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%`, transition: 'width 0.6s var(--ease-out)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isDone   = i < currentStep;
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.625rem',
                  fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'var(--c-black)' : isDone ? 'var(--c-border-dark)' : 'var(--c-light)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  transform: isActive ? 'translateX(6px)' : 'none',
                  transition: 'all 0.4s var(--ease-out)',
                  opacity: isDone ? 0.5 : 1,
                }}
              >
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'var(--c-accent)' : isDone ? 'var(--c-border-dark)' : 'var(--c-border)',
                  boxShadow: isActive ? '0 0 0 3px var(--c-accent-soft)' : 'none',
                  transition: 'all 0.3s ease',
                }} />
                {step}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
