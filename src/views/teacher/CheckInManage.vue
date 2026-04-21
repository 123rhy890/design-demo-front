<!-- 
  模块：【教师端-接送签到】
  功能：今日签到、签退、批量签到、签到记录查询
-->
<template>
  <div class="checkin-manage">
    <!-- 日期选择和批量操作 -->
    <el-card class="mb-20">
      <div class="card-header">
        <el-date-picker
          v-model="currentDate"
          type="date"
          placeholder="选择日期"
          @change="changeDate"
          style="width:200px"
        />
        <div class="batch-actions">
          <el-button type="primary" icon="Check" @click="batchCheckin">批量签到</el-button>
          <el-button type="warning" icon="Download" @click="exportCheckin">导出签到表</el-button>
        </div>
      </div>
    </el-card>

    <!-- 签到列表 -->
    <el-card>
      <el-table :data="checkinList" border stripe style="width:100%" :loading="loading">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="checkinStatus" label="签到状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.checkinStatus === 1 ? 'success' : 'danger'">
              {{ scope.row.checkinStatus === 1 ? '已签到' : '未签到' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkinTime" label="签到时间" width="180" />
        <el-table-column prop="checkinBy" label="签到人" width="120" />
        <el-table-column prop="checkoutStatus" label="签退状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.checkoutStatus === 1 ? 'success' : 'warning'">
              {{ scope.row.checkoutStatus === 1 ? '已签退' : '未签退' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkoutTime" label="签退时间" width="180" />
        <el-table-column prop="checkoutBy" label="签退人" width="120" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button 
              v-if="scope.row.checkinStatus === 0" 
              type="success" 
              size="small" 
              icon="Check" 
              @click="doCheckin(scope.row)"
            >
              签到
            </el-button>
            <el-button 
              v-if="scope.row.checkinStatus === 1 && scope.row.checkoutStatus === 0" 
              type="primary" 
              size="small" 
              icon="Logout" 
              @click="doCheckout(scope.row)"
            >
              签退
            </el-button>
            <el-button type="text" size="small" icon="Edit" @click="editCheckin(scope.row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.pageNum"
        :page-sizes="[10, 20, 50]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        style="margin-top:20px; text-align:right;"
      >
      </el-pagination>
    </el-card>

    <!-- 编辑签到信息弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑签到信息" width="400px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="签到状态" prop="checkinStatus">
          <el-radio-group v-model="editForm.checkinStatus">
            <el-radio label="1">已签到</el-radio>
            <el-radio label="0">未签到</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="签到时间" prop="checkinTime" v-if="editForm.checkinStatus === '1'">
          <el-date-picker
            v-model="editForm.checkinTime"
            type="datetime"
            placeholder="选择签到时间"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="签到人" prop="checkinBy" v-if="editForm.checkinStatus === '1'">
          <el-input v-model="editForm.checkinBy" placeholder="请输入签到人" />
        </el-form-item>
        <el-form-item label="签退状态" prop="checkoutStatus">
          <el-radio-group v-model="editForm.checkoutStatus">
            <el-radio label="1">已签退</el-radio>
            <el-radio label="0">未签退</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="签退时间" prop="checkoutTime" v-if="editForm.checkoutStatus === '1'">
          <el-date-picker
            v-model="editForm.checkoutTime"
            type="datetime"
            placeholder="选择签退时间"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="签退人" prop="checkoutBy" v-if="editForm.checkoutStatus === '1'">
          <el-input v-model="editForm.checkoutBy" placeholder="请输入签退人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 当前日期
const currentDate = ref(new Date())

// 加载状态
const loading = ref(false)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 25
})

// 签到列表
const checkinList = ref([
  {
    childId: 2001,
    childName: '张小宝',
    className: '大一班',
    checkinStatus: 1,
    checkinTime: '2024-05-20 08:30:25',
    checkinBy: '张妈妈',
    checkoutStatus: 0,
    checkoutTime: '',
    checkoutBy: ''
  },
  {
    childId: 2002,
    childName: '李小贝',
    className: '大一班',
    checkinStatus: 0,
    checkinTime: '',
    checkinBy: '',
    checkoutStatus: 0,
    checkoutTime: '',
    checkoutBy: ''
  },
  {
    childId: 2003,
    childName: '王小丫',
    className: '大一班',
    checkinStatus: 1,
    checkinTime: '2024-05-20 08:45:10',
    checkinBy: '王奶奶',
    checkoutStatus: 1,
    checkoutTime: '2024-05-20 17:10:30',
    checkoutBy: '王爸爸'
  }
])

// 编辑弹窗
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  childId: '',
  checkinStatus: '0',
  checkinTime: '',
  checkinBy: '',
  checkoutStatus: '0',
  checkoutTime: '',
  checkoutBy: ''
})
const editRules = ref({
  checkinTime: [{ required: true, message: '请选择签到时间', trigger: 'change' }],
  checkinBy: [{ required: true, message: '请输入签到人', trigger: 'blur' }],
  checkoutTime: [{ required: true, message: '请选择签退时间', trigger: 'change' }],
  checkoutBy: [{ required: true, message: '请输入签退人', trigger: 'blur' }]
})

// 切换日期
const changeDate = () => {
  // 模拟加载对应日期的签到数据
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('已切换至所选日期的签到记录')
  }, 500)
}

// 批量签到
const batchCheckin = () => {
  ElMessageBox.confirm(
    '确定要批量签到所有未签到的儿童吗？',
    '批量签到',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    checkinList.value.forEach(item => {
      if (item.checkinStatus === 0) {
        item.checkinStatus = 1
        item.checkinTime = new Date().toLocaleString()
        item.checkinBy = '系统批量签到'
      }
    })
    ElMessage.success('批量签到成功！')
  })
}

// 导出签到表
const exportCheckin = () => {
  ElMessage.success('签到表导出中，请稍候...')
  setTimeout(() => {
    ElMessage.success('签到表导出成功！')
  }, 1000)
}

// 单个签到
const doCheckin = (row) => {
  ElMessageBox.confirm(
    `确定要为【${row.childName}】进行签到吗？`,
    '签到确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(() => {
    const index = checkinList.value.findIndex(item => item.childId === row.childId)
    if (index > -1) {
      checkinList.value[index].checkinStatus = 1
      checkinList.value[index].checkinTime = new Date().toLocaleString()
      checkinList.value[index].checkinBy = '老师'
    }
    ElMessage.success('签到成功！')
  })
}

// 单个签退
const doCheckout = (row) => {
  ElMessageBox.confirm(
    `确定要为【${row.childName}】进行签退吗？`,
    '签退确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(() => {
    const index = checkinList.value.findIndex(item => item.childId === row.childId)
    if (index > -1) {
      checkinList.value[index].checkoutStatus = 1
      checkinList.value[index].checkoutTime = new Date().toLocaleString()
      checkinList.value[index].checkoutBy = '老师'
    }
    ElMessage.success('签退成功！')
  })
}

// 编辑签到信息
const editCheckin = (row) => {
  editForm.childId = row.childId
  editForm.checkinStatus = row.checkinStatus + ''
  editForm.checkinTime = row.checkinTime ? new Date(row.checkinTime) : ''
  editForm.checkinBy = row.checkinBy || ''
  editForm.checkoutStatus = row.checkoutStatus + ''
  editForm.checkoutTime = row.checkoutTime ? new Date(row.checkoutTime) : ''
  editForm.checkoutBy = row.checkoutBy || ''
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = () => {
  // 动态校验规则
  const requiredFields = []
  if (editForm.checkinStatus === '1') {
    requiredFields.push('checkinTime', 'checkinBy')
  }
  if (editForm.checkoutStatus === '1') {
    requiredFields.push('checkoutTime', 'checkoutBy')
  }

  // 临时校验
  let isValid = true
  requiredFields.forEach(field => {
    if (!editForm[field]) {
      ElMessage.error(`请填写${field === 'checkinTime' ? '签到时间' : field === 'checkinBy' ? '签到人' : field === 'checkoutTime' ? '签退时间' : '签退人'}`)
      isValid = false
    }
  })

  if (isValid) {
    const index = checkinList.value.findIndex(item => item.childId === editForm.childId)
    if (index > -1) {
      checkinList.value[index].checkinStatus = Number(editForm.checkinStatus)
      checkinList.value[index].checkinTime = editForm.checkinTime ? editForm.checkinTime.toLocaleString() : ''
      checkinList.value[index].checkinBy = editForm.checkinBy
      checkinList.value[index].checkoutStatus = Number(editForm.checkoutStatus)
      checkinList.value[index].checkoutTime = editForm.checkoutTime ? editForm.checkoutTime.toLocaleString() : ''
      checkinList.value[index].checkoutBy = editForm.checkoutBy
    }
    ElMessage.success('签到信息修改成功！')
    editDialogVisible.value = false
  }
}

// 分页事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  // 重新加载数据
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  // 重新加载数据
}

onMounted(() => {
  // 初始化加载今日签到数据
})
</script>

<style scoped>
.checkin-manage {
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

.batch-actions {
  display: flex;
  gap: 10px;
}
</style>