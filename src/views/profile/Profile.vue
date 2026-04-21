<!-- 
  模块：【公共-所有角色通用】
  功能：个人信息查看、账号密码修改、头像上传、个人资料编辑、登录日志查看
-->
<template>
  <div class="profile-page">
    <!-- 顶部标题与返回按钮 -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="text" @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <h3>个人中心</h3>
      </div>
      <el-button type="text" @click="refreshData">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </div>

    <!-- 主内容区：分标签页展示不同功能 -->
    <el-card class="profile-card">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <!-- 1. 个人信息标签页 -->
        <el-tab-pane label="基本信息" name="baseInfo">
          <div class="base-info-container">
            <!-- 左侧头像区域 -->
            <div class="avatar-section">
              <el-upload
                class="avatar-uploader"
                action="/api/upload/avatar"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                :headers="uploadHeaders"
              >
                <img v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="avatar-tips">
                <p>点击上传/更换头像</p>
                <p class="text-sm">支持JPG/PNG格式，大小不超过2MB</p>
              </div>
            </div>

            <!-- 右侧信息展示与编辑（改为竖向布局） -->
            <div class="info-section">
              <el-descriptions :column="1" border :data="userInfo" class="info-descriptions">
                <el-descriptions-item label="用户ID">{{ userInfo.id || '-' }}</el-descriptions-item>
                <el-descriptions-item label="账号">{{ userInfo.username || '-' }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ userInfo.realName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="角色">{{ userInfo.roleName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ userInfo.phone || '-' }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ userInfo.email || '-' }}</el-descriptions-item>
                <el-descriptions-item label="性别">{{ userInfo.gender === 1 ? '男' : userInfo.gender === 0 ? '女' : '-' }}</el-descriptions-item>
                <el-descriptions-item label="入职/注册时间">{{ userInfo.createTime || '-' }}</el-descriptions-item>
                <el-descriptions-item label="最后登录时间">{{ userInfo.lastLoginTime || '-' }}</el-descriptions-item>
                <el-descriptions-item label="账号状态">
                  <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
                    {{ userInfo.status === 1 ? '正常' : '禁用' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <el-button type="primary" icon="Edit" class="edit-btn" @click="openEditDialog">
                编辑个人资料
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 2. 密码修改标签页 -->
        <el-tab-pane label="修改密码" name="changePwd">
          <div class="change-pwd-container">
            <el-form
              :model="pwdForm"
              :rules="pwdRules"
              ref="pwdFormRef"
              label-width="120px"
              class="pwd-form"
            >
              <el-form-item label="原密码" prop="oldPwd">
                <el-input
                  v-model="pwdForm.oldPwd"
                  type="password"
                  placeholder="请输入原密码"
                  show-password
                />
              </el-form-item>
              <el-form-item label="新密码" prop="newPwd">
                <el-input
                  v-model="pwdForm.newPwd"
                  type="password"
                  placeholder="请输入新密码（8-20位，包含字母和数字）"
                  show-password
                />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPwd">
                <el-input
                  v-model="pwdForm.confirmPwd"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitChangePwd">提交修改</el-button>
                <el-button @click="resetPwdForm">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 3. 登录日志标签页 -->
        <el-tab-pane label="登录日志" name="loginLog">
          <div class="login-log-container">
            <!-- 筛选条件 -->
            <el-form :model="logSearchForm" inline class="log-search-form">
              <el-form-item label="登录时间">
                <el-date-picker
                  v-model="logSearchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 300px"
                />
              </el-form-item>
              <el-form-item label="登录状态">
                <el-select v-model="logSearchForm.loginStatus" placeholder="请选择状态" style="width: 150px">
                  <el-option label="成功" value="1" />
                  <el-option label="失败" value="0" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="Search" @click="searchLoginLog">查询</el-button>
                <el-button icon="Refresh" @click="resetLogSearch">重置</el-button>
              </el-form-item>
            </el-form>

            <!-- 日志列表 -->
            <el-table
              :data="loginLogList"
              border
              stripe
              style="width: 100%"
              :loading="logLoading"
              v-loading="logLoading"
            >
              <el-table-column prop="id" label="序号" width="80" />
              <el-table-column prop="loginTime" label="登录时间" width="180" />
              <el-table-column prop="ipAddress" label="登录IP" width="150" />
              <el-table-column prop="loginLocation" label="登录地点" width="200" />
              <el-table-column prop="device" label="登录设备" width="200" />
              <el-table-column prop="browser" label="浏览器" width="150" />
              <el-table-column prop="loginStatus" label="登录状态" width="120">
                <template #default="scope">
                  <el-tag :type="scope.row.loginStatus === 1 ? 'success' : 'danger'">
                    {{ scope.row.loginStatus === 1 ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="failReason" label="失败原因" />
            </el-table>

            <!-- 分页 -->
            <el-pagination
              @size-change="handleLogSizeChange"
              @current-change="handleLogCurrentChange"
              :current-page="logPagination.pageNum"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="logPagination.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="logPagination.total"
              style="margin-top: 20px; text-align: center"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 编辑个人资料弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑个人资料" width="500px">
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="editForm.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio label="1">男</el-radio>
            <el-radio label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditForm">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowLeft, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 激活的标签页
const activeTab = ref('baseInfo')

// ========== 1. 基本信息相关 ==========
// 用户信息
const userInfo = ref({
  id: 'admin1001',
  username: 'admin',
  realName: '系统管理员',
  roleName: '超级管理员',
  phone: '13800138000',
  email: 'admin@example.com',
  gender: 1,
  avatar: '', // 初始无头像
  createTime: '2024-01-01 10:00:00',
  lastLoginTime: '2026-03-01 17:06:28',
  status: 1
})

// 上传请求头（实际项目中需携带token）
const uploadHeaders = ref({
  'Authorization': 'Bearer ' + localStorage.getItem('token') || ''
})

// 头像上传成功回调
const handleAvatarSuccess = (res) => {
  if (res.code === 200) {
    userInfo.value.avatar = res.data.avatarUrl
    ElMessage.success('头像上传成功！')
  } else {
    ElMessage.error('头像上传失败：' + res.msg)
  }
}

// 头像上传前校验
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('头像只能是 JPG/PNG 格式！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB！')
    return false
  }
  return true
}

// 编辑资料弹窗相关
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  realName: '',
  phone: '',
  email: '',
  gender: '1'
})
const editRules = ref({
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ 
    required: true, 
    message: '请输入正确的手机号', 
    trigger: 'blur',
    pattern: /^1[3-9]\d{9}$/
  }],
  email: [{ 
    required: true, 
    message: '请输入正确的邮箱', 
    trigger: 'blur',
    type: 'email'
  }]
})

// 打开编辑弹窗
const openEditDialog = () => {
  // 初始化表单数据
  editForm.realName = userInfo.value.realName
  editForm.phone = userInfo.value.phone
  editForm.email = userInfo.value.email
  editForm.gender = userInfo.value.gender + ''
  editDialogVisible.value = true
}

// 提交编辑表单
const submitEditForm = () => {
  editFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟接口请求更新资料
      ElMessage.success('资料修改中...')
      setTimeout(() => {
        // 更新用户信息
        userInfo.value.realName = editForm.realName
        userInfo.value.phone = editForm.phone
        userInfo.value.email = editForm.email
        userInfo.value.gender = Number(editForm.gender)
        
        editDialogVisible.value = false
        ElMessage.success('个人资料修改成功！')
      }, 800)
    }
  })
}

// ========== 2. 密码修改相关 ==========
const pwdFormRef = ref(null)
const pwdForm = reactive({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})
const pwdRules = ref({
  oldPwd: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPwd: [{ 
    required: true, 
    message: '请输入新密码', 
    trigger: 'blur',
    pattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/
  }],
  confirmPwd: [{ 
    required: true, 
    message: '请确认新密码', 
    trigger: 'blur',
    validator: (rule, value, callback) => {
      if (value !== pwdForm.newPwd) {
        callback(new Error('两次输入的密码不一致！'))
      } else {
        callback()
      }
    }
  }]
})

// 提交密码修改
const submitChangePwd = () => {
  pwdFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟接口请求修改密码
      ElMessage.success('密码修改中...')
      setTimeout(() => {
        ElMessageBox.confirm(
          '密码修改成功！请重新登录',
          '修改成功',
          {
            confirmButtonText: '确定',
            type: 'success'
          }
        ).then(() => {
          // 清空密码表单
          resetPwdForm()
          // 实际项目中需跳转到登录页并清除token
          // window.location.href = '/login'
        })
      }, 1000)
    }
  })
}

// 重置密码表单
const resetPwdForm = () => {
  pwdFormRef.value?.resetFields()
  Object.assign(pwdForm, { oldPwd: '', newPwd: '', confirmPwd: '' })
}

// ========== 3. 登录日志相关 ==========
// 日志搜索表单
const logSearchForm = reactive({
  dateRange: [],
  loginStatus: ''
})
// 日志加载状态
const logLoading = ref(false)
// 日志分页
const logPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 28
})
// 登录日志列表
const loginLogList = ref([
  {
    id: 1,
    loginTime: '2026-03-01 17:06:28',
    ipAddress: '192.168.1.100',
    loginLocation: '北京市 朝阳区',
    device: 'Windows 10 64位',
    browser: 'Chrome 124.0',
    loginStatus: 1,
    failReason: ''
  },
  {
    id: 2,
    loginTime: '2026-02-28 18:20:15',
    ipAddress: '192.168.1.101',
    loginLocation: '北京市 海淀区',
    device: 'MacOS 14.0',
    browser: 'Safari 17.0',
    loginStatus: 1,
    failReason: ''
  },
  {
    id: 3,
    loginTime: '2026-02-27 10:05:40',
    ipAddress: '10.0.0.5',
    loginLocation: '未知位置',
    device: 'Android 14',
    browser: '微信浏览器',
    loginStatus: 0,
    failReason: '密码错误'
  }
])

// 搜索登录日志
const searchLoginLog = () => {
  logLoading.value = true
  // 模拟接口请求
  setTimeout(() => {
    logLoading.value = false
    ElMessage.success('日志查询成功！')
  }, 600)
}

// 重置日志搜索
const resetLogSearch = () => {
  Object.assign(logSearchForm, { dateRange: [], loginStatus: '' })
}

// 日志分页事件
const handleLogSizeChange = (val) => {
  logPagination.pageSize = val
  searchLoginLog()
}
const handleLogCurrentChange = (val) => {
  logPagination.pageNum = val
  searchLoginLog()
}

// ========== 通用方法 ==========
// 返回上一页
const goBack = () => {
  router.back()
}

// 标签页切换
const handleTabChange = (tab) => {
  // 切换到登录日志时自动加载数据
  if (tab === 'loginLog' && loginLogList.value.length === 0) {
    searchLoginLog()
  }
}

// 刷新数据
const refreshData = () => {
  ElMessage.success('数据刷新成功！')
  // 模拟重新加载用户信息
  setTimeout(() => {
    userInfo.value.lastLoginTime = new Date().toLocaleString()
  }, 500)
}

// 初始化
onMounted(() => {
  // 初始化日志默认时间范围（近7天）
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 7 * 24 * 60 * 60 * 1000)
  logSearchForm.dateRange = [start, end]
  
  // 加载用户信息和登录日志
  searchLoginLog()
})
</script>

<style scoped>
.profile-page {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 14px;
  color: #409eff;
}

.profile-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 基本信息样式 */
.base-info-container {
  display: flex;
  gap: 40px;
  padding: 20px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 200px;
}

.avatar-uploader {
  width: 160px;
  height: 160px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c8c8c;
  width: 160px;
  height: 160px;
  text-align: center;
  line-height: 160px;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.avatar-tips {
  margin-top: 15px;
  text-align: center;
  color: #666;
}

.text-sm {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.info-section {
  flex: 1;
}

.info-descriptions {
  margin-bottom: 20px;
}

.edit-btn {
  margin-top: 10px;
}

/* 修改密码样式（横向居中） */
.change-pwd-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.pwd-form {
  width: 500px;
}

/* 登录日志样式（内容居中） */
.login-log-container {
  padding: 20px;
  text-align: center;
}

.log-search-form {
  margin-bottom: 20px;
  text-align: left;
}
</style>