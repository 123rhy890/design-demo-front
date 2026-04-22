<!-- 
  模块：【教师端-托管管理】
  功能：家长预约记录审核、审核通过/驳回、预约历史查询
-->
<template>
  <div class="teacher-reserve-audit">
    <!-- 筛选栏 -->
    <el-card class="mb-20 search-card">
      <el-form :model="searchForm" inline @submit.prevent="fetchReservations">
        <el-form-item label="儿童姓名">
          <el-input v-model="searchForm.childName" placeholder="请输入姓名" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" style="width:130px">
            <el-option label="全部" value="all" />
            <el-option label="待审核" value="review" />
            <el-option label="已确认" value="confirm" />
            <el-option label="已取消" value="cancel" />
          </el-select>
        </el-form-item>
        <el-form-item class="search-btns">
          <el-button type="primary" icon="Search" @click="fetchReservations">查询</el-button>
          <el-button icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预约列表 -->
    <el-card>
      <el-table :data="reservationList" border stripe style="width:100%" v-loading="loading">
        <el-table-column prop="reservationId" label="预约ID" width="100" />
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="parentName" label="家长姓名" width="120" />
        <el-table-column prop="reserveDate" label="预约日期" width="120" />
        <el-table-column prop="timeSlot" label="时间段" width="100" />
        <el-table-column prop="specialNeeds" label="特殊需求" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <div class="operation-buttons">
              <template v-if="scope.row.status === 'review'">
                <el-button type="success" size="small" icon="Check" @click="handleAudit(scope.row, 'confirm')">通过</el-button>
                <el-button type="danger" size="small" icon="Close" @click="handleAudit(scope.row, 'cancel')">驳回</el-button>
              </template>
              <el-button v-else type="primary" size="small" icon="View" @click="viewDetail(scope.row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="预约详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="儿童姓名">{{ currentDetail.childName }}</el-descriptions-item>
        <el-descriptions-item label="家长姓名">{{ currentDetail.parentName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDetail.parentPhone }}</el-descriptions-item>
        <el-descriptions-item label="预约日期">{{ currentDetail.reserveDate }}</el-descriptions-item>
        <el-descriptions-item label="时间段">{{ currentDetail.timeSlot }}</el-descriptions-item>
        <el-descriptions-item label="特殊需求">{{ currentDetail.specialNeeds || '无' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusType(currentDetail.status)">
            {{ getStatusText(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ currentDetail.updateTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'
import { useUserStore } from '../../pinia/modules/userStore'

const userStore = useUserStore()
const loading = ref(false)
const reservationList = ref([])

// 搜索表单
const searchForm = reactive({
  childName: '',
  status: 'review' // 默认查看待审核
})

// 分页
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 详情相关
const detailVisible = ref(false)
const currentDetail = ref({})

// 获取预约记录
const fetchReservations = async () => {
  loading.value = true
  try {
    let url = '/reservation/list'
    if (searchForm.status !== 'all') {
      url = `/reservation/status/${searchForm.status}`
    }
    
    const res = await request.get(url)
    let data = res.data.map(r => ({
      reservationId: r.reservationId,
      childName: r.child ? r.child.childName : '-',
      parentName: r.parent ? r.parent.username : '-',
      parentPhone: r.parent ? r.parent.phone : '-',
      reserveDate: r.reserveDate,
      timeSlot: r.timeSlot,
      specialNeeds: r.specialNeeds,
      status: r.reserveStatus,
      createTime: r.createTime ? r.createTime.replace('T', ' ') : '-',
      updateTime: r.updateTime ? r.updateTime.replace('T', ' ') : '-'
    }))

    // 客户端搜索过滤（如果后端没有搜索接口）
    if (searchForm.childName) {
      data = data.filter(item => item.childName.includes(searchForm.childName))
    }

    reservationList.value = data
    pagination.total = data.length
  } catch (err) {
    console.error('获取预约记录失败', err)
  } finally {
    loading.value = false
  }
}

// 审核处理
const handleAudit = (row, status) => {
  const actionText = status === 'confirm' ? '通过' : '驳回'
  ElMessageBox.confirm(`确定要${actionText}该预约吗？`, '提示', {
    type: status === 'confirm' ? 'success' : 'warning'
  }).then(async () => {
    try {
      const auditorId = userStore.userInfo.userId
      await request.put(`/reservation/audit/${row.reservationId}?auditorId=${auditorId}&status=${status}`)
      ElMessage.success(`审核已${actionText}`)
      fetchReservations()
    } catch (err) {
      console.error('审核操作失败', err)
    }
  })
}

// 查看详情
const viewDetail = (row) => {
  currentDetail.value = { ...row }
  detailVisible.value = true
}

// 重置搜索
const resetSearch = () => {
  searchForm.childName = ''
  searchForm.status = 'review'
  fetchReservations()
}

// 状态样式
const getStatusType = (status) => {
  const typeMap = {
    review: 'warning',
    confirm: 'success',
    cancel: 'danger'
  }
  return typeMap[status] || ''
}

// 状态文本
const getStatusText = (status) => {
  const statusMap = {
    review: '待审核',
    confirm: '已确认',
    cancel: '已取消'
  }
  return statusMap[status] || status
}

// 分页操作
const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchReservations()
}
const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchReservations()
}

onMounted(() => {
  fetchReservations()
})
</script>

<style scoped>
.teacher-reserve-audit {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}
.mb-20 { margin-bottom: 20px; }

.search-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 24px;
}

.search-btns {
  margin-right: 0 !important;
  float: right;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.operation-buttons .el-button {
  padding: 8px 16px;
  transition: all 0.3s;
}

.operation-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

:deep(.el-table th.el-table__cell) {
  background-color: #fafafa !important;
  color: #333;
  font-weight: 600;
}

.pagination-container {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
}
</style>
