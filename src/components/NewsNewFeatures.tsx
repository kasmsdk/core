import React, { useRef, useEffect } from 'react';
import JogCanvas from '../../latest/JogCanvas';
import type { JogCanvasHandle } from '../../latest/JogCanvas';

const NewsNewFeatures: React.FC = () => {
    const jogCanvasRef = useRef<JogCanvasHandle>(null);
    useEffect(() => {
        // Generate a random note in range 40 to 80, intervals of 5
        function getRandomNote() {
            const min = 40;
            const max = 80;
            const step = 5;
            const steps = Math.floor((max - min) / step) + 1;
            return min + step * Math.floor(Math.random() * steps);
        }
        const velocity = 100; // Example velocity
        const interval = setInterval(() => {
            const note = getRandomNote();
            const handle = jogCanvasRef.current as JogCanvasHandle | null;
            if (handle) {
                handle.callKasmFunction('update_canvas_data', { pitch: note, velocity, cc: false });
            }
            if (handle) {
                handle.callKasmFunction('update_canvas_data', { pitch: note - 10, velocity: 0, cc: false });
            }
        }, 500); // every 3 seconds
        return () => clearInterval(interval);
    }, []);
    return (
        <p>
            New Component in Kasm v1.14!<br/>Jog - video jogger canvas kasm_canvas_jog.rs<br/>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '16px 0' }}>
                <JogCanvas ref={jogCanvasRef} />
                <button
                    className="kasm-demo-btn"
                    title="Download Jog as Ableton Live 12.2 M4L device"
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/latest/Kasm%20Jog.amxd';
                        link.download = 'Kasm Jog.amxd';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                >
                    ⬇️<br/>Kasm Jog.amxd
                </button>
            </div>
        </p>
    );
};

export default NewsNewFeatures;
