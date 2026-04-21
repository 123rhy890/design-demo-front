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
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#E6A23C"><Tickets /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ feeStats.invoiceCount }}</div>
              <div class="stat-label">发票数量</div>
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
          <el-button type="primary" size="small">查询</el-button>
        </div>
      </template>

      <el-table :data="billList" border stripe style="width:100%">
        <el-table-column prop="billNo" label="账单编号" width="180" />
        <el-table-column prop="month" label="账单月份" width="120" />
        <el-table-column prop="childName" label="儿童姓名" width="100" />
        <el-table-column prop="amount" label="应缴金额" width="120">
          <template #default="scope">
            <span class="amount-text">¥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="缴费状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'paid' ? 'success' : 'danger'">
              {{ scope.row.status === 'paid' ? '已缴费' : '待缴费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="生成时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              v-if="scope.row.status === 'unpaid'"
            >
              立即缴费
            </el-button>
            <el-button type="text" size="small">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Money, Checked, Document, Tickets } from '@element-plus/icons-vue'

// 费用统计
const feeStats = ref({
  unpaid: 320,
  paid: 1680,
  billCount: 6,
  invoiceCount: 4
})

// 账单列表
const billList = ref([
  {
    id: 1,
    billNo: 'BILL202405001',
    month: '2024-05',
    childName: '张小宝',
    amount: 160,
    status: 'unpaid',
    createTime: '2024-05-01 10:00:00'
  },
  {
    id: 2,
    billNo: 'BILL202404001',
    month: '2024-04',
    childName: '张小宝',
    amount: 160,
    status: 'paid',
    createTime: '2024-04-01 10:00:00'
  }
])
</script>

<style scoped>
.parent-fee-view {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.mb-20 {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-text {
  font-size: 16px;
  font-weight: bold;
  color: #F56C6C;
}
</style>
