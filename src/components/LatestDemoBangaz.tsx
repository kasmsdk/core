import React, { useRef, useEffect } from 'react';
import KasmBuyButton from "./KasmBuyButton.tsx";
const LatestDemoBangaz: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Relay keyboard events to the iframe
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'KASM_KEY', key: event.key, code: event.code, altKey: event.altKey, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, metaKey: event.metaKey }, '*');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div style={{ marginTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onClick={() => { if (iframeRef.current) iframeRef.current.focus(); }}>
      <iframe
        ref={iframeRef}
        src="/latest/bangaz.html"
        title="Kasm Demo"
        style={{ width: '90vw', height: '90vh', display: 'block', border: '2px solid #ccc', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
        allowFullScreen
        tabIndex={-1}
        onLoad={() => {
          if (iframeRef.current) {
            iframeRef.current.focus();
          }
        }}
      />
      <KasmBuyButton />
    </div>
  );
};

export default LatestDemoBangaz;
