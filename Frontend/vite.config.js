import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: true, // Listen on all local IP addresses
  //   port: 5173, // You can change this if you use a different port
  // }
})
