import { useState, useCallback, useEffect } from 'react';
import './styles/magazine.css';

import UploadSection from './components/UploadSection';
import LoadingSpinner from './components/LoadingSpinner';
import AnalysisCard from './components/AnalysisCard';
import OutfitCard from './components/OutfitCard';
import PreferencesForm from './components/PreferencesForm';
import ShareModal from './components/ShareModal';

const ANALYSIS_STEPS = [
  'Analyzing your unique silhouette...',
  'Determining your seasonal color profile...',
  'Mapping body landmarks in 3D...',
  'Scanning aesthetic visual patterns...',
  'Matching against editorial collections...',
  'Curating your personalized lookbook...',
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
  
  // New states for Try-On and Sharing
  const [tryOnImage, setTryOnImage] = useState(null);
  const [isTryOnLoading, setIsTryOnLoading] = useState(false);
  const [shareData, setShareData] = useState(null);

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
      {/* HEADER / MASTHEAD */}
      <header className="masthead">
        <p className="masthead-date">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · ISSUE 001</p>
        <h1 className="masthead-title">STYLE AI</h1>
        <p className="masthead-subtitle">The Editorial Lookbook</p>
      </header>

      <main>
        {/* IDLE / ERROR */}
        {(appState === STATE.IDLE || appState === STATE.ERROR) && (
          <div className="flex flex-col gap-10 items-center">
            <div className="max-w-2xl w-full">
              <h2 className="section-title italic">Begin Your Session</h2>
              <div className="polaroid-frame mb-8">
                <UploadSection onFileSelect={handleFileSelect} preview={preview} />
              </div>
              
              <PreferencesForm preferences={preferences} onChange={setPreferences} />

              {error && <p className="text-red-600 mt-4 font-semibold text-center">⚠️ {error}</p>}
              
              <div className="mt-10 flex justify-center">
                <button 
                  className="btn-editorial text-xl" 
                  disabled={!file} 
                  onClick={handleAnalyze}
                >
                  Create My Lookbook
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {appState === STATE.LOADING && (
          <div className="py-20 text-center">
            <LoadingSpinner steps={ANALYSIS_STEPS} currentStep={loadingStep} />
          </div>
        )}

        {/* RESULTS */}
        {appState === STATE.RESULTS && results && (
          <div className="fade-in">
            <div className="editorial-spread mb-20">
              {/* PAGE 1: ANALYSIS */}
              <div className="page page-left">
                <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-2">
                  <h2 className="font-display text-4xl m-0">PROFILE</h2>
                  <p className="m-0 text-sm font-bold tracking-widest uppercase">P. 01</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="polaroid-frame h-fit">
                    <img src={preview} alt="User" className="w-full grayscale-[20%]" />
                  </div>
                  <AnalysisCard features={results.features} />
                </div>
                
                {tryOnImage && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="font-display text-2xl italic mb-4">The Fitting Room</h3>
                    <div className="bg-gray-100 p-4 border border-gray-200">
                      <img src={tryOnImage} alt="Try On" className="w-full max-h-[500px] object-contain" />
                    </div>
                  </div>
                )}
                
                {isTryOnLoading && (
                  <div className="mt-12 text-center py-10 bg-gray-50 border border-dashed border-gray-300">
                    <p className="animate-pulse font-accent italic">Adjusting the garments to your frame...</p>
                  </div>
                )}
              </div>

              {/* PAGE 2: RECOMMENDATIONS */}
              <div className="page">
                <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-2">
                  <h2 className="font-display text-4xl m-0">COLLECTION</h2>
                  <p className="m-0 text-sm font-bold tracking-widest uppercase">P. 02</p>
                </div>
                
                <div className="columns-1 sm:columns-2 gap-8">
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
                
                <div className="mt-12 flex justify-center">
                  <button className="btn-editorial" onClick={handleReset}>New Session</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {shareData && <ShareModal base64={shareData} onClose={() => setShareData(null)} />}

      <footer className="mt-20 py-10 border-t border-black text-center">
        <p className="font-accent italic text-lg">Fin.</p>
        <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mt-2">© 2026 Style AI Magazine</p>
      </footer>
    </div>
  );
}
