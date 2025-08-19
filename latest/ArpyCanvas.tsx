import React from 'react';

interface ArpyCanvasProps {
    src?: string;
    title?: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
}

const ArpyCanvas: React.FC<ArpyCanvasProps> = ({
    src = '/latest/kasm_canvas_arpy_obs.html',
    title = 'Arpy Canvas',
    width = 400,
    height = 300,
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

export default ArpyCanvas;

