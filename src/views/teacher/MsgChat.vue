<!-- 
  模块：【老师-家校沟通】
  功能：家长消息查看、一对一聊天、班级公告发布、家长留言回复、消息已读回执
-->
<template>
  <div class="teacher-msg-chat">
    <el-row :gutter="20" style="height:100%;">
      <!-- 左侧：联系人列表 -->
      <el-col :span="6" style="height:100%;">
        <el-card style="height:100%;">
          <template #header>
            <div class="card-header">
              <span>联系人</span>
              <el-button type="primary" size="small" @click="showAnnouncementDialog">
                <el-icon><Bell /></el-icon>
                发公告
              </el-button>
            </div>
          </template>

          <!-- 搜索框 -->
          <el-input
            v-model="searchKeyword"
            placeholder="搜索家长姓名"
            :prefix-icon="'Search'"
            class="mb-15"
          />

          <!-- 联系人列表 -->
          <el-scrollbar height="calc(100vh - 280px)">
            <div
              v-for="contact in filteredContacts"
              :key="contact.id"
              class="contact-item"
              :class="{ active: currentContact?.id === contact.id }"
              @click="selectContact(contact)"
            >
              <el-badge :value="contact.unreadCount" :hidden="contact.unreadCount === 0">
                <el-avatar :size="45" :src="contact.avatar">
                  {{ contact.name.charAt(0) }}
                </el-avatar>
              </el-badge>
              <div class="contact-info">
                <div class="contact-name">{{ contact.name }}</div>
                <div class="contact-last-msg">{{ contact.lastMessage }}</div>
              </div>
              <div class="contact-time">{{ contact.lastTime }}</div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>

      <!-- 右侧：聊天区域 -->
      <el-col :span="18" style="height:100%;">
        <el-card style="height:100%;" v-if="currentContact">
          <template #header>
            <div class="chat-header">
              <div>
                <h3>{{ currentContact.name }}</h3>
                <span class="child-info">孩子：{{ currentContact.childName }} ({{ currentContact.className }})</span>
              </div>
              <el-button type="text" @click="viewParentInfo">查看家长信息</el-button>
            </div>
          </template>

          <!-- 消息列表 -->
          <el-scrollbar height="calc(100vh - 400px)" ref="messageScrollbar">
            <div class="message-list">
              <div
                v-for="msg in currentMessages"
                :key="msg.id"
                class="message-item"
                :class="msg.sender === 'teacher' ? 'message-right' : 'message-left'"
              >
                <el-avatar :size="40" :src="msg.avatar">
                  {{ msg.senderName.charAt(0) }}
                </el-avatar>
                <div class="message-content">
                  <div class="message-info">
                    <span class="sender-name">{{ msg.senderName }}</span>
                    <span class="message-time">{{ msg.time }}</span>
                  </div>
                  <div class="message-bubble" v-if="msg.type === 'text'">
                    {{ msg.content }}
                  </div>
                  <el-image
                    v-else-if="msg.type === 'image'"
                    :src="msg.content"
                    fit="cover"
                    style="width:200px;height:200px;border-radius:8px;"
                    :preview-src-list="[msg.content]"
                  />
                  <div class="message-status" v-if="msg.sender === 'teacher'">
                    <el-icon v-if="msg.status === 'read'" color="#67C23A"><Check /></el-icon>
                    <el-icon v-else color="#909399"><Clock /></el-icon>
                    {{ msg.status === 'read' ? '已读' : '未读' }}
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>

          <!-- 输入区域 -->
          <div class="input-area">
            <div class="input-toolbar">
              <el-upload
                action="/api/upload/chat"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleImageUpload"
                accept="image/*"
              >
                <el-button type="text" :icon="'Picture'">图片</el-button>
              </el-upload>
            </div>
            <el-input
              v-model="messageInput"
              type="textarea"
              :rows="3"
              placeholder="输入消息内容..."
              @keydown.enter.ctrl="sendMessage"
            />
            <div class="input-actions">
              <span class="tip">Ctrl + Enter 发送</span>
              <el-button type="primary" @click="sendMessage">发送</el-button>
            </div>
          </div>
        </el-card>

        <!-- 未选择联系人时的提示 -->
        <el-card style="height:100%;" v-else>
          <el-empty description="请选择一个联系人开始聊天" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 发布公告弹窗 -->
    <el-dialog v-model="announcementDialogVisible" title="发布班级公告" width="600px">
      <el-form :model="announcementForm" :rules="announcementRules" ref="announcementFormRef" label-width="100px">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="announcementForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="接收班级" prop="classIds">
          <el-select v-model="announcementForm.classIds" multiple placeholder="请选择班级" style="width:100%">
            <el-option label="大一班" value="1" />
            <el-option label="大二班" value="2" />
            <el-option label="中一班" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="announcementForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
          />
        </el-form-item>
        <el-form-item label="重要程度">
          <el-radio-group v-model="announcementForm.level">
            <el-radio label="normal">普通</el-radio>
            <el-radio label="important">重要</el-radio>
            <el-radio label="urgent">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="announcementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="publishAnnouncement">发布</el-button>
      </template>
    </el-dialog>

    <!-- 家长信息弹窗 -->
    <el-dialog v-model="parentInfoDialogVisible" title="家长信息" width="500px">
      <el-descriptions :column="1" border v-if="currentContact">
        <el-descriptions-item label="家长姓名">{{ currentContact.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentContact.phone }}</el-descriptions-item>
        <el-descriptions-item label="孩子姓名">{{ currentContact.childName }}</el-descriptions-item>
        <el-descriptions-item label="所在班级">{{ currentContact.className }}</el-descriptions-item>
        <el-descriptions-item label="关系">{{ currentContact.relation }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, Check, Clock } from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 联系人列表
const contacts = ref([
  {
    id: 1,
    name: '张爸爸',
    childName: '张小宝',
    className: '大一班',
    phone: '13800138001',
    relation: '父亲',
    avatar: '',
    lastMessage: '孩子今天表现怎么样？',
    lastTime: '10:30',
    unreadCount: 2
  },
  {
    id: 2,
    name: '李妈妈',
    childName: '李小贝',
    className: '大一班',
    phone: '13800138002',
    relation: '母亲',
    avatar: '',
    lastMessage: '好的，谢谢老师',
    lastTime: '昨天',
    unreadCount: 0
  },
  {
    id: 3,
    name: '王爸爸',
    childName: '王小丫',
    className: '大一班',
    phone: '13800138003',
    relation: '父亲',
    avatar: '',
    lastMessage: '明天请假一天',
    lastTime: '周一',
    unreadCount: 1
  }
])

// 过滤后的联系人
const filteredContacts = computed(() => {
  if (!searchKeyword.value) return contacts.value
  return contacts.value.filter(c =>
    c.name.includes(searchKeyword.value) || c.childName.includes(searchKeyword.value)
  )
})

// 当前选中的联系人
const currentContact = ref(null)

// 当前聊天消息
const currentMessages = ref([])

// 消息滚动容器
const messageScrollbar = ref(null)

// 消息输入
const messageInput = ref('')

// 上传请求头
const uploadHeaders = ref({
  'Authorization': 'Bearer ' + localStorage.getItem('token') || ''
})

// 公告弹窗
const announcementDialogVisible = ref(false)
const announcementFormRef = ref(null)
const announcementForm = reactive({
  title: '',
  classIds: [],
  content: '',
  level: 'normal'
})
const announcementRules = ref({
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  classIds: [{ required: true, message: '请选择接收班级', trigger: 'change' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
})

// 家长信息弹窗
const parentInfoDialogVisible = ref(false)

// 选择联系人
const selectContact = (contact) => {
  currentContact.value = contact
  contact.unreadCount = 0
  
  // 加载聊天记录
  currentMessages.value = [
    {
      id: 1,
      sender: 'parent',
      senderName: contact.name,
      avatar: contact.avatar,
      type: 'text',
      content: '老师您好，孩子今天表现怎么样？',
      time: '09:30',
      status: 'read'
    },
    {
      id: 2,
      sender: 'teacher',
      senderName: '王老师',
      avatar: '',
      type: 'text',
      content: '您好！孩子今天表现很好，积极参与课堂活动，和小朋友相处融洽。',
      time: '10:15',
      status: 'read'
    },
    {
      id: 3,
      sender: 'parent',
      senderName: contact.name,
      avatar: contact.avatar,
      type: 'text',
      content: '那就好，谢谢老师！',
      time: '10:30',
      status: 'read'
    }
  ]
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 发送消息
const sendMessage = () => {
  if (!messageInput.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  const newMessage = {
    id: Date.now(),
    sender: 'teacher',
    senderName: '王老师',
    avatar: '',
    type: 'text',
    content: messageInput.value,
    time: new Date().toLocaleTimeString().slice(0, 5),
    status: 'unread'
  }
  
  currentMessages.value.push(newMessage)
  messageInput.value = ''
  
  // 更新联系人最后消息
  if (currentContact.value) {
    currentContact.value.lastMessage = newMessage.content
    currentContact.value.lastTime = newMessage.time
  }
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
  
  ElMessage.success('消息发送成功')
}

// 图片上传成功
const handleImageUpload = (response) => {
  if (response.code === 200) {
    const newMessage = {
      id: Date.now(),
      sender: 'teacher',
      senderName: '王老师',
      avatar: '',
      type: 'image',
      content: response.data.url,
      time: new Date().toLocaleTimeString().slice(0, 5),
      status: 'unread'
    }
    
    currentMessages.value.push(newMessage)
    
    // 更新联系人最后消息
    if (currentContact.value) {
      currentContact.value.lastMessage = '[图片]'
      currentContact.value.lastTime = newMessage.time
    }
    
    nextTick(() => {
      scrollToBottom()
    })
    
    ElMessage.success('图片发送成功')
  } else {
    ElMessage.error('图片上传失败')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageScrollbar.value) {
    const scrollElement = messageScrollbar.value.$el.querySelector('.el-scrollbar__wrap')
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  }
}

// 显示公告弹窗
const showAnnouncementDialog = () => {
  announcementDialogVisible.value = true
}

// 发布公告
const publishAnnouncement = () => {
  announcementFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('公告发布成功！')
      announcementDialogVisible.value = false
      
      // 重置表单
      Object.assign(announcementForm, {
        title: '',
        classIds: [],
        content: '',
        level: 'normal'
      })
    }
  })
}

// 查看家长信息
const viewParentInfo = () => {
  parentInfoDialogVisible.value = true
}
</script>

<style scoped>
.teacher-msg-chat {
  padding: 20px;
  height: calc(100vh - 100px);
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb-15 {
  margin-bottom: 15px;
}

/* 联系人列表 */
.contact-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s;
  position: relative;
}

.contact-item:hover {
  background: #f5f7fa;
}

.contact-item.active {
  background: #ecf5ff;
}

.contact-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.contact-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.contact-last-msg {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-time {
  font-size: 12px;
  color: #909399;
  position: absolute;
  top: 12px;
  right: 12px;
}

/* 聊天区域 */
.chat-header h3 {
  margin: 0 0 5px 0;
}

.child-info {
  font-size: 14px;
  color: #909399;
}

.message-list {
  padding: 20px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
}

.message-item.message-right {
  flex-direction: row-reverse;
}

.message-content {
  margin: 0 12px;
  max-width: 60%;
}

.message-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.message-right .message-info {
  flex-direction: row-reverse;
}

.sender-name {
  margin-right: 8px;
}

.message-right .sender-name {
  margin-right: 0;
  margin-left: 8px;
}

.message-bubble {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-break: break-word;
}

.message-right .message-bubble {
  background: #409EFF;
  color: #fff;
}

.message-status {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

/* 输入区域 */
.input-area {
  border-top: 1px solid #e6e6e6;
  padding-top: 15px;
}

.input-toolbar {
  margin-bottom: 10px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.tip {
  font-size: 12px;
  color: #909399;
}
</style>