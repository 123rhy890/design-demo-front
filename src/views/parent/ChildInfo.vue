<!-- 
  模块：【家长-儿童信息】
  功能：查看儿童基本信息、日常托管记录、考勤统计、成长档案、老师评语查看
-->
<template>
  <div class="parent-child-info">
    <!-- 儿童选择与手动签到 -->
    <el-card class="mb-20" v-if="children.length > 0">
      <div class="header-action">
        <el-radio-group v-model="currentChildId" @change="loadChildInfo">
          <el-radio-button 
            v-for="child in children" 
            :key="child.id" 
            :label="child.id"
          >
            {{ child.name }}
          </el-radio-button>
        </el-radio-group>
        <el-button type="danger" @click="openManualCheckin">手动签到</el-button>
      </div>
    </el-card>
    <el-empty v-else description="暂无关联儿童信息" />

    <el-row :gutter="20" v-if="currentChild && children.length > 0">
      <!-- 左侧：基本信息 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>

          <div class="child-profile">
            <el-avatar :size="100" :src="currentChild.avatar">
              {{ currentChild.name.charAt(0) }}
            </el-avatar>
            <h2>{{ currentChild.name }}</h2>
            <el-tag type="success">在读</el-tag>
            <el-button type="primary" link icon="Edit" @click="openEditChildDialog">修改信息</el-button>
          </div>

          <el-descriptions :column="1" border class="mt-20">
            <el-descriptions-item label="性别">
              {{ currentChild.gender === 1 ? '男' : '女' }}
            </el-descriptions-item>
            <el-descriptions-item label="年龄">
              {{ currentChild.age }}岁
            </el-descriptions-item>
            <el-descriptions-item label="班级">
              {{ currentChild.className }}
            </el-descriptions-item>
            <el-descriptions-item label="过敏史">
              {{ currentChild.allergy || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="紧急联系人">
              {{ currentChild.emergencyContact }}
            </el-descriptions-item>
            <el-descriptions-item label="紧急电话">
              {{ currentChild.emergencyPhone }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 右侧：详细信息 -->
      <el-col :span="16">
        <el-card>
          <el-tabs v-model="activeTab">
            <!-- 考勤记录 -->
            <el-tab-pane label="考勤记录" name="attendance">
              <el-table :data="attendanceRecords" border stripe style="width:100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="checkInTime" label="签到时间" width="180" />
                <el-table-column prop="checkOutTime" label="签退时间" width="180" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag :type="getAttendanceStatusType(scope.row.status)">
                      {{ getAttendanceStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="pickPerson" label="接送人" />
              </el-table>
            </el-tab-pane>

            <!-- 日常记录 -->
            <el-tab-pane label="日常记录" name="daily">
              <el-timeline v-if="dailyRecords.length > 0">
                <el-timeline-item
                  v-for="record in dailyRecords"
                  :key="record.id"
                  :timestamp="record.date"
                  color="#409EFF"
                  @click="viewDailyRecordDetail(record)"
                  class="daily-record-item"
                >
                  <el-card>
                    <div class="record-header">
                      <span class="record-teacher">记录老师：{{ record.teacher }}</span>
                    </div>
                    <div class="record-content">
                      <p><strong>记录类型：</strong>{{ getTypeName(record.recordType) }}</p>
                      <p><strong>记录内容：</strong>{{ record.content }}</p>
                      <div v-if="record.abnormalDesc" style="color: #F56C6C; margin-top: 10px;">
                        <strong>异常情况：</strong>{{ record.abnormalDesc }}
                      </div>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无日常记录" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 日常记录详情弹窗 -->
    <el-dialog v-model="dailyRecordDetailVisible" title="日常记录详情" width="600px">
      <el-descriptions :column="2" border v-if="currentDailyRecord">
        <el-descriptions-item label="记录类型">
          <el-tag :type="getTypeColor(currentDailyRecord.recordType)">
            {{ getTypeName(currentDailyRecord.recordType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="记录日期">{{ currentDailyRecord.date }}</el-descriptions-item>
        <el-descriptions-item label="记录老师">{{ currentDailyRecord.teacher }}</el-descriptions-item>
        <el-descriptions-item label="记录时间">{{ currentDailyRecord.createTime }}</el-descriptions-item>
        <el-descriptions-item label="记录内容" :span="2">{{ currentDailyRecord.content }}</el-descriptions-item>
        <el-descriptions-item v-if="currentDailyRecord.abnormalDesc" label="异常情况" :span="2" label-class-name="abnormal-label">
          {{ currentDailyRecord.abnormalDesc }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="currentDailyRecord && currentDailyRecord.abnormalImg" class="mt-20">
        <h4>相关照片</h4>
        <el-image 
          :src="currentDailyRecord.abnormalImg" 
          fit="cover" 
          style="width:150px;height:150px;margin-right:10px;margin-top:10px;"
          :preview-src-list="[currentDailyRecord.abnormalImg]"
        />
      </div>
    </el-dialog>

    <!-- 手动签到弹窗 -->
    <el-dialog v-model="manualCheckinVisible" title="手动签到" width="450px">
      <el-form :model="manualForm" :rules="manualRules" ref="manualFormRef" label-width="110px">
        <el-form-item label="当前选择儿童">
          <span class="child-name">{{ currentChild?.name }}</span>
        </el-form-item>
        <el-form-item label="选择预约记录" prop="reserveId">
          <el-select v-model="manualForm.reserveId" placeholder="请选择今日有效的预约记录" style="width: 100%">
            <el-option
              v-for="item in todayReservations"
              :key="item.reserveId"
              :label="`${item.reserveDate} (${item.type === 'day' ? '日托' : '晚托'})`"
              :value="item.reserveId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="签到码" prop="signCode">
          <el-input 
            v-model="manualForm.signCode" 
            placeholder="请输入老师端生成的8位签到码" 
            maxlength="8"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="manualCheckinVisible = false">取消</el-button>
          <el-button type="primary" @click="submitManualCheckin" :loading="submitting">确认签到</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改儿童信息弹窗 -->
    <el-dialog v-model="editChildDialogVisible" title="修改儿童信息" width="500px">
      <el-form :model="editChildForm" :rules="editChildRules" ref="editChildFormRef" label-width="100px">
        <el-form-item label="儿童姓名" prop="childName">
          <el-input v-model="editChildForm.childName" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="editChildForm.idCard" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editChildForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期" prop="birthDate">
          <el-date-picker v-model="editChildForm.birthDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="过敏史" prop="allergyHistory">
          <el-input v-model="editChildForm.allergyHistory" type="textarea" />
        </el-form-item>
        <el-form-item label="紧急联系人" prop="emergencyContact">
          <el-input v-model="editChildForm.emergencyContact" />
        </el-form-item>
        <el-form-item label="紧急电话" prop="emergencyPhone">
          <el-input v-model="editChildForm.emergencyPhone" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editChildForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editChildDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditChild" :loading="submittingEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useUserStore } from '../../pinia/modules/userStore'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

// 儿童列表
const children = ref([])
// 当前选中的儿童ID
const currentChildId = ref(null)
// 当前儿童详细数据
const currentChild = ref(null)
// 日常记录
const dailyRecords = ref([])
// 考勤记录
const attendanceRecords = ref([])
// 当前标签页
const activeTab = ref('attendance') // 默认显示考勤记录

// 日常记录详情弹窗
const dailyRecordDetailVisible = ref(false)
const currentDailyRecord = ref(null)

// 手动签到相关
const manualCheckinVisible = ref(false)
const submitting = ref(false)
const manualFormRef = ref(null)
const todayReservations = ref([])
const manualForm = reactive({
  reserveId: '',
  signCode: ''
})

const manualRules = {
  reserveId: [{ required: true, message: '请选择预约记录', trigger: 'change' }],
  signCode: [
    { required: true, message: '请输入签到码', trigger: 'blur' },
    { min: 8, max: 8, message: '签到码必须为8位', trigger: 'blur' }
  ]
}

// 修改儿童信息相关
const editChildDialogVisible = ref(false)
const submittingEdit = ref(false)
const editChildFormRef = ref(null)
const editChildForm = reactive({
  childId: null,
  childName: '',
  idCard: '',
  gender: 1,
  birthDate: '',
  allergyHistory: '',
  emergencyContact: '',
  emergencyPhone: '',
  remark: ''
})

const editChildRules = {
  childName: [{ required: true, message: '请输入儿童姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  emergencyContact: [{ required: true, message: '请输入紧急联系人', trigger: 'blur' }],
  emergencyPhone: [
    { required: true, message: '请输入紧急电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const openManualCheckin = async () => {
  if (!currentChildId.value) {
    ElMessage.warning('请先选择儿童')
    return
  }
  
  // 获取今日已审核通过的预约记录
  try {
    const res = await request.get(`/reservation/child/${currentChildId.value}/status/1`)
    const today = new Date().toISOString().split('T')[0]
    todayReservations.value = (res.data || []).filter(r => r.reserveDate === today)
    
    if (todayReservations.value.length === 0) {
      ElMessage.warning('该儿童今日没有已审核通过的预约记录，无法手动签到')
      return
    }
    
    manualForm.reserveId = ''
    manualForm.signCode = ''
    manualCheckinVisible.value = true
  } catch (err) {
    console.error('获取预约记录失败', err)
  }
}

const submitManualCheckin = () => {
  manualFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await request.post('/attendance/manual/checkin', null, {
          params: {
            reserveId: manualForm.reserveId,
            signCode: manualForm.signCode
          }
        })
        ElMessage.success('签到成功！')
        manualCheckinVisible.value = false
        fetchAttendanceRecords() // 刷新考勤记录
      } catch (err) {
        console.error('手动签到失败', err)
        // 后端会返回具体的错误信息（如签到码错误）
      } finally {
        submitting.value = false
      }
    }
  })
}

// 打开修改儿童信息弹窗
const openEditChildDialog = () => {
  if (currentChild.value) {
    Object.assign(editChildForm, {
      childId: currentChild.value.id,
      childName: currentChild.value.name,
      idCard: currentChild.value.idCard,
      gender: currentChild.value.gender,
      birthDate: currentChild.value.birthDate,
      allergyHistory: currentChild.value.allergy,
      emergencyContact: currentChild.value.emergencyContact,
      emergencyPhone: currentChild.value.emergencyPhone,
      remark: currentChild.value.remark
    })
    editChildDialogVisible.value = true
  } else {
    ElMessage.warning('请先选择一个儿童')
  }
}

// 提交修改儿童信息
const submitEditChild = () => {
  editChildFormRef.value.validate(async (valid) => {
    if (valid) {
      submittingEdit.value = true
      try {
        await request.put(`/child/update/${editChildForm.childId}`, {
          childName: editChildForm.childName,
          idCard: editChildForm.idCard,
          gender: editChildForm.gender,
          birthDate: editChildForm.birthDate instanceof Date ? editChildForm.birthDate.toISOString().split('T')[0] : editChildForm.birthDate,
          emergencyContact: editChildForm.emergencyContact,
          emergencyPhone: editChildForm.emergencyPhone,
          allergyHistory: editChildForm.allergyHistory,
          remark: editChildForm.remark
        })
        ElMessage.success('儿童信息修改成功！')
        editChildDialogVisible.value = false
        fetchChildren() // 刷新儿童列表和当前儿童信息
      } catch (err) {
        console.error('修改儿童信息失败', err)
      } finally {
        submittingEdit.value = false
      }
    }
  })
}

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
  return types[type] || '未知'
}

// 记录类型颜色
const getTypeColor = (type) => {
  const colors = {
    1: '',
    2: 'success',
    3: 'warning',
    4: 'info',
    5: 'danger',
    6: 'info'
  }
  return colors[type] || ''
}

// 获取家长关联的所有儿童
const fetchChildren = async () => {
  const parentId = userStore.userInfo.userId
  try {
    const res = await request.get(`/child/parent/${parentId}`)
    children.value = res.data.map(c => ({
      id: c.childId,
      name: c.childName,
      idCard: c.idCard,
      gender: c.gender,
      birthDate: c.birthDate,
      className: c.classInfo ? c.classInfo.className : '未分班',
      allergy: c.allergyHistory,
      emergencyContact: c.emergencyContact,
      emergencyPhone: c.emergencyPhone,
      remark: c.remark
    }))
    
    if (children.value.length > 0) {
      currentChildId.value = children.value[0].id
      loadChildInfo()
    }
  } catch (err) {
    console.error('获取儿童列表失败', err)
  }
}

// 加载选中儿童的详细信息
const loadChildInfo = () => {
  const child = children.value.find(c => c.id === currentChildId.value)
  if (child) {
    currentChild.value = {
      ...child,
      age: calculateAge(child.birthDate),
      avatar: ''
    }
    fetchDailyRecords()
    fetchAttendanceRecords()
  }
}

// 获取日常记录
const fetchDailyRecords = async () => {
  try {
    const res = await request.get(`/dailyStatus/child/${currentChildId.value}`)
    dailyRecords.value = res.data.map(r => ({
      id: r.recordId,
      date: r.recordDate,
      recordType: r.recordType,
      content: r.content,
      diet: r.diet,
      homework: r.homework,
      activity: r.activity,
      abnormalDesc: r.abnormalDesc,
      abnormalImg: r.abnormalImg,
      teacher: r.teacher ? r.teacher.username : '系统',
      createTime: r.createTime ? r.createTime.replace('T', ' ') : '-'
    }))
  } catch (err) {
    console.error('获取日常记录失败', err)
  }
}

// 获取考勤记录
const fetchAttendanceRecords = async () => {
  if (!currentChildId.value) return
  try {
    const res = await request.get(`/attendance/child/${currentChildId.value}`)
    console.log('考勤原始数据:', res.data)
    attendanceRecords.value = (res.data || []).map(a => {
      // 兼容处理：后端可能返回 attendStatus 或 attend_status
      const status = a.attendStatus !== undefined ? a.attendStatus : a.attend_status
      
      return {
        date: a.checkinTime ? a.checkinTime.split('T')[0] : (a.checkoutTime ? a.checkoutTime.split('T')[0] : '-'),
        checkInTime: a.checkinTime ? a.checkinTime.replace('T', ' ').substring(0, 16) : '-',
        checkOutTime: a.checkoutTime ? a.checkoutTime.replace('T', ' ').substring(0, 16) : '-',
        status: status,
        pickPerson: a.pickPerson || '-'
      }
    })
  } catch (err) {
    console.error('获取考勤记录失败', err)
    attendanceRecords.value = []
  }
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

// 考勤状态样式
const getAttendanceStatusType = (status) => {
  switch (status) {
    case 1: return 'success'
    case 0: return 'danger'
    case 2: return 'warning'
    case 3: return 'info'
    default: return ''
  }
}

// 考勤状态文本
const getAttendanceStatusText = (status) => {
  switch (status) {
    case 1: return '正常'
    case 0: return '迟到'
    case 2: return '早退'
    case 3: return '缺勤'
    default: return '未知'
  }
}

// 查看日常记录详情
const viewDailyRecordDetail = (record) => {
  currentDailyRecord.value = record
  dailyRecordDetailVisible.value = true
}

onMounted(() => {
  fetchChildren()
})
</script>

<style scoped>
.parent-child-info {
  padding: 20px;
}
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.child-name {
  font-weight: bold;
  color: #409EFF;
}
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.child-profile {
  text-align: center;
  padding: 10px 0;
}
.record-header {
  margin-bottom: 10px;
}
.record-teacher {
  font-size: 12px;
  color: #909399;
}
.record-content p {
  margin: 5px 0;
  font-size: 14px;
}

.daily-record-item {
  cursor: pointer;
}

.daily-record-item:hover {
  background-color: #f5f7fa;
}

.abnormal-label {
  color: #F56C6C;
  font-weight: bold;
}
</style>
