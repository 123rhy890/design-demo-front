import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: Cookies.get('token') || '',
    userInfo: {
      userId: '',
      userName: '',
      role: '', // 核心：区分角色 admin-管理员 teacher-老师 parent-家长
      avatar: ''
    },
    sidebar: true // 侧边栏展开/收起
  }),
  actions: {
    // 登录-存储用户信息
    loginSave (userInfo, token) {
      this.token = token
      this.userInfo = userInfo
      Cookies.set('token', token, { expires: 7 }) // token缓存7天
    },
    // 退出登录-清空数据
    logout () {
      this.token = ''
      this.userInfo = { userId: '', userName: '', role: '', avatar: '' }
      Cookies.remove('token')
    },
    // 更新用户信息
    updateUserInfo (info) {
      this.userInfo = { ...this.userInfo, ...info }
    }
  },
  getters: {
    // 获取当前用户角色
    getRole: state => state.userInfo.role,
    // 是否已登录
    isLogin: state => !!state.token
  }
})