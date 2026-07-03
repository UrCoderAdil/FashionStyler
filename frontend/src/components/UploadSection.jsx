import { useRef, useState } from 'react';

const TIPS = [
  { icon: '🧍', label: 'Full body' },
  { icon: '☀️', label: 'Good lighting' },
  { icon: '🖼️', label: 'Clear bg' },
];

export default function UploadSection({ onFileSelect, preview }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) onFileSelect(file);
  };

  return (
    <div
      className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
      style={{ minHeight: preview ? '260px' : '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2.5rem' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {preview ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '180px', height: '240px', overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-md)',
            position: 'relative',
          }}>
            <img
              src={preview}
              alt="Your uploaded photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              color: '#fff',
              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '0.5rem', textAlign: 'center',
            }}>
              Click to replace
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['✓ Photo ready', '✓ AI will analyze'].map((t) => (
              <span key={t} style={{ fontSize: '0.6rem', fontWeight: 700, color: '#22c55e', letterSpacing: '0.05em' }}>{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{
            width: '72px', height: '72px',
            background: 'var(--c-accent-soft)',
            border: '1.5px solid var(--c-accent)',
            borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            transition: 'all 0.3s ease',
          }}>
            📸
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-black)', marginBottom: '0.25rem' }}>
              Upload Your Photo
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--c-muted)' }}>
              Drag & drop or <span style={{ color: 'var(--c-accent)', fontWeight: 600, borderBottom: '1px solid var(--c-accent)' }}>click to browse</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {TIPS.map((tip) => (
              <div key={tip.label} style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.65rem', fontWeight: 600,
                padding: '0.3rem 0.75rem',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--r-pill)',
                color: 'var(--c-charcoal)',
              }}>
                <span>{tip.icon}</span>
                <span>{tip.label}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.6rem', color: 'var(--c-border-dark)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            JPG · PNG · WEBP
          </p>
        </>
      )}
    </div>
  );
}
