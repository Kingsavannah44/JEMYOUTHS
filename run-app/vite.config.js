import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy visual components
          'visual': ['./src/components/Scene3D', './src/components/TiltCard', './src/components/Reveal'],
          'firebase': ['firebase/app', 'firebase/firestore'],
        }
      }
    }
  }
})
