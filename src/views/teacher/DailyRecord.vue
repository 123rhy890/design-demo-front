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
          <el-button type="primary" :icon="Search" @click="searchRecord">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Plus" @click="addRecord">新增记录</el-button>
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
        <el-table-column label="操作" width="220" align="center" class-name="operation-column">
          <template #default="scope">
            <el-button type="primary" link :icon="View" @click="viewRecord(scope.row)">查看</el-button>
            <el-button type="warning" link :icon="Edit" @click="editRecord(scope.row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="deleteRecord(scope.row)">删除</el-button>
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
          <el-select v-model="recordForm.childId" placeholder="请选择儿童" style="width:100%" filterable>
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
            v-model:file-list="fileList"
            :multiple="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            list-type="picture-card"
            :limit="1"
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
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, View, Edit, Delete } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useUserStore } from '../../pinia/modules/userStore'
import Cookies from 'js-cookie'

const userStore = useUserStore()

// 弹窗控制
const recordDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const currentRecord = ref({})
const recordFormRef = ref(null)

// 表单数据
const recordForm = reactive({
  recordId: '',
  childId: '',
  recordType: '1',
  recordDate: new Date(),
  content: ''
})

const recordRules = reactive({
  childId: [{ required: true, message: '请选择儿童', trigger: 'change' }],
  recordType: [{ required: true, message: '请选择记录类型', trigger: 'change' }],
  recordDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  content: [{ required: true, message: '请输入记录内容', trigger: 'blur' }]
})

// 文件上传
const uploadHeaders = ref({
  'Authorization': 'Bearer ' + (Cookies.get('token') || '')
})
const fileList = ref([])

// 记录类型映射
const getTypeName = (type) => {
  const types = {
    1: '日常表现',
    2: '饮食情况',
    3: '午睡情况',
    4: '活动表现',
    5: '健康状况',
    6: '其他'
  }
  return types[type] || types[String(type)] || '未知'
}

const getTypeColor = (type) => {
  const colors = {
    1: '',
    2: 'success',
    3: 'warning',
    4: 'info',
    5: 'danger',
    6: 'info'
  }
  return colors[type] || colors[String(type)] || ''
}

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
  total: 0
})

// 记录列表
const recordList = ref([])

// 儿童选项
const childOptions = ref([])

// 获取儿童列表
const fetchChildren = async () => {
  try {
    const res = await request.get('/child/list')
    childOptions.value = res.data.map(c => ({
      value: c.childId,
      label: `${c.childName} (${c.classInfo ? c.classInfo.className : '未分班'})`
    }))
  } catch (err) {
    console.error('获取儿童列表失败', err)
  }
}

// 搜索记录
const searchRecord = async () => {
  loading.value = true
  try {
    const teacherId = userStore.userInfo.userId
    const res = await request.get(`/dailyStatus/teacher/${teacherId}`)
    
    // 过滤并转换数据
    let filteredData = res.data.map(item => ({
      recordId: item.recordId,
      childId: item.child ? item.child.childId : '',
      childName: item.child ? item.child.childName : '未知',
      className: item.child && item.child.classInfo ? item.child.classInfo.className : '未分班',
      recordDate: item.recordDate,
      recordType: item.recordType || 1, // 默认日常表现
      content: item.content || item.activity || item.diet || item.homework || '无内容',
      createBy: item.teacher ? item.teacher.username : '系统',
      createTime: item.createTime ? item.createTime.replace('T', ' ') : '-',
      photos: item.abnormalImg ? [item.abnormalImg] : []
    }))

    // 根据儿童姓名筛选
    if (searchForm.childName) {
      filteredData = filteredData.filter(item => item.childName.includes(searchForm.childName))
    }

    // 根据日期范围筛选
    if (searchForm.recordDate && searchForm.recordDate.length === 2) {
      const start = new Date(searchForm.recordDate[0])
      const end = new Date(searchForm.recordDate[1])
      filteredData = filteredData.filter(item => {
        const date = new Date(item.recordDate)
        return date >= start && date <= end
      })
    }

    recordList.value = filteredData
    pagination.total = filteredData.length
  } catch (err) {
    console.error('获取日常记录失败', err)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.childName = ''
  searchForm.recordDate = []
  searchRecord()
}

// 新增记录
const addRecord = () => {
  isEdit.value = false
  Object.assign(recordForm, {
    recordId: '',
    childId: '',
    recordType: '1',
    recordDate: new Date(),
    content: ''
  })
  fileList.value = []
  recordDialogVisible.value = true
  // 清除校验提示
  nextTick(() => {
    if (recordFormRef.value) {
      recordFormRef.value.clearValidate()
    }
  })
}

// 编辑记录
const editRecord = (row) => {
  isEdit.value = true
  Object.assign(recordForm, {
    recordId: row.recordId,
    childId: row.childId,
    recordType: row.recordType.toString(),
    recordDate: new Date(row.recordDate),
    content: row.content
  })
  fileList.value = row.photos ? row.photos.map(img => ({ url: img })) : []
  recordDialogVisible.value = true
  // 清除校验提示
  nextTick(() => {
    if (recordFormRef.value) {
      recordFormRef.value.clearValidate()
    }
  })
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
  ).then(async () => {
    try {
      await request.delete(`/dailyStatus/delete/${row.recordId}`)
      ElMessage.success('记录删除成功！')
      searchRecord()
    } catch (err) {
      console.error('删除记录失败', err)
    }
  })
}

// 保存记录
const saveRecord = () => {
  recordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const teacherId = userStore.userInfo.userId
        const data = {
          recordType: parseInt(recordForm.recordType),
          content: recordForm.content,
          recordDate: recordForm.recordDate.toISOString().split('T')[0],
          // 同时映射到旧字段以防万一
          activity: recordForm.recordType === '1' || recordForm.recordType === '4' ? recordForm.content : '',
          diet: recordForm.recordType === '2' ? recordForm.content : '',
          homework: recordForm.recordType === '6' ? recordForm.content : '', // 其他
          abnormalDesc: recordForm.recordType === '5' ? recordForm.content : '',
          abnormalImg: fileList.value.length > 0 ? fileList.value[0].url : ''
        }

        if (isEdit.value) {
          await request.put(`/dailyStatus/update/${recordForm.recordId}`, data)
          ElMessage.success('记录编辑成功！')
        } else {
          await request.post(`/dailyStatus/add?childId=${recordForm.childId}&teacherId=${teacherId}`, data)
          ElMessage.success('记录新增成功！')
        }
        recordDialogVisible.value = false
        searchRecord()
      } catch (err) {
        console.error('保存记录失败', err)
      } finally {
        loading.value = false
      }
    }
  })
}

// 上传成功回调
const handleUploadSuccess = (response, file) => {
  if (response.code === 200) {
    // response.data.url 已经是 /api/uploads/records/xxx.jpg
    file.url = response.data.url
    ElMessage.success('照片上传成功！')
  } else {
    ElMessage.error('照片上传失败：' + response.msg)
    // 上传失败从列表中移除
    const index = fileList.value.indexOf(file)
    if (index > -1) {
      fileList.value.splice(index, 1)
    }
  }
}

const handleUploadError = (err) => {
  console.error('上传异常:', err)
  ElMessage.error('服务器响应异常，请检查网络或后端服务')
}

// 分页事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  // 这里可以根据真实分页接口传参
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
}

onMounted(() => {
  fetchChildren()
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

:deep(.operation-column .cell) {
  display: flex;
  justify-content: center;
  gap: 12px;
}

:deep(.operation-column .cell .el-button) {
  margin: 0;
}
</style>