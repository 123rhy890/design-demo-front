<!-- 
  模块：【管理员-系统管理】
  功能：家长账号审核、审核通过/驳回、家长信息查看、审核记录查询
-->
<template>
  <div class="admin-user-audit">
    <!-- 筛选栏 -->
    <el-card class="mb-20">
      <el-form :model="searchForm" inline @submit.prevent="searchAudit">
        <el-form-item label="家长姓名">
          <el-input v-model="searchForm.parentName" placeholder="请输入家长姓名" style="width:200px" />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.auditStatus" placeholder="请选择审核状态" style="width:150px">
            <el-option label="待审核" value="2" />
            <el-option label="审核通过" value="1" />
            <el-option label="已禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchAudit">查询</el-button>
          <el-button icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核列表 -->
    <el-card>
      <el-table :data="auditList" border stripe style="width:100%" :loading="loading">
        <el-table-column prop="parentId" label="家长ID" width="100" />
        <el-table-column prop="parentName" label="家长姓名" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column prop="auditStatus" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.auditStatus)">
              {{ getStatusText(scope.row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditTime" label="最后操作时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" icon="View" @click="viewDetail(scope.row)">详情</el-button>
            <template v-if="scope.row.auditStatus === 0">
              <el-button type="success" size="small" icon="Check" @click="passAudit(scope.row)">通过</el-button>
              <el-button type="danger" size="small" icon="Close" @click="rejectAudit(scope.row)">驳回</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top:20px; text-align:right;">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 审核详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="家长详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="家长姓名">{{ currentDetail.parentName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentDetail.applyTime }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusType(currentDetail.auditStatus)">
            {{ getStatusText(currentDetail.auditStatus) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div v-if="currentDetail.auditStatus === 0">
          <el-button @click="detailDialogVisible = false">取消</el-button>
          <el-button type="success" @click="passAudit(currentDetail)">通过</el-button>
          <el-button type="danger" @click="rejectAudit(currentDetail)">驳回</el-button>
        </div>
        <el-button v-else @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 驳回原因弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回审核" width="400px">
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="80px">
        <el-form-item label="驳回原因" prop="remark">
          <el-input v-model="rejectForm.remark" type="textarea" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确定驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

// 搜索表单
const searchForm = reactive({
  parentName: '',
  auditStatus: '2' // 默认查待审核(2)
})

// 加载状态
const loading = ref(false)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 审核列表
const auditList = ref([])

// 详情弹窗相关
const detailDialogVisible = ref(false)
const currentDetail = ref({})

// 驳回弹窗相关
const rejectDialogVisible = ref(false)
const rejectFormRef = ref(null)
const rejectForm = reactive({
  remark: '',
  parentId: ''
})
const rejectRules = {
  remark: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
}

// 获取列表数据
const fetchAuditList = () => {
  loading.value = true
  const status = searchForm.auditStatus
  request.get(`/user/role/2/status/${status}`).then(res => {
    auditList.value = res.data.map(user => ({
      parentId: user.userId,
      parentName: user.username,
      phone: user.phone,
      applyTime: user.createTime,
      auditStatus: user.status === 2 ? 0 : (user.status === 1 ? 1 : 2), // 映射为前端显示状态
      auditTime: user.updateTime
    }))
    pagination.total = auditList.value.length
  }).finally(() => {
    loading.value = false
  })
}

// 状态类型
const getStatusType = (status) => {
  switch (status) {
    case 0: return 'warning' // 待审核
    case 1: return 'success' // 正常
    case 2: return 'danger'  // 禁用
    default: return ''
  }
}

// 状态文本
const getStatusText = (status) => {
  switch (status) {
    case 0: return '待审核'
    case 1: return '审核通过'
    case 2: return '审核驳回'
    default: return '未知'
  }
}

// 搜索
const searchAudit = () => {
  fetchAuditList()
}

// 重置
const resetSearch = () => {
  searchForm.parentName = ''
  searchForm.auditStatus = '2'
  fetchAuditList()
}

// 查看详情
const viewDetail = (row) => {
  currentDetail.value = { ...row }
  detailDialogVisible.value = true
}

// 审核通过
const passAudit = (row) => {
  ElMessageBox.confirm('确定要审核通过该家长账号吗？', '提示', {
    type: 'warning'
  }).then(() => {
    request.put(`/user/audit/${row.parentId}?status=1`).then(() => {
      ElMessage.success('审核已通过！')
      detailDialogVisible.value = false
      fetchAuditList()
    })
  })
}

// 驳回审核（打开弹窗）
const rejectAudit = (row) => {
  rejectForm.parentId = row.parentId
  rejectForm.remark = ''
  rejectDialogVisible.value = true
}

// 确认驳回
const confirmReject = () => {
  rejectFormRef.value.validate((valid) => {
    if (valid) {
      request.put(`/user/audit/${rejectForm.parentId}?status=0`).then(() => {
        ElMessage.success('已驳回该申请！')
        rejectDialogVisible.value = false
        detailDialogVisible.value = false
        fetchAuditList()
      })
    }
  })
}

// 分页操作
const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchAuditList()
}
const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchAuditList()
}

onMounted(() => {
  fetchAuditList()
})
</script>

<style scoped>
.mb-20 { margin-bottom: 20px; }
</style>
