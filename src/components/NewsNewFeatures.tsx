import React, { useState } from 'react';
import JogCanvas from '../../latest/JogCanvas';
import { setEmanatorAndSendMiddleC } from '../utils/emanatorUtils';

const NewsNewFeatures: React.FC = () => {
  const [played, setPlayed] = useState(false);

  const handlePlayMiddleC = () => {
    setEmanatorAndSendMiddleC('JogDemo');
    setPlayed(true);
    setTimeout(() => setPlayed(false), 2000);
  };

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '1rem' }}>Featured New Component: Jog</h2>
      <JogCanvas />
      <button onClick={handlePlayMiddleC} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Play Middle C
      </button>
      {played && (
        <div style={{ marginTop: '1rem', color: 'green', fontWeight: 'bold' }}>Middle C played!</div>
      )}
    </div>
  );
};

export default NewsNewFeatures;
