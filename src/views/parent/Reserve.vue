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

          <el-calendar v-model="selectedDate" :key="calendarKey">
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

            <el-form-item label="托管时间" prop="timeSlot">
              <el-radio-group v-model="reserveForm.timeSlot">
                <el-radio label="上午">上午</el-radio>
                <el-radio label="下午">下午</el-radio>
                <el-radio label="全天">全天</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="特殊需求">
              <el-input 
                v-model="reserveForm.specialNeeds" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入特殊需求（选填，如晚餐、留餐等）"
              />
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
              <li>预约提交后需等待管理员/教师审核</li>
              <li>如需取消预约，请在审核通过前操作</li>
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
          <el-radio-group v-model="recordFilter" size="small" @change="fetchReservations">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="review">待审核</el-radio-button>
            <el-radio-button label="confirm">已确认</el-radio-button>
            <el-radio-button label="cancel">已取消</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="filteredRecords" border stripe style="width:100%" v-loading="loading">
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="reserveDate" label="预约日期" width="120" />
        <el-table-column prop="timeSlot" label="时间段" width="100" />
        <el-table-column prop="specialNeeds" label="特殊需求" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              type="danger" 
              size="small" 
              @click="cancelReserve(scope.row)"
              v-if="scope.row.status === 'review'"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { useUserStore } from '../../pinia/modules/userStore'
import request from '../../utils/request'

const userStore = useUserStore()

// 选中的日期
const selectedDate = ref(new Date())
const calendarKey = ref(0) // 用于强制刷新日历组件
const loading = ref(false)
const submitting = ref(false)

// 儿童列表
const children = ref([])

// 预约表单
const reserveFormRef = ref(null)
const reserveForm = reactive({
  childId: '',
  reserveDate: '',
  timeSlot: '全天',
  specialNeeds: ''
})

const reserveRules = {
  childId: [{ required: true, message: '请选择儿童', trigger: 'change' }],
  reserveDate: [{ required: true, message: '请选择预约日期', trigger: 'change' }],
  timeSlot: [{ required: true, message: '请选择时间段', trigger: 'change' }]
}

// 预约记录
const reserveRecords = ref([])
const recordFilter = ref('all')

const filteredRecords = computed(() => {
  if (recordFilter.value === 'all') {
    return reserveRecords.value
  }
  return reserveRecords.value.filter(item => item.status === recordFilter.value)
})

// 获取儿童列表
const fetchChildren = async () => {
  const parentId = userStore.userInfo.userId
  try {
    const res = await request.get(`/child/parent/${parentId}`)
    children.value = res.data.map(c => ({
      id: c.childId,
      name: c.childName,
      className: c.classInfo ? c.classInfo.className : '未分班'
    }))
  } catch (err) {
    console.error('获取儿童列表失败', err)
  }
}

// 获取预约记录
const fetchReservations = async () => {
  loading.value = true
  const parentId = userStore.userInfo.userId
  try {
    const res = await request.get(`/reservation/parent/${parentId}`)
    reserveRecords.value = res.data.map(r => ({
      id: r.reservationId,
      childName: r.child ? r.child.childName : '-',
      reserveDate: r.reserveDate,
      timeSlot: r.timeSlot,
      specialNeeds: r.specialNeeds,
      status: r.reserveStatus,
      createTime: r.createTime ? r.createTime.replace('T', ' ') : '-'
    }))
    // 数据加载完成后，更新 calendarKey 触发日历组件重新渲染
    calendarKey.value++
  } catch (err) {
    console.error('获取预约记录失败', err)
  } finally {
    loading.value = false
  }
}

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

// 获取日期状态
const getDateStatus = (date) => {
  // 只查找非取消状态的记录
  const record = reserveRecords.value.find(r => r.reserveDate === date && r.status !== 'cancel')
  if (record) {
    return record.status === 'confirm' ? '已确认' : '待审核'
  }
  return ''
}

// 获取日期样式类
const getDayClass = (date) => {
  // 只查找非取消状态的记录
  const record = reserveRecords.value.find(r => r.reserveDate === date && r.status !== 'cancel')
  if (record) {
    return record.status === 'confirm' ? 'reserved-day' : 'pending-day'
  }
  return ''
}

// 选择日期
const selectDate = (date) => {
  reserveForm.reserveDate = new Date(date)
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

// 状态类型
const getStatusType = (status) => {
  const typeMap = {
    review: 'warning',
    confirm: 'success',
    cancel: 'danger'
  }
  return typeMap[status] || ''
}

// 提交预约
const submitReserve = () => {
  reserveFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      const parentId = userStore.userInfo.userId
      try {
        await request.post(`/reservation/add?childId=${reserveForm.childId}&parentId=${parentId}`, {
          reserveDate: reserveForm.reserveDate.toISOString().split('T')[0],
          timeSlot: reserveForm.timeSlot,
          specialNeeds: reserveForm.specialNeeds
        })
        ElMessage.success('预约提交成功！')
        fetchReservations()
        // 重置表单并清除校验状态
        reserveFormRef.value.resetFields()
      } catch (err) {
        console.error('提交预约失败', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 取消预约
const cancelReserve = (record) => {
  ElMessageBox.confirm('确定要取消这个预约吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.put(`/reservation/cancel/${record.id}`)
      ElMessage.success('预约已取消')
      fetchReservations()
    } catch (err) {
      console.error('取消预约失败', err)
    }
  })
}

onMounted(() => {
  fetchChildren()
  fetchReservations()
})
</script>

<style scoped>
.parent-reserve {
  padding: 20px;
}
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.calendar-day {
  height: 100%;
  padding: 5px;
  cursor: pointer;
}
.calendar-day.reserved-day { background: #e1f3d8; }
.calendar-day.pending-day { background: #fdf6ec; }
.day-number { font-size: 16px; font-weight: bold; }
.day-status { font-size: 12px; color: #67C23A; margin-top: 5px; }
.notice-list { padding-left: 20px; margin: 0; }
.notice-list li { margin: 8px 0; color: #606266; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
