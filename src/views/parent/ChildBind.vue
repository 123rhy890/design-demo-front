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
              <el-button type="primary" size="small" @click="showEditDialog(child)">
                修改信息
              </el-button>
              <el-button type="danger" size="small" @click="unbindChild(child)">
                解除绑定
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty description="还没有绑定孩子，快去添加吧" v-else />
    </el-card>

    <!-- 绑定申请记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>绑定申请记录</span>
        </div>
      </template>
      <el-table :data="applyRecords" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="儿童姓名" width="120" />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column prop="status" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditor" label="审核人" width="120" />
        <el-table-column prop="auditTime" label="审核时间" width="180" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- 绑定儿童弹窗 -->
    <el-dialog v-model="bindDialogVisible" title="添加儿童信息" width="500px">
      <el-form :model="bindForm" :rules="bindRules" ref="bindFormRef" label-width="100px">
        <el-form-item label="儿童姓名" prop="childName">
          <el-input v-model="bindForm.childName" placeholder="请输入儿童姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="bindForm.idCard" placeholder="请输入身份证号" />
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

    <!-- 修改儿童信息弹窗 -->
    <el-dialog v-model="editDialogVisible" title="修改儿童信息" width="500px">
      <el-form :model="editForm" :rules="bindRules" ref="editFormRef" label-width="100px">
        <el-form-item label="儿童姓名" prop="childName">
          <el-input v-model="editForm.childName" placeholder="请输入儿童姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="editForm.idCard" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期" prop="birthDate">
          <el-date-picker
            v-model="editForm.birthDate"
            type="date"
            placeholder="选择出生日期"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="紧急联系人" prop="emergencyContact">
          <el-input v-model="editForm.emergencyContact" placeholder="请输入紧急联系人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="emergencyPhone">
          <el-input v-model="editForm.emergencyPhone" placeholder="请输入紧急联系电话" />
        </el-form-item>
        <el-form-item label="特殊需求">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息（如过敏史等）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitting">确认修改</el-button>
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
const applyRecords = ref([])
const loading = ref(false)

// 获取已绑定儿童
const fetchChildren = async () => {
  loading.value = true
  const parentId = userStore.userInfo.userId
  try {
    const res = await request.get(`/child/parent/${parentId}`)
    // 过滤已通过的儿童显示在卡片中 (status为1或null的都视为已通过，兼容历史数据)
    boundChildren.value = res.data.filter(c => c.status === 1 || c.status === null).map(c => ({
      id: c.childId,
      name: c.childName,
      gender: c.gender,
      age: calculateAge(c.birthDate),
      birthDate: c.birthDate,
      idCard: c.idCard,
      emergencyContact: c.emergencyContact,
      emergencyPhone: c.emergencyPhone,
      remark: c.remark,
      className: c.classInfo ? c.classInfo.className : '未分班'
    }))

    // 所有申请记录显示在表格中
    applyRecords.value = res.data.map(c => ({
      id: c.childId,
      name: c.childName,
      applyTime: c.createTime ? c.createTime.replace('T', ' ') : '-',
      status: c.status === null ? 1 : c.status, // null 默认为已通过
      auditor: c.auditorName || '-',
      auditTime: c.auditTime ? c.auditTime.replace('T', ' ') : '-',
      remark: c.remark || '无'
    }))
  } catch (err) {
    console.error('获取儿童列表失败', err)
  } finally {
    loading.value = false
  }
}

// 状态类型
const getStatusType = (status) => {
  if (status === null) return 'success'
  switch (status) {
    case 0: return 'warning' // 待审核
    case 1: return 'success' // 已通过
    case 2: return 'danger'  // 已驳回
    default: return 'info'
  }
}

// 状态文本
const getStatusText = (status) => {
  if (status === null) return '已通过'
  switch (status) {
    case 0: return '待审核'
    case 1: return '已通过'
    case 2: return '已驳回'
    default: return '未知'
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
  idCard: '',
  gender: 1,
  birthDate: '',
  emergencyContact: '',
  emergencyPhone: '',
  remark: ''
})

const bindRules = {
  childName: [{ required: true, message: '请输入儿童姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  emergencyContact: [{ required: true, message: '请输入紧急联系人', trigger: 'blur' }],
  emergencyPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

const showBindDialog = () => {
  Object.assign(bindForm, {
    childName: '',
    idCard: '',
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
          idCard: bindForm.idCard,
          gender: bindForm.gender,
          birthDate: bindForm.birthDate instanceof Date ? bindForm.birthDate.toISOString().split('T')[0] : bindForm.birthDate,
          emergencyContact: bindForm.emergencyContact,
          emergencyPhone: bindForm.emergencyPhone,
          remark: bindForm.remark,
          status: 0 // 默认为待审核
        })
        ElMessage.success('申请提交成功，请等待管理员审核！')
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

// 修改儿童信息弹窗
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  childId: null,
  childName: '',
  idCard: '',
  gender: 1,
  birthDate: '',
  emergencyContact: '',
  emergencyPhone: '',
  remark: ''
})

const showEditDialog = (child) => {
  Object.assign(editForm, {
    childId: child.id,
    childName: child.name,
    idCard: child.idCard,
    gender: child.gender,
    birthDate: child.birthDate,
    emergencyContact: child.emergencyContact,
    emergencyPhone: child.emergencyPhone,
    remark: child.remark
  })
  editDialogVisible.value = true
}

const submitEdit = () => {
  editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await request.put(`/child/update/${editForm.childId}`, {
          childName: editForm.childName,
          idCard: editForm.idCard,
          gender: editForm.gender,
          birthDate: editForm.birthDate instanceof Date ? editForm.birthDate.toISOString().split('T')[0] : editForm.birthDate,
          emergencyContact: editForm.emergencyContact,
          emergencyPhone: editForm.emergencyPhone,
          remark: editForm.remark
        })
        ElMessage.success('儿童信息修改成功！')
        editDialogVisible.value = false
        fetchChildren()
      } catch (err) {
        console.error('修改失败', err)
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
