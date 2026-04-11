/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173
  },
  // 프로덕션 빌드 시 모든 asset 경로가 /pcms/ 기준으로 생성됨
  base: process.env.NODE_ENV === 'production' ? '/pcms/' : '/',
  test: {
    globals: true,
    environment: 'node',
  },
})