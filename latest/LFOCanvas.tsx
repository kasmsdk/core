import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface LFOCanvasProps {
    src?: string;
    title?: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
    midiData?: { note: number; velocity: number; isCC: boolean } | null;
}

export interface UpdateCanvasDataArgs {
    pitch: number;
    velocity: number;
    cc: boolean;
}

export interface LFOCanvasHandle {
    callKasmFunction: (func: string, args?: UpdateCanvasDataArgs) => void;
    postHello: () => void;
}

const LFOCanvas = forwardRef<LFOCanvasHandle, LFOCanvasProps>(({
                                                                      src = '/latest/kasm_canvas_obs.html',
                                                                      title = 'LFO Canvas',
                                                                      width = 150,
                                                                      height = 150,
                                                                      style = {},
                                                                      midiData,
                                                                  }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (midiData && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'MIDI_DATA', ...midiData }, '*');
        }
    }, [midiData]);

    useImperativeHandle(ref, () => ({
        callKasmFunction: (func: string, args?: UpdateCanvasDataArgs) => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({ type: 'KASM', func, args }, '*');
            }
        },
        postHello: () => {
            if (iframeRef.current && iframeRef.current.contentWindow && typeof (iframeRef.current.contentWindow as any).post === 'function') {
                (iframeRef.current.contentWindow as any).post("HELLO");
            }
        }
    }));

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
});

export default LFOCanvas;
