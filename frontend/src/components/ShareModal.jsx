import { useState } from 'react';

export default function ShareModal({ base64, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = 'my-style-match.png';
    link.click();
  };

  const handleCopy = async () => {
    try {
      const res = await fetch(base64);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Clipboard copy failed. Please use download instead.');
    }
  };

  return (
    <div className="share-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="share-modal">

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', lineHeight: 1, color: 'var(--c-muted)',
            transition: 'color 0.15s',
            borderRadius: 'var(--r-sm)',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--c-black)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--c-muted)'}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--c-border)' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--c-muted)', marginBottom: '0.25rem' }}>
            Style AI · Editorial Card
          </p>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-black)' }}>
            Your Look
          </h3>
        </div>

        {/* Preview image */}
        <div style={{ border: '1px solid var(--c-border)', marginBottom: '1.5rem', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <img src={base64} alt="Share Card" style={{ width: '100%', display: 'block' }} />
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <button className="btn-editorial" onClick={handleDownload}>
            Download
          </button>
          <button
            className="btn-ghost"
            onClick={handleCopy}
            style={{ background: copied ? 'var(--c-black)' : '', color: copied ? 'var(--c-white)' : '' }}
          >
            {copied ? '✓ Copied!' : 'Copy Image'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--c-muted)' }}>
          Perfect for Instagram Stories &amp; Twitter
        </p>
      </div>
    </div>
  );
}
