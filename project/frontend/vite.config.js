import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 1001,
    proxy: {
      '/api': 'http://127.0.0.1:2001',
    },
  },
})
