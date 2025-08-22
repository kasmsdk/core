import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface ArpyCanvasProps {
    src?: string;
    title?: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
    midiData?: { note: number; velocity: number; isCC: boolean } | null;
    inlet_5_emanator? : number;
}

export interface UpdateCanvasDataArgs {
    pitch: number;
    velocity: number;
    cc: boolean;
}

export interface ArpyCanvasHandle {
    callKasmFunction: (func: string, args?: UpdateCanvasDataArgs) => void;
    postHello: () => void;
    setInlets: (args?: UpdateCanvasDataArgs) => void;
}

const ArpyCanvas = forwardRef<ArpyCanvasHandle, ArpyCanvasProps>(({
                                                                                  src = '/latest/kasm_canvas_arpy_obs.html',
                                                                                  title = 'LFO Canvas',
                                                                                  width = 150,
                                                                                  height = 150,
                                                                                  style = {},
                                                                                  midiData,
                                                                                  inlet_5_emanator,
                                                                              }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Track iframe loaded state
    const hasLoadedRef = useRef(false);

    const handleIframeLoad = () => {
        hasLoadedRef.current = true;
        if (typeof inlet_5_emanator === 'number' && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'INLET_5_EMANATOR', value: inlet_5_emanator }, '*');
        }
    };

    useEffect(() => {
        if (midiData && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'MIDI_DATA', ...midiData }, '*');
        }
    }, [midiData]);

    useEffect(() => {
        if (hasLoadedRef.current && typeof inlet_5_emanator === 'number' && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'INLET_5_EMANATOR', value: inlet_5_emanator }, '*');
        }
    }, [inlet_5_emanator]);

    useImperativeHandle(ref, () => ({
        callKasmFunction: (func: string, args?: UpdateCanvasDataArgs) => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({ type: 'KASM', func, args }, '*');
            }
        },
        postHello: () => {
            const win = iframeRef.current?.contentWindow;
            if (win && typeof (win as any).post === 'function') {
                (win as any).post("Hello, World!");
            }
        },
        setInlets: (args?: UpdateCanvasDataArgs) => {
            if (iframeRef.current && iframeRef.current.contentWindow && args) {
                iframeRef.current.contentWindow.postMessage({ type: 'INLET_0_NOTE', value: args.pitch }, '*');
                iframeRef.current.contentWindow.postMessage({ type: 'INLET_2_VELOCITY', value: args.velocity }, '*');
                iframeRef.current.contentWindow.postMessage({ type: 'BANG' }, '*');

                // uncomment this call to kasm_rust.update_canvas_data will also shows the note played
                // iframeRef.current.contentWindow.postMessage({ type: 'KASM', func: 'update_canvas_data', args }, '*');
            }
        },

    }));

    return (
        <iframe
            ref={iframeRef}
            src={src}
            title={title}
            width={width}
            height={height}
            style={{ border: '1px solid #ccc', borderRadius: '8px', ...style }}
            onLoad={handleIframeLoad}
        />
    );
});

export default ArpyCanvas;
