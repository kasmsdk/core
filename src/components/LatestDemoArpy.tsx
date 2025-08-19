import React from 'react';

const LatestDemoArpy: React.FC = () => {
  return (
    <div style={{ marginTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <iframe
        src="https://kasmsdk.github.io/latest/arpy.html"
        title="Kasm Demo"
        width="90%"
        height="1024"
        style={{ border: '2px solid #ccc', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
        allowFullScreen
      />
    </div>
  );
};

export default LatestDemoArpy;
