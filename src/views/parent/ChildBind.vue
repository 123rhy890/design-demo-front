<!-- 
  模块：【家长-账户管理】
  功能：绑定儿童信息、解绑儿童、查看绑定状态、提交绑定审核申请
-->
<template>
  <div class="parent-child-bind">
    <!-- 已绑定儿童列表 -->
    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <span>我的孩子</span>
          <el-button type="primary" @click="showBindDialog">
            <el-icon><Plus /></el-icon>
            添加孩子信息
          </el-button>
        </div>
      </template>

      <el-row :gutter="20" v-if="boundChildren.length > 0">
        <el-col :span="8" v-for="child in boundChildren" :key="child.id">
          <el-card class="child-card" shadow="hover">
            <div class="child-avatar">
              <el-avatar :size="80">
                {{ child.name.charAt(0) }}
              </el-avatar>
            </div>
            <div class="child-info">
              <h3>{{ child.name }}</h3>
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span>{{ child.gender === 1 ? '男' : '女' }} · {{ child.age }}岁</span>
              </div>
              <div class="info-item">
                <el-icon><School /></el-icon>
                <span>{{ child.className || '未分班' }}</span>
              </div>
            </div>
            <el-divider />
            <div class="child-actions">
              <el-button type="danger" size="small" @click="unbindChild(child)">
                解除绑定
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty description="还没有绑定孩子，快去添加吧" v-else />
    </el-card>

    <!-- 绑定儿童弹窗 -->
    <el-dialog v-model="bindDialogVisible" title="添加儿童信息" width="500px">
      <el-form :model="bindForm" :rules="bindRules" ref="bindFormRef" label-width="100px">
        <el-form-item label="儿童姓名" prop="childName">
          <el-input v-model="bindForm.childName" placeholder="请输入儿童姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="bindForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期" prop="birthDate">
          <el-date-picker
            v-model="bindForm.birthDate"
            type="date"
            placeholder="选择出生日期"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="紧急联系人" prop="emergencyContact">
          <el-input v-model="bindForm.emergencyContact" placeholder="请输入紧急联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="emergencyPhone">
          <el-input v-model="bindForm.emergencyPhone" placeholder="请输入紧急联系电话" />
        </el-form-item>
        <el-form-item label="特殊需求">
          <el-input v-model="bindForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息（如过敏史等）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBind" :loading="submitting">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, School } from '@element-plus/icons-vue'
import { useUserStore } from '../../pinia/modules/userStore'
import request from '../../utils/request'

const userStore = useUserStore()

// 已绑定儿童列表
const boundChildren = ref([])
const loading = ref(false)

// 获取已绑定儿童
const fetchChildren = async () => {
  loading.value = true
  const parentId = userStore.userInfo.userId
  try {
    const res = await request.get(`/child/parent/${parentId}`)
    boundChildren.value = res.data.map(c => ({
      id: c.childId,
      name: c.childName,
      gender: c.gender,
      age: calculateAge(c.birthDate),
      className: c.classInfo ? c.classInfo.className : '未分班'
    }))
  } catch (err) {
    console.error('获取儿童列表失败', err)
  } finally {
    loading.value = false
  }
}

// 计算年龄
const calculateAge = (birthday) => {
  if (!birthday) return '-'
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// 绑定儿童弹窗
const bindDialogVisible = ref(false)
const bindFormRef = ref(null)
const submitting = ref(false)
const bindForm = reactive({
  childName: '',
  gender: 1,
  birthDate: '',
  emergencyContact: '',
  emergencyPhone: '',
  remark: ''
})

const bindRules = {
  childName: [{ required: true, message: '请输入儿童姓名', trigger: 'blur' }],
  birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  emergencyContact: [{ required: true, message: '请输入紧急联系人', trigger: 'blur' }],
  emergencyPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const showBindDialog = () => {
  Object.assign(bindForm, {
    childName: '',
    gender: 1,
    birthDate: '',
    emergencyContact: '',
    emergencyPhone: '',
    remark: ''
  })
  bindDialogVisible.value = true
}

const submitBind = () => {
  bindFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      const parentId = userStore.userInfo.userId
      try {
        await request.post(`/child/add?parentId=${parentId}`, {
          childName: bindForm.childName,
          gender: bindForm.gender,
          birthDate: bindForm.birthDate.toISOString().split('T')[0],
          emergencyContact: bindForm.emergencyContact,
          emergencyPhone: bindForm.emergencyPhone,
          remark: bindForm.remark
        })
        ElMessage.success('儿童信息添加成功！')
        bindDialogVisible.value = false
        fetchChildren()
      } catch (err) {
        console.error('添加失败', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

const unbindChild = (child) => {
  ElMessageBox.confirm(`确定要解除与 ${child.name} 的绑定吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.delete(`/child/delete/${child.id}`)
      ElMessage.success('已解除绑定')
      fetchChildren()
    } catch (err) {
      console.error('解除绑定失败', err)
    }
  })
}

onMounted(() => {
  fetchChildren()
})
</script>

<style scoped>
.parent-child-bind { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.child-card { text-align: center; margin-bottom: 20px; }
.child-avatar { margin-bottom: 15px; }
.child-info h3 { margin: 10px 0; }
.info-item { display: flex; align-items: center; justify-content: center; gap: 8px; color: #666; font-size: 14px; margin-bottom: 5px; }
.child-actions { display: flex; justify-content: center; gap: 10px; }
</style>
