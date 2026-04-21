<template>
  <div class="dashboard-page">
    <!-- 数据统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statsCards" :key="item.title">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: item.color }">
              <el-icon :size="28"><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-label">{{ item.title }}</div>
              <div class="stat-trend" :class="item.trend > 0 ? 'up' : 'down'" v-if="item.trend !== undefined">
                <el-icon><component :is="item.trend > 0 ? 'CaretTop' : 'CaretBottom'" /></el-icon>
                {{ Math.abs(item.trend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="mt-20">
      <!-- 考勤趋势图 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>考勤趋势分析</span>
              <el-radio-group v-model="attendanceRange" size="small" @change="updateAttendanceChart">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
                <el-radio-button label="year">近12月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div style="width:100%;height:320px;" ref="attendanceChartRef"></div>
        </el-card>
      </el-col>

      <!-- 班级分布饼图 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>班级学员分布</span>
          </template>
          <div style="width:100%;height:320px;" ref="classChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第三行：缴费统计和最新动态 -->
    <el-row :gutter="20" class="mt-20">
      <!-- 缴费统计 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>月度缴费统计</span>
          </template>
          <div style="width:100%;height:280px;" ref="feeChartRef"></div>
        </el-card>
      </el-col>

      <!-- 最新动态 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最新动态</span>
          </template>
          <el-timeline class="activity-timeline">
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.time"
              :color="activity.color"
            >
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-desc">{{ activity.desc }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作（根据角色显示） -->
    <el-card class="mt-20" v-if="quickActions.length > 0">
      <template #header>
        <span>快捷操作</span>
      </template>
      <el-row :gutter="15">
        <el-col :span="4" v-for="action in quickActions" :key="action.name">
          <div class="quick-action" @click="handleQuickAction(action)">
            <el-icon :size="32" :color="action.color"><component :is="action.icon" /></el-icon>
            <div class="action-name">{{ action.name }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../pinia/modules/userStore'
import * as echarts from 'echarts'
import { 
  User, Calendar, DocumentCopy, Money, 
  CaretTop, CaretBottom, Plus, Edit, 
  View, Download, ChatDotRound, Bell 
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 基础数据
const childTotal = ref(156)
const todayCheckIn = ref(142)
const reserveTotal = ref(23)
const feeUnpaid = ref(8)
const teacherCount = ref(12)
const classCount = ref(6)

// 图表引用
const attendanceChartRef = ref(null)
const classChartRef = ref(null)
const feeChartRef = ref(null)
const attendanceRange = ref('week')

// 图表实例
let attendanceChart = null
let classChart = null
let feeChart = null

// 根据角色显示不同的统计卡片
const statsCards = computed(() => {
  const role = userStore.userInfo.role
  
  if (role === 'admin') {
    return [
      { title: '在册儿童总数', value: childTotal.value, icon: User, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', trend: 5.2 },
      { title: '今日签到人数', value: todayCheckIn.value, icon: Calendar, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', trend: 2.8 },
      { title: '托管预约数', value: reserveTotal.value, icon: DocumentCopy, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', trend: -1.5 },
      { title: '待缴费用数', value: feeUnpaid.value, icon: Money, color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', trend: -3.2 }
    ]
  } else if (role === 'teacher') {
    return [
      { title: '我的班级学员', value: 28, icon: User, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { title: '今日已签到', value: 25, icon: Calendar, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { title: '待处理预约', value: 5, icon: DocumentCopy, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { title: '未读消息', value: 12, icon: Bell, color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
    ]
  } else {
    return [
      { title: '我的孩子', value: 2, icon: User, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { title: '本月签到', value: 18, icon: Calendar, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { title: '预约记录', value: 3, icon: DocumentCopy, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { title: '待缴费用', value: 1, icon: Money, color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
    ]
  }
})

// 快捷操作（根据角色）
const quickActions = computed(() => {
  const role = userStore.userInfo.role
  
  if (role === 'admin') {
    return [
      { name: '家长审核', icon: 'User', color: '#165DFF', path: '/admin/userAudit' },
      { name: '费用管理', icon: 'Money', color: '#67C23A', path: '/admin/feeManage' },
      { name: '数据导出', icon: 'Download', color: '#E6A23C', path: '/admin/dataExport' },
      { name: '角色权限', icon: 'Edit', color: '#F56C6C', path: '/admin/roleAuth' }
    ]
  } else if (role === 'teacher') {
    return [
      { name: '接送签到', icon: 'Calendar', color: '#165DFF', path: '/teacher/checkIn' },
      { name: '日常记录', icon: 'Edit', color: '#67C23A', path: '/teacher/dailyRecord' },
      { name: '儿童管理', icon: 'User', color: '#E6A23C', path: '/teacher/childList' },
      { name: '家校沟通', icon: 'ChatDotRound', color: '#F56C6C', path: '/teacher/msgChat' }
    ]
  } else {
    return [
      { name: '托管预约', icon: 'Plus', color: '#165DFF', path: '/parent/reserve' },
      { name: '儿童信息', icon: 'View', color: '#67C23A', path: '/parent/childInfo' },
      { name: '费用查看', icon: 'Money', color: '#E6A23C', path: '/parent/feeView' },
      { name: '消息中心', icon: 'Bell', color: '#F56C6C', path: '/parent/msgCenter' }
    ]
  }
})

// 最新动态
const recentActivities = ref([
  { id: 1, title: '新增学员', desc: '张小明家长完成注册审核', time: '10分钟前', color: '#67C23A' },
  { id: 2, title: '缴费提醒', desc: '李小红家长完成本月费用缴纳', time: '30分钟前', color: '#E6A23C' },
  { id: 3, title: '预约托管', desc: '王小华预约了本周六全天托管', time: '1小时前', color: '#165DFF' },
  { id: 4, title: '考勤异常', desc: '赵小刚今日未签到，已通知家长', time: '2小时前', color: '#F56C6C' },
  { id: 5, title: '系统通知', desc: '本月考勤统计已生成', time: '3小时前', color: '#909399' }
])

// 初始化考勤趋势图
const initAttendanceChart = () => {
  if (!attendanceChartRef.value) return
  attendanceChart = echarts.init(attendanceChartRef.value)
  updateAttendanceChart()
}

// 更新考勤趋势图
const updateAttendanceChart = () => {
  if (!attendanceChart) return
  
  const dataMap = {
    week: {
      xData: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      checkIn: [142, 138, 145, 140, 148, 85, 92],
      total: [156, 156, 156, 156, 156, 156, 156]
    },
    month: {
      xData: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
      checkIn: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20 + 130)),
      total: Array.from({ length: 30 }, () => 156)
    },
    year: {
      xData: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      checkIn: [142, 145, 148, 150, 152, 155, 154, 153, 156, 155, 154, 156],
      total: [150, 150, 152, 152, 155, 156, 156, 156, 156, 156, 156, 156]
    }
  }
  
  const data = dataMap[attendanceRange.value]
  
  attendanceChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['签到人数', '总人数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.xData
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '签到人数',
        type: 'line',
        smooth: true,
        data: data.checkIn,
        itemStyle: { color: '#165DFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
            { offset: 1, color: 'rgba(22, 93, 255, 0.05)' }
          ])
        }
      },
      {
        name: '总人数',
        type: 'line',
        smooth: true,
        data: data.total,
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
}

// 初始化班级分布图
const initClassChart = () => {
  if (!classChartRef.value) return
  classChart = echarts.init(classChartRef.value)
  
  classChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: 28, name: '大一班', itemStyle: { color: '#165DFF' } },
          { value: 26, name: '大二班', itemStyle: { color: '#67C23A' } },
          { value: 25, name: '中一班', itemStyle: { color: '#E6A23C' } },
          { value: 27, name: '中二班', itemStyle: { color: '#F56C6C' } },
          { value: 24, name: '小一班', itemStyle: { color: '#9254DE' } },
          { value: 26, name: '小二班', itemStyle: { color: '#00B8D9' } }
        ]
      }
    ]
  })
}

// 初始化缴费统计图
const initFeeChart = () => {
  if (!feeChartRef.value) return
  feeChart = echarts.init(feeChartRef.value)
  
  feeChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['已缴费', '未缴费']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '已缴费',
        type: 'bar',
        stack: 'total',
        data: [145, 148, 150, 152, 148, 148],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '未缴费',
        type: 'bar',
        stack: 'total',
        data: [5, 2, 2, 4, 8, 8],
        itemStyle: { color: '#F56C6C' }
      }
    ]
  })
}

// 快捷操作点击
const handleQuickAction = (action) => {
  router.push(action.path)
}

// 窗口大小改变时重绘图表
const handleResize = () => {
  attendanceChart?.resize()
  classChart?.resize()
  feeChart?.resize()
}

onMounted(() => {
  initAttendanceChart()
  initClassChart()
  initFeeChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  attendanceChart?.dispose()
  classChart?.dispose()
  feeChart?.dispose()
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.mt-20 {
  margin-top: 20px;
}

/* 统计卡片样式 */
.stat-card {
  transition: all 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
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

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  margin-top: 5px;
  padding: 2px 6px;
  border-radius: 4px;
}

.stat-trend.up {
  color: #67C23A;
  background: rgba(103, 194, 58, 0.1);
}

.stat-trend.down {
  color: #F56C6C;
  background: rgba(245, 108, 108, 0.1);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 最新动态 */
.activity-timeline {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 10px;
}

.activity-content {
  padding-left: 10px;
}

.activity-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.activity-desc {
  font-size: 13px;
  color: #666;
}

/* 快捷操作 */
.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 8px;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-action:hover {
  background: #e8eaf0;
  transform: translateY(-3px);
}

.action-name {
  margin-top: 10px;
  font-size: 14px;
  color: #333;
}
</style>