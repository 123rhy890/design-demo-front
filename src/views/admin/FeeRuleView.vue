<template>
  <div class="admin-fee-rule">
    <el-tabs v-model="activeTab">
      <!-- 费用标准 Tab -->
      <el-tab-pane label="费用标准" name="standard">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>托管费用标准设置</span>
              <el-button type="primary" icon="Plus" @click="openRuleDialog()">新增规则</el-button>
            </div>
          </template>
          <el-table :data="feeRuleList" border stripe v-loading="loadingRules">
            <el-table-column prop="timeSlot" label="托管类型" width="150" />
            <el-table-column label="费用(元/月或天)" width="150">
              <template #default="scope">¥{{ Number(scope.row.unitPrice).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="生效时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.effectiveTime) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '正常' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button type="primary" link icon="Edit" @click="openRuleDialog(scope.row)">修改</el-button>
                <el-button 
                  :type="scope.row.status === 1 ? 'danger' : 'success'" 
                  link 
                  :icon="scope.row.status === 1 ? 'VideoPause' : 'VideoPlay'"
                  @click="toggleRuleStatus(scope.row)"
                >
                  {{ scope.row.status === 1 ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 优惠规则 Tab -->
      <el-tab-pane label="优惠规则" name="discount">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>优惠政策管理</span>
              <el-button type="primary" icon="Plus" @click="openDiscountDialog()">新增优惠</el-button>
            </div>
          </template>
          <el-table :data="discountList" border stripe v-loading="loadingDiscounts">
            <el-table-column prop="discountName" label="优惠名称" width="200" />
            <el-table-column label="优惠内容" width="150">
              <template #default="scope">
                {{ scope.row.discountType === 0 ? (scope.row.discountValue * 10) + '折' : '减免¥' + scope.row.discountValue }}
              </template>
            </el-table-column>
            <el-table-column label="生效时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.effectiveTime) }}</template>
            </el-table-column>
            <el-table-column label="失效时间" width="180">
              <template #default="scope">{{ formatDateTime(scope.row.invalidTime) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                  {{ scope.row.status === 1 ? '正常' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button type="primary" link icon="Edit" @click="openDiscountDialog(scope.row)">修改</el-button>
                <el-button 
                  :type="scope.row.status === 1 ? 'danger' : 'success'" 
                  link 
                  @click="toggleDiscountStatus(scope.row)"
                >
                  {{ scope.row.status === 1 ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 生成账单 Tab -->
      <el-tab-pane label="生成账单" name="generate">
        <el-card>
          <template #header><span>手动生成托管账单</span></template>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form :model="billForm" :rules="billRules" ref="billFormRef" label-width="120px">
                <el-form-item label="选择家长" prop="selectedParentId">
                  <el-select v-model="billForm.selectedParentId" placeholder="请选择家长" filterable style="width:100%" @change="handleParentChange">
                    <el-option v-for="p in parentList" :key="p.userId" :label="p.username + ' (' + p.phone + ')'" :value="p.userId" />
                  </el-select>
                </el-form-item>
                <el-form-item label="托管儿童" v-if="billForm.selectedParentId">
                  <div class="child-names-box">
                    <el-tag v-for="c in filteredChildList" :key="c.childId" class="mr-5">
                      {{ c.childName }}
                    </el-tag>
                    <span v-if="filteredChildList.length === 0" class="tip">该家长暂无关联儿童</span>
                  </div>
                </el-form-item>
                <el-form-item label="账单月份" prop="billMonth">
                  <el-date-picker v-model="billForm.billMonth" type="month" placeholder="选择月份" value-format="YYYY-MM" style="width:100%" @change="handleMonthChange" />
                </el-form-item>
                <el-form-item label="费用规则" prop="ruleId">
                  <el-select v-model="billForm.ruleId" placeholder="请选择收费标准" style="width:100%" @change="calculateAmount">
                    <el-option v-for="r in activeRules" :key="r.ruleId" :label="r.timeSlot + ' (¥' + r.unitPrice + ')'" :value="r.ruleId" />
                  </el-select>
                </el-form-item>
                <el-form-item label="托管天数" prop="manageDays">
                  <el-input-number v-model="billForm.manageDays" :min="1" :max="31" style="width:100%" @change="calculateAmount" />
                </el-form-item>
                <el-form-item label="优惠规则" prop="discountId">
                  <el-select v-model="billForm.discountId" placeholder="选择优惠规则 (可选)" clearable style="width:100%" @change="calculateAmount">
                    <el-option v-for="d in activeDiscounts" :key="d.discountId" :label="d.discountName" :value="d.discountId" />
                  </el-select>
                </el-form-item>
                <el-form-item label="应付金额">
                  <span class="total-amount">¥{{ billForm.payableAmount }}</span>
                  <span v-if="billForm.discountAmount > 0" class="discount-tip">(已优惠 ¥{{ billForm.discountAmount }})</span>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="generating" @click="submitBill">立即生成账单</el-button>
                  <el-button @click="resetBillForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-col>
            <el-col :span="12">
              <div class="calendar-container">
                <el-calendar v-model="calendarDate">
                  <template #date-cell="{ data }">
                    <div :class="{'is-selected': isCheckinDay(data.day)}">
                      {{ data.day.split('-').slice(2).join('-') }}
                      <div v-if="isCheckinDay(data.day)" class="checkin-dot"></div>
                    </div>
                  </template>
                </el-calendar>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 费用规则弹窗 -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleForm.ruleId ? '修改规则' : '新增规则'" width="500px">
      <el-form :model="ruleForm" :rules="ruleRules" ref="ruleFormRef" label-width="100px">
        <el-form-item label="托管类型" prop="timeSlot">
          <el-input v-model="ruleForm.timeSlot" placeholder="如：全托、日托、临时托管" />
        </el-form-item>
        <el-form-item label="单价" prop="unitPrice">
          <el-input-number v-model="ruleForm.unitPrice" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="生效时间" prop="effectiveTime">
          <el-date-picker v-model="ruleForm.effectiveTime" type="datetime" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">确定</el-button>
      </template>
    </el-dialog>

    <!-- 优惠规则弹窗 -->
    <el-dialog v-model="discountDialogVisible" :title="discountForm.discountId ? '修改优惠' : '新增优惠'" width="500px">
      <el-form :model="discountForm" :rules="discountRules" ref="discountFormRef" label-width="100px">
        <el-form-item label="优惠名称" prop="discountName">
          <el-input v-model="discountForm.discountName" placeholder="如：老生优惠、多孩优惠" />
        </el-form-item>
        <el-form-item label="优惠类型" prop="discountType">
          <el-radio-group v-model="discountForm.discountType">
            <el-radio :label="0">折扣</el-radio>
            <el-radio :label="1">满减</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="discountForm.discountType === 0 ? '折扣比例' : '减免金额'" prop="discountValue">
          <el-input-number v-if="discountForm.discountType === 0" v-model="discountForm.discountValue" :min="0" :max="1" :step="0.01" :precision="2" style="width:100%" />
          <el-input-number v-else v-model="discountForm.discountValue" :min="0" :precision="2" style="width:100%" />
          <div v-if="discountForm.discountType === 0" class="tip">0.9 表示 9 折</div>
        </el-form-item>
        <el-form-item label="有效期" prop="timeRange">
          <el-date-picker
            v-model="discountForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="生效时间"
            end-placeholder="失效时间"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="discountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDiscount">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'
import { useUserStore } from '../../pinia/modules/userStore'

const userStore = useUserStore()
const activeTab = ref('standard')

// ==================== 费用规则 ====================
const feeRuleList = ref([])
const loadingRules = ref(false)
const ruleDialogVisible = ref(false)
const ruleFormRef = ref(null)
const ruleForm = reactive({ ruleId: null, timeSlot: '', unitPrice: 0, effectiveTime: '' })
const ruleRules = {
  timeSlot: [{ required: true, message: '请输入托管类型', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  effectiveTime: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
}

const activeRules = computed(() => feeRuleList.value.filter(r => r.status === 1))

const loadFeeRules = async () => {
  loadingRules.value = true
  try {
    const res = await request.get('/feeRule/list')
    feeRuleList.value = res.data || []
  } catch (e) {
    console.error('加载费用规则失败', e)
  } finally {
    loadingRules.value = false
  }
}

const openRuleDialog = (row) => {
  if (row) {
    Object.assign(ruleForm, row)
  } else {
    Object.assign(ruleForm, { ruleId: null, timeSlot: '', unitPrice: 0, effectiveTime: new Date() })
  }
  ruleDialogVisible.value = true
  nextTick(() => {
    ruleFormRef.value?.clearValidate()
  })
}

const saveRule = async () => {
  await ruleFormRef.value.validate()
  try {
    const adminId = userStore.userInfo.userId
    if (ruleForm.ruleId) {
      await request.put(`/feeRule/update/${ruleForm.ruleId}`, ruleForm)
    } else {
      // 默认失效时间10年后
      const data = { ...ruleForm, invalidTime: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString() }
      await request.post(`/feeRule/add?createById=${adminId}`, data)
    }
    ElMessage.success('保存成功')
    ruleDialogVisible.value = false
    loadFeeRules()
  } catch (e) {
    console.error('保存失败', e)
  }
}

const toggleRuleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.put(`/feeRule/status/${row.ruleId}?status=${newStatus}`)
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用')
    loadFeeRules()
  } catch (e) {
    console.error('更新状态失败', e)
  }
}

// ==================== 优惠规则 ====================
const discountList = ref([])
const loadingDiscounts = ref(false)
const discountDialogVisible = ref(false)
const discountFormRef = ref(null)
const discountForm = reactive({ discountId: null, discountName: '', discountType: 0, discountValue: 1, timeRange: [] })
const discountRules = {
  discountName: [{ required: true, message: '请输入优惠名称', trigger: 'blur' }],
  discountValue: [{ required: true, message: '请输入优惠值', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请选择有效时间', trigger: 'change' }]
}

const activeDiscounts = computed(() => discountList.value.filter(d => d.status === 1))

const loadDiscounts = async () => {
  loadingDiscounts.value = true
  try {
    const res = await request.get('/discountRule/list')
    discountList.value = res.data || []
  } catch (e) {
    console.error('加载优惠规则失败', e)
  } finally {
    loadingDiscounts.value = false
  }
}

const openDiscountDialog = (row) => {
  if (row) {
    Object.assign(discountForm, {
      ...row,
      timeRange: [new Date(row.effectiveTime), new Date(row.invalidTime)]
    })
  } else {
    Object.assign(discountForm, {
      discountId: null,
      discountName: '',
      discountType: 0,
      discountValue: 1,
      timeRange: [new Date(), new Date(new Date().setFullYear(new Date().getFullYear() + 1))]
    })
  }
  discountDialogVisible.value = true
  nextTick(() => {
    discountFormRef.value?.clearValidate()
  })
}

const saveDiscount = async () => {
  await discountFormRef.value.validate()
  try {
    const adminId = userStore.userInfo.userId
    const data = {
      ...discountForm,
      effectiveTime: discountForm.timeRange[0].toISOString(),
      invalidTime: discountForm.timeRange[1].toISOString()
    }
    if (discountForm.discountId) {
      await request.put(`/discountRule/update/${discountForm.discountId}`, data)
    } else {
      await request.post(`/discountRule/add?createById=${adminId}`, data)
    }
    ElMessage.success('保存成功')
    discountDialogVisible.value = false
    loadDiscounts()
  } catch (e) {
    console.error('保存失败', e)
  }
}

const toggleDiscountStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.put(`/discountRule/status/${row.discountId}?status=${newStatus}`)
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用')
    loadDiscounts()
  } catch (e) {
    console.error('更新状态失败', e)
  }
}

// ==================== 生成账单 ====================
const parentList = ref([]) // 家长列表
const allChildList = ref([]) // 所有儿童列表
const filteredChildList = ref([]) // 根据家长筛选后的儿童列表
const calendarDate = ref(new Date()) // 日历当前日期
const checkinDates = ref([]) // 考勤日期列表

const generating = ref(false)
const billFormRef = ref(null)
const billForm = reactive({
  selectedParentId: null, // 新增：选择的家长ID
  childId: null,
  billMonth: '',
  ruleId: null,
  manageDays: 0, // 托管天数初始化为0
  discountId: null,
  payableAmount: 0,
  discountAmount: 0,
  parentId: null
})

const billRules = {
  selectedParentId: [{ required: true, message: '请选择家长', trigger: 'change' }],
  billMonth: [{ required: true, message: '请选择账单月份', trigger: 'change' }],
  ruleId: [{ required: true, message: '请选择费用规则', trigger: 'change' }]
}

// 加载家长列表
const loadParents = async () => {
  try {
    const res = await request.get('/user/role/2') // 2代表家长角色
    parentList.value = res.data || []
  } catch (e) {
    console.error('加载家长列表失败', e)
  }
}

// 加载所有儿童列表
const loadChildren = async () => {
  try {
    const res = await request.get('/child/list')
    allChildList.value = res.data || []
  } catch (e) {
    console.error('加载所有儿童列表失败', e)
  }
}

// 处理家长选择变化
const handleParentChange = (val) => {
  billForm.parentId = val // 更新账单中的parentId
  filteredChildList.value = allChildList.value.filter(c => c.parent?.userId === val)
  
  if (filteredChildList.value.length > 0) {
    billForm.childId = filteredChildList.value[0].childId // 默认选择第一个孩子
  } else {
    billForm.childId = null
  }
  
  resetCalendarAndCheckinDates()
  calculateAmount()
}

// 处理账单月份变化
const handleMonthChange = (val) => {
  if (billForm.childId && val) {
    calendarDate.value = new Date(val) // 更新日历显示月份
    loadCheckinDates()
  } else {
    resetCalendarAndCheckinDates()
  }
  calculateAmount()
}

// 加载考勤日期
const loadCheckinDates = async () => {
  if (!billForm.childId || !billForm.billMonth) {
    checkinDates.value = []
    billForm.manageDays = 0
    return
  }
  try {
    const res = await request.get(`/attendance/child/${billForm.childId}/checkinDates?month=${billForm.billMonth}`)
    checkinDates.value = res.data || []
    billForm.manageDays = checkinDates.value.length // 更新托管天数
    
    // 如果有多个孩子，可以在这里累加天数，或者根据业务逻辑处理
    // 目前保持简单，仅针对选中的（第一个）孩子生成账单
  } catch (e) {
    console.error('加载考勤日期失败', e)
    checkinDates.value = []
    billForm.manageDays = 0
  } finally {
    calculateAmount()
  }
}

// 判断是否为考勤日
const isCheckinDay = (day) => {
  return checkinDates.value.includes(day)
}

// 重置日历和考勤日期
const resetCalendarAndCheckinDates = () => {
  calendarDate.value = new Date()
  checkinDates.value = []
  billForm.manageDays = 0
}

const calculateAmount = () => {
  const rule = feeRuleList.value.find(r => r.ruleId === billForm.ruleId)
  const discount = discountList.value.find(d => d.discountId === billForm.discountId)
  
  if (!rule || billForm.manageDays <= 0) {
    billForm.payableAmount = 0
    billForm.discountAmount = 0
    return
  }

  let baseAmount = rule.unitPrice * billForm.manageDays
  let discountAmount = 0

  if (discount) {
    if (discount.discountType === 0) { // 折扣
      discountAmount = baseAmount * (1 - discount.discountValue)
    } else { // 满减
      discountAmount = discount.discountValue
    }
  }

  billForm.discountAmount = Number(discountAmount.toFixed(2))
  billForm.payableAmount = Number((baseAmount - discountAmount).toFixed(2))
}

const submitBill = async () => {
  await billFormRef.value.validate()
  if (filteredChildList.value.length === 0) {
    return ElMessage.warning('该家长暂无关联儿童，无法生成账单')
  }

  generating.value = true
  try {
    const adminId = userStore.userInfo.userId
    const rule = feeRuleList.value.find(r => r.ruleId === billForm.ruleId)
    
    // 为家长下的每一个孩子生成账单
    for (const child of filteredChildList.value) {
      // 获取每个孩子的考勤天数
      const datesRes = await request.get(`/attendance/child/${child.childId}/checkinDates?month=${billForm.billMonth}`)
      const days = datesRes.data ? datesRes.data.length : 0
      
      if (days === 0) {
        console.warn(`儿童 ${child.childName} 在 ${billForm.billMonth} 无考勤记录，跳过`)
        continue
      }

      // 计算该孩子的金额（重新计算，因为天数可能不同）
      let baseAmount = rule.unitPrice * days
      let discountAmount = 0
      const discount = discountList.value.find(d => d.discountId === billForm.discountId)
      if (discount) {
        discountAmount = discount.discountType === 0 ? baseAmount * (1 - discount.discountValue) : discount.discountValue
      }
      const payableAmount = Number((baseAmount - discountAmount).toFixed(2))

      const deadline = new Date(new Date(billForm.billMonth).setMonth(new Date(billForm.billMonth).getMonth() + 1, 5))
      const data = {
        billMonth: billForm.billMonth,
        manageDays: days,
        timeSlot: rule.timeSlot,
        unitPrice: rule.unitPrice,
        discountAmount: Number(discountAmount.toFixed(2)),
        payableAmount: payableAmount,
        discountId: billForm.discountId,
        paymentDeadline: `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-05 00:00:00`
      }

      let url = `/feeBill/add?childId=${child.childId}&parentId=${billForm.parentId}&createById=${adminId}`
      if (billForm.discountId) {
        url += `&discountId=${billForm.discountId}`
      }
      await request.post(url, data)
    }
    
    ElMessage.success('账单生成成功，家长可即时查看')
    resetBillForm()
  } catch (e) {
    console.error('生成账单失败', e)
  } finally {
    generating.value = false
  }
}

const resetBillForm = () => {
  Object.assign(billForm, {
    selectedParentId: null,
    childId: null,
    billMonth: '',
    ruleId: null,
    manageDays: 0,
    discountId: null,
    payableAmount: 0,
    discountAmount: 0,
    parentId: null
  })
  resetCalendarAndCheckinDates()
  nextTick(() => {
    billFormRef.value?.clearValidate()
  })
}

// ==================== 工具函数 ====================
const formatDateTime = (dt) => {
  if (!dt) return '-'
  return String(dt).replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  loadFeeRules()
  loadDiscounts()
  loadParents() // 加载家长列表
  loadChildren() // 加载所有儿童列表
})
</script>

<style scoped>
.admin-fee-rule { padding: 10px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.total-amount { font-size: 24px; font-weight: bold; color: #F56C6C; margin-right: 10px; }
.discount-tip { color: #909399; font-size: 14px; }
.tip { font-size: 12px; color: #909399; margin-top: 4px; }
.mr-5 { margin-right: 5px; }
.child-names-box { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
</style>