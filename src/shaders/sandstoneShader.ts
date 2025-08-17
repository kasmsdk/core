// Pyrmont Sandstone WebGPU Shader Implementation
export const sandstoneVertexShader = `
struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) world_position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

struct Uniforms {
  view_proj: mat4x4<f32>,
  model: mat4x4<f32>,
  time: f32,
  light_position: vec3<f32>,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  
  let world_position = uniforms.model * vec4<f32>(input.position, 1.0);
  out.world_position = world_position.xyz;
  out.clip_position = uniforms.view_proj * world_position;
  out.normal = normalize((uniforms.model * vec4<f32>(input.normal, 0.0)).xyz);
  out.uv = input.uv;
  
  return out;
}
`;

export const sandstoneFragmentShader = `
struct FragmentInput {
  @location(0) world_position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

struct Uniforms {
  view_proj: mat4x4<f32>,
  model: mat4x4<f32>,
  time: f32,
  light_position: vec3<f32>,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

@group(0) @binding(1)
var texture_sampler: sampler;

@group(0) @binding(2)
var metallic_texture: texture_2d<f32>;

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4<f32> {
  let uv = input.uv;
  let world_pos = input.world_position;
  let normal = normalize(input.normal);

  // Sample metallic texture for base color
  var base_color = textureSample(metallic_texture, texture_sampler, uv).rgb;

  // Lighting calculation
  let light_dir = normalize(uniforms.light_position - world_pos);
  let view_dir = normalize(-world_pos); // Assuming camera at origin
  let half_dir = normalize(light_dir + view_dir);

  // Diffuse lighting
  let diffuse = max(0.0, dot(normal, light_dir));

  // Specular lighting (stronger for metallic)
  let specular = pow(max(0.0, dot(normal, half_dir)), 64.0) * 0.5;

  // Ambient lighting
  let ambient = 0.4;

  // Final color composition
  let final_color = base_color * (ambient + diffuse * 0.7) + vec3<f32>(specular);

  return vec4<f32>(final_color, 1.0);
}
`;

export const sandstoneComputeShader = `
@group(0) @binding(0)
var<storage, read_write> noise_data: array<f32>;

@compute @workgroup_size(8, 8, 1)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let dims = 256u;
  let index = global_id.y * dims + global_id.x;
  
  if (global_id.x >= dims || global_id.y >= dims) {
    return;
  }
  
  let uv = vec2<f32>(f32(global_id.x), f32(global_id.y)) / f32(dims);
  
  // Generate procedural noise for sandstone texture
  var noise_value = 0.0;
  var amplitude = 1.0;
  var frequency = 1.0;
  
  for (var i = 0; i < 8; i++) {
    let p = uv * frequency;
    let n = sin(p.x * 6.28318) * cos(p.y * 6.28318) * 0.5 + 0.5;
    noise_value += n * amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  noise_data[index] = noise_value;
}
`;

// WebGPU Sandstone Material Class
export class SandstoneWebGPUMaterial {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private metallicTexture: GPUTexture | null = null;
  private bindGroup: GPUBindGroup | null = null;

  constructor(device: GPUDevice) {
    this.device = device;
  }

  async initialize(): Promise<void> {
    // Create shader modules
    const vertexShaderModule = this.device.createShaderModule({
      code: sandstoneVertexShader,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: sandstoneFragmentShader,
    });

    // Create uniform buffer
    this.uniformBuffer = this.device.createBuffer({
      size: 160, // mat4x4 (64) + mat4x4 (64) + f32 (4) + vec3 (12) + padding (16)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Load metallic.png as the main texture
    const response = await fetch('./src/assets/textures/metallic.png');
    const imageBitmap = await createImageBitmap(await response.blob());
    this.metallicTexture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: this.metallicTexture },
      [imageBitmap.width, imageBitmap.height]
    );

    // Create bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: 'unfilterable-float' },
        },
      ],
    });

    // Create sampler
    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });

    // Create bind group
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: this.metallicTexture.createView() },
      ],
    });

    // Create render pipeline
    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      }),
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 32, // 3 * 4 + 3 * 4 + 2 * 4
            attributes: [
              { format: 'float32x3', offset: 0, shaderLocation: 0 }, // position
              { format: 'float32x3', offset: 12, shaderLocation: 1 }, // normal
              { format: 'float32x2', offset: 24, shaderLocation: 2 }, // uv
            ],
          },
        ],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'fs_main',
        targets: [{ format: 'bgra8unorm' }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    });
  }


  updateUniforms(viewProjMatrix: Float32Array, modelMatrix: Float32Array, time: number, lightPosition: Float32Array): void {
    if (!this.uniformBuffer) return;

    const uniformData = new Float32Array(40); // 160 bytes / 4 bytes per float
    uniformData.set(viewProjMatrix, 0);
    uniformData.set(modelMatrix, 16);
    uniformData[32] = time;
    uniformData.set(lightPosition, 33);

    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData.buffer);
  }

  render(renderPass: GPURenderPassEncoder, vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer, indexCount: number): void {
    if (!this.pipeline || !this.bindGroup) return;

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, 'uint16');
    renderPass.drawIndexed(indexCount);
  }
}

// CSS Custom Properties for Sandstone Theme
export const sandstoneThemeProperties = {
  // Primary sandstone colors
  '--sandstone-base': '#D9BF8C',      // Warm cream base
  '--sandstone-light': '#F2E1B8',     // Light cream
  '--sandstone-dark': '#A68B59',      // Darker ochre
  '--sandstone-iron': '#BF7340',      // Iron oxide staining
  '--sandstone-shadow': '#8C7853',    // Deep shadow

  // Accent colors derived from sandstone
  '--sandstone-accent': '#D4A574',    // Warm accent
  '--sandstone-highlight': '#F5E8C8', // Highlight
  '--sandstone-muted': '#B8A082',     // Muted tone

  // Functional colors
  '--sandstone-text': '#4A3F2A',      // Dark brown text
  '--sandstone-text-light': '#6B5D42', // Lighter text
  '--sandstone-text-muted': '#8C7853', // Muted text

  // Interactive states
  '--sandstone-hover': '#E6C999',     // Hover state
  '--sandstone-active': '#CC9966',    // Active state
  '--sandstone-focus': '#D4A574',     // Focus state

  // Surface variations
  '--sandstone-surface-1': '#F0E4C1', // Lightest surface
  '--sandstone-surface-2': '#E8D7B3', // Light surface
  '--sandstone-surface-3': '#D9BF8C', // Base surface
  '--sandstone-surface-4': '#C7A876', // Dark surface
  '--sandstone-surface-5': '#A68B59', // Darkest surface
};
