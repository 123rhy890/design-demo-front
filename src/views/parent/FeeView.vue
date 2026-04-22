<!-- 
  模块：【家长-费用管理】
  功能：托管费用账单查看、缴费记录查询、欠费提醒、缴费明细、发票申请
-->
<template>
  <div class="parent-fee-view">
    <!-- 费用概览 -->
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#F56C6C"><Money /></el-icon>
            <div class="stat-info">
              <div class="stat-value">¥{{ feeStats.unpaid }}</div>
              <div class="stat-label">待缴费用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#67C23A"><Checked /></el-icon>
            <div class="stat-info">
              <div class="stat-value">¥{{ feeStats.paid }}</div>
              <div class="stat-label">已缴费用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#409EFF"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ feeStats.billCount }}</div>
              <div class="stat-label">账单数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 账单列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>费用账单</span>
          <el-button type="primary" size="small" @click="fetchBills">刷新</el-button>
        </div>
      </template>

      <el-table :data="billList" border stripe style="width:100%" v-loading="loading">
        <el-table-column prop="billId" label="账单ID" width="100" />
        <el-table-column prop="month" label="账单月份" width="120" />
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="amount" label="应缴金额" width="120">
          <template #default="scope">
            <span class="amount-text">¥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="缴费状态" width="100">
          <template #default="scope">
            <el-tag :type="getPaymentStatusType(scope.row.status)">
              {{ getPaymentStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="生成时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              v-if="scope.row.status === 0"
              @click="handlePay(scope.row)"
            >
              去缴费
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Money, Checked, Document } from '@element-plus/icons-vue'
import { useUserStore } from '../../pinia/modules/userStore'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const userStore = useUserStore()
const loading = ref(false)

// 费用统计
const feeStats = reactive({
  unpaid: 0,
  paid: 0,
  billCount: 0
})

// 账单列表
const billList = ref([])

// 获取账单数据
const fetchBills = async () => {
  loading.value = true
  const parentId = userStore.userInfo.userId
  try {
    const res = await request.get(`/feeBill/parent/${parentId}`)
    billList.value = res.data.map(b => ({
      id: b.billId,
      billId: b.billId,
      month: b.billMonth,
      childName: b.child ? b.child.childName : '-',
      amount: b.payableAmount,
      status: b.paymentStatus,
      createTime: b.createTime ? b.createTime.replace('T', ' ') : '-'
    }))
    
    // 更新统计数据
    feeStats.billCount = billList.value.length
    feeStats.unpaid = billList.value
      .filter(b => b.status === 0)
      .reduce((sum, b) => sum + b.amount, 0)
    feeStats.paid = billList.value
      .filter(b => b.status === 1)
      .reduce((sum, b) => sum + b.amount, 0)
      
  } catch (err) {
    console.error('获取账单失败', err)
  } finally {
    loading.value = false
  }
}

// 缴费状态样式
const getPaymentStatusType = (status) => {
  switch (status) {
    case 1: return 'success'
    case 0: return 'danger'
    case 2: return 'warning'
    default: return ''
  }
}

// 缴费状态文本
const getPaymentStatusText = (status) => {
  switch (status) {
    case 1: return '已缴费'
    case 0: return '未缴费'
    case 2: return '欠费'
    default: return '未知'
  }
}

// 模拟缴费处理
const handlePay = (row) => {
  ElMessage.info('功能开发中，请线下联系老师缴费并上传凭证')
}

onMounted(() => {
  fetchBills()
})
</script>

<style scoped>
.parent-fee-view {
  padding: 20px;
}
.mb-20 { margin-bottom: 20px; }
.stat-card { transition: all 0.3s; }
.stat-card:hover { transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.stat-content { display: flex; align-items: center; gap: 20px; }
.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: bold; color: #333; line-height: 1; }
.stat-label { font-size: 14px; color: #666; margin-top: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.amount-text { font-size: 16px; font-weight: bold; color: #F56C6C; }
</style>
