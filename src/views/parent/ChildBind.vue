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
            绑定新儿童
          </el-button>
        </div>
      </template>

      <el-row :gutter="20" v-if="boundChildren.length > 0">
        <el-col :span="8" v-for="child in boundChildren" :key="child.id">
          <el-card class="child-card" shadow="hover">
            <div class="child-avatar">
              <el-avatar :size="80" :src="child.avatar">
                {{ child.name.charAt(0) }}
              </el-avatar>
              <el-tag 
                :type="child.status === 'approved' ? 'success' : child.status === 'pending' ? 'warning' : 'info'" 
                size="small"
                class="status-tag"
              >
                {{ getStatusText(child.status) }}
              </el-tag>
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
              <div class="info-item">
                <el-icon><Calendar /></el-icon>
                <span>入学时间：{{ child.enrollDate }}</span>
              </div>
            </div>
            <el-divider />
            <div class="child-actions">
              <el-button type="primary" size="small" @click="viewChildDetail(child)">
                查看详情
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="unbindChild(child)"
                v-if="child.status === 'approved'"
              >
                解除绑定
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                disabled
                v-if="child.status === 'pending'"
              >
                审核中
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
        <span>绑定申请记录</span>
      </template>

      <el-table :data="bindRecords" border stripe style="width:100%">
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="idCard" label="身份证号" width="180" />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column prop="status" label="审核状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'approved' ? 'success' : scope.row.status === 'pending' ? 'warning' : 'danger'">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditBy" label="审核人" width="120" />
        <el-table-column prop="auditTime" label="审核时间" width="180" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- 绑定儿童弹窗 -->
    <el-dialog v-model="bindDialogVisible" title="绑定儿童信息" width="600px">
      <el-form :model="bindForm" :rules="bindRules" ref="bindFormRef" label-width="120px">
        <el-form-item label="儿童姓名" prop="childName">
          <el-input v-model="bindForm.childName" placeholder="请输入儿童姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="bindForm.idCard" placeholder="请输入儿童身份证号" maxlength="18" />
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
        <el-form-item label="与孩子关系" prop="relation">
          <el-select v-model="bindForm.relation" placeholder="请选择关系" style="width:100%">
            <el-option label="父亲" value="father" />
            <el-option label="母亲" value="mother" />
            <el-option label="爷爷" value="grandfather" />
            <el-option label="奶奶" value="grandmother" />
            <el-option label="外公" value="maternal_grandfather" />
            <el-option label="外婆" value="maternal_grandmother" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="bindForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="家庭住址" prop="address">
          <el-input v-model="bindForm.address" type="textarea" :rows="2" placeholder="请输入家庭住址" />
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="bindForm.remark" type="textarea" :rows="2" placeholder="请输入备注信息（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBind" :loading="submitting">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, School, Calendar } from '@element-plus/icons-vue'

// 已绑定儿童列表
const boundChildren = ref([
  {
    id: 1,
    name: '张小宝',
    gender: 1,
    age: 6,
    className: '大一班',
    avatar: '',
    enrollDate: '2024-01-15',
    status: 'approved'
  },
  {
    id: 2,
    name: '张小美',
    gender: 0,
    age: 4,
    className: '中一班',
    avatar: '',
    enrollDate: '2024-03-01',
    status: 'approved'
  }
])

// 绑定申请记录
const bindRecords = ref([
  {
    id: 1,
    childName: '张小宝',
    idCard: '110101201801011234',
    applyTime: '2024-01-10 10:30:00',
    status: 'approved',
    auditBy: '管理员',
    auditTime: '2024-01-10 14:20:00',
    remark: '审核通过'
  },
  {
    id: 2,
    childName: '张小美',
    idCard: '110101202001011235',
    applyTime: '2024-02-28 09:15:00',
    status: 'approved',
    auditBy: '管理员',
    auditTime: '2024-02-28 16:30:00',
    remark: '审核通过'
  }
])

// 绑定弹窗
const bindDialogVisible = ref(false)
const bindFormRef = ref(null)
const submitting = ref(false)

const bindForm = reactive({
  childName: '',
  idCard: '',
  gender: 1,
  birthDate: '',
  relation: '',
  phone: '',
  address: '',
  remark: ''
})

const bindRules = ref({
  childName: [{ required: true, message: '请输入儿童姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  relation: [{ required: true, message: '请选择与孩子的关系', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入家庭住址', trigger: 'blur' }]
})

// 状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statusMap[status] || '未知'
}

// 显示绑定弹窗
const showBindDialog = () => {
  bindDialogVisible.value = true
  // 重置表单
  Object.assign(bindForm, {
    childName: '',
    idCard: '',
    gender: 1,
    birthDate: '',
    relation: '',
    phone: '',
    address: '',
    remark: ''
  })
}

// 提交绑定申请
const submitBind = () => {
  bindFormRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      
      setTimeout(() => {
        // 添加到申请记录
        bindRecords.value.unshift({
          id: Date.now(),
          childName: bindForm.childName,
          idCard: bindForm.idCard,
          applyTime: new Date().toLocaleString(),
          status: 'pending',
          auditBy: '-',
          auditTime: '-',
          remark: '等待审核'
        })
        
        submitting.value = false
        bindDialogVisible.value = false
        ElMessage.success('绑定申请已提交，请等待管理员审核！')
      }, 1000)
    }
  })
}

// 查看儿童详情
const viewChildDetail = (child) => {
  ElMessage.info(`查看${child.name}的详细信息`)
}

// 解除绑定
const unbindChild = (child) => {
  ElMessageBox.confirm(
    `确定要解除与${child.name}的绑定关系吗？解绑后将无法查看该儿童的相关信息。`,
    '解绑确认',
    {
      confirmButtonText: '确定解绑',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    boundChildren.value = boundChildren.value.filter(item => item.id !== child.id)
    ElMessage.success('解绑成功！')
  })
}
</script>

<style scoped>
.parent-child-bind {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.mb-20 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.child-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.child-card:hover {
  transform: translateY(-5px);
}

.child-avatar {
  text-align: center;
  position: relative;
  margin-bottom: 15px;
}

.status-tag {
  position: absolute;
  top: 0;
  right: 50%;
  transform: translateX(50%);
}

.child-info {
  text-align: center;
}

.child-info h3 {
  margin: 10px 0;
  font-size: 18px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.child-actions {
  display: flex;
  gap: 10px;
}

.child-actions .el-button {
  flex: 1;
}
</style>