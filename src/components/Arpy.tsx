import React from 'react';

const Arpy: React.FC = () => {
  return (
    <div className="emanator-main-ui" style={{ padding: '2em', textAlign: 'left' }}>
      <h1 style={{ fontSize: '2.5em', marginBottom: '0.5em' }}>Arpy MIDI Arpeggiator Editor</h1>
      <p style={{ color: 'var(--sandstone-base)', marginBottom: '2em' }}>
        WebMIDI Arpeggiator Editor Tool.<br />
        <em>Mechanism to view arpeggiators and edit them coming soon...</em>
      </p>
    </div>
  );
};

export default Arpy;
