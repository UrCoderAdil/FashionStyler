import { useState, useCallback } from 'react';
import './index.css';

import UploadSection from './components/UploadSection';
import LoadingSpinner from './components/LoadingSpinner';
import AnalysisCard from './components/AnalysisCard';
import OutfitCard from './components/OutfitCard';
import PreferencesForm from './components/PreferencesForm';

const ANALYSIS_STEPS = [
  'Loading your photo...',
  'Detecting body landmarks...',
  'Analyzing skin tone...',
  'Computing visual embeddings...',
  'Applying preference filters...',
  'Ranking personalized outfits...',
];

const STATE = { IDLE: 'idle', LOADING: 'loading', RESULTS: 'results', ERROR: 'error' };

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [appState, setAppState] = useState(STATE.IDLE);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [preferences, setPreferences] = useState({
    style: '', occasion: '', budget: '', color_preference: '',
  });

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResults(null);
    setError('');
    if (appState === STATE.ERROR) setAppState(STATE.IDLE);
  }, [appState]);

  const handleAnalyze = async () => {
    if (!file) return;
    setAppState(STATE.LOADING);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 2) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1400);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Append non-empty preferences as form fields
      Object.entries(preferences).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setLoadingStep(ANALYSIS_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 600));
      setResults(data);
      setAppState(STATE.RESULTS);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Something went wrong. Please try again.');
      setAppState(STATE.ERROR);
    }
  };

  const handleReset = () => {
    setFile(null); setPreview(null); setResults(null);
    setError(''); setAppState(STATE.IDLE);
  };

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      <div className="relative z-10 flex flex-col items-center px-4 py-10 min-h-screen">

        {/* HEADER */}
        <header className="text-center mb-10 fade-in">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
            🤖 CLIP · MediaPipe · Hybrid AI
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">
            <span className="gradient-text">AI Personal</span><br />
            <span style={{ color: '#e2e8f0' }}>Stylist</span>
          </h1>
          <p className="text-base max-w-md mx-auto" style={{ color: '#64748b' }}>
            Upload your photo, set your preferences — get outfits made <em>just for you</em>.
          </p>
        </header>

        <main className="w-full max-w-5xl">

          {/* IDLE / ERROR */}
          {(appState === STATE.IDLE || appState === STATE.ERROR) && (
            <div className="flex flex-col gap-5 fade-in">
              <div className="glass-card p-6 md:p-8">
                <UploadSection onFileSelect={handleFileSelect} preview={preview} />
              </div>

              <PreferencesForm preferences={preferences} onChange={setPreferences} />

              {error && (
                <div className="p-4 rounded-xl text-sm border"
                  style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="flex justify-center">
                <button id="analyze-btn" className="btn-primary text-base px-10 py-3"
                  disabled={!file} onClick={handleAnalyze}>
                  ✨ Analyze My Style
                </button>
              </div>
            </div>
          )}

          {/* LOADING */}
          {appState === STATE.LOADING && (
            <div className="glass-card p-10 flex flex-col items-center fade-in">
              <LoadingSpinner steps={ANALYSIS_STEPS} currentStep={loadingStep} />
              <p className="mt-6 text-sm" style={{ color: '#64748b' }}>
                First run may take 10–30s while the AI warms up…
              </p>
            </div>
          )}

          {/* RESULTS */}
          {appState === STATE.RESULTS && results && (
            <div className="flex flex-col gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Photo */}
                <div className="glass-card p-6 flex flex-col items-center gap-4 fade-in">
                  <h2 className="text-lg font-semibold self-start" style={{ color: '#e2e8f0' }}>📷 Your Photo</h2>
                  <div className="rounded-2xl overflow-hidden glow-ring" style={{ width: '200px', height: '260px' }}>
                    <img src={preview} alt="Your photo" className="w-full h-full object-cover" />
                  </div>
                  {/* Preferences used */}
                  {Object.keys(results.preferences_used || {}).length > 0 && (
                    <div className="self-stretch">
                      <p className="text-xs font-semibold mb-2" style={{ color: '#64748b' }}>PREFERENCES APPLIED</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(results.preferences_used).map(([k, v]) => (
                          <span key={k} className="text-xs px-2 py-1 rounded-full"
                            style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                            {k.replace('_', ' ')}: <strong>{v}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Analysis */}
                <AnalysisCard features={results.features} />
              </div>

              {/* Recommendations */}
              <div className="fade-in fade-in-delay-1">
                <h2 className="text-xl font-bold mb-4 gradient-text">👗 Top Outfit Recommendations</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {results.recommendations.map((outfit, i) => (
                    <div key={i} className={`fade-in fade-in-delay-${Math.min(i + 1, 4)}`}>
                      <OutfitCard outfit={outfit} rank={i} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center fade-in fade-in-delay-4">
                <button id="reset-btn" className="btn-primary" onClick={handleReset}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}>
                  🔄 Try Another Photo
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-16 text-xs" style={{ color: '#334155' }}>
          AI Personal Stylist v2 · CLIP + MediaPipe · Hybrid Scoring
        </footer>
      </div>
    </div>
  );
}
