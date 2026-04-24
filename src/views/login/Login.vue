<template>
  <div 
    class="login-page"
    :style="{
      backgroundImage: `url(${backgroundUrl})`,
    }"
  >
    <el-card class="login-card" style="width:400px;">
      <template #header>
        <div style="text-align:center;font-size:20px;font-weight:bold;color:#165DFF;">儿童托管班管理系统</div>
      </template>
      <el-form :model="loginForm" ref="loginRef" :rules="loginRules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item style="text-align:center;">
          <el-button type="primary" @click="handleLogin" size="default">登录系统</el-button>
          <el-button type="primary" @click="handleRegister" size="default">注册用户</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../pinia/modules/userStore'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import backgroundImg from '../../assets/Login.jpg'

const router = useRouter()
const userStore = useUserStore()
const loginRef = ref(null)

const backgroundUrl = backgroundImg

// 角色映射表：后端数字 -> 前端字符串
const roleMap = {
  0: 'admin',
  1: 'teacher',
  2: 'parent'
}

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
})

// 表单校验规则
const loginRules = ref({
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

// 登录逻辑
const handleLogin = () => {
  loginRef.value.validate((valid) => {
    if (valid) {
      // 真实接口请求
      request.post('/user/login', {
        username: loginForm.value.username,
        password: loginForm.value.password
      }).then(res => {
        const { user, token } = res.data
        
        // 构建用户信息
        const userInfo = {
          userId: user.userId,
          userName: user.username,
          role: roleMap[user.roleType],
          avatar: ''
        }
        
        // 存储用户信息到Pinia
        userStore.loginSave(userInfo, token)
        ElMessage.success('登录成功！')
        // 跳转到首页
        router.push('/dashboard')
      }).catch(err => {
        console.error('登录失败:', err)
      })
    } else {
      ElMessage.error('请完善登录信息！')
      return false
    }
  })
}

const handleRegister = () => {
  console.log('注册测试')
}
</script>

<style scoped>
.login-page {
  width: 100%;
  height: 100vh;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.login-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.login-form {
  margin-top: 20px;
}

/* 移除 el-form-item__content 的 margin-left */
:deep(.el-form-item__content) {
  margin-left: 0 !important;
  justify-content: center !important;
}
</style>