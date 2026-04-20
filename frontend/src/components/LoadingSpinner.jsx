export default function LoadingSpinner({ steps, currentStep }) {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Animated ring */}
      <div className="relative w-24 h-24">
        <svg
          className="w-full h-full animate-spin"
          style={{ animationDuration: '1.5s' }}
          viewBox="0 0 96 96"
          fill="none"
        >
          <circle
            cx="48" cy="48" r="40"
            stroke="rgba(139,92,246,0.15)"
            strokeWidth="6"
          />
          <path
            d="M48 8 A40 40 0 0 1 88 48"
            stroke="url(#spinGrad)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {steps.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div
              key={i}
              className="flex items-center gap-3 transition-all duration-500"
              style={{ opacity: i > currentStep ? 0.3 : 1 }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all duration-300"
                style={{
                  background: done
                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                    : active
                    ? 'rgba(139,92,246,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: active ? '1px solid #8b5cf6' : '1px solid transparent',
                }}
              >
                {done ? '✓' : active ? (
                  <span className="flex gap-0.5">
                    <span className="pulse-dot w-1 h-1 rounded-full bg-purple-400 inline-block" />
                    <span className="pulse-dot w-1 h-1 rounded-full bg-purple-400 inline-block" />
                    <span className="pulse-dot w-1 h-1 rounded-full bg-purple-400 inline-block" />
                  </span>
                ) : '○'}
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: done ? '#a78bfa' : active ? '#e2e8f0' : '#64748b' }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
