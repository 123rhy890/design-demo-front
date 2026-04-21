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
            <el-option label="待审核" value="0" />
            <el-option label="审核通过" value="1" />
            <el-option label="审核驳回" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核时间">
          <el-date-picker
            v-model="searchForm.auditTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width:300px"
          />
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
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="childId" label="儿童ID" width="100" />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column prop="auditStatus" label="审核状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.auditStatus)">
              {{ getStatusText(scope.row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditUser" label="审核人" width="120" />
        <el-table-column prop="auditTime" label="审核时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" icon="View" @click="viewDetail(scope.row)">查看详情</el-button>
            <template v-if="scope.row.auditStatus === 0">
              <el-button type="success" size="small" icon="Check" @click="passAudit(scope.row)">通过</el-button>
              <el-button type="danger" size="small" icon="Close" @click="rejectAudit(scope.row)">驳回</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.pageNum"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        style="margin-top:20px; text-align:right;"
      >
      </el-pagination>
    </el-card>

    <!-- 审核详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="家长审核详情" width="600px">
      <el-descriptions :column="2" border :data="currentDetail">
        <el-descriptions-item label="家长姓名">{{ currentDetail.parentName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ currentDetail.idCard }}</el-descriptions-item>
        <el-descriptions-item label="与儿童关系">{{ currentDetail.relation }}</el-descriptions-item>
        <el-descriptions-item label="儿童姓名">{{ currentDetail.childName }}</el-descriptions-item>
        <el-descriptions-item label="儿童年龄">{{ currentDetail.childAge }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentDetail.applyTime }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusType(currentDetail.auditStatus)">
            {{ getStatusText(currentDetail.auditStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核意见" span="2">{{ currentDetail.auditRemark || '暂无' }}</el-descriptions-item>
      </el-descriptions>
      <template v-if="currentDetail.auditStatus === 0" #footer>
        <el-button @click="detailDialogVisible = false">取消</el-button>
        <el-button type="success" @click="passAudit(currentDetail)">通过</el-button>
        <el-button type="danger" @click="rejectAudit(currentDetail)">驳回</el-button>
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

// 搜索表单
const searchForm = reactive({
  parentName: '',
  auditStatus: '',
  auditTime: []
})

// 加载状态
const loading = ref(false)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 50
})

// 审核列表
const auditList = ref([
  {
    parentId: 1001,
    parentName: '张三',
    phone: '13800138000',
    childName: '张小宝',
    childId: 2001,
    applyTime: '2024-05-01 10:20:30',
    auditStatus: 0,
    auditUser: '',
    auditTime: '',
    idCard: '110101199001011234',
    relation: '父亲',
    childAge: 6,
    auditRemark: ''
  },
  {
    parentId: 1002,
    parentName: '李四',
    phone: '13900139000',
    childName: '李小贝',
    childId: 2002,
    applyTime: '2024-05-02 14:30:20',
    auditStatus: 1,
    auditUser: '系统管理员',
    auditTime: '2024-05-02 15:00:00',
    idCard: '110101199102021234',
    relation: '母亲',
    childAge: 5,
    auditRemark: ''
  },
  {
    parentId: 1003,
    parentName: '王五',
    phone: '13700137000',
    childName: '王小丫',
    childId: 2003,
    applyTime: '2024-05-03 09:10:00',
    auditStatus: 2,
    auditUser: '系统管理员',
    auditTime: '2024-05-03 10:00:00',
    idCard: '110101198903031234',
    relation: '母亲',
    childAge: 7,
    auditRemark: '身份信息与系统不符'
  }
])

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
const rejectRules = ref({
  remark: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
})

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'danger'
    default: return ''
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 0: return '待审核'
    case 1: return '审核通过'
    case 2: return '审核驳回'
    default: return '未知'
  }
}

// 搜索审核列表
const searchAudit = () => {
  loading.value = true
  // 模拟接口请求
  setTimeout(() => {
    loading.value = false
    ElMessage.success('查询成功！')
  }, 500)
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    parentName: '',
    auditStatus: '',
    auditTime: []
  })
}

// 查看详情
const viewDetail = (row) => {
  currentDetail.value = { ...row }
  detailDialogVisible.value = true
}

// 审核通过
const passAudit = (row) => {
  ElMessageBox.confirm(
    '确定要审核通过该家长账号吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    const index = auditList.value.findIndex(item => item.parentId === row.parentId)
    if (index > -1) {
      auditList.value[index].auditStatus = 1
      auditList.value[index].auditUser = '系统管理员'
      auditList.value[index].auditTime = new Date().toLocaleString()
    }
    ElMessage.success('审核通过！')
    detailDialogVisible.value = false
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
      const index = auditList.value.findIndex(item => item.parentId === rejectForm.parentId)
      if (index > -1) {
        auditList.value[index].auditStatus = 2
        auditList.value[index].auditUser = '系统管理员'
        auditList.value[index].auditTime = new Date().toLocaleString()
        auditList.value[index].auditRemark = rejectForm.remark
      }
      ElMessage.success('审核驳回成功！')
      rejectDialogVisible.value = false
      detailDialogVisible.value = false
    }
  })
}

// 分页相关
const handleSizeChange = (val) => {
  pagination.pageSize = val
  // 重新加载数据
  searchAudit()
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  // 重新加载数据
  searchAudit()
}

onMounted(() => {
  // 初始化加载数据
  searchAudit()
})
</script>

<style scoped>
.admin-user-audit {
  width: 100%;
  height: 100%;
}
</style>