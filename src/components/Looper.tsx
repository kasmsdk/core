import React from 'react';
import LatestDemoLooper from "./LatestDemoLooper.tsx";

const Looper: React.FC = () => (
    <div className="kasm-landing-container">
    <h1>Kasm Looper</h1>
    <p>MIDI Tape looping with counterpoint</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
            <button
                className="kasm-demo-btn"
                title="Download Looper as Ableton Live 12.2 M4L device"
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/latest/Kasm%20Looper.amxd';
                    link.download = 'Kasm Looper.amxd';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }}
            >
                ⬇️<br/>Looper .amxd
            </button>
        </div>
      <LatestDemoLooper />

  </div>
);

export default Looper;
