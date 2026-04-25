import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2015'   // 让 esbuild 把 ?. ?? 等新语法转为 ES2015 兼容代码
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
