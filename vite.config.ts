import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL;
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',  // 모든 네트워크 인터페이스에서 접근 허용
      port: 5173,       // 기본 포트 명시
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('Sending Request to the Target:', proxyReq.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/socket.io': {
          target: apiUrl,
          ws: true,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
          }
        }
      }
    },
    css: {
      postcss: './postcss.config.cjs'
    }
  }
})
