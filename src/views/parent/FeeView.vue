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
          <el-button type="primary" size="small" @click="fetchData">刷新数据</el-button>
        </div>
      </template>

      <el-table :data="billList" border stripe style="width:100%" v-loading="loading">
        <el-table-column prop="billId" label="账单ID" width="90" />
        <el-table-column prop="month" label="账单月份" width="100" />
        <el-table-column prop="childName" label="儿童姓名" width="100" />
        <el-table-column prop="timeSlot" label="托管时段" width="100" />
        <el-table-column prop="manageDays" label="天数" width="80" />
        <el-table-column prop="amount" label="应缴金额" width="100">
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
        <el-table-column prop="createTime" label="生成时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link
              v-if="scope.row.status === 0 || scope.row.status === 2"
              @click="handlePay(scope.row)"
            >
              <el-icon><Upload /></el-icon>上传凭证
            </el-button>
            <el-button 
              type="info" 
              link
              @click="viewVoucher(scope.row)"
            >
              <el-icon><View /></el-icon>详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 上传凭证弹窗 -->
    <el-dialog
      v-model="payDialogVisible"
      title="上传缴费凭证"
      width="500px"
      @close="resetPayForm"
    >
      <el-form :model="payForm" label-width="100px" ref="payFormRef">
        <el-form-item label="账单月份">
          <span>{{ currentBill.month }}</span>
        </el-form-item>
        <el-form-item label="应缴金额">
          <span class="amount-text">¥{{ currentBill.amount }}</span>
        </el-form-item>
        <el-form-item label="缴费凭证" required>
          <el-upload
            class="voucher-upload"
            action="/api/upload/record"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <img v-if="payForm.voucherUrl" :src="payForm.voucherUrl" class="voucher-img" />
            <el-icon v-else class="voucher-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">请上传银行转账或扫码支付成功的截图</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="payForm.remark" type="textarea" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitVoucher">提交审核</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="账单详情及凭证"
      width="600px"
    >
      <div v-if="currentBill" class="bill-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="账单ID">{{ currentBill.billId }}</el-descriptions-item>
          <el-descriptions-item label="账单月份">{{ currentBill.month }}</el-descriptions-item>
          <el-descriptions-item label="儿童姓名">{{ currentBill.childName }}</el-descriptions-item>
          <el-descriptions-item label="托管时段">{{ currentBill.timeSlot }}</el-descriptions-item>
          <el-descriptions-item label="托管天数">{{ currentBill.manageDays }}天</el-descriptions-item>
          <el-descriptions-item label="应缴金额">¥{{ currentBill.amount }}</el-descriptions-item>
          <el-descriptions-item label="缴费状态">
            <el-tag :type="getPaymentStatusType(currentBill.status)">
              {{ getPaymentStatusText(currentBill.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="voucher-section">
          <div class="section-title">缴费凭证记录</div>
          <el-timeline v-if="vouchers.length > 0">
            <el-timeline-item
              v-for="(v, index) in vouchers"
              :key="index"
              :timestamp="v.uploadTime"
              :type="getVoucherAuditType(v.auditStatus)"
            >
              <div class="voucher-item">
                <div class="voucher-status">
                  状态：<el-tag size="small" :type="getVoucherAuditType(v.auditStatus)">
                    {{ getVoucherAuditText(v.auditStatus) }}
                  </el-tag>
                </div>
                <div class="voucher-image-box" v-if="v.voucherUrl">
                  <el-image 
                    :src="v.voucherUrl" 
                    :preview-src-list="[v.voucherUrl]"
                    fit="cover"
                    class="voucher-preview-img"
                  />
                </div>
                <div class="audit-remark" v-if="v.auditRemark">
                  审核备注：{{ v.auditRemark }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else :image-size="60" description="暂无凭证记录" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Money, Checked, Document, Plus, Upload, View } from '@element-plus/icons-vue'
import { useUserStore } from '../../pinia/modules/userStore'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)

// 费用统计
const feeStats = reactive({
  unpaid: 0,
  paid: 0,
  billCount: 0
})

// 账单列表
const billList = ref([])

// 弹窗控制
const payDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentBill = ref(null)
const vouchers = ref([])
const payFormRef = ref(null)

const payForm = reactive({
  voucherUrl: '',
  remark: ''
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  const parentId = userStore.userInfo.userId
  try {
    // 并行获取账单和统计
    const [billRes, statsRes] = await Promise.all([
      request.get(`/feeBill/parent/${parentId}`),
      request.get(`/feeBill/parent/${parentId}/stats`)
    ])
    
    billList.value = billRes.data.map(b => ({
      id: b.billId,
      billId: b.billId,
      month: b.billMonth,
      childName: b.child ? b.child.childName : '-',
      timeSlot: b.timeSlot,
      manageDays: b.manageDays,
      amount: b.payableAmount,
      status: b.paymentStatus,
      createTime: b.createTime ? b.createTime.replace('T', ' ') : '-'
    }))
    
    // 更新统计数据
    Object.assign(feeStats, statsRes.data)
      
  } catch (err) {
    console.error('获取费用数据失败', err)
    ElMessage.error('获取数据失败')
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
    case 4: return 'primary'
    default: return 'info'
  }
}

// 缴费状态文本
const getPaymentStatusText = (status) => {
  switch (status) {
    case 1: return '已缴费'
    case 0: return '未缴费'
    case 2: return '欠费'
    case 4: return '审核中'
    default: return '未知'
  }
}

// 凭证审核状态样式
const getVoucherAuditType = (status) => {
  switch (status) {
    case 1: return 'success'
    case 2: return 'danger'
    case 0: return 'primary'
    default: return 'info'
  }
}

// 凭证审核状态文本
const getVoucherAuditText = (status) => {
  switch (status) {
    case 1: return '审核通过'
    case 2: return '审核驳回'
    case 0: return '待审核'
    default: return '未知'
  }
}

// 处理缴费
const handlePay = (row) => {
  currentBill.value = row
  payDialogVisible.value = true
}

// 查看详情/凭证
const viewVoucher = async (row) => {
  currentBill.value = row
  detailDialogVisible.value = true
  try {
    const res = await request.get(`/voucher/bill/${row.billId}`)
    vouchers.value = res.data.map(v => ({
      ...v,
      uploadTime: v.uploadTime ? v.uploadTime.replace('T', ' ') : '-'
    }))
  } catch (err) {
    console.error('获取凭证失败', err)
  }
}

// 上传相关
const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('上传凭证只能是 JPG/PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('上传凭证大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

const handleUploadSuccess = (res) => {
  if (res.code === 200) {
    payForm.voucherUrl = res.data.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(res.msg || '上传失败')
  }
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请稍后重试')
}

// 提交凭证
const submitVoucher = async () => {
  if (!payForm.voucherUrl) {
    return ElMessage.warning('请先上传缴费凭证截图')
  }

  submitting.value = true
  try {
    await request.post(`/voucher/upload?billId=${currentBill.value.billId}&parentId=${userStore.userInfo.userId}`, {
      voucherUrl: payForm.voucherUrl,
      remark: payForm.remark
    })
    ElMessage.success('凭证提交成功，请耐心等待管理员审核')
    payDialogVisible.value = false
    fetchData()
  } catch (err) {
    console.error('提交凭证失败', err)
  } finally {
    submitting.value = false
  }
}

const resetPayForm = () => {
  payForm.voucherUrl = ''
  payForm.remark = ''
  nextTick(() => {
    if (payFormRef.value) {
      payFormRef.value.clearValidate()
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.parent-fee-view {
  padding: 20px;
}
.mb-20 { margin-bottom: 20px; }
.stat-card { transition: all 0.3s; border-radius: 8px; }
.stat-card:hover { transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
.stat-content { display: flex; align-items: center; gap: 20px; }
.stat-info { flex: 1; }
.stat-value { font-size: 24px; font-weight: bold; color: #303133; line-height: 1.2; }
.stat-label { font-size: 14px; color: #909399; margin-top: 4px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.amount-text { font-size: 16px; font-weight: bold; color: #F56C6C; }

.voucher-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}
.voucher-upload:hover { border-color: #409EFF; }
.voucher-uploader-icon { font-size: 28px; color: #8c939d; }
.voucher-img { width: 100%; height: 100%; object-fit: cover; }
.upload-tip { font-size: 12px; color: #909399; margin-top: 8px; }

.section-title { font-size: 16px; font-weight: bold; margin: 20px 0 15px; padding-left: 10px; border-left: 4px solid #409EFF; }
.voucher-item { padding: 10px; background: #f8f9fa; border-radius: 4px; }
.voucher-status { margin-bottom: 10px; font-size: 14px; }
.voucher-image-box { width: 120px; height: 120px; margin-bottom: 10px; }
.voucher-preview-img { width: 100%; height: 100%; border-radius: 4px; }
.audit-remark { font-size: 13px; color: #F56C6C; margin-top: 5px; }
</style>
