import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration compatible with Vite v4 and Node 18
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // equivalent to '0.0.0.0' in Vite v4
    port: 3000,
    allowedHosts: ['vscode-internal-15138-qa.qa01.cloud.kavia.ai'],
  },
})
