<!-- 
  模块：【教师端-日常记录】
  功能：儿童日常表现记录、饮食/午睡/活动记录、照片上传、记录查询
-->
<template>
  <div class="daily-record">
    <!-- 筛选栏 -->
    <el-card class="mb-20">
      <el-form :model="searchForm" inline @submit.prevent="searchRecord">
        <el-form-item label="儿童姓名">
          <el-input v-model="searchForm.childName" placeholder="请输入儿童姓名" style="width:200px" />
        </el-form-item>
        <el-form-item label="记录日期">
          <el-date-picker
            v-model="searchForm.recordDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width:300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchRecord">查询</el-button>
          <el-button icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" icon="Plus" @click="addRecord">新增记录</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 记录列表 -->
    <el-card>
      <el-table :data="recordList" border stripe style="width:100%" :loading="loading">
        <el-table-column prop="recordId" label="记录ID" width="100" />
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="recordDate" label="记录日期" width="120" />
        <el-table-column prop="recordType" label="记录类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeColor(scope.row.recordType)">
              {{ getTypeName(scope.row.recordType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="记录内容" />
        <el-table-column prop="createBy" label="记录人" width="120" />
        <el-table-column prop="createTime" label="记录时间" width="180" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" icon="View" @click="viewRecord(scope.row)">查看</el-button>
            <el-button type="warning" size="small" icon="Edit" @click="editRecord(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" icon="Delete" @click="deleteRecord(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.pageNum"
        :page-sizes="[10, 20, 50]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        style="margin-top:20px; text-align:right;"
      >
      </el-pagination>
    </el-card>

    <!-- 新增/编辑记录弹窗 -->
    <el-dialog v-model="recordDialogVisible" :title="isEdit ? '编辑日常记录' : '新增日常记录'" width="600px">
      <el-form :model="recordForm" :rules="recordRules" ref="recordFormRef" label-width="100px">
        <el-form-item label="选择儿童" prop="childId">
          <el-select v-model="recordForm.childId" placeholder="请选择儿童" style="width:100%">
            <el-option 
              v-for="child in childOptions" 
              :key="child.value" 
              :label="child.label" 
              :value="child.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="记录类型" prop="recordType">
          <el-select v-model="recordForm.recordType" placeholder="请选择记录类型" style="width:100%">
            <el-option label="日常表现" value="1" />
            <el-option label="饮食情况" value="2" />
            <el-option label="午睡情况" value="3" />
            <el-option label="活动表现" value="4" />
            <el-option label="健康状况" value="5" />
            <el-option label="其他" value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="记录日期" prop="recordDate">
          <el-date-picker
            v-model="recordForm.recordDate"
            type="date"
            placeholder="选择记录日期"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="记录内容" prop="content">
          <el-input v-model="recordForm.content" type="textarea" :rows="5" placeholder="请输入记录内容" />
        </el-form-item>
        <el-form-item label="上传照片">
          <el-upload
            class="upload-demo"
            action="/api/upload/record"
            :headers="uploadHeaders"
            :multiple="true"
            :on-success="handleUploadSuccess"
            :file-list="fileList"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看记录弹窗 -->
    <el-dialog v-model="viewDialogVisible" title="日常记录详情" width="600px">
      <el-descriptions :column="2" border :data="currentRecord">
        <el-descriptions-item label="儿童姓名">{{ currentRecord.childName }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentRecord.className }}</el-descriptions-item>
        <el-descriptions-item label="记录类型">{{ getTypeName(currentRecord.recordType) }}</el-descriptions-item>
        <el-descriptions-item label="记录日期">{{ currentRecord.recordDate }}</el-descriptions-item>
        <el-descriptions-item label="记录人">{{ currentRecord.createBy }}</el-descriptions-item>
        <el-descriptions-item label="记录时间">{{ currentRecord.createTime }}</el-descriptions-item>
        <el-descriptions-item label="记录内容" span="2">{{ currentRecord.content }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 照片展示 -->
      <div v-if="currentRecord.photos && currentRecord.photos.length" class="photos-container">
        <p class="photos-title">相关照片：</p>
        <el-image 
          v-for="(img, index) in currentRecord.photos" 
          :key="index"
          :src="img" 
          fit="cover" 
          style="width:150px;height:150px;margin-right:10px;margin-bottom:10px;"
          preview-src-list="currentRecord.photos"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  childName: '',
  recordDate: []
})

// 加载状态
const loading = ref(false)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 30
})

// 记录列表
const recordList = ref([
  {
    recordId: 1001,
    childId: 2001,
    childName: '张小宝',
    className: '大一班',
    recordDate: '2024-05-20',
    recordType: 1,
    content: '今日表现良好，积极参与课堂互动，乐于助人',
    createBy: '王老师',
    createTime: '2024-05-20 17:30:20',
    photos: []
  },
  {
    recordId: 1002,
    childId: 2002,
    childName: '李小贝',
    className: '大一班',
    recordDate: '2024-05-20',
    recordType: 2,
    content: '今日午餐吃了一碗米饭，青菜和肉都吃完了，加餐吃了一个苹果',
    createBy: '王老师',
    createTime: '2024-05-20 13:15:10',
    photos: []
  },
  {
    recordId: 1003,
    childId: 2003,
    childName: '王小丫',
    className: '大一班',
    recordDate: '2024-05-20',
    recordType: 5,
    content: '今日有点咳嗽，已通知家长，精神状态良好',
    createBy: '王老师',
    createTime: '2024-05-20 10:20:30',
    photos: ['https://picsum.photos/200/200?random=1']
  }
])

// 儿童选项
const childOptions = ref([
  { value: 2001, label: '张小宝 (大一班)' },
  { value: 2002, label: '李小贝 (大一班)' },
  { value: 2003, label: '王小丫 (大一班)' }
])

// 新增/编辑弹窗
const recordDialogVisible = ref(false)
const isEdit = ref(false)
const recordFormRef = ref(null)
const recordForm = reactive({
  recordId: '',
  childId: '',
  recordType: '',
  recordDate: new Date(),
  content: ''
})
const recordRules = ref({
  childId: [{ required: true, message: '请选择儿童', trigger: 'change' }],
  recordType: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
  recordDate: [{ required: true, message: '请选择记录日期', trigger: 'change' }],
  content: [{ required: true, message: '请输入记录内容', trigger: 'blur' }]
})

// 文件上传
const uploadHeaders = ref({
  'Authorization': 'Bearer ' + localStorage.getItem('token') || ''
})
const fileList = ref([])

// 查看弹窗
const viewDialogVisible = ref(false)
const currentRecord = ref({})

// 类型映射
const getTypeName = (type) => {
  const typeMap = {
    1: '日常表现',
    2: '饮食情况',
    3: '午睡情况',
    4: '活动表现',
    5: '健康状况',
    6: '其他'
  }
  return typeMap[type] || '未知'
}

// 类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'info',
    5: 'danger',
    6: 'gray'
  }
  return colorMap[type] || ''
}

// 搜索记录
const searchRecord = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('记录查询成功！')
  }, 500)
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    childName: '',
    recordDate: []
  })
}

// 新增记录
const addRecord = () => {
  isEdit.value = false
  recordForm.recordId = ''
  recordForm.childId = ''
  recordForm.recordType = ''
  recordForm.recordDate = new Date()
  recordForm.content = ''
  fileList.value = []
  recordDialogVisible.value = true
}

// 编辑记录
const editRecord = (row) => {
  isEdit.value = true
  recordForm.recordId = row.recordId
  recordForm.childId = row.childId
  recordForm.recordType = row.recordType
  recordForm.recordDate = new Date(row.recordDate)
  recordForm.content = row.content
  fileList.value = row.photos ? row.photos.map(img => ({ url: img })) : []
  recordDialogVisible.value = true
}

// 查看记录
const viewRecord = (row) => {
  currentRecord.value = { ...row }
  viewDialogVisible.value = true
}

// 删除记录
const deleteRecord = (row) => {
  ElMessageBox.confirm(
    '确定要删除这条记录吗？删除后无法恢复！',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    recordList.value = recordList.value.filter(item => item.recordId !== row.recordId)
    ElMessage.success('记录删除成功！')
  })
}

// 保存记录
const saveRecord = () => {
  recordFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑
        const index = recordList.value.findIndex(item => item.recordId === recordForm.recordId)
        if (index > -1) {
          recordList.value[index] = {
            ...recordList.value[index],
            childId: recordForm.childId,
            recordType: recordForm.recordType,
            recordDate: recordForm.recordDate.toISOString().split('T')[0],
            content: recordForm.content,
            photos: fileList.value.map(file => file.url)
          }
        }
        ElMessage.success('记录编辑成功！')
      } else {
        // 新增
        const newRecord = {
          recordId: Date.now(),
          childId: recordForm.childId,
          childName: childOptions.value.find(item => item.value === recordForm.childId)?.label.split(' ')[0] || '',
          className: '大一班',
          recordDate: recordForm.recordDate.toISOString().split('T')[0],
          recordType: recordForm.recordType,
          content: recordForm.content,
          createBy: '王老师',
          createTime: new Date().toLocaleString(),
          photos: fileList.value.map(file => file.url)
        }
        recordList.value.unshift(newRecord)
        ElMessage.success('记录新增成功！')
      }
      recordDialogVisible.value = false
    }
  })
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

// 分页事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  searchRecord()
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  searchRecord()
}

onMounted(() => {
  searchRecord()
})
</script>

<style scoped>
.daily-record {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.mb-20 {
  margin-bottom: 20px;
}

.photos-container {
  margin-top: 20px;
}

.photos-title {
  margin-bottom: 10px;
  font-weight: bold;
}
</style>