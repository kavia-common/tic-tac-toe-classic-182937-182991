import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration compatible with Vite v4 and Node 18
export default defineConfig({
  plugins: [react()],
})
