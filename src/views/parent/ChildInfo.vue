<!-- 
  模块：【家长-儿童信息】
  功能：查看儿童基本信息、日常托管记录、考勤统计、成长档案、老师评语查看
-->
<template>
  <div class="parent-child-info">
    <!-- 儿童选择 -->
    <el-card class="mb-20">
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

    <el-row :gutter="20" v-if="currentChild">
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
            <el-tag :type="currentChild.status === 'active' ? 'success' : 'info'">
              {{ currentChild.status === 'active' ? '在读' : '请假' }}
            </el-tag>
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
            <el-descriptions-item label="入学时间">
              {{ currentChild.enrollDate }}
            </el-descriptions-item>
            <el-descriptions-item label="班主任">
              {{ currentChild.teacher }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ currentChild.teacherPhone }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 本月考勤统计 -->
        <el-card class="mt-20">
          <template #header>
            <span>本月考勤统计</span>
          </template>

          <div class="attendance-stats">
            <div class="stat-item">
              <div class="stat-value" style="color:#67C23A;">{{ attendanceStats.present }}</div>
              <div class="stat-label">出勤天数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color:#F56C6C;">{{ attendanceStats.absent }}</div>
              <div class="stat-label">缺勤天数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color:#E6A23C;">{{ attendanceStats.late }}</div>
              <div class="stat-label">迟到次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color:#409EFF;">{{ attendanceStats.rate }}%</div>
              <div class="stat-label">出勤率</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：详细信息 -->
      <el-col :span="16">
        <el-card>
          <el-tabs v-model="activeTab">
            <!-- 日常记录 -->
            <el-tab-pane label="日常记录" name="daily">
              <el-timeline>
                <el-timeline-item
                  v-for="record in dailyRecords"
                  :key="record.id"
                  :timestamp="record.date"
                  :color="record.type === 'good' ? '#67C23A' : '#409EFF'"
                >
                  <el-card>
                    <div class="record-header">
                      <el-tag :type="getRecordTypeTag(record.type)" size="small">
                        {{ getRecordTypeText(record.type) }}
                      </el-tag>
                      <span class="record-teacher">记录人：{{ record.teacher }}</span>
                    </div>
                    <p class="record-content">{{ record.content }}</p>
                    <div class="record-images" v-if="record.images && record.images.length">
                      <el-image
                        v-for="(img, index) in record.images"
                        :key="index"
                        :src="img"
                        fit="cover"
                        style="width:100px;height:100px;margin-right:10px;"
                        :preview-src-list="record.images"
                      />
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </el-tab-pane>

            <!-- 考勤记录 -->
            <el-tab-pane label="考勤记录" name="attendance">
              <el-form inline class="mb-15">
                <el-form-item label="查询月份">
                  <el-date-picker
                    v-model="attendanceMonth"
                    type="month"
                    placeholder="选择月份"
                    style="width:200px"
                    @change="loadAttendance"
                  />
                </el-form-item>
              </el-form>

              <el-table :data="attendanceRecords" border stripe style="width:100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="checkInTime" label="签到时间" width="120" />
                <el-table-column prop="checkOutTime" label="签退时间" width="120" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getAttendanceStatusType(scope.row.status)">
                      {{ getAttendanceStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="temperature" label="体温" width="80">
                  <template #default="scope">
                    {{ scope.row.temperature ? scope.row.temperature + '℃' : '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip />
              </el-table>
            </el-tab-pane>

            <!-- 成长档案 -->
            <el-tab-pane label="成长档案" name="growth">
              <el-row :gutter="20">
                <el-col :span="12" v-for="milestone in growthMilestones" :key="milestone.id">
                  <el-card class="milestone-card mb-15" shadow="hover">
                    <div class="milestone-header">
                      <el-icon :size="24" :color="milestone.color">
                        <component :is="milestone.icon" />
                      </el-icon>
                      <h4>{{ milestone.title }}</h4>
                    </div>
                    <p class="milestone-date">{{ milestone.date }}</p>
                    <p class="milestone-content">{{ milestone.content }}</p>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>

            <!-- 老师评语 -->
            <el-tab-pane label="老师评语" name="comments">
              <el-card 
                v-for="comment in teacherComments" 
                :key="comment.id"
                class="comment-card mb-15"
                shadow="hover"
              >
                <div class="comment-header">
                  <div>
                    <span class="comment-teacher">{{ comment.teacher }}</span>
                    <el-tag size="small" class="ml-10">{{ comment.subject }}</el-tag>
                  </div>
                  <span class="comment-date">{{ comment.date }}</span>
                </div>
                <el-rate v-model="comment.rating" disabled show-score class="mt-10" />
                <p class="comment-content">{{ comment.content }}</p>
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Trophy, Star, Heart, Gift } from '@element-plus/icons-vue'

// 儿童列表
const children = ref([
  { id: 1, name: '张小宝' },
  { id: 2, name: '张小美' }
])

// 当前选中的儿童
const currentChildId = ref(1)

// 当前儿童详细信息
const currentChild = ref({
  id: 1,
  name: '张小宝',
  gender: 1,
  age: 6,
  className: '大一班',
  avatar: '',
  enrollDate: '2024-01-15',
  teacher: '王老师',
  teacherPhone: '13800138000',
  status: 'active'
})

// 考勤统计
const attendanceStats = ref({
  present: 18,
  absent: 2,
  late: 1,
  rate: 90
})

// 活动标签
const activeTab = ref('daily')

// 日常记录
const dailyRecords = ref([
  {
    id: 1,
    date: '2024-05-20 15:30',
    type: 'good',
    teacher: '王老师',
    content: '今天表现非常好，积极参与课堂活动，帮助其他小朋友整理玩具，值得表扬！',
    images: []
  },
  {
    id: 2,
    date: '2024-05-20 12:00',
    type: 'meal',
    teacher: '李老师',
    content: '午餐吃得很好，米饭、青菜和肉都吃完了，还喝了一碗汤。',
    images: []
  },
  {
    id: 3,
    date: '2024-05-19 14:30',
    type: 'nap',
    teacher: '王老师',
    content: '午睡情况良好，睡了2小时，醒来精神状态很好。',
    images: []
  }
])

// 考勤记录
const attendanceMonth = ref(new Date())
const attendanceRecords = ref([
  {
    date: '2024-05-20',
    checkInTime: '08:15',
    checkOutTime: '17:05',
    status: 'normal',
    temperature: 36.5,
    remark: ''
  },
  {
    date: '2024-05-19',
    checkInTime: '08:35',
    checkOutTime: '17:10',
    status: 'late',
    temperature: 36.6,
    remark: '迟到'
  },
  {
    date: '2024-05-18',
    checkInTime: '-',
    checkOutTime: '-',
    status: 'absent',
    temperature: null,
    remark: '请假'
  }
])

// 成长档案
const growthMilestones = ref([
  {
    id: 1,
    title: '学会独立穿衣',
    date: '2024-03-15',
    content: '今天小宝第一次独立完成穿衣服，进步很大！',
    icon: Trophy,
    color: '#67C23A'
  },
  {
    id: 2,
    title: '获得小红花',
    date: '2024-04-10',
    content: '因为帮助其他小朋友，获得了本月第一朵小红花。',
    icon: Star,
    color: '#E6A23C'
  },
  {
    id: 3,
    title: '学会分享',
    date: '2024-04-20',
    content: '主动把自己的玩具分享给其他小朋友，懂得分享的快乐。',
    icon: Heart,
    color: '#F56C6C'
  },
  {
    id: 4,
    title: '生日快乐',
    date: '2024-05-01',
    content: '在托管班度过了6岁生日，和小朋友们一起分享了蛋糕。',
    icon: Gift,
    color: '#409EFF'
  }
])

// 老师评语
const teacherComments = ref([
  {
    id: 1,
    teacher: '王老师',
    subject: '综合表现',
    date: '2024-05-15',
    rating: 5,
    content: '小宝这个月表现非常出色，学习态度认真，和小朋友相处融洽，生活自理能力也有很大提升。希望继续保持！'
  },
  {
    id: 2,
    teacher: '李老师',
    subject: '艺术活动',
    date: '2024-05-10',
    rating: 4,
    content: '在美术课上很有创意，画的作品色彩丰富，想象力很好。建议多鼓励孩子表达自己的想法。'
  }
])

// 记录类型标签
const getRecordTypeTag = (type) => {
  const tagMap = {
    good: 'success',
    meal: 'warning',
    nap: 'info',
    health: 'danger',
    activity: 'primary'
  }
  return tagMap[type] || ''
}

// 记录类型文本
const getRecordTypeText = (type) => {
  const textMap = {
    good: '表现优秀',
    meal: '饮食情况',
    nap: '午睡情况',
    health: '健康状况',
    activity: '活动表现'
  }
  return textMap[type] || type
}

// 考勤状态类型
const getAttendanceStatusType = (status) => {
  const typeMap = {
    normal: 'success',
    late: 'warning',
    absent: 'danger',
    leave: 'info'
  }
  return typeMap[status] || ''
}

// 考勤状态文本
const getAttendanceStatusText = (status) => {
  const textMap = {
    normal: '正常',
    late: '迟到',
    absent: '缺勤',
    leave: '请假'
  }
  return textMap[status] || status
}

// 加载儿童信息
const loadChildInfo = () => {
  // 模拟加载数据
  console.log('加载儿童信息:', currentChildId.value)
}

// 加载考勤记录
const loadAttendance = () => {
  // 模拟加载考勤数据
  console.log('加载考勤记录:', attendanceMonth.value)
}
</script>

<style scoped>
.parent-child-info {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.mb-20 {
  margin-bottom: 20px;
}

.mb-15 {
  margin-bottom: 15px;
}

.mt-20 {
  margin-top: 20px;
}

.mt-10 {
  margin-top: 10px;
}

.ml-10 {
  margin-left: 10px;
}

.child-profile {
  text-align: center;
  padding: 20px 0;
}

.child-profile h2 {
  margin: 15px 0 10px;
}

.attendance-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 10px 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-teacher {
  font-size: 12px;
  color: #909399;
}

.record-content {
  margin: 10px 0;
  line-height: 1.6;
}

.record-images {
  margin-top: 10px;
}

.milestone-card {
  transition: all 0.3s;
}

.milestone-card:hover {
  transform: translateY(-5px);
}

.milestone-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.milestone-header h4 {
  margin: 0;
}

.milestone-date {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.milestone-content {
  line-height: 1.6;
  color: #606266;
}

.comment-card {
  transition: all 0.3s;
}

.comment-card:hover {
  transform: translateY(-3px);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-teacher {
  font-weight: bold;
  font-size: 16px;
}

.comment-date {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin-top: 15px;
  line-height: 1.8;
  color: #606266;
}
</style>
