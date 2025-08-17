import React from 'react';

const Bangaz: React.FC = () => {
  return (
    <div className="emanator-main-ui" style={{ padding: '2em', textAlign: 'left' }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: '0.5em' }}>Bangaz Drum Machine</h1>
      <p style={{ color: 'var(--sandstone-base)', marginBottom: '2em' }}>
        WebMIDI Drum Machine Instrument. <br />
        <em>Drum pattern editor coming here soon...</em>
      </p>
    </div>
  );
};

export default Bangaz;
