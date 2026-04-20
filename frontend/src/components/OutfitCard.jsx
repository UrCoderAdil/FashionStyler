import { useState } from 'react';

function ScoreBar({ label, value, color }) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <div>
      <div className="flex justify-between text-[8px] uppercase font-bold mb-1" style={{ color: '#999' }}>
        <span>{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-[2px] w-full bg-gray-100">
        <div className="h-full bg-black transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function OutfitCard({ outfit, rank, onTryOn, onShare }) {
  const [showDetails, setShowDetails] = useState(false);
  const [imgError, setImgError] = useState(false);

  const scores = outfit.scores || {};

  return (
    <div className="outfit-card-magazine mb-8">
      <div className="card-image-wrap group">
        <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-accent italic text-sm">
          {rank + 1}
        </div>
        
        {!imgError ? (
          <img 
            src={outfit.image_url} 
            alt={`Look ${rank + 1}`} 
            className="w-full grayscale-[10%] group-hover:grayscale-0 transition-all duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center text-gray-300">
            <span className="text-4xl">👗</span>
          </div>
        )}

        <button className="try-on-btn" onClick={onTryOn}>Virtual Try-On</button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-accent text-xl italic capitalize">{outfit.style} Ensemble</h4>
          <span className="text-[10px] font-bold text-red-600">{(outfit.final_score * 100).toFixed(0)}% MATCH</span>
        </div>
        
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">
          {outfit.brand || 'Designer'} · {outfit.actual_price || outfit.price_range}
        </p>

        <p className="text-xs text-gray-600 leading-relaxed italic mb-4">
          "{outfit.description || outfit.explanation.split('\n')[0].replace('Recommended because:', '').trim()}"
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {outfit.product_url && (
            <a 
              href={outfit.product_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-0.5 hover:text-red-700 hover:border-red-700 transition-colors"
            >
              Shop the Look
            </a>
          )}
          <button 
            onClick={onShare}
            className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-0.5 hover:text-red-700 hover:border-red-700 transition-colors"
          >
            Share Style
          </button>
        </div>

        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-center text-[9px] uppercase font-bold tracking-widest text-gray-400 py-1 hover:text-black transition-colors"
        >
          {showDetails ? 'Hide Technical Data' : 'View Technical Data'}
        </button>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 fade-in">
            <ScoreBar label="Visual Similarity" value={scores.clip_similarity} color="#000" />
            <ScoreBar label="Body Fit" value={scores.body_match} color="#C41E3A" />
            <ScoreBar label="Color Harmony" value={scores.skin_tone_match} color="#D4AF37" />
            <ScoreBar label="Preference Alignment" value={scores.pref_match} color="#666" />
            
            <div className="mt-2 text-[10px] text-gray-500 leading-tight">
              {outfit.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
