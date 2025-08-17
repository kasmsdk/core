import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Use relative paths for all asset references
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    // https: true, // Disabled for development - enable for WebXR testing
  },
  optimizeDeps: {
    exclude: ['wasm-ar']
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    assetsDir: '.', // Place all assets in the root of the output folder
    rollupOptions: {
      input: {
        main: 'index.html',
        kasm: 'kasm.html',
        emanator: 'emanator.html',
        bangaz: 'bangaz.html',
        arpy: 'arpy.html',
        about: 'about.html',
        webmidi: 'webmidi.html',
        webgpu: 'webgpu.html',
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/xr'],
        },
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]',
      },
    },
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    outDir: 'dist', // (default, but explicit)
    emptyOutDir: true,
  },
  esbuild: {
    drop: ['console', 'debugger'],
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  define: {
    global: 'globalThis',
  },
})
