import React from 'react';
import LatestDemo from "./LatestDemo.tsx";

const Canvas: React.FC = () => (
    <div className="kasm-landing-container">
    <h1>Kasm Canvas</h1>
    <p>2D/WebGL HTML5 canvas from Rust/WebAssembly (WebGPU coming)</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
            <button
                className="kasm-demo-btn"
                title="Download as Ableton Live 12.2 M4L device"
                onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/latest/Kasm%20Canvas.amxd';
                    link.download = 'Kasm Canvas.amxd';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }}
            >
                ⬇️<br/>Kasm Canvas.amxd
            </button>
        </div>
      <LatestDemo />
  </div>


);

export default Canvas;

