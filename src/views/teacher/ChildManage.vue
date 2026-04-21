<!-- 
  模块：【教师端-儿童管理】
  功能：本班儿童列表、儿童信息查看、特殊备注、请假管理
-->
<template>
  <div class="child-manage">
    <!-- 筛选栏 -->
    <el-card class="mb-20">
      <el-form :model="searchForm" inline @submit.prevent="searchChild">
        <el-form-item label="儿童姓名">
          <el-input v-model="searchForm.childName" placeholder="请输入儿童姓名" style="width:200px" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="searchForm.gender" placeholder="请选择性别" style="width:100px">
            <el-option label="男" value="1" />
            <el-option label="女" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" style="width:120px">
            <el-option label="正常" value="1" />
            <el-option label="请假" value="2" />
            <el-option label="缺勤" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchChild">查询</el-button>
          <el-button icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 儿童列表 -->
    <el-card>
      <el-table :data="childList" border stripe style="width:100%" :loading="loading">
        <el-table-column prop="childId" label="儿童ID" width="100" />
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="scope">
            {{ scope.row.gender === 1 ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="parentName" label="家长姓名" width="120" />
        <el-table-column prop="parentPhone" label="联系电话" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="特殊备注" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" icon="View" @click="viewChild(scope.row)">查看详情</el-button>
            <el-button type="warning" size="small" icon="Edit" @click="editRemark(scope.row)">编辑备注</el-button>
            <el-button v-if="scope.row.status !== 2" type="danger" size="small" icon="Calendar" @click="addLeave(scope.row)">请假登记</el-button>
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

    <!-- 儿童详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="儿童详情" width="600px">
      <el-descriptions :column="2" border :data="currentChild">
        <el-descriptions-item label="儿童ID">{{ currentChild.childId }}</el-descriptions-item>
        <el-descriptions-item label="儿童姓名">{{ currentChild.childName }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentChild.gender === 1 ? '男' : '女' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentChild.age }}岁</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentChild.className }}</el-descriptions-item>
        <el-descriptions-item label="出生日期">{{ currentChild.birthday || '-' }}</el-descriptions-item>
        <el-descriptions-item label="家长姓名">{{ currentChild.parentName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentChild.parentPhone }}</el-descriptions-item>
        <el-descriptions-item label="与家长关系">{{ currentChild.relation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系人">{{ currentChild.emergencyContact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="紧急联系电话">{{ currentChild.emergencyPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="过敏史">{{ currentChild.allergy || '无' }}</el-descriptions-item>
        <el-descriptions-item label="特殊疾病">{{ currentChild.disease || '无' }}</el-descriptions-item>
        <el-descriptions-item label="特殊备注" span="2">{{ currentChild.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 编辑备注弹窗 -->
    <el-dialog v-model="remarkDialogVisible" title="编辑特殊备注" width="400px">
      <el-form :model="remarkForm" :rules="remarkRules" ref="remarkFormRef" label-width="80px">
        <el-form-item label="备注内容" prop="remark">
          <el-input v-model="remarkForm.remark" type="textarea" placeholder="请输入特殊备注（如饮食禁忌、性格特点等）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRemark">保存</el-button>
      </template>
    </el-dialog>

    <!-- 请假登记弹窗 -->
    <el-dialog v-model="leaveDialogVisible" title="请假登记" width="400px">
      <el-form :model="leaveForm" :rules="leaveRules" ref="leaveFormRef" label-width="80px">
        <el-form-item label="请假类型" prop="leaveType">
          <el-select v-model="leaveForm.leaveType" placeholder="请选择请假类型">
            <el-option label="事假" value="1" />
            <el-option label="病假" value="2" />
            <el-option label="其他" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="请假时间" prop="leaveTime">
          <el-date-picker
            v-model="leaveForm.leaveTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="请假原因" prop="reason">
          <el-input v-model="leaveForm.reason" type="textarea" placeholder="请输入请假原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="leaveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLeave">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索表单
const searchForm = reactive({
  childName: '',
  gender: '',
  status: ''
})

// 加载状态
const loading = ref(false)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 25
})

// 儿童列表
const childList = ref([
  {
    childId: 2001,
    childName: '张小宝',
    gender: 1,
    age: 6,
    className: '大一班',
    parentName: '张三',
    parentPhone: '13800138000',
    status: 1,
    remark: '对花生过敏，性格活泼',
    birthday: '2018-05-10',
    relation: '父亲',
    emergencyContact: '张奶奶',
    emergencyPhone: '13900139000',
    allergy: '花生',
    disease: '无'
  },
  {
    childId: 2002,
    childName: '李小贝',
    gender: 0,
    age: 5,
    className: '大一班',
    parentName: '李四',
    parentPhone: '13900139000',
    status: 2,
    remark: '性格内向，需要多关注',
    birthday: '2019-03-15',
    relation: '母亲',
    emergencyContact: '李爷爷',
    emergencyPhone: '13700137000',
    allergy: '无',
    disease: '无'
  },
  {
    childId: 2003,
    childName: '王小丫',
    gender: 0,
    age: 7,
    className: '大一班',
    parentName: '王五',
    parentPhone: '13700137000',
    status: 1,
    remark: '哮喘病史，避免剧烈运动',
    birthday: '2017-08-20',
    relation: '母亲',
    emergencyContact: '王叔叔',
    emergencyPhone: '13600136000',
    allergy: '无',
    disease: '哮喘'
  }
])

// 状态类型映射
const getStatusType = (status) => {
  switch (status) {
    case 1: return 'success'
    case 2: return 'warning'
    case 3: return 'danger'
    default: return ''
  }
}

// 状态文本映射
const getStatusText = (status) => {
  switch (status) {
    case 1: return '正常'
    case 2: return '请假'
    case 3: return '缺勤'
    default: return '未知'
  }
}

// 详情弹窗
const detailDialogVisible = ref(false)
const currentChild = ref({})

// 备注弹窗
const remarkDialogVisible = ref(false)
const remarkFormRef = ref(null)
const remarkForm = reactive({
  remark: '',
  childId: ''
})
const remarkRules = ref({
  remark: [{ required: true, message: '请输入备注内容', trigger: 'blur' }]
})

// 请假弹窗
const leaveDialogVisible = ref(false)
const leaveFormRef = ref(null)
const leaveForm = reactive({
  leaveType: '',
  leaveTime: [],
  reason: '',
  childId: ''
})
const leaveRules = ref({
  leaveType: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
  leaveTime: [{ required: true, message: '请选择请假时间', trigger: 'change' }],
  reason: [{ required: true, message: '请输入请假原因', trigger: 'blur' }]
})

// 搜索儿童
const searchChild = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('查询成功！')
  }, 500)
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    childName: '',
    gender: '',
    status: ''
  })
}

// 查看儿童详情
const viewChild = (row) => {
  currentChild.value = { ...row }
  detailDialogVisible.value = true
}

// 编辑备注
const editRemark = (row) => {
  remarkForm.childId = row.childId
  remarkForm.remark = row.remark || ''
  remarkDialogVisible.value = true
}

// 保存备注
const saveRemark = () => {
  remarkFormRef.value.validate((valid) => {
    if (valid) {
      const index = childList.value.findIndex(item => item.childId === remarkForm.childId)
      if (index > -1) {
        childList.value[index].remark = remarkForm.remark
      }
      ElMessage.success('备注保存成功！')
      remarkDialogVisible.value = false
    }
  })
}

// 请假登记
const addLeave = (row) => {
  leaveForm.childId = row.childId
  leaveForm.leaveType = ''
  leaveForm.leaveTime = []
  leaveForm.reason = ''
  leaveDialogVisible.value = true
}

// 保存请假
const saveLeave = () => {
  leaveFormRef.value.validate((valid) => {
    if (valid) {
      const index = childList.value.findIndex(item => item.childId === leaveForm.childId)
      if (index > -1) {
        childList.value[index].status = 2
      }
      ElMessage.success('请假登记成功！')
      leaveDialogVisible.value = false
    }
  })
}

// 分页事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  searchChild()
}

const handleCurrentChange = (val) => {
  pagination.pageNum = val
  searchChild()
}

onMounted(() => {
  searchChild()
})
</script>

<style scoped>
.child-manage {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>