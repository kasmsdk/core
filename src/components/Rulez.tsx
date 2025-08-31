import React from 'react';
import LatestDemoRulez from "./LatestDemoRulez.tsx";

const Rulez: React.FC = () => (
    <div className="kasm-landing-container">
    <h1>Kasm Rulez</h1>
    <p>Apply real world rules to virtual instruments</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
            <button
                className="kasm-demo-btn-download"
                title="Download Rulez as Ableton Live 12.2 M4L device"
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/latest/Kasm%20Rulez.amxd';
                    link.download = 'Kasm Rulez.amxd';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }}
            >
                ⬇️<br/>Kasm Rulez.amxd
            </button>
        </div>
      <LatestDemoRulez />

  </div>
);

export default Rulez;
