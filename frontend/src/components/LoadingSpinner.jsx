export default function LoadingSpinner({ steps, currentStep }) {
  return (
    <div className="flex flex-col items-center gap-12">
      {/* MAG PAGE FLIP ANIMATION */}
      <div className="flip-loader">
        <div className="flip-page">
          <span className="text-4xl">STYLE</span>
        </div>
        <div className="flip-page" style={{ animationDelay: '0.2s' }}>
          <span className="text-4xl italic">AI</span>
        </div>
        <div className="flip-page" style={{ animationDelay: '0.4s' }}>
          <span className="text-4xl font-bold">MODE</span>
        </div>
      </div>

      <div className="max-w-xs transition-all duration-500">
        <p className="font-accent text-3xl italic mb-2">Analyzing...</p>
        <p className="text-sm font-bold uppercase tracking-widest text-red-600 mb-6 drop-shadow-sm">
          Step {currentStep + 1} of {steps.length}
        </p>
        
        <div className="flex flex-col gap-1">
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div 
                key={i} 
                className={`text-[10px] uppercase tracking-widest transition-all duration-500 flex items-center gap-2 ${
                  isActive ? 'text-black font-bold scale-105' : 
                  isDone ? 'text-gray-300 line-through' : 'text-gray-200'
                }`}
              >
                <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-red-600' : isDone ? 'bg-gray-300' : 'bg-gray-200'}`} />
                {step}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
