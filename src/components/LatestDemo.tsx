import React, { useState } from 'react';
import { setEmanatorAndSendMiddleC } from '../utils/emanatorUtils';

const LatestDemo: React.FC = () => {
  const [played, setPlayed] = useState(false);

  const handlePlayMiddleC = () => {
    setEmanatorAndSendMiddleC('Demo');
    setPlayed(true);
    setTimeout(() => setPlayed(false), 2000);
  };

  return (
    <div style={{ marginTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <iframe
        src="https://kasmsdk.github.io/latest/emanator.html"
        title="Kasm Demo"
        width="90%"
        height="1024"
        style={{ border: '2px solid #ccc', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
        allowFullScreen
      />
      <button onClick={handlePlayMiddleC} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Play Middle C
      </button>
      {played && (
        <div style={{ marginTop: '1rem', color: 'green', fontWeight: 'bold' }}>Middle C played!</div>
      )}
    </div>
  );
};

export default LatestDemo;
