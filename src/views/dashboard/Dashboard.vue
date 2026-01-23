<template>
  <div class="dashboard-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div style="text-align:center;">
            <div style="font-size:24px;color:#165DFF;">{{ childTotal }}</div>
            <div style="margin-top:10px;">在册儿童总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div style="text-align:center;">
            <div style="font-size:24px;color:#67C23A;">{{ todayCheckIn }}</div>
            <div style="margin-top:10px;">今日签到人数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div style="text-align:center;">
            <div style="font-size:24px;color:#E6A23C;">{{ reserveTotal }}</div>
            <div style="margin-top:10px;">托管预约数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div style="text-align:center;">
            <div style="font-size:24px;color:#F56C6C;">{{ feeUnpaid }}</div>
            <div style="margin-top:10px;">待缴费用数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="mt-20">
      <template #header>
        <span>月度考勤统计</span>
      </template>
      <div style="width:100%;height:300px;" ref="chartRef"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const childTotal = ref(56)
const todayCheckIn = ref(48)
const reserveTotal = ref(12)
const feeUnpaid = ref(3)
const chartRef = ref(null)

// 初始化图表
const initChart = () => {
  const myChart = echarts.init(chartRef.value)
  myChart.setOption({
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [{ data: [42, 48, 50, 52, 55, 56], type: 'line', smooth: true }]
  })
}

onMounted(() => {
  initChart()
})
</script>