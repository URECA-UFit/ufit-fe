<template>
  <div class="chatbot-box">
    <div class="chatbot-header">
      <span>요금제 상담 챗봇</span>
      <button class="chatbot-close" @click="emit('close')">✕</button>
    </div>
    <div class="chatbot-messages">
      <p v-if="loading" class="chatbot-msg">로딩 중...</p>
      <p v-else-if="errorMsg" class="chatbot-msg bot-msg">{{ errorMsg }}</p>
      <template v-else>
        <div
          v-for="(msg, idx) in pastMessages"
          :key="msg.messageId || 'past-' + idx"
          :class="['chatbot-msg', msg.owner ? 'user-msg' : 'bot-msg']"
        >
          {{ msg.content }}
        </div>
        <p class="chatbot-msg bot-msg">안녕하세요! 어떤 요금제를 찾고 계신가요?</p>
        <div
          v-for="(msg, idx) in currentMessages"
          :key="'current-' + idx"
          :class="['chatbot-msg', msg.owner ? 'user-msg' : 'bot-msg']"
        >
          {{ msg.content }}
        </div>
        <div class="chatbot-msg bot-msg">
          <button @click="emit('review')" class="chatbot-review-btn">
            챗봇 리뷰 작성하기
          </button>
        </div>
      </template>
    </div>
    <div class="chatbot-input">
      <input
        type="text"
        v-model="userInput"
        placeholder="메시지를 입력하세요..."
        @keyup.enter="sendMessage"
        :disabled="loading"
        autofocus
      />
      <button @click="sendMessage" :disabled="loading || !userInput.trim()">전송</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch, defineProps, onMounted, onBeforeUnmount, nextTick } from 'vue';
import axios from 'axios';

const emit = defineEmits(['close', 'review']);
const props = defineProps({ openTrigger: Boolean });

const userInput = ref('');
const pastMessages = ref([]);
const currentMessages = ref([]);
const chatRoomId = ref(null);
const isAnonymous = ref(true);
const loading = ref(false);
const nextCursor = ref(null);
const hasNext = ref(false);
const isFetchingPast = ref(false);
const errorMsg = ref('');

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function scrollToBottom() {
  setTimeout(() => {
    const box = document.querySelector('.chatbot-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }, 100);
}

function scrollToPrev(prevHeight) {
  nextTick(() => {
    const box = document.querySelector('.chatbot-messages');
    if (box) box.scrollTop = box.scrollHeight - prevHeight;
  });
}

async function fetchMorePastMessages() {
  if (!hasNext.value || isFetchingPast.value) return;
  isFetchingPast.value = true;
  try {
    const accessToken = getAccessToken();
    const { data: messagesPage } = await axios.get(
      `/api/chats/${chatRoomId.value}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { lastMessageId: nextCursor.value }
      }
    );
    if (messagesPage.item && messagesPage.item.length > 0) {
      const box = document.querySelector('.chatbot-messages');
      const prevHeight = box ? box.scrollHeight : 0;
      pastMessages.value = [...messagesPage.item.reverse(), ...pastMessages.value];
      scrollToPrev(prevHeight);
    }
    nextCursor.value = messagesPage.nextCursor;
    hasNext.value = messagesPage.hasNext;
  } catch (e) {
    errorMsg.value = '과거 메시지 불러오기 실패';
  }
  isFetchingPast.value = false;
}

async function openChatbot() {
  loading.value = true;
  errorMsg.value = '';
  pastMessages.value = [];
  currentMessages.value = [];
  nextCursor.value = null;
  hasNext.value = false;
  isFetchingPast.value = false;
  try {
    const accessToken = getAccessToken();
    const { data: room } = await axios.post('/api/chats/rooms', {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    chatRoomId.value = room.chatRoomId;
    isAnonymous.value = room.isAnonymous;

    if (!room.isAnonymous) {
      const { data: messagesPage } = await axios.get(
        `/api/chats/${room.chatRoomId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (messagesPage.item) {
        pastMessages.value = [...messagesPage.item].reverse();
      }
      nextCursor.value = messagesPage.nextCursor;
      hasNext.value = messagesPage.hasNext;
    }
  } catch (e) {
    errorMsg.value = '챗봇 서버와 통신에 실패했습니다.';
    pastMessages.value = [];
  }
  loading.value = false;
  scrollToBottom();
}

watch(() => props.openTrigger, (val) => {
  if (val) openChatbot();
});

function sendMessage() {
  if (!userInput.value.trim()) return;
  currentMessages.value.push({ content: userInput.value, owner: true });
  userInput.value = '';
  scrollToBottom();
}

function onScroll(e) {
  if (e.target.scrollTop === 0) {
    fetchMorePastMessages();
  }
}

onMounted(() => {
  const box = document.querySelector('.chatbot-messages');
  if (box) box.addEventListener('scroll', onScroll);
});
onBeforeUnmount(() => {
  const box = document.querySelector('.chatbot-messages');
  if (box) box.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
.chatbot-box {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 360px;
  max-width: 95vw;
  height: 540px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
  border: 1.5px solid #f3e6f9;
}

.chatbot-header {
  background: linear-gradient(90deg, #fa3d8f 0%, #a259c6 100%);
  color: white;
  padding: 18px 22px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(250,61,143,0.08);
  border-bottom: none;
}

.chatbot-close {
  background: none;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
  padding: 0 5px;
  transition: color 0.2s;
}
.chatbot-close:hover {
  color: #ffd6e8;
}

.chatbot-messages {
  flex: 1;
  padding: 20px 18px 10px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8f7fa;
  scrollbar-width: none;
}
.chatbot-messages::-webkit-scrollbar { display: none; }

.chatbot-msg {
  max-width: 80%;
  padding: 12px 18px;
  border-radius: 18px;
  font-size: 15px;
  line-height: 1.6;
  box-shadow: 0 2px 8px rgba(160,89,198,0.07);
  margin-bottom: 2px;
  word-break: break-word;
}

.user-msg {
  align-self: flex-end;
  background: #f5f7fb; 
  color: #333;
  border: 1px solid #e1e4ec;
}

.bot-msg {
  align-self: flex-start;
  background: #fff;
  color: #333;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 18px;
  border: 1px solid #f3e6f9;
}

.chatbot-review-btn {
  background-color: #fa3d8f;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  margin-top: 4px;
  transition: background 0.2s;
  box-shadow: 0 2px 8px rgba(250,61,143,0.08);
}
.chatbot-review-btn:hover {
  background-color: #e0186f;
}

.chatbot-input {
  padding: 16px 18px;
  border-top: 1px solid #f3e6f9;
  background: #fff;
  display: flex;
  gap: 10px;
}
.chatbot-input input {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid #e1e4ec;
  border-radius: 20px;
  font-size: 15px;
  outline: none;
  background: #f8f7fa;
  transition: border 0.2s;
}
.chatbot-input input:focus {
  border: 1.5px solid #a259c6;
}
.chatbot-input button {
  background: linear-gradient(90deg, #fa3d8f 0%, #a259c6 100%);
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.chatbot-input button:hover {
  background: linear-gradient(90deg, #a259c6 0%, #fa3d8f 100%);
}
</style>
