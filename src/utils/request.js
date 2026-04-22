import axios from 'axios'
import { ElMessage } from 'element-plus'
import Cookies from 'js-cookie'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 基础路径，匹配 vite.config.js 的代理
  timeout: 10000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = Cookies.get('token')
    if (token) {
      // 让每个请求携带 token
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 如果返回的状态码不是 200，说明接口报错了
    if (res.code !== 200) {
      ElMessage({
        message: res.msg || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 401: 未登录或 Token 过期
      if (res.code === 401) {
        // 清除 Token 并跳转登录页
        Cookies.remove('token')
        Cookies.remove('userInfo')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error)
    ElMessage({
      message: error.message || '系统异常',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
