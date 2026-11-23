import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IP addresses
    port: 5173, // You can change this if you use a different port
    // allowedHosts: ['.trycloudflare.com'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;

          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return 'react-vendor';
          }
          if (id.includes('/node_modules/@nextui-org/')) {
            return 'ui-vendor';
          }
          if (/\/node_modules\/(redux|@reduxjs|react-redux|redux-persist)\//.test(id)) {
            return 'state-vendor';
          }
          if (/\/node_modules\/(recharts|d3-)/.test(id)) {
            return 'charts-vendor';
          }
        },
      },
    },
  }
})
