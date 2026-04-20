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
      className={`upload-zone flex flex-col items-center justify-center gap-5 p-10 transition-all duration-300 ${dragOver ? 'drag-over' : ''}`}
      style={{ minHeight: '280px' }}
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
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {preview ? (
        <div className="flex flex-col items-center gap-4">
          <div
            className="rounded-2xl overflow-hidden glow-ring"
            style={{ width: '180px', height: '240px' }}
          >
            <img
              src={preview}
              alt="Your uploaded photo"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Click or drop to change photo
          </p>
        </div>
      ) : (
        <>
          {/* Upload icon */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            📸
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold" style={{ color: '#e2e8f0' }}>
              Upload your photo
            </p>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>
              Drag & drop or click to browse
            </p>
            <p className="text-xs mt-2" style={{ color: '#475569' }}>
              JPG, PNG, WEBP supported
            </p>
          </div>

          {/* Tips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {['Full body shot', 'Good lighting', 'Clear background'].map((tip) => (
              <span
                key={tip}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                ✓ {tip}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
