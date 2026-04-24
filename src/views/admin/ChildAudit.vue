<!-- 
  模块：【管理员-系统管理】
  功能：儿童绑定申请审核、审核通过/驳回
-->
<template>
  <div class="admin-child-audit">
    <!-- 筛选栏 -->
    <el-card class="mb-20">
      <el-form :model="searchForm" inline @submit.prevent="searchAudit">
        <el-form-item label="儿童姓名">
          <el-input v-model="searchForm.childName" placeholder="请输入儿童姓名" style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchAudit">查询</el-button>
          <el-button icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核列表 -->
    <el-card>
      <el-table :data="auditList" border stripe style="width:100%" v-loading="loading">
        <el-table-column prop="childId" label="儿童ID" width="80" />
        <el-table-column prop="childName" label="儿童姓名" width="120" />
        <el-table-column prop="idCard" label="身份证号" width="180" />
        <el-table-column prop="parentName" label="家长姓名" width="120" />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleAudit(row, 1)">通过</el-button>
            <el-button type="danger" size="small" @click="handleAudit(row, 2)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'
import { useUserStore } from '../../pinia/modules/userStore'

const userStore = useUserStore()

// 搜索表单
const searchForm = reactive({
  childName: ''
})

// 加载状态
const loading = ref(false)

// 审核列表
const auditList = ref([])

// 获取待审核列表
const fetchAuditList = async () => {
  loading.value = true
  try {
    const res = await request.get('/child/pending')
    auditList.value = res.data.map(child => ({
      childId: child.childId,
      childName: child.childName,
      idCard: child.idCard,
      parentName: child.parent ? child.parent.username : '-',
      applyTime: child.createTime ? child.createTime.replace('T', ' ') : '-'
    }))
    if (searchForm.childName) {
      auditList.value = auditList.value.filter(item => item.childName.includes(searchForm.childName))
    }
  } catch (err) {
    console.error('获取审核列表失败', err)
  } finally {
    loading.value = false
  }
}

// 审核处理
const handleAudit = (row, status) => {
  const actionText = status === 1 ? '通过' : '驳回'
  ElMessageBox.confirm(`确定要${actionText} ${row.childName} 的绑定申请吗？`, '提示', {
    type: status === 1 ? 'success' : 'warning'
  }).then(async () => {
    try {
      const adminName = userStore.userInfo.username
      await request.put(`/child/audit/${row.childId}?status=${status}&auditorName=${adminName}`)
      ElMessage.success(`审核已${actionText}`)
      fetchAuditList()
    } catch (err) {
      console.error('审核操作失败', err)
    }
  })
}

// 搜索
const searchAudit = () => {
  fetchAuditList()
}

// 重置
const resetSearch = () => {
  searchForm.childName = ''
  fetchAuditList()
}

onMounted(() => {
  fetchAuditList()
})
</script>

<style scoped>
.mb-20 { margin-bottom: 20px; }
</style>
