import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import './styles/magazine.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(useGSAP);

import ParticleBackground from './components/ParticleBackground';
import UploadSection      from './components/UploadSection';
import LoadingSpinner     from './components/LoadingSpinner';
import AnalysisCard       from './components/AnalysisCard';
import OutfitCard         from './components/OutfitCard';
import PreferencesForm    from './components/PreferencesForm';
import ShareModal         from './components/ShareModal';
import FilterBar          from './components/FilterBar';

const ANALYSIS_STEPS = [
  'Extracting CLIP visual embeddings…',
  'Running MediaPipe pose detection…',
  'Classifying body architecture…',
  'Analyzing seasonal color profile…',
  'Computing cosine similarity matrix…',
  'Ranking & diversifying results…',
];

const STATE = { IDLE: 'idle', LOADING: 'loading', RESULTS: 'results', ERROR: 'error' };

const TECH_TAGS = ['CLIP · ViT-B/32', 'MediaPipe Pose', 'LAB Color Analysis', 'FastAPI', 'React', 'PyTorch'];

function getStyleDNA(features) {
  if (!features) return null;
  const bodyCode = (features.body_type || 'UNK').slice(0, 3).toUpperCase();
  const seasonCode = (features.color_season || 'UNK').replace('_', '').slice(0, 4).toUpperCase();
  const toneCode = (features.undertone || 'N').slice(0, 1).toUpperCase();
  return `${bodyCode}-${seasonCode}-${toneCode}`;
}

export default function App() {
  /* ── Theme ────────────────────────────────── */
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : false;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const containerRef = useRef();


  /* ── Core State ───────────────────────────── */
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [appState, setAppState] = useState(STATE.IDLE);
  const [loadingStep, setStep]  = useState(0);
  const [results, setResults]   = useState(null);
  const [error, setError]       = useState('');
  const [preferences, setPrefs] = useState({ style: '', occasion: '', budget: '', color_preference: '' });
  const [tryOnImage, setTryOn]  = useState(null);
  const [isTryOnLoading, setTryOnLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [processingMs, setMs]   = useState(null);

  useGSAP(() => {
    if (appState === STATE.RESULTS) {
      gsap.fromTo('.gsap-stagger-item', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
      gsap.fromTo('.editorial-spread', 
        { opacity: 0, scale: 0.98 }, 
        { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out' }
      );
    } else if (appState === STATE.IDLE || appState === STATE.ERROR) {
      gsap.fromTo('.gsap-reveal', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.1 }
      );
    }
  }, { dependencies: [appState], scope: containerRef });

  /* ── Favorites ────────────────────────────── */
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('favorites') || '[]')); }
    catch { return new Set(); }
  });

  const toggleFav = useCallback((filename) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(filename) ? next.delete(filename) : next.add(filename);
      localStorage.setItem('favorites', JSON.stringify([...next]));
      return next;
    });
  }, []);

  /* ── Filter / Sort State ──────────────────── */
  const [sort, setSort]             = useState('match');
  const [styleFilter, setStyleFilter] = useState('');
  const [occFilter, setOccFilter]   = useState('');
  const [showFavs, setShowFavs]     = useState(false);
  const [topN, setTopN]             = useState(5);

  /* ── Derived: filtered + sorted recommendations ── */
  const allRecs = results?.recommendations ?? [];

  const filteredRecs = useMemo(() => {
    let recs = [...allRecs];

    if (showFavs)       recs = recs.filter((r) => favorites.has(r.filename));
    if (styleFilter)    recs = recs.filter((r) => r.style === styleFilter);
    if (occFilter)      recs = recs.filter((r) => r.occasion === occFilter);

    const sortMap = {
      match:  (a, b) => b.final_score - a.final_score,
      visual: (a, b) => (b.scores?.clip_similarity ?? 0) - (a.scores?.clip_similarity ?? 0),
      body:   (a, b) => (b.scores?.body_match ?? 0) - (a.scores?.body_match ?? 0),
      color:  (a, b) => (b.scores?.skin_tone_match ?? 0) - (a.scores?.skin_tone_match ?? 0),
    };

    recs.sort(sortMap[sort] ?? sortMap.match);
    return recs;
  }, [allRecs, sort, styleFilter, occFilter, showFavs, favorites]);

  /* ── File Select ──────────────────────────── */
  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResults(null);
    setError('');
    if (appState === STATE.ERROR) setAppState(STATE.IDLE);
  }, [appState]);

  /* ── Analyze ──────────────────────────────── */
  const handleAnalyze = async () => {
    if (!file) return;
    setAppState(STATE.LOADING);
    setStep(0);
    setMs(null);

    const stepInterval = setInterval(() => {
      setStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 2) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1000);

    const t0 = Date.now();
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(preferences).forEach(([k, v]) => { if (v) fd.append(k, v); });

      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: fd });
      clearInterval(stepInterval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.recommendations) {
        data.recommendations.forEach(r => {
          if (r.image_url && r.image_url.startsWith('/')) {
            r.image_url = API_BASE + r.image_url;
          }
        });
      }

      setMs(Date.now() - t0);
      setStep(ANALYSIS_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 500));
      setResults(data);
      setAppState(STATE.RESULTS);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Analysis failed. Please try again.');
      setAppState(STATE.ERROR);
    }
  };

  /* ── Virtual Try-On ───────────────────────── */
  const handleTryOn = async (outfitFilename) => {
    if (!file) return;
    setTryOnLoading(true);
    setTryOn(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('outfit_filename', outfitFilename);
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/virtual-tryon`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Try-on failed');
      const blob = await res.blob();
      setTryOn(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      alert('Virtual try-on unavailable for this image.');
    } finally {
      setTryOnLoading(false);
    }
  };

  /* ── Share Card ───────────────────────────── */
  const handleShare = async (outfit) => {
    if (!file || !results) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('outfit_filename', outfit.filename);
      fd.append('body_type', results.features.body_type);
      fd.append('color_season', results.features.color_season);
      fd.append('match_score', outfit.final_score);
      fd.append('style', outfit.style);
      fd.append('occasion', outfit.occasion);
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_BASE}/api/share-card`, { method: 'POST', body: fd });
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
    setTryOn(null); setShareData(null);
    setSort('match'); setStyleFilter(''); setOccFilter(''); setShowFavs(false);
  };

  const styleDNA = getStyleDNA(results?.features);

  return (
    <div ref={containerRef}>
      <ParticleBackground darkMode={darkMode} />

      <div className="magazine-container">

        {/* ── MASTHEAD ───────────────────────── */}
        <header className="masthead">
          <div className="masthead-header-row">
            <p className="masthead-date">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Issue 001
            </p>

            {/* Dark Mode Toggle */}
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              <div className="theme-toggle-thumb">
                {darkMode ? '🌙' : '☀️'}
              </div>
            </button>

            <div className="masthead-badge">
              <span /> AI-Powered
            </div>
          </div>

          <h1 className="masthead-title">STYLE AI</h1>
          <p className="masthead-subtitle">The Editorial Lookbook</p>

          <div className="tech-stack">
            {TECH_TAGS.map((t) => (
              <span key={t} className="tech-tag">{t}</span>
            ))}
          </div>
        </header>

        <main>

          {/* ── IDLE / ERROR ───────────────────── */}
          {(appState === STATE.IDLE || appState === STATE.ERROR) && (
            <div className="gsap-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
              <div style={{ maxWidth: '680px', width: '100%' }}>

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
                <PreferencesForm preferences={preferences} onChange={setPrefs} />

                {/* Top-N selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-muted)' }}>
                    Recommendations
                  </span>
                  {[3, 5, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`filter-chip ${topN === n ? 'active' : ''}`}
                      onClick={() => setTopN(n)}
                    >
                      Top {n}
                    </button>
                  ))}
                </div>

                {/* Error banner */}
                {error && (
                  <div className="error-banner gsap-reveal" style={{ marginTop: '1.25rem' }}>
                    <span>⚠</span> {error}
                  </div>
                )}

                {/* CTA */}
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <button
                    className="btn-editorial"
                    style={{ fontSize: '0.8rem', padding: '1rem 3rem', minWidth: '240px' }}
                    disabled={!file}
                    onClick={handleAnalyze}
                  >
                    <span>✦ Create My Lookbook</span>
                  </button>
                </div>

                {!file && (
                  <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Upload a photo to continue
                  </p>
                )}

                {/* How it works */}
                <div style={{ marginTop: '3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--c-border)' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--c-muted)', whiteSpace: 'nowrap' }}>How It Works</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--c-border)' }} />
                  </div>
                  <div className="how-it-works">
                    {[
                      { icon: '🧠', title: 'Vision AI', desc: 'CLIP ViT-B/32 extracts a 512-dim visual embedding from your photo', tech: 'clip · vit-b/32' },
                      { icon: '🦴', title: 'Body Analysis', desc: 'MediaPipe Pose detects 33 landmarks to classify your body architecture', tech: 'mediapipe · opencv' },
                      { icon: '🎨', title: 'Color Profiling', desc: 'LAB K-Means analysis maps your skin tone to one of 12 seasonal types', tech: 'sklearn · lab colorspace' },
                    ].map((step) => (
                      <div key={step.title} className="how-step gsap-reveal">
                        <span className="how-step-icon">{step.icon}</span>
                        <p className="how-step-title">{step.title}</p>
                        <p className="how-step-desc">{step.desc}</p>
                        <p className="how-step-tech">{step.tech}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── LOADING ──────────────────────── */}
          {appState === STATE.LOADING && (
            <div style={{ padding: '5rem 0', textAlign: 'center' }}>
              <LoadingSpinner steps={ANALYSIS_STEPS} currentStep={loadingStep} />
            </div>
          )}

          {/* ── RESULTS ──────────────────────── */}
          {appState === STATE.RESULTS && results && (
            <div className="gsap-reveal">

              {/* Top bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '0.875rem', borderBottom: '1px solid var(--c-border)' }}>
                <button
                  onClick={handleReset}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--c-muted)', transition: 'color 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--c-black)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--c-muted)'}
                >
                  ← New Session
                </button>

                {styleDNA && (
                  <div className="style-dna">
                    <span style={{ fontSize: '0.6rem', fontWeight: 500, color: 'var(--c-muted)', letterSpacing: '0.05em' }}>DNA</span>
                    {styleDNA}
                  </div>
                )}

                <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--c-muted)' }}>
                  {results.recommendations?.length ?? 0} looks curated
                </span>
              </div>

              {/* Processing stats bar */}
              {processingMs && (
                <div className="stats-bar gsap-stagger-item">
                  {[
                    { label: 'Analysis Time',   value: `${(processingMs / 1000).toFixed(1)}s` },
                    { label: 'Outfits Scored',  value: allRecs.length },
                    { label: 'Body Type',       value: results.features?.body_type?.replace(/_/g, ' ') || '—' },
                    { label: 'Color Season',    value: results.features?.color_season?.replace(/_/g, ' ') || '—' },
                    { label: 'Models Used',     value: 'CLIP + MediaPipe' },
                    { label: 'Score Weights',   value: '50% Visual · 20% Body · 10% Color · 20% Pref' },
                  ].map((s) => (
                    <div key={s.label} className="stat-item">
                      <span className="stat-label">{s.label}</span>
                      <span className="stat-value">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Two-page spread */}
              <div className="editorial-spread">

                {/* PAGE 1 — PROFILE */}
                <div className="page page-left gsap-stagger-item">
                  <div className="page-header">
                    <h2 className="page-title">PROFILE</h2>
                    <span className="page-number">P. 01</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="polaroid-frame" style={{ alignSelf: 'start' }}>
                      <img src={preview} alt="Your photo" style={{ width: '100%', display: 'block' }} />
                    </div>
                    <AnalysisCard features={results.features} />
                  </div>

                  {tryOnImage && (
                    <div className="fitting-room fade-in">
                      <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--c-muted)', marginBottom: '0.75rem' }}>
                        The Fitting Room
                      </p>
                      <img src={tryOnImage} alt="Virtual Try-On" style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'contain', borderRadius: 'var(--r-sm)' }} />
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
                <div className="page gsap-stagger-item">
                  <div className="page-header">
                    <h2 className="page-title">COLLECTION</h2>
                    <span className="page-number">P. 02</span>
                  </div>

                  <FilterBar
                    sort={sort} setSort={setSort}
                    styleFilter={styleFilter} setStyleFilter={setStyleFilter}
                    occFilter={occFilter} setOccFilter={setOccFilter}
                    showFavs={showFavs} setShowFavs={setShowFavs}
                    favCount={favorites.size}
                    total={allRecs.length}
                    filtered={filteredRecs.length}
                  />

                  {filteredRecs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>No looks match the current filters.</p>
                      <button className="btn-ghost" style={{ marginTop: '1rem' }} onClick={() => { setStyleFilter(''); setOccFilter(''); setShowFavs(false); }}>
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="outfit-grid">
                      {filteredRecs.map((outfit, i) => (
                        <OutfitCard
                          key={outfit.filename}
                          outfit={outfit}
                          rank={i}
                          isFav={favorites.has(outfit.filename)}
                          onToggleFav={() => toggleFav(outfit.filename)}
                          onTryOn={() => handleTryOn(outfit.filename)}
                          onShare={() => handleShare(outfit)}
                        />
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <button className="btn-editorial" style={{ fontSize: '0.7rem' }} onClick={handleReset}>
                      <span>Start New Session</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── FOOTER ───────────────────────────── */}
        <footer style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '1px solid var(--c-border)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--f-accent)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--c-black)', marginBottom: '0.5rem' }}>
            Fin.
          </p>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--c-muted)' }}>
            © {new Date().getFullYear()} Style AI · All looks curated by machine intelligence
          </p>
        </footer>

        {shareData && <ShareModal base64={shareData} onClose={() => setShareData(null)} />}
      </div>
    </div>
  );
}
