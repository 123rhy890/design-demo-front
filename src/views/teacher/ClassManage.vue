<!-- 
  模块：【老师-班级管理】
  功能：班级列表管理、班级新增/编辑、学员分班调整、班级考勤汇总
-->
<template>
  <div class="teacher-class-manage">
    <!-- 班级列表 -->
    <el-row :gutter="20">
      <el-col :span="8" v-for="classItem in classList" :key="classItem.id">
        <el-card class="class-card" shadow="hover">
          <template #header>
            <div class="class-header">
              <div>
                <h3>{{ classItem.name }}</h3>
                <el-tag :type="classItem.status === 1 ? 'success' : 'info'" size="small">
                  {{ classItem.status === 1 ? '正常' : '停用' }}
                </el-tag>
              </div>
              <el-dropdown @command="(cmd) => handleCommand(cmd, classItem)">
                <el-button type="text" :icon="'MoreFilled'" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="view">查看详情</el-dropdown-item>
                    <el-dropdown-item command="edit">编辑班级</el-dropdown-item>
                    <el-dropdown-item command="students">学员管理</el-dropdown-item>
                    <el-dropdown-item command="attendance">考勤汇总</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>

          <div class="class-info">
            <div class="info-row">
              <span class="label">班主任：</span>
              <span>{{ classItem.teacher }}</span>
            </div>
            <div class="info-row">
              <span class="label">学员人数：</span>
              <span class="highlight">{{ classItem.studentCount }}人</span>
            </div>
            <div class="info-row">
              <span class="label">今日出勤：</span>
              <span class="success">{{ classItem.todayAttendance }}人</span>
            </div>
            <div class="info-row">
              <span class="label">教室位置：</span>
              <span>{{ classItem.classroom }}</span>
            </div>
          </div>

          <el-divider />

          <div class="class-actions">
            <el-button type="primary" size="small" @click="viewStudents(classItem)">
              <el-icon><User /></el-icon>
              学员列表
            </el-button>
            <el-button type="success" size="small" @click="viewAttendance(classItem)">
              <el-icon><Calendar /></el-icon>
              考勤记录
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 新增班级卡片 -->
      <el-col :span="8">
        <el-card class="add-class-card" shadow="hover" @click="addNewClass">
          <div class="add-content">
            <el-icon :size="48" color="#409EFF"><Plus /></el-icon>
            <div class="add-text">新增班级</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 班级详情/编辑弹窗 -->
    <el-dialog 
      v-model="classDialogVisible" 
      :title="isEdit ? '编辑班级' : '新增班级'" 
      width="600px"
    >
      <el-form :model="classForm" :rules="classRules" ref="classFormRef" label-width="100px">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="classForm.name" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="班主任" prop="teacher">
          <el-select v-model="classForm.teacher" placeholder="请选择班主任" style="width:100%">
            <el-option label="王老师" value="王老师" />
            <el-option label="李老师" value="李老师" />
            <el-option label="张老师" value="张老师" />
          </el-select>
        </el-form-item>
        <el-form-item label="教室位置" prop="classroom">
          <el-input v-model="classForm.classroom" placeholder="请输入教室位置" />
        </el-form-item>
        <el-form-item label="班级状态" prop="status">
          <el-radio-group v-model="classForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="班级简介">
          <el-input 
            v-model="classForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入班级简介"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="classDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClass">保存</el-button>
      </template>
    </el-dialog>

    <!-- 学员列表弹窗 -->
    <el-dialog v-model="studentsDialogVisible" title="班级学员列表" width="800px">
      <el-table :data="currentStudents" border stripe style="width:100%">
        <el-table-column prop="id" label="学号" width="100" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="scope">
            {{ scope.row.gender === 1 ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="parentName" label="家长" width="120" />
        <el-table-column prop="parentPhone" label="联系电话" width="130" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="text" size="small" @click="transferStudent(scope.row)">
              转班
            </el-button>
            <el-button type="text" size="small" style="color:#F56C6C;" @click="removeStudent(scope.row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 考勤汇总弹窗 -->
    <el-dialog v-model="attendanceDialogVisible" title="班级考勤汇总" width="900px">
      <el-form inline class="mb-20">
        <el-form-item label="统计月份">
          <el-date-picker
            v-model="attendanceMonth"
            type="month"
            placeholder="选择月份"
            style="width:200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAttendance">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="attendanceData" border stripe style="width:100%">
        <el-table-column prop="name" label="姓名" width="100" fixed />
        <el-table-column prop="totalDays" label="应到天数" width="100" />
        <el-table-column prop="actualDays" label="实到天数" width="100" />
        <el-table-column prop="absentDays" label="缺勤天数" width="100" />
        <el-table-column prop="lateDays" label="迟到次数" width="100" />
        <el-table-column prop="attendanceRate" label="出勤率" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.attendanceRate >= 90 ? 'success' : 'warning'">
              {{ scope.row.attendanceRate }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, Calendar } from '@element-plus/icons-vue'

// 班级列表
const classList = ref([
  {
    id: 1,
    name: '大一班',
    teacher: '王老师',
    studentCount: 28,
    todayAttendance: 26,
    classroom: '一楼101室',
    status: 1,
    description: '大班年龄段，注重综合能力培养'
  },
  {
    id: 2,
    name: '大二班',
    teacher: '李老师',
    studentCount: 26,
    todayAttendance: 24,
    classroom: '一楼102室',
    status: 1,
    description: '大班年龄段，注重综合能力培养'
  },
  {
    id: 3,
    name: '中一班',
    teacher: '张老师',
    studentCount: 25,
    todayAttendance: 23,
    classroom: '二楼201室',
    status: 1,
    description: '中班年龄段，培养基础能力'
  }
])

// 班级表单
const classDialogVisible = ref(false)
const isEdit = ref(false)
const classFormRef = ref(null)
const classForm = reactive({
  id: '',
  name: '',
  teacher: '',
  classroom: '',
  status: 1,
  description: ''
})

const classRules = ref({
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  teacher: [{ required: true, message: '请选择班主任', trigger: 'change' }],
  classroom: [{ required: true, message: '请输入教室位置', trigger: 'blur' }]
})

// 学员列表
const studentsDialogVisible = ref(false)
const currentStudents = ref([])

// 考勤汇总
const attendanceDialogVisible = ref(false)
const attendanceMonth = ref(new Date())
const attendanceData = ref([])

// 下拉菜单命令
const handleCommand = (command, classItem) => {
  switch (command) {
    case 'view':
      viewClassDetail(classItem)
      break
    case 'edit':
      editClass(classItem)
      break
    case 'students':
      viewStudents(classItem)
      break
    case 'attendance':
      viewAttendance(classItem)
      break
  }
}

// 查看班级详情
const viewClassDetail = (classItem) => {
  ElMessage.info(`查看${classItem.name}详情`)
}

// 编辑班级
const editClass = (classItem) => {
  isEdit.value = true
  Object.assign(classForm, classItem)
  classDialogVisible.value = true
}

// 新增班级
const addNewClass = () => {
  isEdit.value = false
  Object.assign(classForm, {
    id: '',
    name: '',
    teacher: '',
    classroom: '',
    status: 1,
    description: ''
  })
  classDialogVisible.value = true
}

// 保存班级
const saveClass = () => {
  classFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = classList.value.findIndex(item => item.id === classForm.id)
        if (index > -1) {
          classList.value[index] = { ...classForm, studentCount: classList.value[index].studentCount, todayAttendance: classList.value[index].todayAttendance }
        }
        ElMessage.success('班级信息更新成功！')
      } else {
        classList.value.push({
          ...classForm,
          id: Date.now(),
          studentCount: 0,
          todayAttendance: 0
        })
        ElMessage.success('班级创建成功！')
      }
      classDialogVisible.value = false
    }
  })
}

// 查看学员列表
const viewStudents = (classItem) => {
  currentStudents.value = [
    { id: 2001, name: '张小宝', gender: 1, age: 6, parentName: '张爸爸', parentPhone: '13800138001' },
    { id: 2002, name: '李小贝', gender: 0, age: 6, parentName: '李妈妈', parentPhone: '13800138002' },
    { id: 2003, name: '王小丫', gender: 0, age: 5, parentName: '王爸爸', parentPhone: '13800138003' }
  ]
  studentsDialogVisible.value = true
}

// 转班
const transferStudent = (student) => {
  ElMessage.info(`转班功能：${student.name}`)
}

// 移除学员
const removeStudent = (student) => {
  ElMessageBox.confirm(
    `确定要将${student.name}从班级中移除吗？`,
    '移除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    currentStudents.value = currentStudents.value.filter(item => item.id !== student.id)
    ElMessage.success('学员移除成功！')
  })
}

// 查看考勤汇总
const viewAttendance = (classItem) => {
  attendanceDialogVisible.value = true
  loadAttendance()
}

// 加载考勤数据
const loadAttendance = () => {
  attendanceData.value = [
    { name: '张小宝', totalDays: 22, actualDays: 21, absentDays: 1, lateDays: 0, attendanceRate: 95 },
    { name: '李小贝', totalDays: 22, actualDays: 20, absentDays: 2, lateDays: 1, attendanceRate: 91 },
    { name: '王小丫', totalDays: 22, actualDays: 19, absentDays: 3, lateDays: 2, attendanceRate: 86 }
  ]
}
</script>

<style scoped>
.teacher-class-manage {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.class-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.class-card:hover {
  transform: translateY(-5px);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-header h3 {
  margin: 0 10px 0 0;
  display: inline-block;
}

.class-info {
  padding: 10px 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.label {
  color: #666;
}

.highlight {
  color: #409EFF;
  font-weight: bold;
}

.success {
  color: #67C23A;
  font-weight: bold;
}

.class-actions {
  display: flex;
  gap: 10px;
}

.class-actions .el-button {
  flex: 1;
}

.add-class-card {
  margin-bottom: 20px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.add-class-card:hover {
  transform: translateY(-5px);
  border-color: #409EFF;
}

.add-content {
  text-align: center;
}

.add-text {
  margin-top: 15px;
  font-size: 16px;
  color: #409EFF;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>