import React, { useRef, useEffect } from 'react';

interface ArpyCanvasProps {
    src?: string;
    title?: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
    midiData?: { note: number; velocity: number; isCC: boolean } | null;
}

const ArpyCanvas: React.FC<ArpyCanvasProps> = ({
    src = '/latest/kasm_canvas_arpy_obs.html',
    title = 'Arpy Canvas',
    width = 150,
    height = 150,
    style = {},
    midiData,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (midiData && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'MIDI_DATA', ...midiData }, '*');
        }
    }, [midiData]);

    return (
        <iframe
            ref={iframeRef}
            src={src}
            title={title}
            width={width}
            height={height}
            style={{ border: '1px solid #ccc', borderRadius: '8px', ...style }}
        />
    );
};

export default ArpyCanvas;
