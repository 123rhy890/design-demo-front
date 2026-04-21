<!-- 
  模块：【管理员-系统管理】
  功能：角色列表管理、权限分配配置、账号新增/编辑/禁用、角色权限关联
-->
<template>
  <div class="admin-role-auth">
    <el-card class="mb-20">
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" icon="Plus" @click="openRoleDialog">新增角色</el-button>
        </div>
      </template>
      <el-table :data="roleList" border stripe style="width:100%">
        <el-table-column prop="roleId" label="角色ID" width="100" />
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="roleDesc" label="角色描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" icon="Edit" @click="editRole(scope.row)">编辑</el-button>
            <el-button type="warning" size="small" icon="Lock" @click="changeStatus(scope.row)">
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" icon="Delete" @click="deleteRole(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 权限分配卡片 -->
    <el-card>
      <template #header>
        <span>权限分配</span>
      </template>
      <el-form :model="permissionForm" label-width="100px">
        <el-form-item label="选择角色">
          <el-select v-model="permissionForm.roleId" placeholder="请选择角色" style="width:200px">
            <el-option 
              v-for="role in roleList" 
              :key="role.roleId" 
              :label="role.roleName" 
              :value="role.roleId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分配权限">
          <el-tree
            :data="permissionTree"
            show-checkbox
            node-key="permissionId"
            :default-checked-keys="checkedPermissions"
            @check="handleCheckChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="savePermission">保存权限</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 角色新增/编辑弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="角色管理" width="500px">
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDesc">
          <el-input v-model="roleForm.roleDesc" type="textarea" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="roleForm.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 角色列表数据
const roleList = ref([
  { roleId: 1, roleName: '超级管理员', roleDesc: '系统最高权限', status: 1 },
  { roleId: 2, roleName: '普通管理员', roleDesc: '基础管理权限', status: 1 },
  { roleId: 3, roleName: '财务管理员', roleDesc: '仅费用管理权限', status: 1 }
])

// 角色弹窗相关
const roleDialogVisible = ref(false)
const roleFormRef = ref(null)
const roleForm = reactive({
  roleId: '',
  roleName: '',
  roleDesc: '',
  status: '1'
})
const roleRules = ref({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleDesc: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
})

// 权限分配相关
const permissionForm = reactive({
  roleId: ''
})
const permissionTree = ref([
  {
    permissionId: 1,
    label: '系统管理',
    children: [
      { permissionId: 101, label: '家长审核' },
      { permissionId: 102, label: '角色权限' },
      { permissionId: 103, label: '费用管理' },
      { permissionId: 104, label: '数据导出' }
    ]
  },
  {
    permissionId: 2,
    label: '教学管理',
    children: [
      { permissionId: 201, label: '儿童管理' },
      { permissionId: 202, label: '接送签到' },
      { permissionId: 203, label: '日常记录' }
    ]
  },
  {
    permissionId: 3,
    label: '家长中心',
    children: [
      { permissionId: 301, label: '儿童绑定' },
      { permissionId: 302, label: '托管预约' },
      { permissionId: 303, label: '费用查看' }
    ]
  }
])
const checkedPermissions = ref([101, 102, 103, 104])

// 打开角色弹窗
const openRoleDialog = () => {
  roleDialogVisible.value = true
  // 重置表单
  roleFormRef.value?.resetFields()
  Object.assign(roleForm, { roleId: '', roleName: '', roleDesc: '', status: '1' })
}

// 编辑角色
const editRole = (row) => {
  roleDialogVisible.value = true
  Object.assign(roleForm, {
    roleId: row.roleId,
    roleName: row.roleName,
    roleDesc: row.roleDesc,
    status: row.status + ''
  })
}

// 保存角色
const saveRole = () => {
  roleFormRef.value.validate((valid) => {
    if (valid) {
      if (roleForm.roleId) {
        // 编辑
        const index = roleList.value.findIndex(item => item.roleId === roleForm.roleId)
        if (index > -1) {
          roleList.value[index] = {
            ...roleList.value[index],
            roleName: roleForm.roleName,
            roleDesc: roleForm.roleDesc,
            status: Number(roleForm.status)
          }
        }
        ElMessage.success('角色编辑成功！')
      } else {
        // 新增
        const newRole = {
          roleId: Date.now(),
          roleName: roleForm.roleName,
          roleDesc: roleForm.roleDesc,
          status: Number(roleForm.status)
        }
        roleList.value.push(newRole)
        ElMessage.success('角色新增成功！')
      }
      roleDialogVisible.value = false
    }
  })
}

// 切换角色状态
const changeStatus = (row) => {
  ElMessageBox.confirm(
    `确定要${row.status === 1 ? '禁用' : '启用'}该角色吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.success(`${row.status === 1 ? '启用' : '禁用'}成功！`)
  })
}

// 删除角色
const deleteRole = (row) => {
  ElMessageBox.confirm(
    '确定要删除该角色吗？删除后无法恢复！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    roleList.value = roleList.value.filter(item => item.roleId !== row.roleId)
    ElMessage.success('角色删除成功！')
  })
}

// 权限勾选变化
const handleCheckChange = (checkedKeys) => {
  checkedPermissions.value = checkedKeys
}

// 保存权限
const savePermission = () => {
  if (!permissionForm.roleId) {
    ElMessage.warning('请先选择角色！')
    return
  }
  ElMessage.success('权限分配成功！')
}

onMounted(() => {
  // 模拟接口请求加载角色和权限数据
  console.log('加载角色权限数据')
})
</script>

<style scoped>
.admin-role-auth {
  width: 100%;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-tree {
  border: 1px solid #e6e6e6;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>