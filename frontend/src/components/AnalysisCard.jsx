function Swatch({ hex, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-full aspect-square border border-gray-200" style={{ backgroundColor: hex }} title={label || hex} />
      {label && <span className="text-[8px] uppercase tracking-tighter text-gray-400">{label}</span>}
    </div>
  );
}

export default function AnalysisCard({ features }) {
  const { 
    body_type = 'unknown', 
    body_confidence = 0,
    color_season = 'unknown',
    color_confidence = 0,
    color_palette = {},
    style_tips = {},
    undertone = 'unknown',
    color_value = 'unknown',
    color_chroma = 'unknown'
  } = features;

  const seasonName = color_season.replace('_', ' ');

  return (
    <div className="flex flex-col gap-6 font-body">
      {/* BODY TYPE */}
      <section>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Body Architecture</label>
          <span className="text-[10px] text-gray-400">Confidence: {(body_confidence * 100).toFixed(0)}%</span>
        </div>
        <h3 className="font-accent text-3xl capitalize italic mb-2">{body_type.replace('_', ' ')}</h3>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{style_tips.description}</p>
        
        <div className="grid grid-cols-1 gap-2">
          <div className="bg-gray-50 p-3 border border-gray-100">
            <h4 className="text-[10px] font-bold uppercase mb-2 text-black">Editorial Tips</h4>
            <ul className="text-xs space-y-1 list-disc pl-4 text-gray-600">
              {style_tips.recommended?.map((tip, i) => (
                <li key={i}><strong className="text-gray-900">Do:</strong> {tip}</li>
              ))}
              {style_tips.avoid?.map((tip, i) => (
                <li key={i}><span className="text-gray-400 italic">Avoid {tip}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* COLOR SEASON */}
      <section className="pt-6 border-t border-gray-100">
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Chromatic Season</label>
          <span className="text-[10px] text-gray-400">Match: {(color_confidence * 100).toFixed(0)}%</span>
        </div>
        <h3 className="font-accent text-3xl capitalize italic mb-2">{seasonName}</h3>
        
        <div className="flex gap-4 text-[10px] uppercase font-bold text-gray-400 mb-4">
          <span>{undertone} Undertone</span>
          <span>•</span>
          <span>{color_value} Value</span>
          <span>•</span>
          <span>{color_chroma} Chroma</span>
        </div>

        <p className="text-xs text-gray-600 italic mb-4">{color_palette.description}</p>

        {/* SWATCHES */}
        {color_palette.best_colors && (
          <div>
            <h4 className="text-[10px] font-bold uppercase mb-2 text-black">Best Palette Swatches</h4>
            <div className="grid grid-cols-6 gap-2">
              {color_palette.best_colors.map((hex, i) => (
                <Swatch key={i} hex={hex} />
              ))}
            </div>
          </div>
        )}

        {/* METALS / MAKEUP */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-[10px] font-bold uppercase mb-1 text-black">Best Metals</h4>
            <p className="text-[10px] text-gray-600 capitalize">{color_palette.metals?.join(', ')}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase mb-1 text-black">Beauty Pulse</h4>
            <p className="text-[10px] text-gray-600">{color_palette.makeup_tips}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
