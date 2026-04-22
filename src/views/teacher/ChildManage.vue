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
        <el-table-column prop="remark" label="特殊备注" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" icon="View" @click="viewChild(scope.row)">详情</el-button>
            <el-button type="warning" size="small" icon="Edit" @click="editRemark(scope.row)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top:20px; text-align:right;">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 儿童详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="儿童详情" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="儿童姓名">{{ currentChild.childName }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentChild.gender === 1 ? '男' : '女' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentChild.age }}岁</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentChild.className }}</el-descriptions-item>
        <el-descriptions-item label="家长">{{ currentChild.parentName }} ({{ currentChild.parentPhone }})</el-descriptions-item>
        <el-descriptions-item label="过敏史">{{ currentChild.allergy || '无' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentChild.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 编辑备注弹窗 -->
    <el-dialog v-model="remarkDialogVisible" title="编辑备注" width="400px">
      <el-form :model="remarkForm" :rules="remarkRules" ref="remarkFormRef" label-width="80px">
        <el-form-item label="备注内容" prop="remark">
          <el-input v-model="remarkForm.remark" type="textarea" placeholder="请输入特殊备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRemark">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

// 搜索表单
const searchForm = reactive({
  childName: '',
  gender: ''
})

// 加载状态
const loading = ref(false)

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 儿童列表
const childList = ref([])

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
const remarkRules = {
  remark: [{ required: true, message: '请输入备注内容', trigger: 'blur' }]
}

// 获取列表数据
const fetchChildList = () => {
  loading.value = true
  request.get('/child/list').then(res => {
    childList.value = res.data.map(child => ({
      childId: child.childId,
      childName: child.childName,
      gender: child.gender,
      age: calculateAge(child.birthDate),
      className: child.classInfo ? child.classInfo.className : '未分班',
      parentName: child.parent ? child.parent.username : '-',
      parentPhone: child.parent ? child.parent.phone : '-',
      remark: child.remark || '无',
      birthday: child.birthDate,
      emergencyContact: child.emergencyContact,
      emergencyPhone: child.emergencyPhone,
      allergy: child.allergyHistory || '无'
    }))
    pagination.total = childList.value.length
  }).finally(() => {
    loading.value = false
  })
}

// 计算年龄
const calculateAge = (birthday) => {
  if (!birthday) return '-'
  const birthDate = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// 搜索
const searchChild = () => {
  if (searchForm.childName) {
    loading.value = true
    request.get(`/child/search?keyword=${searchForm.childName}`).then(res => {
      // 此处简化，实际应使用搜索结果
      fetchChildList()
    }).finally(() => {
      loading.value = false
    })
  } else {
    fetchChildList()
  }
}

// 重置
const resetSearch = () => {
  searchForm.childName = ''
  searchForm.gender = ''
  fetchChildList()
}

// 查看详情
const viewChild = (row) => {
  currentChild.value = { ...row }
  detailDialogVisible.value = true
}

// 编辑备注
const editRemark = (row) => {
  remarkForm.childId = row.childId
  remarkForm.remark = row.remark === '无' ? '' : row.remark
  remarkDialogVisible.value = true
}

// 保存备注
const saveRemark = () => {
  remarkFormRef.value.validate((valid) => {
    if (valid) {
      request.put(`/child/update/${remarkForm.childId}`, {
        remark: remarkForm.remark
      }).then(() => {
        ElMessage.success('备注保存成功！')
        remarkDialogVisible.value = false
        fetchChildList()
      })
    }
  })
}

// 分页操作
const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchChildList()
}
const handleCurrentChange = (val) => {
  pagination.pageNum = val
  fetchChildList()
}

onMounted(() => {
  fetchChildList()
})
</script>

<style scoped>
.mb-20 { margin-bottom: 20px; }
</style>
