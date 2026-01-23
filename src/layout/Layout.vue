<template>
  <div class="layout-container" style="width:100%;height:100vh;display:flex;flex-direction:column;">
    <!-- 顶部导航栏 -->
    <div class="layout-header" style="height:60px;background:#fff;border-bottom:1px solid #e6e6e6;padding:0 20px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:18px;font-weight:bold;color:#165DFF;">儿童托管班管理系统</div>
      <div style="display:flex;align-items:center;">
        <span>欢迎您：{{ userStore.userInfo.userName }}</span>
        <el-button type="text" icon="UserFilled" @click="$router.push('/profile')">个人中心</el-button>
        <el-button type="text" icon="SwitchButton" @click="handleLogout">退出登录</el-button>
      </div>
    </div>
    <!-- 主体内容：侧边栏+主内容 -->
    <div style="display:flex;flex:1;overflow:hidden;">
      <!-- 侧边栏 -->
      <div class="layout-sidebar" style="width:220px;background:#fff;border-right:1px solid #e6e6e6;height:100%;overflow:auto;">
        <el-menu 
          default-active="/dashboard" 
          router 
          mode="vertical"
          text-color="#333"
          active-text-color="#165DFF"
          unique-opened
        >
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <!-- 管理员菜单 -->
          <el-sub-menu index="/admin" v-if="userStore.getRole === 'admin'">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/admin/userAudit">家长审核</el-menu-item>
            <el-menu-item index="/admin/roleAuth">角色权限</el-menu-item>
            <el-menu-item index="/admin/feeManage">费用管理</el-menu-item>
            <el-menu-item index="/admin/dataExport">数据导出</el-menu-item>
          </el-sub-menu>
          <!-- 老师菜单 -->
          <el-sub-menu index="/teacher" v-if="userStore.getRole === 'teacher'">
            <template #title>
              <el-icon><UserFilled /></el-icon>
              <span>教学管理</span>
            </template>
            <el-menu-item index="/teacher/childList">儿童管理</el-menu-item>
            <el-menu-item index="/teacher/checkIn">接送签到</el-menu-item>
            <el-menu-item index="/teacher/dailyRecord">日常记录</el-menu-item>
            <el-menu-item index="/teacher/classManage">班级管理</el-menu-item>
            <el-menu-item index="/teacher/msgChat">家校沟通</el-menu-item>
          </el-sub-menu>
          <!-- 家长菜单 -->
          <el-sub-menu index="/parent" v-if="userStore.getRole === 'parent'">
            <template #title>
              <el-icon><User /></el-icon>
              <span>家长中心</span>
            </template>
            <el-menu-item index="/parent/childBind">儿童绑定</el-menu-item>
            <el-menu-item index="/parent/reserve">托管预约</el-menu-item>
            <el-menu-item index="/parent/childInfo">儿童信息</el-menu-item>
            <el-menu-item index="/parent/feeView">费用查看</el-menu-item>
            <el-menu-item index="/parent/msgCenter">消息中心</el-menu-item>
          </el-sub-menu>
          <!-- 个人中心 -->
          <el-menu-item index="/profile">
            <el-icon><UserFilled /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
        </el-menu>
      </div>
      <!-- 主内容区域 -->
      <div class="main-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../pinia/modules/userStore'
import { ElMessage } from 'element-plus'
import { House, Setting, UserFilled, User, SwitchButton } from '@element-plus/icons-vue'

const userStore = useUserStore()

// 退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('退出登录成功！')
  window.location.href = '/login'
}
</script>