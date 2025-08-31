function isWebGPUSupported(): boolean {
    return !!navigator.gpu;
}

export class Renderer {
    private canvas: HTMLCanvasElement;
    private context: GPUCanvasContext | WebGLRenderingContext | null = null;
    private useWebGPU: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        if (isWebGPUSupported()) {
            this.context = canvas.getContext('webgpu');
            this.useWebGPU = !!this.context;
        }

        if (!this.useWebGPU) {
            // Fallback to WebGL with alpha: true for transparency
            this.context = canvas.getContext('webgl', { alpha: true })
                || canvas.getContext('experimental-webgl', { alpha: true });
        }
    }

    public clear() {
        if (this.useWebGPU && this.context) {
            // WebGPU clear logic
            // Make sure compositing allows transparency if possible
            // ...existing WebGPU clear code...
        } else if (this.context) {
            // WebGL clear logic
            const gl = this.context as WebGLRenderingContext;
            // Clear with transparent color so CSS background shows through
            gl.clearColor(0, 0, 0, 0); // alpha = 0 for transparency
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    }

    // ...existing code...
}
