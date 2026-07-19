import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Pinned (rather than left to Vite's auto-increment) because the backend's
    // CORS policy allowlists this exact origin — see effective-happiness's
    // ProviderRegistryModule.cs and friends. Fail loudly instead of silently
    // drifting to 5174+ and breaking CORS.
    port: 5173,
    strictPort: true,
  },
})
