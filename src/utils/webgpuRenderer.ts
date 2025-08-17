import { SandstoneWebGPUMaterial } from '../shaders/sandstoneShader';

export interface RenderObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion
  scale: [number, number, number];
  mesh?: {
    vertices: Float32Array;
    indices: Uint16Array;
    normals?: Float32Array;
    uvs?: Float32Array;
  };
}

export class WebGPURenderer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private canvas: HTMLCanvasElement;
  private fallbackToWebGL = false;
  private webglContext: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private sandstoneMaterial: SandstoneWebGPUMaterial | null = null;
  private quadVertexBuffer: GPUBuffer | null = null;
  private quadIndexBuffer: GPUBuffer | null = null;
  private depthTexture: GPUTexture | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize(): Promise<boolean> {
    try {
      // Try WebGPU first
      if ('gpu' in navigator && navigator.gpu) {
        const gpu = navigator.gpu as GPU;
        const adapter = await gpu.requestAdapter();
        if (adapter) {
          this.device = await adapter.requestDevice();
          this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
          
          if (this.context && this.device) {
            this.context.configure({
              device: this.device,
              format: gpu.getPreferredCanvasFormat(),
              alphaMode: 'premultiplied',
            });
            
            this.sandstoneMaterial = new SandstoneWebGPUMaterial(this.device);
            await this.sandstoneMaterial.initialize();
            this.createFullScreenQuad();

            console.log('WebGPU initialized successfully');
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('WebGPU initialization failed:', error);
    }

    // Fallback to WebGL
    return this.initializeWebGL();
  }

  private initializeWebGL(): boolean {
    try {
      this.webglContext = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
      
      if (this.webglContext) {
        this.fallbackToWebGL = true;
        console.log('WebGL fallback initialized');
        
        // Enable depth testing
        this.webglContext.enable(this.webglContext.DEPTH_TEST);
        this.webglContext.enable(this.webglContext.CULL_FACE);
        
        return true;
      }
    } catch (error) {
      console.error('WebGL initialization failed:', error);
    }
    
    return false;
  }

  render(objects: RenderObject[], viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    if (this.fallbackToWebGL) {
      this.renderWebGL(objects, viewMatrix, projectionMatrix);
    } else {
      this.renderWebGPU(objects, viewMatrix, projectionMatrix);
    }
  }

  private renderWebGPU(objects: RenderObject[], viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    if (!this.device || !this.context) return;

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }, // Transparent background
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    
    // Render sandstone background
    if (this.sandstoneMaterial && this.quadVertexBuffer && this.quadIndexBuffer) {
      const time = performance.now() / 1000.0;
      const lightPosition = new Float32Array([2.0, 5.0, 10.0]);
      const modelMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); // Identity matrix
      const viewProjMatrix = new Float32Array(16); // Dummy view-projection for background
      viewProjMatrix.set([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

      this.sandstoneMaterial.updateUniforms(viewProjMatrix, modelMatrix, time, lightPosition);
      this.sandstoneMaterial.render(passEncoder, this.quadVertexBuffer, this.quadIndexBuffer, 6);
    }

    // Render each object
    for (const object of objects) {
      this.renderObjectWebGPU(passEncoder, object, viewMatrix, projectionMatrix);
    }

    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  private renderObjectWebGPU(
    _passEncoder: GPURenderPassEncoder,
    object: RenderObject,
    _viewMatrix: Float32Array,
    _projectionMatrix: Float32Array
  ): void {
    // This is where you would render actual 3D objects on top of the background
    if (object.mesh) {
      // In a real app, you'd have buffers for each object's mesh
      // and update uniforms for its specific model matrix.
    }
  }

  private createFullScreenQuad(): void {
    if (!this.device) return;

    // x, y, z, nx, ny, nz, u, v
    const vertices = new Float32Array([
      -1.0, -1.0, 0.999, 0.0, 0.0, 1.0, 0.0, 1.0,
       1.0, -1.0, 0.999, 0.0, 0.0, 1.0, 1.0, 1.0,
       1.0,  1.0, 0.999, 0.0, 0.0, 1.0, 1.0, 0.0,
      -1.0,  1.0, 0.999, 0.0, 0.0, 1.0, 0.0, 0.0,
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    this.quadVertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.quadVertexBuffer.getMappedRange()).set(vertices);
    this.quadVertexBuffer.unmap();

    this.quadIndexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(this.quadIndexBuffer.getMappedRange()).set(indices);
    this.quadIndexBuffer.unmap();
  }

  private renderWebGL(objects: RenderObject[], viewMatrix: Float32Array, projectionMatrix: Float32Array): void {
    if (!this.webglContext) return;

    const gl = this.webglContext;
    
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Render each object
    for (const object of objects) {
      this.renderObjectWebGL(object, viewMatrix, projectionMatrix);
    }
  }

  private renderObjectWebGL(
    object: RenderObject,
    _viewMatrix: Float32Array,
    _projectionMatrix: Float32Array
  ): void {
    if (!this.webglContext) return;

    // WebGL object rendering logic would go here
    // This would include creating shaders, buffers, and drawing calls
    console.log(`Rendering object ${object.id} with WebGL`);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    if (this.isWebGPU() && this.device && this.context) {
        this.context.configure({
            device: this.device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied',
        });
        if (this.depthTexture) {
            this.depthTexture.destroy();
        }
        this.depthTexture = this.device.createTexture({
            size: [width, height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    if (this.fallbackToWebGL && this.webglContext) {
      this.webglContext.viewport(0, 0, width, height);
    }
  }

  dispose(): void {
    if (this.device) {
      this.device.destroy();
    }
    
    this.device = null;
    this.context = null;
    this.webglContext = null;
  }

  isWebGPU(): boolean {
    return !this.fallbackToWebGL && this.device !== null;
  }

  isWebGL(): boolean {
    return this.fallbackToWebGL && this.webglContext !== null;
  }
}

// Utility functions for matrix operations
export function createPerspectiveMatrix(
  fov: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ]);
}

export function createViewMatrix(
  eye: [number, number, number],
  target: [number, number, number],
  up: [number, number, number]
): Float32Array {
  const zAxis = normalize(subtract(eye, target));
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);

  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1
  ]);
}

// Vector math utilities
function subtract(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v: [number, number, number]): [number, number, number] {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return length > 0 ? [v[0] / length, v[1] / length, v[2] / length] : [0, 0, 0];
}
