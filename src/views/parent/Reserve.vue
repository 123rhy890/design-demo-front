<!-- 
  模块：【家长-托管服务】
  功能：托管时段预约、预约日期选择、预约撤销、预约记录查询、预约状态查看
-->
<template>
  <div class="parent-reserve">
    <el-row :gutter="20">
      <!-- 左侧：预约日历 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>选择预约日期</span>
          </template>

          <el-calendar v-model="selectedDate">
            <template #date-cell="{ data }">
              <div 
                class="calendar-day" 
                :class="getDayClass(data.day)"
                @click="selectDate(data.day)"
              >
                <div class="day-number">{{ data.day.split('-').slice(2).join('-') }}</div>
                <div class="day-status" v-if="getDateStatus(data.day)">
                  {{ getDateStatus(data.day) }}
                </div>
              </div>
            </template>
          </el-calendar>
        </el-card>
      </el-col>

      <!-- 右侧：预约详情 -->
      <el-col :span="14">
        <el-card class="mb-20">
          <template #header>
            <span>预约托管服务</span>
          </template>

          <el-form :model="reserveForm" :rules="reserveRules" ref="reserveFormRef" label-width="100px">
            <el-form-item label="选择儿童" prop="childId">
              <el-select v-model="reserveForm.childId" placeholder="请选择儿童" style="width:100%">
                <el-option 
                  v-for="child in children" 
                  :key="child.id" 
                  :label="`${child.name} (${child.className})`" 
                  :value="child.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="预约日期" prop="reserveDate">
              <el-date-picker
                v-model="reserveForm.reserveDate"
                type="date"
                placeholder="选择预约日期"
                style="width:100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>

            <el-form-item label="托管类型" prop="careType">
              <el-radio-group v-model="reserveForm.careType">
                <el-radio label="dayCare">日托（8:00-17:00）</el-radio>
                <el-radio label="fullCare">全托（24小时）</el-radio>
                <el-radio label="tempCare">临时托管</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="时间段" prop="timeSlot" v-if="reserveForm.careType === 'tempCare'">
              <el-time-picker
                v-model="reserveForm.timeSlot"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width:100%"
              />
            </el-form-item>

            <el-form-item label="特殊需求">
              <el-input 
                v-model="reserveForm.specialNeeds" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入特殊需求（选填）"
              />
            </el-form-item>

            <el-form-item label="预计费用">
              <el-tag type="warning" size="large">
                ¥ {{ calculateFee() }}
              </el-tag>
              <span class="ml-10 text-muted">（实际费用以账单为准）</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="submitReserve" :loading="submitting" style="width:100%">
                <el-icon><Check /></el-icon>
                提交预约
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 预约须知 -->
        <el-card>
          <template #header>
            <span>预约须知</span>
          </template>
          <el-alert type="info" :closable="false">
            <ul class="notice-list">
              <li>请至少提前1天预约托管服务</li>
              <li>日托服务时间为8:00-17:00，全托为24小时</li>
              <li>临时托管最少2小时，按小时计费</li>
              <li>预约成功后请按时送孩子到托管班</li>
              <li>如需取消预约，请提前12小时操作</li>
            </ul>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预约记录 -->
    <el-card class="mt-20">
      <template #header>
        <div class="card-header">
          <span>我的预约记录</span>
          <el-radio-group v-model="recordFilter" size="small">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="pending">待确认</el-radio-button>
            <el-radio-button label="confirmed">已确认</el-radio-button>
            <el-radio-button label="completed">已完成</el-radio-button>
            <el-radio-button label="cancelled">已取消</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="filteredRecords" border stripe style="width:100%">
        <el-table-column prop="childName" label="儿童姓名" width="100" />
        <el-table-column prop="reserveDate" label="预约日期" width="120" />
        <el-table-column prop="careType" label="托管类型" width="150">
          <template #default="scope">
            {{ getCareTypeText(scope.row.careType) }}
          </template>
        </el-table-column>
        <el-table-column prop="timeSlot" label="时间段" width="180" />
        <el-table-column prop="fee" label="费用" width="100">
          <template #default="scope">
            ¥{{ scope.row.fee }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="预约时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              type="danger" 
              size="small" 
              @click="cancelReserve(scope.row)"
              v-if="scope.row.status === 'pending' || scope.row.status === 'confirmed'"
            >
              取消预约
            </el-button>
            <el-button 
              type="text" 
              size="small" 
              @click="viewDetail(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

// 选中的日期
const selectedDate = ref(new Date())

// 儿童列表
const children = ref([
  { id: 1, name: '张小宝', className: '大一班' },
  { id: 2, name: '张小美', className: '中一班' }
])

// 预约表单
const reserveFormRef = ref(null)
const submitting = ref(false)

const reserveForm = reactive({
  childId: '',
  reserveDate: '',
  careType: 'dayCare',
  timeSlot: [],
  specialNeeds: ''
})

const reserveRules = ref({
  childId: [{ required: true, message: '请选择儿童', trigger: 'change' }],
  reserveDate: [{ required: true, message: '请选择预约日期', trigger: 'change' }],
  careType: [{ required: true, message: '请选择托管类型', trigger: 'change' }],
  timeSlot: [{ required: true, message: '请选择时间段', trigger: 'change' }]
})

// 预约记录
const reserveRecords = ref([
  {
    id: 1,
    childName: '张小宝',
    reserveDate: '2024-05-25',
    careType: 'dayCare',
    timeSlot: '8:00-17:00',
    fee: 80,
    status: 'confirmed',
    createTime: '2024-05-20 10:30:00'
  },
  {
    id: 2,
    childName: '张小美',
    reserveDate: '2024-05-26',
    careType: 'tempCare',
    timeSlot: '14:00-18:00',
    fee: 40,
    status: 'pending',
    createTime: '2024-05-21 09:15:00'
  }
])

// 记录筛选
const recordFilter = ref('all')

const filteredRecords = computed(() => {
  if (recordFilter.value === 'all') {
    return reserveRecords.value
  }
  return reserveRecords.value.filter(item => item.status === recordFilter.value)
})

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

// 获取日期状态
const getDateStatus = (date) => {
  const record = reserveRecords.value.find(r => r.reserveDate === date)
  if (record) {
    return record.status === 'confirmed' ? '已预约' : '待确认'
  }
  return ''
}

// 获取日期样式类
const getDayClass = (date) => {
  const record = reserveRecords.value.find(r => r.reserveDate === date)
  if (record) {
    return record.status === 'confirmed' ? 'reserved-day' : 'pending-day'
  }
  return ''
}

// 选择日期
const selectDate = (date) => {
  reserveForm.reserveDate = new Date(date)
}

// 计算费用
const calculateFee = () => {
  if (!reserveForm.careType) return 0
  
  const feeMap = {
    dayCare: 80,
    fullCare: 150,
    tempCare: 20 // 每小时
  }
  
  let fee = feeMap[reserveForm.careType] || 0
  
  if (reserveForm.careType === 'tempCare' && reserveForm.timeSlot.length === 2) {
    const hours = Math.ceil((reserveForm.timeSlot[1] - reserveForm.timeSlot[0]) / (1000 * 60 * 60))
    fee = hours * 20
  }
  
  return fee
}

// 托管类型文本
const getCareTypeText = (type) => {
  const typeMap = {
    dayCare: '日托（8:00-17:00）',
    fullCare: '全托（24小时）',
    tempCare: '临时托管'
  }
  return typeMap[type] || type
}

// 状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 状态类型
const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    confirmed: 'success',
    completed: 'info',
    cancelled: 'danger'
  }
  return typeMap[status] || ''
}

// 提交预约
const submitReserve = () => {
  reserveFormRef.value.validate((valid) => {
    if (valid) {
      if (reserveForm.careType === 'tempCare' && reserveForm.timeSlot.length !== 2) {
        ElMessage.warning('请选择临时托管的时间段')
        return
      }
      
      submitting.value = true
      
      setTimeout(() => {
        const child = children.value.find(c => c.id === reserveForm.childId)
        const timeSlot = reserveForm.careType === 'tempCare' 
          ? `${reserveForm.timeSlot[0].toLocaleTimeString().slice(0, 5)}-${reserveForm.timeSlot[1].toLocaleTimeString().slice(0, 5)}`
          : reserveForm.careType === 'dayCare' ? '8:00-17:00' : '24小时'
        
        reserveRecords.value.unshift({
          id: Date.now(),
          childName: child.name,
          reserveDate: reserveForm.reserveDate.toISOString().split('T')[0],
          careType: reserveForm.careType,
          timeSlot: timeSlot,
          fee: calculateFee(),
          status: 'pending',
          createTime: new Date().toLocaleString()
        })
        
        submitting.value = false
        ElMessage.success('预约提交成功，请等待确认！')
        
        // 重置表单
        reserveForm.childId = ''
        reserveForm.reserveDate = ''
        reserveForm.careType = 'dayCare'
        reserveForm.timeSlot = []
        reserveForm.specialNeeds = ''
      }, 1000)
    }
  })
}

// 取消预约
const cancelReserve = (record) => {
  ElMessageBox.confirm(
    '确定要取消这个预约吗？',
    '取消预约',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    record.status = 'cancelled'
    ElMessage.success('预约已取消')
  })
}

// 查看详情
const viewDetail = (record) => {
  ElMessage.info(`查看预约详情：${record.childName}`)
}
</script>

<style scoped>
.parent-reserve {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.ml-10 {
  margin-left: 10px;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-day {
  height: 100%;
  padding: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.calendar-day:hover {
  background: #f5f7fa;
}

.calendar-day.reserved-day {
  background: #e1f3d8;
}

.calendar-day.pending-day {
  background: #fdf6ec;
}

.day-number {
  font-size: 16px;
  font-weight: bold;
}

.day-status {
  font-size: 12px;
  color: #67C23A;
  margin-top: 5px;
}

.notice-list {
  margin: 0;
  padding-left: 20px;
}

.notice-list li {
  margin: 8px 0;
  color: #606266;
}
</style>