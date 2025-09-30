import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ważne dla Firebase Hosting
  publicDir: 'public', // Folder z plikami statycznymi
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Wyłącz sourcemap dla produkcji
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  define: {
    // Definiuj zmienne środowiskowe dla build
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Wymuś URL API dla produkcji
    'import.meta.env.VITE_API_URL': JSON.stringify('https://next-review-booster.onrender.com'),
    'import.meta.env.PROD': JSON.stringify(true)
  }
})
