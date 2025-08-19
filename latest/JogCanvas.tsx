import React from 'react';

interface JogCanvasProps {
    src?: string;
    title?: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
}

const JogCanvas: React.FC<JogCanvasProps> = ({
    src = '/latest/kasm_canvas_jog_obs.html',
    title = 'Jog Canvas',
    width = 150,
    height = 150,
    style = {},
}) => {
    return (
        <iframe
            src={src}
            title={title}
            width={width}
            height={height}
            style={{ border: '1px solid #ccc', borderRadius: '8px', ...style }}
        />
    );
};

export default JogCanvas;

