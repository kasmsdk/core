import React from 'react';

interface EmanatorCanvasProps {
    src?: string;
    title?: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
}

const EmanatorCanvas: React.FC<EmanatorCanvasProps> = ({
    src = '/latest/kasm_canvas_obs.html',
    title = 'Emanator Canvas',
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

export default EmanatorCanvas;

