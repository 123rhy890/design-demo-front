<!-- 
  模块：【家长-儿童信息】
  功能：查看儿童基本信息、日常托管记录、考勤统计、成长档案、老师评语查看
-->
<template>
  <div class="parent-child-info">
    <!-- 儿童选择 -->
    <el-card class="mb-20" v-if="children.length > 0">
      <el-radio-group v-model="currentChildId" @change="loadChildInfo">
        <el-radio-button 
          v-for="child in children" 
          :key="child.id" 
          :label="child.id"
        >
          {{ child.name }}
        </el-radio-button>
      </el-radio-group>
    </el-card>
    <el-empty v-else description="暂无关联儿童信息" />

    <el-row :gutter="20" v-if="currentChild && children.length > 0">
      <!-- 左侧：基本信息 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>

          <div class="child-profile">
            <el-avatar :size="100" :src="currentChild.avatar">
              {{ currentChild.name.charAt(0) }}
            </el-avatar>
            <h2>{{ currentChild.name }}</h2>
            <el-tag type="success">在读</el-tag>
          </div>

          <el-descriptions :column="1" border class="mt-20">
            <el-descriptions-item label="性别">
              {{ currentChild.gender === 1 ? '男' : '女' }}
            </el-descriptions-item>
            <el-descriptions-item label="年龄">
              {{ currentChild.age }}岁
            </el-descriptions-item>
            <el-descriptions-item label="班级">
              {{ currentChild.className }}
            </el-descriptions-item>
            <el-descriptions-item label="过敏史">
              {{ currentChild.allergy || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="紧急联系人">
              {{ currentChild.emergencyContact }}
            </el-descriptions-item>
            <el-descriptions-item label="紧急电话">
              {{ currentChild.emergencyPhone }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右侧：详细信息 -->
      <el-col :span="16">
        <el-card>
          <el-tabs v-model="activeTab">
            <!-- 日常记录 -->
            <el-tab-pane label="日常记录" name="daily">
              <el-timeline v-if="dailyRecords.length > 0">
                <el-timeline-item
                  v-for="record in dailyRecords"
                  :key="record.id"
                  :timestamp="record.date"
                  color="#409EFF"
                >
                  <el-card>
                    <div class="record-header">
                      <span class="record-teacher">记录老师：{{ record.teacher }}</span>
                    </div>
                    <div class="record-content">
                      <p><strong>饮食情况：</strong>{{ record.diet || '正常' }}</p>
                      <p><strong>作业情况：</strong>{{ record.homework || '无' }}</p>
                      <p><strong>活动情况：</strong>{{ record.activity || '正常' }}</p>
                      <div v-if="record.abnormalDesc" style="color: #F56C6C; margin-top: 10px;">
                        <strong>异常情况：</strong>{{ record.abnormalDesc }}
                      </div>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无日常记录" />
            </el-tab-pane>

            <!-- 考勤记录 -->
            <el-tab-pane label="考勤记录" name="attendance">
              <el-table :data="attendanceRecords" border stripe style="width:100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="checkInTime" label="签到时间" width="180" />
                <el-table-column prop="checkOutTime" label="签退时间" width="180" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getAttendanceStatusType(scope.row.status)">
                      {{ getAttendanceStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="pickPerson" label="接送人" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../pinia/modules/userStore'
import request from '../../utils/request'

const userStore = useUserStore()

// 儿童列表
const children = ref([])
// 当前选中的儿童ID
const currentChildId = ref(null)
// 当前儿童详细数据
const currentChild = ref(null)
// 日常记录
const dailyRecords = ref([])
// 考勤记录
const attendanceRecords = ref([])
// 当前标签页
const activeTab = ref('daily')

// 获取家长关联的所有儿童
const fetchChildren = async () => {
  const parentId = userStore.userInfo.userId
  try {
    const res = await request.get(`/child/parent/${parentId}`)
    children.value = res.data.map(c => ({
      id: c.childId,
      name: c.childName,
      gender: c.gender,
      birthDate: c.birthDate,
      className: c.classInfo ? c.classInfo.className : '未分班',
      allergy: c.allergyHistory,
      emergencyContact: c.emergencyContact,
      emergencyPhone: c.emergencyPhone,
      remark: c.remark
    }))
    
    if (children.value.length > 0) {
      currentChildId.value = children.value[0].id
      loadChildInfo()
    }
  } catch (err) {
    console.error('获取儿童列表失败', err)
  }
}

// 加载选中儿童的详细信息
const loadChildInfo = () => {
  const child = children.value.find(c => c.id === currentChildId.value)
  if (child) {
    currentChild.value = {
      ...child,
      age: calculateAge(child.birthDate),
      avatar: ''
    }
    fetchDailyRecords()
    fetchAttendanceRecords()
  }
}

// 获取日常记录
const fetchDailyRecords = async () => {
  try {
    const res = await request.get(`/dailyStatus/child/${currentChildId.value}`)
    dailyRecords.value = res.data.map(r => ({
      id: r.recordId,
      date: r.recordDate,
      diet: r.diet,
      homework: r.homework,
      activity: r.activity,
      abnormalDesc: r.abnormalDesc,
      teacher: r.teacher ? r.teacher.username : '系统'
    }))
  } catch (err) {
    console.error('获取日常记录失败', err)
  }
}

// 获取考勤记录
const fetchAttendanceRecords = async () => {
  try {
    const res = await request.get(`/attendance/child/${currentChildId.value}`)
    attendanceRecords.value = res.data.map(a => ({
      date: a.checkinTime ? a.checkinTime.split('T')[0] : '-',
      checkInTime: a.checkinTime ? a.checkinTime.replace('T', ' ') : '-',
      checkOutTime: a.checkoutTime ? a.checkoutTime.replace('T', ' ') : '-',
      status: a.attendStatus,
      pickPerson: a.pickPerson
    }))
  } catch (err) {
    console.error('获取考勤记录失败', err)
  }
}

// 计算年龄
const calculateAge = (birthday) => {
  if (!birthday) return '-'
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// 考勤状态样式
const getAttendanceStatusType = (status) => {
  switch (status) {
    case 1: return 'success'
    case 0: return 'danger'
    case 2: return 'warning'
    case 3: return 'info'
    default: return ''
  }
}

// 考勤状态文本
const getAttendanceStatusText = (status) => {
  switch (status) {
    case 1: return '正常'
    case 0: return '迟到'
    case 2: return '早退'
    case 3: return '缺勤'
    default: return '未知'
  }
}

onMounted(() => {
  fetchChildren()
})
</script>

<style scoped>
.parent-child-info {
  padding: 20px;
}
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.child-profile {
  text-align: center;
  padding: 10px 0;
}
.record-header {
  margin-bottom: 10px;
}
.record-teacher {
  font-size: 12px;
  color: #909399;
}
.record-content p {
  margin: 5px 0;
  font-size: 14px;
}
</style>
