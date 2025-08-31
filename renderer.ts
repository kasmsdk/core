function isWebGPUSupported(): boolean {
    return !!navigator.gpu;
}

export class Renderer {
    private canvas: HTMLCanvasElement;
    private context: GPUCanvasContext | WebGLRenderingContext | null = null;
    private useWebGPU: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        // Remove direct background assignment; handled by CSS

        if (isWebGPUSupported()) {
            this.context = canvas.getContext('webgpu');
            this.useWebGPU = !!this.context;
        }

        if (!this.useWebGPU) {
            // Fallback to WebGL
            this.context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        }
    }

    public clear() {
        if (this.useWebGPU && this.context) {
            // WebGPU clear logic
            // ...existing WebGPU clear code...
        } else if (this.context) {
            // WebGL clear logic
            const gl = this.context as WebGLRenderingContext;
            gl.clearColor(0, 0, 0, 1); // black background
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    }

    // ...existing code...
}
