<!-- 
  模块：【管理员-费用管理】
  功能：托管费用标准设置、缴费记录查询、欠费提醒、费用统计、账单生成
-->
<template>
  <div class="admin-fee-manage">
    <!-- 费用标准设置 -->
    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <span>托管费用标准设置</span>
          <el-button type="primary" icon="Edit" @click="openStandardDialog">修改标准</el-button>
        </div>
      </template>
      <el-table :data="feeStandardList" border stripe style="width:100%">
        <el-table-column prop="typeName" label="托管类型" width="150" />
        <el-table-column prop="price" label="费用(元/月)" width="120">
          <template #default="scope">
            {{ scope.row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="费用说明" />
        <el-table-column prop="effectiveTime" label="生效时间" width="180" />
      </el-table>
    </el-card>

    <!-- 缴费记录查询 -->
    <el-card class="mb-20">
      <template #header>
        <span>缴费记录查询</span>
      </template>
      <el-form :model="feeSearchForm" inline @submit.prevent="searchFeeRecord">
        <el-form-item label="儿童姓名">
          <el-input v-model="feeSearchForm.childName" placeholder="请输入儿童姓名" style="width:200px" />
        </el-form-item>
        <el-form-item label="缴费状态">
          <el-select v-model="feeSearchForm.payStatus" placeholder="请选择缴费状态" style="width:150px">
            <el-option label="已缴费" value="1" />
            <el-option label="未缴费" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="缴费月份">
          <el-date-picker
            v-model="feeSearchForm.payMonth"
            type="month"
            placeholder="选择月份"
            style="width:200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchFeeRecord">查询</el-button>
          <el-button icon="Refresh" @click="resetFeeSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="feeRecordList" border stripe style="width:100%" :loading="feeLoading">
        <el-table-column prop="childId" label="儿童ID" width="100" />
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="parentName" label="家长姓名" width="120" />
        <el-table-column prop="parentPhone" label="联系电话" width="150" />
        <el-table-column prop="feeType" label="费用类型" width="120" />
        <el-table-column prop="feeAmount" label="费用金额(元)" width="120">
          <template #default="scope">
            {{ scope.row.feeAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="payMonth" label="缴费月份" width="120" />
        <el-table-column prop="payStatus" label="缴费状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.payStatus === 1 ? 'success' : 'danger'">
              {{ scope.row.payStatus === 1 ? '已缴费' : '未缴费' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="缴费时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" icon="Document" @click="generateBill(scope.row)">生成账单</el-button>
            <el-button v-if="scope.row.payStatus === 0" type="warning" size="small" icon="Bell" @click="sendRemind(scope.row)">欠费提醒</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        @size-change="handleFeeSizeChange"
        @current-change="handleFeeCurrentChange"
        :current-page="feePagination.pageNum"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="feePagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="feePagination.total"
        style="margin-top:20px; text-align:right;"
      >
      </el-pagination>
    </el-card>

    <!-- 费用统计卡片 -->
    <el-card>
      <template #header>
        <span>费用统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ totalFee.toFixed(2) }}</div>
            <div class="stat-label">本月应收总额(元)</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ paidFee.toFixed(2) }}</div>
            <div class="stat-label">本月已收总额(元)</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ unpaidFee.toFixed(2) }}</div>
            <div class="stat-label">本月未收总额(元)</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ unpaidCount }}</div>
            <div class="stat-label">欠费人数</div>
          </div>
        </el-col>
      </el-row>

      <!-- 费用趋势图表 -->
      <div style="margin-top:20px; width:100%; height:300px;" ref="feeChartRef"></div>
    </el-card>

    <!-- 费用标准修改弹窗 -->
    <el-dialog v-model="standardDialogVisible" title="修改费用标准" width="500px">
      <el-form :model="standardForm" :rules="standardRules" ref="standardFormRef" label-width="120px">
        <el-form-item label="日托费用(元/月)" prop="dayCare">
          <el-input v-model="standardForm.dayCare" type="number" placeholder="请输入日托费用" />
        </el-form-item>
        <el-form-item label="全托费用(元/月)" prop="fullCare">
          <el-input v-model="standardForm.fullCare" type="number" placeholder="请输入全托费用" />
        </el-form-item>
        <el-form-item label="临时托管(元/天)" prop="tempCare">
          <el-input v-model="standardForm.tempCare" type="number" placeholder="请输入临时托管费用" />
        </el-form-item>
        <el-form-item label="生效时间" prop="effectiveTime">
          <el-date-picker
            v-model="standardForm.effectiveTime"
            type="date"
            placeholder="选择生效时间"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="standardDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStandard">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 费用标准列表
const feeStandardList = ref([
  { typeName: '日托', price: 1500, desc: '周一至周五白天托管', effectiveTime: '2024-01-01' },
  { typeName: '全托', price: 2800, desc: '全天24小时托管', effectiveTime: '2024-01-01' },
  { typeName: '临时托管', price: 80, desc: '临时按天托管', effectiveTime: '2024-01-01' }
])

// 费用标准弹窗相关
const standardDialogVisible = ref(false)
const standardFormRef = ref(null)
const standardForm = reactive({
  dayCare: 1500,
  fullCare: 2800,
  tempCare: 80,
  effectiveTime: ''
})
const standardRules = ref({
  dayCare: [{ required: true, message: '请输入日托费用', trigger: 'blur', type: 'number' }],
  fullCare: [{ required: true, message: '请输入全托费用', trigger: 'blur', type: 'number' }],
  tempCare: [{ required: true, message: '请输入临时托管费用', trigger: 'blur', type: 'number' }],
  effectiveTime: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
})

// 缴费记录搜索表单
const feeSearchForm = reactive({
  childName: '',
  payStatus: '',
  payMonth: ''
})

// 缴费记录加载状态
const feeLoading = ref(false)

// 缴费记录分页
const feePagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 30
})

// 缴费记录列表
const feeRecordList = ref([
  {
    childId: 2001,
    childName: '张小宝',
    parentName: '张三',
    parentPhone: '13800138000',
    feeType: '日托',
    feeAmount: 1500,
    payMonth: '2024-05',
    payStatus: 1,
    payTime: '2024-04-28 10:20:30'
  },
  {
    childId: 2002,
    childName: '李小贝',
    parentName: '李四',
    parentPhone: '13900139000',
    feeType: '全托',
    feeAmount: 2800,
    payMonth: '2024-05',
    payStatus: 0,
    payTime: ''
  },
  {
    childId: 2003,
    childName: '王小丫',
    parentName: '王五',
    parentPhone: '13700137000',
    feeType: '日托',
    feeAmount: 1500,
    payMonth: '2024-05',
    payStatus: 0,
    payTime: ''
  }
])

// 费用统计数据
const totalFee = ref(45000)
const paidFee = ref(32000)
const unpaidFee = ref(13000)
const unpaidCount = ref(8)

// 图表引用
const feeChartRef = ref(null)

// 打开费用标准弹窗
const openStandardDialog = () => {
  standardForm.effectiveTime = new Date().toISOString().split('T')[0]
  standardDialogVisible.value = true
}

// 保存费用标准
const saveStandard = () => {
  standardFormRef.value.validate((valid) => {
    if (valid) {
      // 更新费用标准列表
      feeStandardList.value = [
        { typeName: '日托', price: standardForm.dayCare, desc: '周一至周五白天托管', effectiveTime: standardForm.effectiveTime },
        { typeName: '全托', price: standardForm.fullCare, desc: '全天24小时托管', effectiveTime: standardForm.effectiveTime },
        { typeName: '临时托管', price: standardForm.tempCare, desc: '临时按天托管', effectiveTime: standardForm.effectiveTime }
      ]
      ElMessage.success('费用标准修改成功！')
      standardDialogVisible.value = false
    }
  })
}

// 搜索缴费记录
const searchFeeRecord = () => {
  feeLoading.value = true
  setTimeout(() => {
    feeLoading.value = false
    ElMessage.success('缴费记录查询成功！')
  }, 500)
}

// 重置缴费搜索
const resetFeeSearch = () => {
  Object.assign(feeSearchForm, {
    childName: '',
    payStatus: '',
    payMonth: ''
  })
}

// 生成账单
const generateBill = (row) => {
  ElMessageBox.confirm(
    `确定为【${row.childName}】生成${row.payMonth}月份的缴费账单吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(() => {
    ElMessage.success('账单生成成功！已发送至家长手机')
  })
}

// 欠费提醒
const sendRemind = (row) => {
  ElMessageBox.confirm(
    `确定向【${row.parentName}】发送${row.payMonth}月份的欠费提醒吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('欠费提醒发送成功！')
  })
}

// 缴费记录分页
const handleFeeSizeChange = (val) => {
  feePagination.pageSize = val
  searchFeeRecord()
}

const handleFeeCurrentChange = (val) => {
  feePagination.pageNum = val
  searchFeeRecord()
}

// 初始化费用图表
const initFeeChart = () => {
  const myChart = echarts.init(feeChartRef.value)
  myChart.setOption({
    title: { text: '近6个月费用收缴趋势' },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value', name: '金额(元)' },
    series: [
      { name: '应收金额', type: 'bar', data: [42000, 43000, 44000, 45000, 45000, 46000] },
      { name: '实收金额', type: 'bar', data: [38000, 39000, 40000, 38000, 32000, 0] }
    ],
    tooltip: { trigger: 'axis' },
    legend: { data: ['应收金额', '实收金额'], top: 30 }
  })
}

onMounted(() => {
  searchFeeRecord()
  initFeeChart()
  // 监听窗口变化重绘图表
  window.addEventListener('resize', () => {
    if (feeChartRef.value) {
      echarts.init(feeChartRef.value).resize()
    }
  })
})
</script>

<style scoped>
.admin-fee-manage {
  width: 100%;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #165DFF;
  margin-bottom: 10px;
}

.stat-label {
  color: #666;
}
</style>