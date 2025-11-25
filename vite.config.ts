import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the browser so standard code works
      'process.env': env
    },
    server: {
        host: '0.0.0.0',
        port: 3000,
        allowedHosts: [
            '65459237bf09.ngrok-free.app',
            'yellowdevtest23252345.loca.lt'
        ]
    }
  }
})