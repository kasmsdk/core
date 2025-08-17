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
var noise_texture: texture_2d<f32>;

// Authentic Pyrmont sandstone color palette (1880s rustic)
const SANDSTONE_BASE: vec3<f32> = vec3<f32>(0.82, 0.68, 0.45); // Warm golden base
const SANDSTONE_DARK: vec3<f32> = vec3<f32>(0.58, 0.48, 0.32); // Deep weathered blocks
const SANDSTONE_LIGHT: vec3<f32> = vec3<f32>(0.92, 0.82, 0.62); // Light weathered surface
const SANDSTONE_MORTAR: vec3<f32> = vec3<f32>(0.72, 0.62, 0.48); // Mortar joints
const SANDSTONE_STAIN: vec3<f32> = vec3<f32>(0.68, 0.52, 0.35); // Age staining

// Noise functions for procedural texture generation
fn hash(p: vec2<f32>) -> f32 {
  let h = dot(p, vec2<f32>(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

fn noise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  
  let a = hash(i);
  let b = hash(i + vec2<f32>(1.0, 0.0));
  let c = hash(i + vec2<f32>(0.0, 1.0));
  let d = hash(i + vec2<f32>(1.0, 1.0));
  
  let u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

fn fbm(p: vec2<f32>) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var frequency = 1.0;
  
  for (var i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

// Authentic Pyrmont sandstone block pattern
fn sandstoneBlocks(uv: vec2<f32>) -> f32 {
  // Create realistic block pattern with mortar joints
  let block_size = vec2<f32>(0.3, 0.15); // Typical sandstone block proportions
  let block_uv = uv / block_size;
  let block_id = floor(block_uv);
  let block_local = fract(block_uv);
  
  // Mortar joint width
  let mortar_width = 0.08;
  let mortar_x = smoothstep(0.0, mortar_width, block_local.x) * smoothstep(1.0, 1.0 - mortar_width, block_local.x);
  let mortar_y = smoothstep(0.0, mortar_width, block_local.y) * smoothstep(1.0, 1.0 - mortar_width, block_local.y);
  
  return mortar_x * mortar_y;
}

// Weathering and age patterns specific to 1880s Pyrmont stone
fn weatheringPattern(uv: vec2<f32>, world_pos: vec3<f32>) -> f32 {
  // Surface weathering from 140+ years of exposure
  let age_weathering = fbm(uv * 6.0 + world_pos.xz * 0.08);
  
  // Rain streaking patterns (vertical emphasis)
  let rain_streaks = fbm(vec2<f32>(uv.x * 3.0, uv.y * 12.0));
  
  // Wind erosion (horizontal patterns)
  let wind_erosion = fbm(vec2<f32>(uv.x * 15.0, uv.y * 4.0));
  
  return mix(age_weathering, mix(rain_streaks, wind_erosion, 0.4), 0.6);
}

// Iron oxide staining typical of Pyrmont sandstone
fn ironStaining(uv: vec2<f32>, world_pos: vec3<f32>) -> f32 {
  // Iron-rich mineral deposits create characteristic staining
  let iron_deposits = fbm(uv * 8.0 + world_pos.xz * 0.03);
  
  // Vertical streaking from water runoff
  let vertical_stains = fbm(vec2<f32>(uv.x * 4.0, uv.y * 0.8));
  
  // Concentrated staining near mortar joints
  let joint_staining = 1.0 - sandstoneBlocks(uv);
  
  return max(0.0, iron_deposits - 0.3) * (0.4 + 0.6 * vertical_stains) * (0.7 + 0.3 * joint_staining);
}

// Surface roughness for realistic lighting
fn surfaceRoughness(uv: vec2<f32>) -> f32 {
  let detail_scale = 32.0;
  let fine_detail = fbm(uv * detail_scale) * 0.1;
  let medium_detail = fbm(uv * detail_scale * 0.5) * 0.2;
  
  return fine_detail + medium_detail;
}

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4<f32> {
  let uv = input.uv;
  let world_pos = input.world_position;
  let normal = normalize(input.normal);
  
  // Generate authentic Pyrmont sandstone texture layers
  let blocks = sandstoneBlocks(uv);
  let weathering = weatheringPattern(uv, world_pos);
  let iron_stain = ironStaining(uv, world_pos);
  let roughness = surfaceRoughness(uv);
  
  // Base sandstone color - start with authentic golden tone
  var base_color = SANDSTONE_BASE;
  
  // Apply block structure - mortar joints are darker
  base_color = mix(base_color, SANDSTONE_MORTAR, (1.0 - blocks) * 0.4);
  
  // Apply weathering - creates lighter weathered areas
  base_color = mix(base_color, SANDSTONE_LIGHT, weathering * 0.3);
  
  // Apply age staining - darker weathered areas
  base_color = mix(base_color, SANDSTONE_STAIN, weathering * 0.2);
  
  // Apply iron oxide staining - characteristic rust-colored streaks
  base_color = mix(base_color, SANDSTONE_STAIN, iron_stain * 0.5);
  
  // Lighting calculation
  let light_dir = normalize(uniforms.light_position - world_pos);
  let view_dir = normalize(-world_pos); // Assuming camera at origin
  let half_dir = normalize(light_dir + view_dir);
  
  // Modify normal with surface roughness
  let perturbed_normal = normalize(normal + vec3<f32>(roughness * 2.0 - 1.0, 0.0, roughness * 2.0 - 1.0) * 0.1);
  
  // Diffuse lighting
  let diffuse = max(0.0, dot(perturbed_normal, light_dir));
  
  // Specular lighting (subtle for sandstone)
  let specular = pow(max(0.0, dot(perturbed_normal, half_dir)), 16.0) * 0.1;
  
  // Ambient occlusion approximation - based on block structure and weathering
  let ao = 1.0 - ((1.0 - blocks) * 0.15 + weathering * 0.1);
  
  // Final color composition
  let ambient = 0.3;
  let final_color = base_color * (ambient * ao + diffuse * 0.8) + vec3<f32>(specular);
  
  // Add subtle subsurface scattering effect
  let subsurface = pow(max(0.0, dot(-light_dir, perturbed_normal)), 2.0) * 0.1;
  let sss_color = SANDSTONE_LIGHT * subsurface;
  
  return vec4<f32>(final_color + sss_color, 1.0);
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
  private noiseTexture: GPUTexture | null = null;
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

    // Generate noise texture
    await this.generateNoiseTexture();

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
        { binding: 2, resource: this.noiseTexture!.createView() },
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

  private async generateNoiseTexture(): Promise<void> {
    const size = 256;
    
    // Create compute shader for noise generation
    const computeShaderModule = this.device.createShaderModule({
      code: sandstoneComputeShader,
    });

    // Create storage buffer for noise data
    const noiseBuffer = this.device.createBuffer({
      size: size * size * 4, // f32 array
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Create compute pipeline
    const computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: computeShaderModule,
        entryPoint: 'cs_main',
      },
    });

    // Create bind group for compute
    const computeBindGroup = this.device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: noiseBuffer } }],
    });

    // Run compute shader
    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(size / 8), Math.ceil(size / 8));
    computePass.end();

    // Create texture
    this.noiseTexture = this.device.createTexture({
      size: [size, size, 1],
      format: 'r32float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    // Copy buffer to texture
    commandEncoder.copyBufferToTexture(
      { buffer: noiseBuffer, bytesPerRow: size * 4 },
      { texture: this.noiseTexture },
      [size, size, 1]
    );

    this.device.queue.submit([commandEncoder.finish()]);
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
