<!-- 
  模块：【教师端-异常汇报】
  功能：儿童异常情况上报、健康异常记录、行为异常记录、事故报告、家长通知
-->
<template>
  <div class="exception-report">
    <el-row :gutter="20">
      <!-- 左侧：快速上报 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>异常情况上报</span>
          </template>

          <el-form :model="reportForm" :rules="reportRules" ref="reportFormRef" label-width="100px">
            <el-form-item label="异常类型" prop="type">
              <el-select v-model="reportForm.type" placeholder="请选择异常类型" style="width:100%">
                <el-option label="健康异常" value="health">
                  <el-icon color="#F56C6C"><Warning /></el-icon>
                  <span class="ml-10">健康异常</span>
                </el-option>
                <el-option label="行为异常" value="behavior">
                  <el-icon color="#E6A23C"><User /></el-icon>
                  <span class="ml-10">行为异常</span>
                </el-option>
                <el-option label="安全事故" value="accident">
                  <el-icon color="#F56C6C"><CircleClose /></el-icon>
                  <span class="ml-10">安全事故</span>
                </el-option>
                <el-option label="其他异常" value="other">
                  <el-icon color="#909399"><More /></el-icon>
                  <span class="ml-10">其他异常</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="选择儿童" prop="childId">
              <el-select 
                v-model="reportForm.childId" 
                placeholder="请选择儿童" 
                filterable
                style="width:100%"
              >
                <el-option 
                  v-for="child in childList" 
                  :key="child.id" 
                  :label="`${child.name} (${child.className})`" 
                  :value="child.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="严重程度" prop="severity">
              <el-radio-group v-model="reportForm.severity">
                <el-radio label="low">
                  <el-tag type="info" size="small">轻微</el-tag>
                </el-radio>
                <el-radio label="medium">
                  <el-tag type="warning" size="small">中等</el-tag>
                </el-radio>
                <el-radio label="high">
                  <el-tag type="danger" size="small">严重</el-tag>
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="发生时间" prop="occurTime">
              <el-date-picker
                v-model="reportForm.occurTime"
                type="datetime"
                placeholder="选择发生时间"
                style="width:100%"
              />
            </el-form-item>

            <el-form-item label="异常描述" prop="description">
              <el-input 
                v-model="reportForm.description" 
                type="textarea" 
                :rows="5" 
                placeholder="请详细描述异常情况"
              />
            </el-form-item>

            <el-form-item label="处理措施" prop="treatment">
              <el-input 
                v-model="reportForm.treatment" 
                type="textarea" 
                :rows="3" 
                placeholder="请描述已采取的处理措施"
              />
            </el-form-item>

            <el-form-item label="上传照片">
              <el-upload
                class="upload-demo"
                action="/api/upload/exception"
                :headers="uploadHeaders"
                :multiple="true"
                :on-success="handleUploadSuccess"
                :file-list="fileList"
                list-type="picture-card"
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">支持上传现场照片、伤情照片等</div>
            </el-form-item>

            <el-form-item label="通知家长" prop="notifyParent">
              <el-switch v-model="reportForm.notifyParent" />
              <span class="ml-10 text-muted">开启后将立即通知家长</span>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="danger" 
                size="large" 
                style="width:100%" 
                @click="submitReport"
                :loading="submitting"
              >
                <el-icon><Upload /></el-icon>
                提交异常报告
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 快速模板 -->
        <el-card class="mt-20">
          <template #header>
            <span>常用模板</span>
          </template>
          <el-space wrap>
            <el-button 
              v-for="template in templates" 
              :key="template.id"
              size="small"
              @click="useTemplate(template)"
            >
              {{ template.name }}
            </el-button>
          </el-space>
        </el-card>
      </el-col>

      <!-- 右侧：异常记录 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>异常记录</span>
              <el-radio-group v-model="recordFilter" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="health">健康</el-radio-button>
                <el-radio-button label="behavior">行为</el-radio-button>
                <el-radio-button label="accident">事故</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <el-table 
            :data="filteredRecords" 
            border 
            stripe 
            style="width:100%" 
            max-height="600"
          >
            <el-table-column prop="childName" label="儿童姓名" width="100" />
            <el-table-column prop="type" label="异常类型" width="100">
              <template #default="scope">
                <el-tag :type="getTypeColor(scope.row.type)" size="small">
                  {{ getTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="scope">
                <el-tag :type="getSeverityColor(scope.row.severity)" size="small">
                  {{ getSeverityText(scope.row.severity) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="occurTime" label="发生时间" width="160" />
            <el-table-column prop="description" label="异常描述" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'handled' ? 'success' : 'warning'" size="small">
                  {{ scope.row.status === 'handled' ? '已处理' : '处理中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="viewDetail(scope.row)">
                  查看
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="markHandled(scope.row)"
                  v-if="scope.row.status === 'pending'"
                >
                  标记已处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 统计信息 -->
        <el-card class="mt-20">
          <template #header>
            <span>本月统计</span>
          </template>
          <el-row :gutter="15">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color:#F56C6C;">{{ monthStats.total }}</div>
                <div class="stat-label">异常总数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color:#E6A23C;">{{ monthStats.health }}</div>
                <div class="stat-label">健康异常</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color:#409EFF;">{{ monthStats.behavior }}</div>
                <div class="stat-label">行为异常</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-value" style="color:#67C23A;">{{ monthStats.handled }}</div>
                <div class="stat-label">已处理</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="异常详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="儿童姓名">{{ currentRecord.childName }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentRecord.className }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">
          <el-tag :type="getTypeColor(currentRecord.type)">
            {{ getTypeText(currentRecord.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag :type="getSeverityColor(currentRecord.severity)">
            {{ getSeverityText(currentRecord.severity) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ currentRecord.occurTime }}</el-descriptions-item>
        <el-descriptions-item label="上报时间">{{ currentRecord.reportTime }}</el-descriptions-item>
        <el-descriptions-item label="上报人">{{ currentRecord.reporter }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRecord.status === 'handled' ? 'success' : 'warning'">
            {{ currentRecord.status === 'handled' ? '已处理' : '处理中' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="异常描述" :span="2">
          {{ currentRecord.description }}
        </el-descriptions-item>
        <el-descriptions-item label="处理措施" :span="2">
          {{ currentRecord.treatment }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="currentRecord && currentRecord.images && currentRecord.images.length" class="mt-20">
        <h4>相关照片</h4>
        <el-image 
          v-for="(img, index) in currentRecord.images" 
          :key="index"
          :src="img" 
          fit="cover" 
          style="width:150px;height:150px;margin-right:10px;margin-top:10px;"
          :preview-src-list="currentRecord.images"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Warning, User, CircleClose, More, Plus, Upload 
} from '@element-plus/icons-vue'

// 儿童列表
const childList = ref([
  { id: 1, name: '张小宝', className: '大一班' },
  { id: 2, name: '李小贝', className: '大一班' },
  { id: 3, name: '王小丫', className: '大一班' }
])

// 上报表单
const reportFormRef = ref(null)
const submitting = ref(false)

const reportForm = reactive({
  type: '',
  childId: '',
  severity: 'low',
  occurTime: new Date(),
  description: '',
  treatment: '',
  notifyParent: true
})

const reportRules = ref({
  type: [{ required: true, message: '请选择异常类型', trigger: 'change' }],
  childId: [{ required: true, message: '请选择儿童', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  occurTime: [{ required: true, message: '请选择发生时间', trigger: 'change' }],
  description: [{ required: true, message: '请描述异常情况', trigger: 'blur' }],
  treatment: [{ required: true, message: '请描述处理措施', trigger: 'blur' }]
})

// 文件上传
const uploadHeaders = ref({
  'Authorization': 'Bearer ' + localStorage.getItem('token') || ''
})
const fileList = ref([])

// 常用模板
const templates = ref([
  { id: 1, name: '发烧', type: 'health', description: '儿童体温超过37.5℃', treatment: '已测量体温，通知家长，建议就医' },
  { id: 2, name: '摔倒擦伤', type: 'accident', description: '儿童在活动中不慎摔倒，膝盖擦伤', treatment: '已清洗伤口，涂抹碘伏消毒' },
  { id: 3, name: '情绪异常', type: 'behavior', description: '儿童情绪低落，不愿参与活动', treatment: '已与儿童沟通，了解原因，给予关注' },
  { id: 4, name: '呕吐', type: 'health', description: '儿童出现呕吐症状', treatment: '已让儿童休息，通知家长' }
])

// 异常记录
const exceptionRecords = ref([
  {
    id: 1,
    childName: '张小宝',
    className: '大一班',
    type: 'health',
    severity: 'medium',
    occurTime: '2024-05-20 10:30',
    reportTime: '2024-05-20 10:35',
    reporter: '王老师',
    description: '儿童体温37.8℃，有轻微咳嗽',
    treatment: '已测量体温，让儿童多喝水休息，已通知家长',
    status: 'handled',
    images: []
  },
  {
    id: 2,
    childName: '李小贝',
    className: '大一班',
    type: 'accident',
    severity: 'low',
    occurTime: '2024-05-19 14:20',
    reportTime: '2024-05-19 14:25',
    reporter: '王老师',
    description: '户外活动时不慎摔倒，右膝盖轻微擦伤',
    treatment: '已清洗伤口，涂抹碘伏消毒，贴创可贴',
    status: 'handled',
    images: []
  }
])

// 记录筛选
const recordFilter = ref('all')

const filteredRecords = computed(() => {
  if (recordFilter.value === 'all') {
    return exceptionRecords.value
  }
  return exceptionRecords.value.filter(item => item.type === recordFilter.value)
})

// 本月统计
const monthStats = ref({
  total: 8,
  health: 3,
  behavior: 2,
  handled: 6
})

// 详情弹窗
const detailDialogVisible = ref(false)
const currentRecord = ref(null)

// 类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    health: 'danger',
    behavior: 'warning',
    accident: 'danger',
    other: 'info'
  }
  return colorMap[type] || ''
}

// 类型文本
const getTypeText = (type) => {
  const textMap = {
    health: '健康异常',
    behavior: '行为异常',
    accident: '安全事故',
    other: '其他异常'
  }
  return textMap[type] || type
}

// 严重程度颜色
const getSeverityColor = (severity) => {
  const colorMap = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return colorMap[severity] || ''
}

// 严重程度文本
const getSeverityText = (severity) => {
  const textMap = {
    low: '轻微',
    medium: '中等',
    high: '严重'
  }
  return textMap[severity] || severity
}

// 使用模板
const useTemplate = (template) => {
  reportForm.type = template.type
  reportForm.description = template.description
  reportForm.treatment = template.treatment
  ElMessage.success('已应用模板')
}

// 上传成功回调
const handleUploadSuccess = (response, file) => {
  if (response.code === 200) {
    file.url = response.data.url
    ElMessage.success('照片上传成功！')
  } else {
    ElMessage.error('照片上传失败：' + response.msg)
  }
}

// 提交报告
const submitReport = () => {
  reportFormRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      
      setTimeout(() => {
        const child = childList.value.find(c => c.id === reportForm.childId)
        
        const newRecord = {
          id: Date.now(),
          childName: child.name,
          className: child.className,
          type: reportForm.type,
          severity: reportForm.severity,
          occurTime: reportForm.occurTime.toLocaleString(),
          reportTime: new Date().toLocaleString(),
          reporter: '王老师',
          description: reportForm.description,
          treatment: reportForm.treatment,
          status: 'pending',
          images: fileList.value.map(file => file.url)
        }
        
        exceptionRecords.value.unshift(newRecord)
        monthStats.value.total++
        
        submitting.value = false
        ElMessage.success('异常报告提交成功！' + (reportForm.notifyParent ? '已通知家长' : ''))
        
        // 重置表单
        reportFormRef.value.resetFields()
        fileList.value = []
      }, 1000)
    }
  })
}

// 查看详情
const viewDetail = (record) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

// 标记已处理
const markHandled = (record) => {
  ElMessageBox.confirm(
    '确认该异常已妥善处理？',
    '标记已处理',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    record.status = 'handled'
    monthStats.value.handled++
    ElMessage.success('已标记为已处理')
  })
}
</script>

<style scoped>
.exception-report {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
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

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.stat-item {
  text-align: center;
  padding: 15px 0;
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
</style>
