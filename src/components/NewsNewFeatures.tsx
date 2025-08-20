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
            New Component in v1.14!<br/>Jog - video jogger canvas kasm_canvas_jog.rs<br/>
            <JogCanvas ref={jogCanvasRef} />
        </p>
    );
};

export default NewsNewFeatures;
