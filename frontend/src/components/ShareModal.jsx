export default function ShareModal({ base64, onClose }) {
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
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Clipboard copy failed. Please use download.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
      <div className="bg-white max-w-lg w-full p-8 relative shadow-2xl border border-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-light hover:text-red-700 transition-colors"
        >
          ×
        </button>

        <h3 className="font-display text-2xl text-center mb-6">Your Editorial Card</h3>
        
        <div className="border border-gray-100 shadow-lg mb-8">
          <img src={base64} alt="Share Card" className="w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleDownload}
            className="btn-editorial text-xs"
          >
            Download Card
          </button>
          <button 
            onClick={handleCopy}
            className="btn-editorial text-xs bg-gray-100 !text-black hover:!bg-gray-200"
          >
            Copy Image
          </button>
        </div>
        
        <p className="mt-6 text-[10px] text-center uppercase tracking-widest text-gray-400">
          Perfect for Instagram Stories or Twitter
        </p>
      </div>
    </div>
  );
}
