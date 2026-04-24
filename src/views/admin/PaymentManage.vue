<template>
  <div class="admin-payment-manage">
    <!-- 缴费记录查询 -->
    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <span>缴费记录查询</span>
        </div>
      </template>
      <el-form :model="feeSearchForm" inline @submit.prevent="searchFeeRecord">
        <el-form-item label="儿童姓名">
          <el-input v-model="feeSearchForm.childName" placeholder="请输入儿童姓名" style="width:200px" clearable />
        </el-form-item>
        <el-form-item label="缴费状态">
          <el-select v-model="feeSearchForm.payStatus" placeholder="请选择缴费状态" style="width:150px" clearable>
            <el-option label="已缴费" :value="1" />
            <el-option label="未缴费" :value="0" />
            <el-option label="审核中" :value="4" />
            <el-option label="欠费" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="缴费月份">
          <el-date-picker
            v-model="feeSearchForm.payMonth"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            style="width:200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchFeeRecord">查询</el-button>
          <el-button icon="Refresh" @click="resetFeeSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="feeRecordList" border stripe style="width:100%" v-loading="feeLoading">
        <el-table-column prop="billId" label="账单ID" width="90" />
        <el-table-column label="儿童姓名" width="120">
          <template #default="scope">{{ scope.row.child?.childName || '-' }}</template>
        </el-table-column>
        <el-table-column label="家长姓名" width="120">
          <template #default="scope">{{ scope.row.parent?.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="联系电话" width="150">
          <template #default="scope">{{ scope.row.parent?.phone || '-' }}</template>
        </el-table-column>
        <el-table-column prop="timeSlot" label="费用类型" width="120" />
        <el-table-column label="费用金额(元)" width="130">
          <template #default="scope">{{ Number(scope.row.payableAmount).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="billMonth" label="缴费月份" width="120" />
        <el-table-column label="缴费状态" width="100">
          <template #default="scope">
            <el-tag :type="payStatusType(scope.row.paymentStatus)">
              {{ payStatusText(scope.row.paymentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="缴费时间" width="180">
          <template #default="scope">
            {{ scope.row.paymentStatus === 1 ? formatDateTime(scope.row.updateTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button type="primary" link icon="View" @click="viewBillDetail(scope.row)">详情</el-button>
            <el-button
              v-if="scope.row.paymentStatus === 4"
              type="success" link icon="Check"
              @click="handleAudit(scope.row)"
            >审核</el-button>
            <el-button
              v-if="scope.row.paymentStatus === 0 || scope.row.paymentStatus === 2"
              type="warning" link icon="Bell"
              @click="sendRemind(scope.row)"
            >提醒</el-button>
            <el-button type="danger" link icon="Delete" @click="handleDeleteBill(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        @size-change="handleFeeSizeChange"
        @current-change="handleFeeCurrentChange"
        :current-page="feePagination.pageNum"
        :page-sizes="[10, 20, 50]"
        :page-size="feePagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="feePagination.total"
        style="margin-top:20px; text-align:right;"
      />
    </el-card>

    <!-- 费用统计 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>缴费概览统计</span>
          <el-date-picker
            v-model="statsMonth"
            type="month"
            placeholder="选择统计月份"
            value-format="YYYY-MM"
            style="width:180px"
            @change="loadFeeStats"
          />
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">¥{{ Number(feeStats.totalFee).toFixed(2) }}</div>
            <div class="stat-label">本月应收总额</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value" style="color:#67C23A">¥{{ Number(feeStats.paidFee).toFixed(2) }}</div>
            <div class="stat-label">本月已收总额</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value" style="color:#F56C6C">¥{{ Number(feeStats.unpaidFee).toFixed(2) }}</div>
            <div class="stat-label">本月待收总额</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value" style="color:#E6A23C">{{ feeStats.unpaidCount }}</div>
            <div class="stat-label">待缴费人数</div>
          </div>
        </el-col>
      </el-row>
      <div style="margin-top:20px; width:100%; height:350px;" ref="feeChartRef"></div>
    </el-card>

    <!-- 账单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="账单详情" width="600px">
      <div v-if="currentBill" class="bill-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="账单编号">{{ currentBill.billId }}</el-descriptions-item>
          <el-descriptions-item label="账单月份">{{ currentBill.billMonth }}</el-descriptions-item>
          <el-descriptions-item label="儿童姓名">{{ currentBill.child?.childName }}</el-descriptions-item>
          <el-descriptions-item label="家长姓名">{{ currentBill.parent?.username }}</el-descriptions-item>
          <el-descriptions-item label="费用类型">{{ currentBill.timeSlot }}</el-descriptions-item>
          <el-descriptions-item label="托管天数">{{ currentBill.manageDays }}天</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ currentBill.unitPrice }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">¥{{ currentBill.discountAmount }}</el-descriptions-item>
          <el-descriptions-item label="应付总额">¥{{ currentBill.payableAmount }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">¥{{ currentBill.actualAmount }}</el-descriptions-item>
          <el-descriptions-item label="缴费状态">
            <el-tag :type="payStatusType(currentBill.paymentStatus)">
              {{ payStatusText(currentBill.paymentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="缴费截止">{{ formatDateTime(currentBill.paymentDeadline).split(' ')[0] }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(currentBill.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="最近提醒" :span="2" v-if="currentBill.paymentStatus !== 1">
            {{ currentBill.remindTimes > 0 ? formatDateTime(currentBill.lastRemindTime) + ' (共' + currentBill.remindTimes + '次)' : '从未提醒' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 凭证审核弹窗 -->
    <el-dialog v-model="auditVisible" title="缴费凭证审核" width="500px">
      <div v-if="auditVoucher" class="audit-container">
        <el-descriptions :column="1" border class="mb-20">
          <el-descriptions-item label="儿童姓名">{{ currentBill?.child?.childName }}</el-descriptions-item>
          <el-descriptions-item label="账单月份">{{ currentBill?.billMonth }}</el-descriptions-item>
          <el-descriptions-item label="应缴金额">¥{{ currentBill?.payableAmount }}</el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ formatDateTime(auditVoucher.uploadTime) }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="voucher-img-box mb-20">
          <div class="label">缴费凭证：</div>
          <el-image 
            :src="auditVoucher.voucherUrl" 
            :preview-src-list="[auditVoucher.voucherUrl]"
            fit="contain"
            style="width: 100%; max-height: 300px; border-radius: 4px;"
          />
        </div>

        <el-form label-width="80px">
          <el-form-item label="审核备注">
            <el-input v-model="auditForm.remark" type="textarea" placeholder="请输入审核备注（如驳回原因）" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button type="danger" @click="submitAudit(2)">审核驳回</el-button>
        <el-button type="primary" @click="submitAudit(1)">审核通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import request from '../../utils/request'
import { useUserStore } from '../../pinia/modules/userStore'

const userStore = useUserStore()

// ==================== 缴费记录 ====================
const feeLoading = ref(false)
const feeRecordList = ref([])
const feeSearchForm = reactive({ childName: '', payStatus: null, payMonth: '' })
const feePagination = reactive({ pageNum: 1, pageSize: 10, total: 0 })

const searchFeeRecord = async () => {
  feeLoading.value = true
  try {
    const params = {
      pageNum: feePagination.pageNum,
      pageSize: feePagination.pageSize
    }
    if (feeSearchForm.childName) params.childName = feeSearchForm.childName
    if (feeSearchForm.payStatus !== null && feeSearchForm.payStatus !== '') params.paymentStatus = feeSearchForm.payStatus
    if (feeSearchForm.payMonth) params.billMonth = feeSearchForm.payMonth

    const res = await request.get('/feeBill/page', { params })
    feeRecordList.value = res.data.content || []
    feePagination.total = res.data.totalElements || 0
  } catch (e) {
    console.error('查询缴费记录失败', e)
  } finally {
    feeLoading.value = false
  }
}

const resetFeeSearch = () => {
  Object.assign(feeSearchForm, { childName: '', payStatus: null, payMonth: '' })
  feePagination.pageNum = 1
  searchFeeRecord()
}

const handleFeeSizeChange = (val) => {
  feePagination.pageSize = val
  feePagination.pageNum = 1
  searchFeeRecord()
}

const handleFeeCurrentChange = (val) => {
  feePagination.pageNum = val
  searchFeeRecord()
}

// 账单详情
const detailVisible = ref(false)
const currentBill = ref(null)
const viewBillDetail = (row) => {
  currentBill.value = row
  detailVisible.value = true
}

// 删除账单
const handleDeleteBill = (row) => {
  ElMessageBox.confirm(
    `确定要删除儿童【${row.child?.childName}】的 ${row.billMonth} 账单吗？此操作不可撤销。`,
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'error' }
  ).then(async () => {
    try {
      await request.delete(`/feeBill/delete/${row.billId}`)
      ElMessage.success('账单已删除')
      searchFeeRecord()
      loadFeeStats()
    } catch (e) {
      console.error('删除账单失败', e)
    }
  })
}

// 欠费提醒
const sendRemind = async (row) => {
  await ElMessageBox.confirm(
    `确定向【${row.parent?.username}】发送 ${row.billMonth} 月份的欠费提醒吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  )
  try {
    await request.post(`/feeBill/remind/${row.billId}`)
    ElMessage.success('欠费提醒发送成功')
    searchFeeRecord()
  } catch (e) {
    console.error('发送提醒失败', e)
  }
}

// ==================== 费用统计 ====================
const statsMonth = ref(new Date().toISOString().slice(0, 7))
const feeStats = reactive({ totalFee: 0, paidFee: 0, unpaidFee: 0, unpaidCount: 0 })
const feeChartRef = ref(null)
let chartInstance = null

const loadFeeStats = async () => {
  if (!statsMonth.value) return
  try {
    const res = await request.get(`/feeBill/stats/${statsMonth.value}`)
    Object.assign(feeStats, res.data)
  } catch (e) {
    console.error('加载费用统计失败', e)
  }
}

const loadFeeChart = async () => {
  try {
    const res = await request.get('/feeBill/trend', { params: { months: 6 } })
    const { months, payable, actual } = res.data
    await nextTick()
    if (!feeChartRef.value) return
    if (!chartInstance) {
      chartInstance = echarts.init(feeChartRef.value)
    }
    chartInstance.setOption({
      title: { text: '近6个月费用收缴趋势' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['应收金额', '实收金额'], top: 30 },
      xAxis: { type: 'category', data: months },
      yAxis: { type: 'value', name: '金额(元)' },
      series: [
        { name: '应收金额', type: 'bar', data: payable },
        { name: '实收金额', type: 'bar', data: actual }
      ]
    })
  } catch (e) {
    console.error('加载费用趋势失败', e)
  }
}

// ==================== 工具函数 ====================
const payStatusType = (status) => {
  if (status === 1) return 'success'
  if (status === 2) return 'warning'
  if (status === 4) return 'primary'
  return 'danger'
}

const payStatusText = (status) => {
  if (status === 1) return '已缴费'
  if (status === 2) return '欠费'
  if (status === 4) return '审核中'
  return '未缴费'
}

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return String(dt).replace('T', ' ').slice(0, 19)
}

// 审核相关
const auditVisible = ref(false)
const auditVoucher = ref(null)
const auditForm = reactive({ remark: '' })

const handleAudit = async (row) => {
  currentBill.value = row
  try {
    const res = await request.get(`/voucher/bill/${row.billId}`)
    // 寻找最新的待审核凭证
    auditVoucher.value = res.data.find(v => v.auditStatus === 0) || res.data[0]
    auditForm.remark = ''
    auditVisible.value = true
  } catch (e) {
    console.error('获取凭证失败', e)
    ElMessage.error('获取凭证失败')
  }
}

const submitAudit = async (status) => {
  if (!auditVoucher.value) return
  
  try {
    const adminId = userStore.userInfo.userId
    await request.put(`/voucher/audit/${auditVoucher.value.voucherId}`, null, {
      params: {
        auditorId: adminId,
        auditStatus: status,
        auditRemark: auditForm.remark
      }
    })
    ElMessage.success(status === 1 ? '审核通过' : '审核已驳回')
    auditVisible.value = false
    searchFeeRecord()
    loadFeeStats()
  } catch (e) {
    console.error('审核提交失败', e)
  }
}

onMounted(() => {
  searchFeeRecord()
  loadFeeStats()
  loadFeeChart()
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.admin-fee-manage { width: 100%; }
.mb-20 { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.stat-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
}
.stat-value { font-size: 24px; font-weight: bold; color: #165DFF; margin-bottom: 10px; }
.stat-label { color: #666; }

.voucher-img-box {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}
.voucher-img-box .label {
  margin-bottom: 8px;
  font-weight: bold;
  color: #606266;
}
</style>
