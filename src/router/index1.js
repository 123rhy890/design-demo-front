import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../pinia/modules/userStore'
import { ElMessage } from 'element-plus'

// 静态路由-无需权限
const staticRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/Login.vue'),
    meta: { title: '儿童托管班管理系统-登录', hidden: true }
  },
  {
    path: '/',
    redirect: '/dashboard',
    component: () => import('../layout/Layout.vue'),
    meta: { hidden: true },
    children: []
  }
]

// 动态路由-按角色分配权限（核心！完全贴合你的脑图）
export const asyncRoutes = [
  // 首页-所有角色可见
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/dashboard/Dashboard.vue'),
    meta: { title: '数据看板', icon: 'House', roles: ['admin', 'teacher', 'parent'] }
  },
  // ========== 管理员专属路由 ==========
  {
    path: '/admin',
    name: 'Admin',
    meta: { title: '系统管理', icon: 'Setting', roles: ['admin'] },
    component: () => import('../layout/Layout.vue'),
    children: [
      { path: 'userAudit', name: 'UserAudit', component: () => import('../views/admin/UserAudit.vue'), meta: { title: '家长审核', roles: ['admin'] } },
      { path: 'roleAuth', name: 'RoleAuth', component: () => import('../views/admin/RoleAuth.vue'), meta: { title: '角色权限', roles: ['admin'] } },
      { path: 'feeManage', name: 'FeeManage', component: () => import('../views/admin/FeeManage.vue'), meta: { title: '费用管理', roles: ['admin'] } },
      { path: 'dataExport', name: 'DataExport', component: () => import('../views/admin/DataExport.vue'), meta: { title: '数据导出', roles: ['admin'] } }
    ]
  },
  // ========== 老师专属路由 ==========
  {
    path: '/teacher',
    name: 'Teacher',
    meta: { title: '教学管理', icon: 'UserFilled', roles: ['teacher'] },
    component: () => import('../layout/Layout.vue'),
    children: [
      { path: 'childList', name: 'ChildList', component: () => import('../views/teacher/ChildList.vue'), meta: { title: '儿童管理', roles: ['teacher'] } },
      { path: 'checkIn', name: 'CheckIn', component: () => import('../views/teacher/CheckIn.vue'), meta: { title: '接送签到', roles: ['teacher'] } },
      { path: 'dailyRecord', name: 'DailyRecord', component: () => import('../views/teacher/DailyRecord.vue'), meta: { title: '日常记录', roles: ['teacher'] } },
      { path: 'classManage', name: 'ClassManage', component: () => import('../views/teacher/ClassManage.vue'), meta: { title: '班级管理', roles: ['teacher'] } },
      { path: 'msgChat', name: 'MsgChat', component: () => import('../views/teacher/MsgChat.vue'), meta: { title: '家校沟通', roles: ['teacher'] } }
    ]
  },
  // ========== 家长专属路由 ==========
  {
    path: '/parent',
    name: 'Parent',
    meta: { title: '家长中心', icon: 'User', roles: ['parent'] },
    component: () => import('../layout/Layout.vue'),
    children: [
      { path: 'childBind', name: 'ChildBind', component: () => import('../views/parent/ChildBind.vue'), meta: { title: '儿童绑定', roles: ['parent'] } },
      { path: 'reserve', name: 'Reserve', component: () => import('../views/parent/Reserve.vue'), meta: { title: '托管预约', roles: ['parent'] } },
      { path: 'childInfo', name: 'ChildInfo', component: () => import('../views/parent/ChildInfo.vue'), meta: { title: '儿童信息', roles: ['parent'] } },
      { path: 'feeView', name: 'FeeView', component: () => import('../views/parent/FeeView.vue'), meta: { title: '费用查看', roles: ['parent'] } },
      { path: 'msgCenter', name: 'MsgCenter', component: () => import('../views/parent/MsgCenter.vue'), meta: { title: '消息中心', roles: ['parent'] } }
    ]
  },
  // 个人中心-所有角色可见
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/profile/Profile.vue'),
    meta: { title: '个人中心', icon: 'UserFilled', roles: ['admin', 'teacher', 'parent'] }
  },
  // 404页面
  { path: '/:pathMatch(.*)*', redirect: '/dashboard', meta: { hidden: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes
})

// 路由守卫-全局前置守卫：权限控制、登录校验
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  // 设置页面标题
  document.title = to.meta.title || '儿童托管班管理系统'
  // 访问登录页：放行
  if (to.path === '/login') {
    next()
    return
  }
  // 未登录访问其他页面：跳登录页
  if (!userStore.token) {
    ElMessage.warning('请先登录！')
    next('/login')
    return
  }
  // 已登录：判断是否有权限访问当前路由
  const hasRole = to.meta.roles ? to.meta.roles.includes(userStore.userInfo.role) : true
  if (hasRole) {
    next()
  } else {
    ElMessage.error('暂无权限访问该页面！')
    next(from.path)
  }
})

export default router