import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      // 백엔드(ildan-nawa-backend)로 API 요청 전달. 카카오/네이버 키는 백엔드에서만 관리.
      '/api': 'http://localhost:3001',
    },
  },
});
