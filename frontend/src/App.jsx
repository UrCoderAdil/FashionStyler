import { useState, useCallback } from 'react';
import './styles/magazine.css';

import UploadSection    from './components/UploadSection';
import LoadingSpinner   from './components/LoadingSpinner';
import AnalysisCard     from './components/AnalysisCard';
import OutfitCard       from './components/OutfitCard';
import PreferencesForm  from './components/PreferencesForm';
import ShareModal       from './components/ShareModal';

const ANALYSIS_STEPS = [
  'Analyzing your unique silhouette…',
  'Determining your seasonal color profile…',
  'Mapping body landmarks in 3D…',
  'Scanning aesthetic visual patterns…',
  'Matching against editorial collections…',
  'Curating your personalized lookbook…',
];

const STATE = { IDLE: 'idle', LOADING: 'loading', RESULTS: 'results', ERROR: 'error' };

export default function App() {
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [appState, setAppState]     = useState(STATE.IDLE);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults]       = useState(null);
  const [error, setError]           = useState('');
  const [preferences, setPreferences] = useState({ style: '', occasion: '', budget: '', color_preference: '' });
  const [tryOnImage, setTryOnImage] = useState(null);
  const [isTryOnLoading, setIsTryOnLoading] = useState(false);
  const [shareData, setShareData]   = useState(null);

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
    }, 1200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(preferences).forEach(([k, v]) => { if (v) formData.append(k, v); });

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
      setError(err.message || 'Analysis failed. Please try again.');
      setAppState(STATE.ERROR);
    }
  };

  const handleTryOn = async (outfitFilename) => {
    if (!file) return;
    setIsTryOnLoading(true);
    setTryOnImage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outfit_filename', outfitFilename);
      const res = await fetch('/api/virtual-tryon', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Try-on failed');
      const blob = await res.blob();
      setTryOnImage(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      alert('Virtual try-on unavailable for this image.');
    } finally {
      setIsTryOnLoading(false);
    }
  };

  const handleShare = async (outfit) => {
    if (!file || !results) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outfit_filename', outfit.filename);
      formData.append('body_type', results.features.body_type);
      formData.append('color_season', results.features.color_season);
      formData.append('match_score', outfit.final_score);
      formData.append('style', outfit.style);
      formData.append('occasion', outfit.occasion);
      const res = await fetch('/api/share-card', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Share card failed');
      const data = await res.json();
      setShareData(data.share_card);
    } catch (err) {
      console.error(err);
      alert('Could not generate share card.');
    }
  };

  const handleReset = () => {
    setFile(null); setPreview(null); setResults(null);
    setError(''); setAppState(STATE.IDLE);
    setTryOnImage(null); setShareData(null);
  };

  return (
    <div className="magazine-container">

      {/* ── MASTHEAD ─────────────────────────────────── */}
      <header className="masthead">
        <p className="masthead-date">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} &nbsp;·&nbsp; Issue 001
        </p>
        <h1 className="masthead-title">STYLE AI</h1>
        <p className="masthead-subtitle">The Editorial Lookbook</p>
      </header>

      <main>

        {/* ── IDLE / ERROR ─────────────────────────── */}
        {(appState === STATE.IDLE || appState === STATE.ERROR) && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <div style={{ maxWidth: '640px', width: '100%' }}>

              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--c-border)' }} />
                <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--c-muted)', whiteSpace: 'nowrap' }}>
                  Begin Your Session
                </h2>
                <div style={{ flex: 1, height: '1px', background: 'var(--c-border)' }} />
              </div>

              {/* Upload */}
              <div className="polaroid-frame" style={{ marginBottom: '2rem' }}>
                <UploadSection onFileSelect={handleFileSelect} preview={preview} />
              </div>

              {/* Preferences */}
              <PreferencesForm preferences={preferences} onChange={setPreferences} />

              {/* Error banner */}
              {error && (
                <div className="error-banner fade-in" style={{ marginTop: '1.25rem' }}>
                  <span style={{ fontSize: '1rem' }}>⚠</span>
                  {error}
                </div>
              )}

              {/* CTA */}
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <button
                  className="btn-editorial"
                  style={{ fontSize: '0.8rem', padding: '1rem 3rem', minWidth: '220px' }}
                  disabled={!file}
                  onClick={handleAnalyze}
                >
                  Create My Lookbook
                </button>
              </div>

              {/* Hint text */}
              {!file && (
                <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Upload a photo to continue
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── LOADING ──────────────────────────────── */}
        {appState === STATE.LOADING && (
          <div style={{ padding: '5rem 0', textAlign: 'center' }}>
            <LoadingSpinner steps={ANALYSIS_STEPS} currentStep={loadingStep} />
          </div>
        )}

        {/* ── RESULTS ──────────────────────────────── */}
        {appState === STATE.RESULTS && results && (
          <div className="fade-in">

            {/* Back / session info strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--c-border)' }}>
              <button
                onClick={handleReset}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--c-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--c-black)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--c-muted)'}
              >
                ← New Session
              </button>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--c-muted)' }}>
                {results.recommendations?.length ?? 0} looks curated
              </span>
            </div>

            {/* Two-page spread */}
            <div className="editorial-spread">

              {/* PAGE 1 — PROFILE */}
              <div className="page page-left fade-in-delay-1">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', paddingBottom: '0.625rem', borderBottom: '2px solid var(--c-black)' }}>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
                    PROFILE
                  </h2>
                  <span className="page-number">P. 01</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="polaroid-frame" style={{ alignSelf: 'start' }}>
                    <img src={preview} alt="Your photo" style={{ width: '100%', display: 'block' }} />
                  </div>
                  <AnalysisCard features={results.features} />
                </div>

                {/* Fitting Room */}
                {tryOnImage && (
                  <div className="fitting-room fade-in">
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>
                      The Fitting Room
                    </p>
                    <img src={tryOnImage} alt="Virtual Try-On" style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'contain' }} />
                  </div>
                )}

                {isTryOnLoading && (
                  <div className="fitting-room-loading fade-in">
                    <span style={{ fontSize: '1.25rem' }}>👗</span>
                    <p style={{ fontFamily: 'var(--f-accent)', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--c-charcoal)' }}>
                      Adjusting the garments to your frame…
                    </p>
                  </div>
                )}
              </div>

              {/* PAGE 2 — COLLECTION */}
              <div className="page fade-in-delay-2">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', paddingBottom: '0.625rem', borderBottom: '2px solid var(--c-black)' }}>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
                    COLLECTION
                  </h2>
                  <span className="page-number">P. 02</span>
                </div>

                <div style={{ columns: '1', gap: '0' }}>
                  {results.recommendations.map((outfit, i) => (
                    <OutfitCard
                      key={i}
                      outfit={outfit}
                      rank={i}
                      onTryOn={() => handleTryOn(outfit.filename)}
                      onShare={() => handleShare(outfit)}
                    />
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <button className="btn-editorial" style={{ fontSize: '0.7rem' }} onClick={handleReset}>
                    Start New Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── SHARE MODAL ─────────────────────────────── */}
      {shareData && <ShareModal base64={shareData} onClose={() => setShareData(null)} />}

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '1px solid var(--c-black)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--f-accent)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--c-black)', marginBottom: '0.5rem' }}>
          Fin.
        </p>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--c-muted)' }}>
          © {new Date().getFullYear()} Style AI Magazine · All looks curated by artificial intelligence
        </p>
      </footer>

    </div>
  );
}
