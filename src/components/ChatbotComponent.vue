<template>
  <div class="chatbot-box">
    <div class="chatbot-header">
      <span>요금제 상담 챗봇</span>
      <button class="chatbot-close" @click="emit('close')">✕</button>
    </div>
    <div class="chatbot-messages">
      <p v-if="errorMsg" class="chatbot-msg bot-msg">{{ errorMsg }}</p>
      <template v-else>
        <div
          v-for="(msg, idx) in pastMessages"
          :key="msg.messageId || 'past-' + idx"
          :class="['chatbot-msg', msg.owner ? 'user-msg' : 'bot-msg']"
        >
          <div v-if="msg.isLoading" v-html="msg.content"></div>
          <div v-else>{{ msg.content }}</div>
        </div>
        <p v-if="!loading" class="chatbot-msg bot-msg">안녕하세요! 어떤 요금제를 찾고 계신가요?</p>
        <div
          v-for="(msg, idx) in currentMessages"
          :key="'current-' + idx"
          :class="['chatbot-msg', msg.owner ? 'user-msg' : 'bot-msg']"
        >
          <div v-if="msg.isLoading" v-html="msg.content"></div>
          <div v-else-if="msg.isRecommendation">
            <div>{{ msg.content }}</div>
            <div v-if="msg.recommendedPlans && msg.recommendedPlans.length > 0" class="recommendation-plans">
              <div 
                v-for="plan in msg.recommendedPlans" 
                :key="plan.aPlanID || plan.bPlanID"
                class="plan-card"
                @click="handlePlanClick(plan)"
              >
                <div class="plan-name">{{ plan.name }}</div>
              </div>
            </div>
          </div>
          <div v-else>{{ msg.content }}</div>
        </div>
        <p v-if="loading" class="chatbot-msg bot-msg loading-bubble">
          <span class="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        <div v-if="!loading && answerType === 'RECOMMEND'" class="chatbot-msg bot-msg">
          <button @click="showReviewModal = true" class="chatbot-review-btn">
            챗봇 리뷰 작성하기
          </button>
        </div>

        <ChatbotReviewModal
          v-if="showReviewModal"
          @close="showReviewModal = false"
          @submit="handleReviewSubmit"
        />
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
import api from '@/api/axiosInstance';
import ChatbotReviewModal from '@/components/ChatbotReviewModal.vue';

const emit = defineEmits(['close']);
const props = defineProps({ openTrigger: Boolean });

const showReviewModal = ref(false);
const answerType = ref('');
const handleReviewSubmit = (review) => {
  console.log('리뷰 제출됨:', review);
  // TODO: API로 리뷰 전송
};

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

function processRecommendationMessage(content) {
  // [[RECOMMENDATION_LIST]]를 추천 요금제 리스트로 대체
  return content.replace('[[RECOMMENDATION_LIST]]', '');
}

function handlePlanClick(plan) {
  // 요금제 ID 매핑 (aPlanID 또는 bPlanID를 rateplanId로 사용)
  const rateplanId = plan.aPlanID || plan.bPlanID;
  
  // PlanDetailPage로 이동
  // Vue Router를 사용한다고 가정
  window.location.href = `/plan-detail/${rateplanId}`;
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
    const { data: messagesPage } = await api.get(
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
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const { data: room } = await api.post('/api/chats/rooms', {}, { headers }); 
    
    chatRoomId.value = room.chatRoomId;
    isAnonymous.value = room.isAnonymous;
    answerType.value = room.answerType || '';

    if (!room.isAnonymous) {
      const { data: messagesPage } = await api.get(
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

const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value || !chatRoomId.value) return;

  const message = userInput.value.trim();
  userInput.value = '';
  loading.value = true;

  try {
    const accessToken = getAccessToken();
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

    // 사용자 메시지를 먼저 표시
    currentMessages.value.push({
      content: message,
      owner: true,
      messageId: null
    });

    // 스크롤을 최하단으로 이동
    await nextTick();
    scrollToBottom();

    const { data: response } = await api.post('/api/chats/message', {
      content: message,
      chatRoomId: chatRoomId.value
    }, { headers });

    // 추천 응답 처리
    let processedContent = response.answer;
    let currentRecommendedPlans = [];
    
    if (response.answerType === 'RECOMMEND' && response.recommandPlans) {
      processedContent = processRecommendationMessage(response.answer);
      currentRecommendedPlans = response.recommandPlans;
    }

    // 봇 응답 메시지 추가
    currentMessages.value.push({
      content: processedContent,
      owner: false,
      messageId: response.messageId,
      isLoading: false,
      isRecommendation: response.answerType === 'RECOMMEND',
      recommendedPlans: currentRecommendedPlans
    });

    // 스크롤을 최하단으로 이동
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('메시지 전송 중 오류 발생:', error);
    const errorMessage = error.response?.data?.message || '메시지 전송에 실패했습니다. 다시 시도해주세요.';
    
    currentMessages.value.push({
      content: errorMessage,
      owner: false,
      messageId: null,
      isLoading: false
    });
    
    await nextTick();
    scrollToBottom();
  } finally {
    loading.value = false;
  }
};

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
  white-space: pre-wrap;
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
  white-space: pre-wrap;
  text-align: left;
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

.loading-dots {
  display: inline-block;
  font-size: 3em;
}

.loading-dots span {
  animation: cumulative-blink 1.5s infinite step-start;
  background: linear-gradient(45deg, #e0186f, #ff8a00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

@keyframes cumulative-blink {
  0%, 20% { opacity: 0; }
  40% { opacity: 1; }
  60% { opacity: 1; }
  80%, 100% { opacity: 1; }
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.5s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 1s;
}

.loading-bubble {
  padding: 6px 12px !important;
  line-height: 1 !important;
  min-height: auto !important;
}

.recommendation-plans {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-card {
  background: linear-gradient(45deg, #fa3d8f, #ff6bb3);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(250, 61, 143, 0.2);
}

.plan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(250, 61, 143, 0.3);
}

.plan-name {
  font-weight: 600;
  font-size: 15px;
  text-align: center;
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
