<!-- 
  模块：【管理员-数据管理】
  功能：学员数据导出、考勤记录导出、缴费记录导出、自定义条件导出Excel
-->
<template>
  <div class="admin-data-export">
    <el-card>
      <template #header>
        <span>数据导出中心</span>
      </template>

      <!-- 导出类型选择 -->
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="学员数据" name="student">
          <el-form :model="studentForm" label-width="120px" class="export-form">
            <el-form-item label="导出范围">
              <el-radio-group v-model="studentForm.exportRange">
                <el-radio label="all">全部学员</el-radio>
                <el-radio label="class">按班级导出</el-radio>
                <el-radio label="status">按状态导出</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="选择班级" v-if="studentForm.exportRange === 'class'">
              <el-select v-model="studentForm.classId" placeholder="请选择班级" style="width:200px">
                <el-option label="大一班" value="1" />
                <el-option label="大二班" value="2" />
                <el-option label="中一班" value="3" />
                <el-option label="中二班" value="4" />
                <el-option label="小一班" value="5" />
                <el-option label="小二班" value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="学员状态" v-if="studentForm.exportRange === 'status'">
              <el-select v-model="studentForm.status" placeholder="请选择状态" style="width:200px">
                <el-option label="在读" value="1" />
                <el-option label="请假" value="2" />
                <el-option label="退学" value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="导出字段">
              <el-checkbox-group v-model="studentForm.fields">
                <el-checkbox label="儿童ID" value="childId" />
                <el-checkbox label="儿童姓名" value="childName" />
                <el-checkbox label="性别" value="gender" />
                <el-checkbox label="年龄" value="age" />
                <el-checkbox label="班级" value="className" />
                <el-checkbox label="家长姓名" value="parentName" />
                <el-checkbox label="联系电话" value="phone" />
                <el-checkbox label="入学时间" value="enrollTime" />
                <el-checkbox label="学员状态" value="status" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Download" @click="exportStudentData">导出Excel</el-button>
              <el-button @click="resetStudentForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="考勤记录" name="attendance">
          <el-form :model="attendanceForm" label-width="120px" class="export-form">
            <el-form-item label="考勤日期">
              <el-date-picker
                v-model="attendanceForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width:300px"
              />
            </el-form-item>
            <el-form-item label="选择班级">
              <el-select v-model="attendanceForm.classId" placeholder="请选择班级(可选)" style="width:200px">
                <el-option label="全部班级" value="" />
                <el-option label="大一班" value="1" />
                <el-option label="大二班" value="2" />
                <el-option label="中一班" value="3" />
                <el-option label="中二班" value="4" />
                <el-option label="小一班" value="5" />
                <el-option label="小二班" value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="考勤状态">
              <el-select v-model="attendanceForm.checkStatus" placeholder="请选择状态(可选)" style="width:200px">
                <el-option label="全部状态" value="" />
                <el-option label="已签到" value="1" />
                <el-option label="未签到" value="0" />
                <el-option label="迟到" value="2" />
                <el-option label="早退" value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Download" @click="exportAttendanceData">导出Excel</el-button>
              <el-button @click="resetAttendanceForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="缴费记录" name="fee">
          <el-form :model="feeForm" label-width="120px" class="export-form">
            <el-form-item label="缴费月份">
              <el-date-picker
                v-model="feeForm.payMonth"
                type="month"
                placeholder="选择月份"
                style="width:200px"
              />
            </el-form-item>
            <el-form-item label="缴费状态">
              <el-radio-group v-model="feeForm.payStatus">
                <el-radio label="all">全部状态</el-radio>
                <el-radio label="paid">已缴费</el-radio>
                <el-radio label="unpaid">未缴费</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="费用类型">
              <el-select v-model="feeForm.feeType" placeholder="请选择费用类型(可选)" style="width:200px">
                <el-option label="全部类型" value="" />
                <el-option label="日托" value="dayCare" />
                <el-option label="全托" value="fullCare" />
                <el-option label="临时托管" value="tempCare" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Download" @click="exportFeeData">导出Excel</el-button>
              <el-button @click="resetFeeForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="自定义导出" name="custom">
          <el-form :model="customForm" label-width="120px" class="export-form">
            <el-form-item label="数据类型">
              <el-checkbox-group v-model="customForm.dataTypes">
                <el-checkbox label="学员信息" value="student" />
                <el-checkbox label="考勤记录" value="attendance" />
                <el-checkbox label="缴费记录" value="fee" />
                <el-checkbox label="预约记录" value="reserve" />
                <el-checkbox label="消息记录" value="message" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="customForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width:300px"
              />
            </el-form-item>
            <el-form-item label="导出格式">
              <el-radio-group v-model="customForm.format">
                <el-radio label="Excel" value="xlsx" />
                <el-radio label="CSV" value="csv" />
                <el-radio label="PDF" value="pdf" />
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Download" @click="exportCustomData">导出数据</el-button>
              <el-button @click="resetCustomForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 导出记录 -->
      <div class="export-record mt-20">
        <h4>最近导出记录</h4>
        <el-table :data="exportRecordList" border stripe style="width:100%">
          <el-table-column prop="id" label="序号" width="80" />
          <el-table-column prop="type" label="导出类型" width="120" />
          <el-table-column prop="fileName" label="文件名称" />
          <el-table-column prop="exportTime" label="导出时间" width="180" />
          <el-table-column prop="fileSize" label="文件大小" width="100">
            <template #default="scope">
              {{ (scope.row.fileSize / 1024).toFixed(2) }} KB
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="text" icon="Download" @click="downloadFile(scope.row)">下载</el-button>
              <el-button type="text" icon="Delete" @click="deleteRecord(scope.row)" style="color:#F56C6C;">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 激活的标签页
const activeTab = ref('student')

// 学员数据导出表单
const studentForm = reactive({
  exportRange: 'all',
  classId: '',
  status: '',
  fields: ['childId', 'childName', 'gender', 'age', 'className', 'parentName', 'phone']
})

// 考勤数据导出表单
const attendanceForm = reactive({
  dateRange: [],
  classId: '',
  checkStatus: ''
})

// 缴费数据导出表单
const feeForm = reactive({
  payMonth: '',
  payStatus: 'all',
  feeType: ''
})

// 自定义导出表单
const customForm = reactive({
  dataTypes: [],
  dateRange: [],
  format: 'xlsx'
})

// 导出记录列表
const exportRecordList = ref([
  {
    id: 1,
    type: '学员数据',
    fileName: '学员数据_20240501.xlsx',
    exportTime: '2024-05-01 10:20:30',
    fileSize: 20480
  },
  {
    id: 2,
    type: '考勤记录',
    fileName: '考勤记录_20240501.xlsx',
    exportTime: '2024-05-01 14:30:20',
    fileSize: 15360
  },
  {
    id: 3,
    type: '缴费记录',
    fileName: '缴费记录_20240501.xlsx',
    exportTime: '2024-05-01 16:40:10',
    fileSize: 10240
  }
])

// 导出学员数据
const exportStudentData = () => {
  if (studentForm.fields.length === 0) {
    ElMessage.warning('请至少选择一个导出字段！')
    return
  }
  ElMessage.success('学员数据导出中，请稍候...')
  // 模拟导出操作
  setTimeout(() => {
    // 添加导出记录
    exportRecordList.value.unshift({
      id: exportRecordList.value.length + 1,
      type: '学员数据',
      fileName: `学员数据_${new Date().getTime()}.xlsx`,
      exportTime: new Date().toLocaleString(),
      fileSize: Math.floor(Math.random() * 30000 + 10000)
    })
    ElMessage.success('学员数据导出成功！')
  }, 1500)
}

// 导出考勤数据
const exportAttendanceData = () => {
  if (!attendanceForm.dateRange || attendanceForm.dateRange.length === 0) {
    ElMessage.warning('请选择考勤日期范围！')
    return
  }
  ElMessage.success('考勤记录导出中，请稍候...')
  setTimeout(() => {
    exportRecordList.value.unshift({
      id: exportRecordList.value.length + 1,
      type: '考勤记录',
      fileName: `考勤记录_${new Date().getTime()}.xlsx`,
      exportTime: new Date().toLocaleString(),
      fileSize: Math.floor(Math.random() * 20000 + 8000)
    })
    ElMessage.success('考勤记录导出成功！')
  }, 1500)
}

// 导出缴费数据
const exportFeeData = () => {
  if (!feeForm.payMonth) {
    ElMessage.warning('请选择缴费月份！')
    return
  }
  ElMessage.success('缴费记录导出中，请稍候...')
  setTimeout(() => {
    exportRecordList.value.unshift({
      id: exportRecordList.value.length + 1,
      type: '缴费记录',
      fileName: `缴费记录_${new Date().getTime()}.xlsx`,
      exportTime: new Date().toLocaleString(),
      fileSize: Math.floor(Math.random() * 25000 + 12000)
    })
    ElMessage.success('缴费记录导出成功！')
  }, 1500)
}

// 导出自定义数据
const exportCustomData = () => {
  if (customForm.dataTypes.length === 0) {
    ElMessage.warning('请至少选择一种数据类型！')
    return
  }
  if (!customForm.dateRange || customForm.dateRange.length === 0) {
    ElMessage.warning('请选择时间范围！')
    return
  }
  ElMessage.success('自定义数据导出中，请稍候...')
  setTimeout(() => {
    exportRecordList.value.unshift({
      id: exportRecordList.value.length + 1,
      type: '自定义数据',
      fileName: `自定义数据_${new Date().getTime()}.${customForm.format}`,
      exportTime: new Date().toLocaleString(),
      fileSize: Math.floor(Math.random() * 40000 + 15000)
    })
    ElMessage.success('自定义数据导出成功！')
  }, 2000)
}

// 重置学员表单
const resetStudentForm = () => {
  Object.assign(studentForm, {
    exportRange: 'all',
    classId: '',
    status: '',
    fields: ['childId', 'childName', 'gender', 'age', 'className', 'parentName', 'phone']
  })
}

// 重置考勤表单
const resetAttendanceForm = () => {
  Object.assign(attendanceForm, {
    dateRange: [],
    classId: '',
    checkStatus: ''
  })
}

// 重置缴费表单
const resetFeeForm = () => {
  Object.assign(feeForm, {
    payMonth: '',
    payStatus: 'all',
    feeType: ''
  })
}

// 重置自定义表单
const resetCustomForm = () => {
  Object.assign(customForm, {
    dataTypes: [],
    dateRange: [],
    format: 'xlsx'
  })
}

// 下载文件
const downloadFile = (row) => {
  ElMessage.success(`开始下载：${row.fileName}`)
  // 模拟文件下载
}

// 删除导出记录
const deleteRecord = (row) => {
  ElMessageBox.confirm(
    '确定要删除该导出记录吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    exportRecordList.value = exportRecordList.value.filter(item => item.id !== row.id)
    ElMessage.success('记录删除成功！')
  })
}

onMounted(() => {
  // 初始化默认时间
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  attendanceForm.dateRange = [firstDay, lastDay]
  customForm.dateRange = [firstDay, lastDay]
  feeForm.payMonth = now.toISOString().split('T')[0].slice(0, 7)
})
</script>

<style scoped>
.admin-data-export {
  width: 100%;
  height: 100%;
}

.export-form {
  padding: 20px 0;
  border-bottom: 1px solid #e6e6e6;
  margin-bottom: 20px;
}

.export-record {
  margin-top: 20px;
}

.export-record h4 {
  margin-bottom: 10px;
  color: #333;
}
</style>