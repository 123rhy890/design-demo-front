import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: Cookies.get('token') || '',
    userInfo: JSON.parse(Cookies.get('userInfo') || '{"userId":"","userName":"","role":"","avatar":""}'),
    sidebar: true // 侧边栏展开/收起
  }),
  actions: {
    // 登录-存储用户信息
    loginSave (userInfo, token) {
      this.token = token
      this.userInfo = userInfo
      Cookies.set('token', token, { expires: 7 }) // token缓存7天
      Cookies.set('userInfo', JSON.stringify(userInfo), { expires: 7 }) // 用户信息也缓存7天
    },
    // 退出登录-清空数据
    logout () {
      this.token = ''
      this.userInfo = { userId: '', userName: '', role: '', avatar: '' }
      Cookies.remove('token')
      Cookies.remove('userInfo')
    },
    // 更新用户信息
    updateUserInfo (info) {
      this.userInfo = { ...this.userInfo, ...info }
      Cookies.set('userInfo', JSON.stringify(this.userInfo), { expires: 7 })
    }
  },
  getters: {
    // 获取当前用户角色
    getRole: state => state.userInfo.role,
    // 是否已登录
    isLogin: state => !!state.token
  }
})