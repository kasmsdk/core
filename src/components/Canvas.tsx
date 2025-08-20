import React from 'react';
import LatestDemo from "./LatestDemo.tsx";

const Canvas: React.FC = () => (
    <div className="kasm-landing-container">
    <h1>Kasm Canvas</h1>
    <p>2D/WebGL HTML5 canvas from Rust/WebAssembly (WebGPU coming)</p>

      <LatestDemo />
  </div>


);

export default Canvas;

