import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 配置@别名，方便导入文件
    }
  },
  server: {
    port: 5173, // 端口号
    open: true, // 自动打开浏览器
    proxy: {
      // 配置接口代理，解决跨域
      '/api': {
        target: 'http://localhost:8081', // 后端接口地址
        changeOrigin: true
        // rewrite: (path) => path.replace(/^\/api/, '') // 后端已有 /api 前缀，无需重写
      }
    }
  }
})