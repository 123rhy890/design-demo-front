<!-- 
  模块：【老师-班级管理】
  功能：班级列表管理、班级新增/编辑、学员分班调整、班级考勤汇总
-->
<template>
  <div class="teacher-class-manage">
    <!-- 班级列表 -->
    <el-row :gutter="20" v-loading="loading">
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
              <span class="highlight">{{ classItem.studentCount }} / {{ classItem.maxCapacity }}人</span>
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
        <el-form-item label="班主任" prop="teacherId">
          <el-select v-model="classForm.teacherId" placeholder="请选择班主任" style="width:100%">
            <el-option 
              v-for="t in teacherList" 
              :key="t.userId" 
              :label="t.username" 
              :value="t.userId" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="最大容量" prop="maxCapacity">
          <el-input-number v-model="classForm.maxCapacity" :min="1" :max="100" style="width:100%" />
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
    <el-dialog v-model="studentsDialogVisible" :title="`【${currentClassName}】学员列表`" width="800px">
      <el-table :data="currentStudents" border stripe style="width:100%" v-loading="studentsLoading">
        <el-table-column prop="childId" label="学号" width="100" />
        <el-table-column prop="childName" label="姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="scope">
            {{ scope.row.gender === 1 ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="birthDate" label="生日" width="120" />
        <el-table-column prop="parentName" label="家长" width="120">
          <template #default="scope">
            {{ scope.row.parent ? scope.row.parent.username : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="parentPhone" label="联系电话" width="130">
          <template #default="scope">
            {{ scope.row.parent ? scope.row.parent.phone : '-' }}
          </template>
        </el-table-column>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, Calendar } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useUserStore } from '../../pinia/modules/userStore'

const userStore = useUserStore()

// 班级列表
const classList = ref([])
const loading = ref(false)

// 教师列表
const teacherList = ref([])

// 获取班级列表
const fetchClassList = async () => {
  loading.value = true
  try {
    const res = await request.get('/class/stats')
    classList.value = res.data
  } catch (err) {
    console.error('获取班级列表失败', err)
  } finally {
    loading.value = false
  }
}

// 获取教师列表
const fetchTeacherList = async () => {
  try {
    const res = await request.get('/user/role/1')
    teacherList.value = res.data
  } catch (err) {
    console.error('获取教师列表失败', err)
  }
}

onMounted(() => {
  fetchClassList()
  fetchTeacherList()
})

// 班级表单
const classDialogVisible = ref(false)
const isEdit = ref(false)
const classFormRef = ref(null)
const classForm = reactive({
  id: '',
  name: '',
  teacherId: '',
  maxCapacity: 30,
  classroom: '',
  status: 1,
  description: ''
})

const classRules = ref({
  name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  teacherId: [{ required: true, message: '请选择班主任', trigger: 'change' }],
  classroom: [{ required: true, message: '请输入教室位置', trigger: 'blur' }]
})

// 学员列表
const studentsDialogVisible = ref(false)
const studentsLoading = ref(false)
const currentStudents = ref([])
const currentClassName = ref('')

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
  Object.assign(classForm, {
    id: classItem.id,
    name: classItem.name,
    teacherId: classItem.teacherId,
    maxCapacity: classItem.maxCapacity,
    classroom: classItem.classroom,
    status: classItem.status,
    description: classItem.description || ''
  })
  classDialogVisible.value = true
}

// 新增班级
const addNewClass = () => {
  isEdit.value = false
  Object.assign(classForm, {
    id: '',
    name: '',
    teacherId: userStore.userInfo.userId, // 默认当前老师
    maxCapacity: 30,
    classroom: '',
    status: 1,
    description: ''
  })
  classDialogVisible.value = true
}

// 保存班级
const saveClass = () => {
  classFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await request.put(`/class/update/${classForm.id}?teacherId=${classForm.teacherId}`, {
            className: classForm.name,
            maxCapacity: classForm.maxCapacity,
            classStatus: classForm.status
          })
          ElMessage.success('班级信息更新成功！')
        } else {
          await request.post(`/class/add?teacherId=${classForm.teacherId}`, {
            className: classForm.name,
            maxCapacity: classForm.maxCapacity,
            classStatus: classForm.status
          })
          ElMessage.success('班级创建成功！')
        }
        classDialogVisible.value = false
        fetchClassList()
      } catch (err) {
        console.error('保存班级失败', err)
      }
    }
  })
}

// 查看学员列表
const viewStudents = async (classItem) => {
  currentClassName.value = classItem.name
  studentsDialogVisible.value = true
  studentsLoading.value = true
  try {
    const res = await request.get(`/child/class/${classItem.id}`)
    currentStudents.value = res.data
  } catch (err) {
    console.error('获取学员列表失败', err)
  } finally {
    studentsLoading.value = false
  }
}

// 转班
const transferStudent = (student) => {
  ElMessage.info(`转班功能：${student.childName}`)
}

// 移除学员
const removeStudent = (student) => {
  ElMessageBox.confirm(
    `确定要将${student.childName}从班级中移除吗？`,
    '移除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 实际上是把 child 的 classId 设为 null
      await request.put(`/child/update/${student.childId}?classId=0`)
      ElMessage.success('学员移除成功！')
      // 刷新列表
      if (currentStudents.value.length > 0) {
        const classId = currentStudents.value[0].classInfo.classId
        viewStudents({ id: classId, name: currentClassName.value })
      }
      fetchClassList()
    } catch (err) {
      console.error('移除学员失败', err)
    }
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
  background-color: #f5f7fa;
}

.class-card {
  margin-bottom: 20px;
  transition: all 0.3s;
  border-radius: 8px;
}

.class-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.class-header h3 {
  margin: 0 10px 0 0;
  display: inline-block;
  font-size: 18px;
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
  justify-content: space-around;
  padding-top: 10px;
}

.add-class-card {
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: 2px dashed #dcdfe6;
  background: transparent;
  border-radius: 8px;
}

.add-class-card:hover {
  border-color: #409EFF;
  background-color: #f0f7ff;
}

.add-content {
  text-align: center;
}

.add-text {
  margin-top: 10px;
  color: #409EFF;
  font-weight: bold;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
