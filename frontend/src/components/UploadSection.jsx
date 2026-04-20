import { useRef, useState } from 'react';

export default function UploadSection({ onFileSelect, preview }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  return (
    <div
      id="upload-zone"
      className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
      style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2.5rem' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        id="file-input"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {preview ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '180px', height: '240px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-sm)',
          }}>
            <img
              src={preview}
              alt="Your uploaded photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)', letterSpacing: '0.05em' }}>
            Click or drop to replace photo
          </p>
        </div>
      ) : (
        <>
          {/* Upload icon */}
          <div style={{
            width: '64px', height: '64px',
            background: 'var(--c-cream)',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--r-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem',
          }}>
            📷
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-black)', marginBottom: '0.25rem' }}>
              Upload Your Photo
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>
              Drag &amp; drop or click to browse
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            {['Full body shot', 'Good lighting', 'Clear background'].map((tip) => (
              <span
                key={tip}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '0.3rem 0.75rem',
                  background: 'var(--c-cream)',
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-pill)',
                  color: 'var(--c-charcoal)',
                }}
              >
                ✓ {tip}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '0.65rem', color: 'var(--c-border-dark)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            JPG · PNG · WEBP
          </p>
        </>
      )}
    </div>
  );
}
