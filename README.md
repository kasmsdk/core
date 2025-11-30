# KasmSDK Core

React, Three.js, and WebGPU/WebMIDI playground for exploring cutting-edge web technologies.

## Features

- **Pose Detection**: Real-time human pose tracking using TensorFlow.js
- **POI Gesture Detection**: Advanced gesture recognition via external WASM module (see below)
- **3D Graphics**: Interactive 3D scenes with Three.js and React Three Fiber
- **WebMIDI**: MIDI device integration for musical applications
- **WebXR**: Virtual reality support (experimental)

## POI Module (External)

The Points of Interest (POI) gesture detection module is maintained as a separate private repository at `~/workspace/poi`. To use it:

1. Build and sync from POI repo:
   ```bash
   cd ~/workspace/poi
   ./sync_to_core.sh
   ```

2. WASM files will be copied to `public/poi/`
3. TypeScript wrapper will be at `src/utils/poi/poiWasm.ts`

The core project gracefully handles the absence of POI - if WASM files aren't present, pose detection works without advanced gesture recognition.

## Getting Started

### Prerequisites

- Node.js and npm
- (Optional) Rust and wasm-pack for other WASM modules

### Installation

```bash
git clone --recursive https://github.com/kasmsdk/core.git
cd core
npm install
```

### Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Project Structure

```
core/
├── src/
│   ├── components/       # React components
│   │   ├── Triggaz.tsx   # Pose detection demo
│   │   └── ...
│   ├── utils/
│   │   └── poi/          # POI WASM wrapper (synced from external repo)
│   └── ...
├── public/
│   └── poi/              # POI WASM binaries (synced from external repo)
└── ...
```

## Contributing

Make things better, submit GitHub issues and PRs at https://github.com/kasmsdk/core/issues

## License

Open Source - See LICENSE file for details

Note: POI module is proprietary and maintained separately.
