<!-- 
  模块：【教师端-工作台】
  功能：数据概览、今日待办、快速操作入口
-->
<template>
  <div class="teacher-dashboard">
    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalChild }}</div>
              <div class="stat-label">本班儿童总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon checkin-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ checkedInCount }}</div>
              <div class="stat-label">今日已签到</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon absent-icon">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ absentCount }}</div>
              <div class="stat-label">今日未签到</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon message-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ unreadMsg }}</div>
              <div class="stat-label">未读家长消息</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 今日待办 -->
    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>今日待办</span>
          </template>
          <el-list border :data="todoList">
            <el-list-item v-for="item in todoList" :key="item.id">
              <el-list-item-meta>
                <template #title>
                  <span :class="{ 'todo-completed': item.completed }">{{ item.title }}</span>
                </template>
                <template #description>{{ item.time }}</template>
              </el-list-item-meta>
              <el-checkbox v-model="item.completed" @change="updateTodo(item)" />
            </el-list-item>
          </el-list>
        </el-card>
      </el-col>

      <!-- 快速操作 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <el-grid :columns="3" :gutter="10">
            <el-grid-item v-for="item in quickMenu" :key="item.id">
              <div class="quick-item" @click="goToPage(item.path)">
                <div class="quick-icon" :style="{ backgroundColor: item.color }">
                  <el-icon :size="24">{{ item.icon }}</el-icon>
                </div>
                <div class="quick-text">{{ item.name }}</div>
              </div>
            </el-grid-item>
          </el-grid>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近一周签到统计 -->
    <el-card>
      <template #header>
        <span>最近一周签到统计</span>
      </template>
      <div ref="checkinChart" style="width:100%;height:300px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, useRouter } from 'element-plus'
import { User, Check, Close, ChatDotRound, UserFilled, Document, EditPen, Message, Calendar } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const router = useRouter()

// 数据概览
const totalChild = ref(25)
const checkedInCount = ref(22)
const absentCount = ref(3)
const unreadMsg = ref(8)

// 今日待办
const todoList = ref([
  { id: 1, title: '完成今日签到记录', completed: true, time: '09:00' },
  { id: 2, title: '填写儿童日常表现', completed: false, time: '12:00' },
  { id: 3, title: '布置今日作业', completed: false, time: '15:00' },
  { id: 4, title: '回复家长消息', completed: false, time: '17:00' }
])

// 快速操作菜单
const quickMenu = ref([
  { id: 1, name: '儿童管理', icon: UserFilled, color: '#409EFF', path: '/teacher/child-manage' },
  { id: 2, name: '接送签到', icon: Check, color: '#67C23A', path: '/teacher/checkin' },
  { id: 3, name: '日常记录', icon: EditPen, color: '#E6A23C', path: '/teacher/daily-record' },
  { id: 4, name: '作业布置', icon: Document, color: '#909399', path: '/teacher/homework' },
  { id: 5, name: '家长沟通', icon: Message, color: '#F56C6C', path: '/teacher/message' },
  { id: 6, name: '考勤统计', icon: Calendar, color: '#722ED1', path: '/teacher/statistics' }
])

// 更新待办状态
const updateTodo = (item) => {
  ElMessage.success(item.completed ? '已完成' : '已取消')
}

// 跳转页面
const goToPage = (path) => {
  router.push(path)
}

// 初始化签到统计图表
const checkinChart = ref(null)
const initChart = () => {
  const chart = echarts.init(checkinChart.value)
  chart.setOption({
    title: { text: '' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['已签到', '未签到'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '已签到',
        type: 'bar',
        data: [24, 23, 25, 22, 24, 18, 15],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '未签到',
        type: 'bar',
        data: [1, 2, 0, 3, 1, 7, 10],
        itemStyle: { color: '#F56C6C' }
      }
    ]
  })
  // 自适应窗口大小
  window.addEventListener('resize', () => {
    chart.resize()
  })
}

onMounted(() => {
  initChart()
})
</script>

<style scoped>
.teacher-dashboard {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.mb-20 {
  margin-bottom: 20px;
}

/* 数据卡片样式 */
.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 80px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.user-icon {
  background-color: #e8f4ff;
  color: #409EFF;
}

.checkin-icon {
  background-color: #f0f9eb;
  color: #67C23A;
}

.absent-icon {
  background-color: #fef0f0;
  color: #F56C6C;
}

.message-icon {
  background-color: #fcf1f7;
  color: #E6A23C;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #999;
  font-size: 14px;
}

/* 待办样式 */
.todo-completed {
  text-decoration: line-through;
  color: #999;
}

/* 快速操作样式 */
.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.quick-item:hover {
  background-color: #f5f7fa;
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 10px;
}

.quick-text {
  font-size: 14px;
  color: #666;
}
</style>