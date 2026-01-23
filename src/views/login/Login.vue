<template>
  <div style="width:100%;height:100vh;background:#f5f7fa;display:flex;justify-content:center;align-items:center;">
    <el-card class="login-card" style="width:400px;">
      <template #header>
        <div style="text-align:center;font-size:20px;font-weight:bold;color:#165DFF;">儿童托管班管理系统1111</div>
      </template>
      <el-form :model="loginForm" ref="loginRef" :rules="loginRules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="loginForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="老师" value="teacher" />
            <el-option label="家长" value="parent" />
          </el-select>
        </el-form-item>
        <el-form-item style="text-align:center;">
          <el-button type="primary" @click="handleLogin" size="default">登录系统</el-button>
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

const router = useRouter()
const userStore = useUserStore()
const loginRef = ref(null)

// 登录表单
const loginForm = ref({
  username: '',
  password: '',
  role: ''
})

// 表单校验规则
const loginRules = ref({
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
})

// 登录逻辑
const handleLogin = () => {
  loginRef.value.validate((valid) => {
    if (valid) {
      // 模拟登录请求-实际开发替换为真实接口请求
      const mockToken = 'kidscare_' + new Date().getTime()
      const mockUserInfo = {
        userId: '1001',
        userName: loginForm.value.username,
        role: loginForm.value.role,
        avatar: ''
      }
      // 存储用户信息到Pinia
      userStore.loginSave(mockUserInfo, mockToken)
      ElMessage.success('登录成功！')
      // 跳转到首页
      router.push('/dashboard')
    } else {
      ElMessage.error('请完善登录信息！')
      return false
    }
  })
}
</script>