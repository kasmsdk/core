import React from 'react';
import JogCanvas from '../../latest/JogCanvas';

const NewsNewFeatures: React.FC = () => {
  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
      <h2 style={{ marginBottom: '1rem' }}>Featured New Component: Jog</h2>
      <JogCanvas />
    </div>
  );
};

export default NewsNewFeatures;
