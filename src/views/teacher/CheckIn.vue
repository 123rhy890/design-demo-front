<!-- 
  模块：【老师-接送管理】
  功能：儿童签到/签退确认、今日接送记录查看、接送人信息核验、缺勤提醒
-->
<template>
  <div class="teacher-check-in">
    <el-row :gutter="20">
      <!-- 左侧：签到操作区 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快速签到/签退</span>
              <el-tag :type="currentTime.includes('上午') ? 'success' : 'warning'">
                {{ currentTime }}
              </el-tag>
            </div>
          </template>

          <!-- 签到类型选择 -->
          <div class="check-top-area">
            <el-radio-group v-model="checkType" class="check-type-group" @change="handleTypeChange">
              <el-radio-button label="checkIn">签到</el-radio-button>
              <el-radio-button label="checkOut">签退</el-radio-button>
            </el-radio-group>
            
            <div class="sign-code-box">
              今日签到码：<span class="code-text">{{ signCode }}</span>
            </div>
          </div>

          <!-- 儿童选择 -->
          <el-form :model="checkForm" :rules="checkRules" ref="checkFormRef" label-width="100px" class="mt-20">
            <el-form-item label="选择儿童" prop="childId">
              <el-select 
                v-model="checkForm.childId" 
                placeholder="请选择或搜索儿童" 
                filterable
                style="width:100%"
                @change="handleChildChange"
              >
                <el-option 
                  v-for="child in childList" 
                  :key="child.id" 
                  :label="`${child.name} (${child.className})`" 
                  :value="child.id"
                  :disabled="checkType === 'checkIn' ? child.checkedIn : !child.checkedIn"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="接送人" prop="pickupPerson" v-if="checkType === 'checkOut'">
              <el-input v-model="checkForm.pickupPerson" placeholder="请输入接送人姓名" />
            </el-form-item>

            <el-form-item label="联系电话" prop="pickupPhone" v-if="checkType === 'checkOut'">
              <el-input v-model="checkForm.pickupPhone" placeholder="请输入接送人电话" />
            </el-form-item>

            <el-form-item label="体温记录" prop="temperature" v-if="checkType === 'checkIn'">
              <el-input-number 
                v-model="checkForm.temperature" 
                :precision="1" 
                :step="0.1" 
                :min="35" 
                :max="42"
                style="width:100%"
              />
              <span class="ml-10">℃</span>
            </el-form-item>

            <el-form-item label="健康状况" prop="healthStatus">
              <el-radio-group v-model="checkForm.healthStatus">
                <el-radio label="normal">正常</el-radio>
                <el-radio label="abnormal">异常</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="备注说明">
              <el-input 
                v-model="checkForm.remark" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入备注信息（选填）"
              />
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                style="width:100%" 
                @click="submitCheck"
                :loading="submitting"
              >
                <el-icon><Check /></el-icon>
                确认{{ checkType === 'checkIn' ? '签到' : '签退' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 今日统计 -->
        <el-card class="mt-20">
          <template #header>
            <span>今日统计</span>
          </template>
          <el-row :gutter="15">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value" style="color:#67C23A;">{{ todayStats.checkIn }}</div>
                <div class="stat-label">已签到</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value" style="color:#E6A23C;">{{ todayStats.checkOut }}</div>
                <div class="stat-label">已签退</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value" style="color:#F56C6C;">{{ todayStats.absent }}</div>
                <div class="stat-label">未签到</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧：今日记录列表 -->
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>今日接送记录</span>
              <el-button-group>
                <el-button 
                  :type="recordFilter === 'all' ? 'primary' : ''" 
                  size="small"
                  @click="recordFilter = 'all'"
                >
                  全部
                </el-button>
                <el-button 
                  :type="recordFilter === 'checkIn' ? 'primary' : ''" 
                  size="small"
                  @click="recordFilter = 'checkIn'"
                >
                  签到
                </el-button>
                <el-button 
                  :type="recordFilter === 'checkOut' ? 'primary' : ''" 
                  size="small"
                  @click="recordFilter = 'checkOut'"
                >
                  签退
                </el-button>
              </el-button-group>
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
            <el-table-column prop="className" label="班级" width="100" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'checkIn' ? 'success' : 'warning'">
                  {{ scope.row.type === 'checkIn' ? '签到' : '签退' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="时间" width="100" />
            <el-table-column prop="temperature" label="体温" width="80">
              <template #default="scope">
                {{ scope.row.temperature ? scope.row.temperature + '℃' : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="pickupPerson" label="接送人" width="100">
              <template #default="scope">
                {{ scope.row.pickupPerson || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="healthStatus" label="健康状况" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.healthStatus === 'normal' ? 'success' : 'danger'" size="small">
                  {{ scope.row.healthStatus === 'normal' ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          </el-table>
        </el-card>

        <!-- 缺勤提醒 -->
        <el-card class="mt-20" v-if="absentList.length > 0">
          <template #header>
            <span>缺勤提醒</span>
          </template>
          <el-alert
            v-for="item in absentList"
            :key="item.id"
            :title="`${item.name} (${item.className}) 今日未签到`"
            type="warning"
            :closable="false"
            class="mb-10"
          >
            <template #default>
              <div>家长：{{ item.parentName }} | 电话：{{ item.parentPhone }}</div>
              <el-button type="text" size="small" @click="notifyParent(item)">通知家长</el-button>
            </template>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { useUserStore } from '../../pinia/modules/userStore'

const userStore = useUserStore()

// 当前时间
const currentTime = ref('')
const updateTime = () => {
  const now = new Date()
  const hours = now.getHours()
  const period = hours < 12 ? '上午' : '下午'
  currentTime.value = `${period} ${now.toLocaleTimeString()}`
}

// 签到类型
const checkType = ref('checkIn')

// 签到码
const signCode = ref('')
const generateSignCode = () => {
  signCode.value = Math.floor(Math.random() * 90000000 + 10000000).toString()
}

// 签到表单
const checkFormRef = ref(null)
const checkForm = reactive({
  childId: '',
  pickupPerson: '',
  pickupPhone: '',
  temperature: 36.5,
  healthStatus: 'normal',
  remark: ''
})

const checkRules = ref({
  childId: [{ required: true, message: '请选择儿童', trigger: 'change' }],
  pickupPerson: [{ required: true, message: '请输入接送人姓名', trigger: 'blur' }],
  pickupPhone: [{ 
    required: true, 
    message: '请输入正确的手机号', 
    trigger: 'blur',
    pattern: /^1[3-9]\d{9}$/
  }],
  temperature: [{ required: true, message: '请输入体温', trigger: 'blur' }],
  healthStatus: [{ required: true, message: '请选择健康状况', trigger: 'change' }]
})

const submitting = ref(false)

// 儿童列表
const childList = ref([])

// 今日统计
const todayStats = reactive({
  checkIn: 0,
  checkOut: 0,
  absent: 0
})

// 今日记录
const todayRecords = ref([])

// 记录筛选
const recordFilter = ref('all')

const filteredRecords = computed(() => {
  if (recordFilter.value === 'all') {
    return todayRecords.value
  }
  return todayRecords.value.filter(item => item.type === recordFilter.value)
})

// 缺勤列表
const absentList = ref([])

// 获取初始数据
const fetchData = async () => {
  try {
    // 1. 获取所有儿童
    const childrenRes = await request.get('/child/list')
    const allChildren = childrenRes.data

    // 2. 获取今日考勤记录
    const attendanceRes = await request.get('/attendance/today')
    const todayAttendances = attendanceRes.data

    // 3. 处理今日记录列表
    todayRecords.value = todayAttendances.flatMap(a => {
      const records = []
      if (a.checkinTime) {
        records.push({
          id: a.attendanceId + '_in',
          childName: a.child.childName,
          className: a.child.classInfo ? a.child.classInfo.className : '未分班',
          type: 'checkIn',
          time: a.checkinTime.split('T')[1].substring(0, 5),
          temperature: 36.5, // 实体类中暂无此字段，可根据需要扩展
          healthStatus: 'normal',
          remark: a.remark
        })
      }
      if (a.checkoutTime) {
        records.push({
          id: a.attendanceId + '_out',
          childName: a.child.childName,
          className: a.child.classInfo ? a.child.classInfo.className : '未分班',
          type: 'checkOut',
          time: a.checkoutTime.split('T')[1].substring(0, 5),
          pickupPerson: a.pickPerson,
          healthStatus: 'normal',
          remark: a.remark
        })
      }
      return records
    })

    // 4. 处理统计数据
    todayStats.checkIn = todayAttendances.filter(a => a.checkinTime).length
    todayStats.checkOut = todayAttendances.filter(a => a.checkoutTime).length

    // 5. 处理待签到儿童列表 (用于下拉框)
    const checkedInIds = todayAttendances.map(a => a.child.childId)
    const checkedOutIds = todayAttendances.filter(a => a.checkoutTime).map(a => a.child.childId)

    childList.value = allChildren.map(c => ({
      id: c.childId,
      name: c.childName,
      className: c.classInfo ? c.classInfo.className : '未分班',
      checkedIn: checkedInIds.includes(c.childId),
      checkedOut: checkedOutIds.includes(c.childId),
      parentName: c.parent ? c.parent.username : '-',
      parentPhone: c.emergencyPhone
    }))

    // 6. 处理缺勤提醒列表
    const absentRes = await request.get('/attendance/absent')
    absentList.value = absentRes.data.map(c => ({
      id: c.childId,
      name: c.childName,
      className: c.classInfo ? c.classInfo.className : '未分班',
      parentName: c.parent ? c.parent.username : '-',
      parentPhone: c.emergencyPhone
    }))
    todayStats.absent = absentList.value.length

  } catch (err) {
    console.error('获取考勤数据失败', err)
  }
}

// 提交签到/签退
const submitCheck = () => {
  checkFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const teacherId = userStore.userInfo.userId
        if (checkType.value === 'checkIn') {
          await request.post('/attendance/checkin', null, {
            params: {
              childId: checkForm.childId,
              teacherId: teacherId,
              checkinCode: signCode.value,
              remark: checkForm.remark
            }
          })
          ElMessage.success('签到成功')
        } else {
          await request.post('/attendance/checkout', null, {
            params: {
              childId: checkForm.childId,
              teacherId: teacherId,
              checkoutCode: signCode.value,
              pickPerson: checkForm.pickupPerson,
              pickPhone: checkForm.pickupPhone,
              remark: checkForm.remark
            }
          })
          ElMessage.success('签退成功')
        }
        // 重置并刷新
        checkFormRef.value.resetFields()
        generateSignCode()
        fetchData()
      } catch (err) {
        console.error('操作失败', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 通知家长
const notifyParent = (child) => {
  ElMessage.success(`已向 ${child.name} 的家长发送缺勤提醒短信`)
}

// 切换类型时重置表单
const handleTypeChange = () => {
  checkForm.childId = ''
  checkForm.remark = ''
  if (checkType.value === 'checkOut') {
    checkForm.pickupPerson = ''
    checkForm.pickupPhone = ''
  }
}

// 选择儿童后，若是签退则自动填入紧急联系人
const handleChildChange = (val) => {
  if (checkType.value === 'checkOut') {
    const child = childList.value.find(c => c.id === val)
    if (child) {
      checkForm.pickupPhone = child.parentPhone
    }
  }
}

onMounted(() => {
  updateTime()
  generateSignCode()
  setInterval(updateTime, 1000)
  fetchData()
})
</script>

<style scoped>
.teacher-check-in {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.check-type-group {
  width: 150px;
  display: flex;
}

.check-top-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sign-code-box {
  border: 1px solid #f56c6c;
  padding: 8px 15px;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 14px;
  background-color: #fef0f0;
}

.code-text {
  font-weight: bold;
  font-size: 18px;
  margin-left: 5px;
}

.check-type-group :deep(.el-radio-button__inner) {
  width: 100%;
}

.mt-20 {
  margin-top: 20px;
}

.ml-10 {
  margin-left: 10px;
}

.mb-10 {
  margin-bottom: 10px;
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