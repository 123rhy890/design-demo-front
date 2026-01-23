import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// 引入Element Plus及样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入路由
import router from './router'
// 引入Pinia
import { createPinia } from 'pinia'
// 引入axios
import axios from 'axios'
// 引入用户仓库
import { useUserStore } from './pinia/modules/userStore'

const app = createApp(App)
const pinia = createPinia()

// axios全局配置
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 5000
app.config.globalProperties.$axios = axios

// ✅ 方案二核心：项目启动自动登录，写入用户信息
app.use(pinia) // 必须先注册pinia
const userStore = useUserStore()
// 这里可以修改 role 切换角色：admin=管理员  teacher=老师  parent=家长
userStore.loginSave(
  { userId: '1001', userName: '系统测试账号', role: 'parent', avatar: '' },
  'auto_login_token_123456'
)

// 注册插件
app.use(router).use(ElementPlus)
app.mount('#app')