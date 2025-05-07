import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // 모든 네트워크 인터페이스에서 접근 허용
    port: 5173,       // 기본 포트 명시
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5002',
        ws: true,
        changeOrigin: true
      }
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  }
})
