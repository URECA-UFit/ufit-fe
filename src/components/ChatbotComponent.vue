<template>
  <div class="chatbot-box">
    <div class="chatbot-header">
      <span>요금제 상담 챗봇</span>
      <button class="chatbot-close" @click="emit('close')">✕</button>
    </div>
    <div class="chatbot-messages">
      <p v-if="errorMsg" class="chatbot-msg bot-msg">{{ errorMsg }}</p>
      <template v-else>
        <template v-for="(msg, idx) in pastMessages" :key="msg.messageId || 'past-' + idx">
          <div :class="['chatbot-msg', msg.owner ? 'user-msg' : 'bot-msg']">
            <div v-if="msg.isLoading" v-html="msg.content"></div>
            <div v-else-if="msg.isRecommendation">
              <template v-for="(part, partIndex) in splitContentWithRecommendations(msg.content)" :key="partIndex">
                <div v-if="part.type === 'text'">{{ part.content }}</div>
                <div v-else-if="part.type === 'recommendations'" class="recommendation-plans">
                  <div 
                    v-for="plan in msg.recommendedPlans" 
                    :key="plan.planId"
                    class="plan-card"
                    @click="handlePlanClick(plan)"
                  >
                    <div class="plan-name">{{ plan.name }}</div>
                  </div>
                </div>
              </template>
            </div>
            <div v-else>{{ msg.content }}</div>
          </div>
          <div v-if="!msg.owner && msg.isRecommendation" class="chatbot-msg bot-msg">
            <button @click="openReviewModal(msg)" class="chatbot-review-btn">
              챗봇 리뷰 작성하기
            </button>
        </div>
        </template>
        <p v-if="!loading" class="chatbot-msg bot-msg">안녕하세요! 어떤 요금제를 찾고 계신가요?</p>
        <template v-for="(msg, idx) in currentMessages" :key="'current-' + idx">
          <div :class="['chatbot-msg', msg.owner ? 'user-msg' : 'bot-msg']">
            <div v-if="msg.isLoading" v-html="msg.content"></div>
            <div v-else-if="msg.isRecommendation">
              <template v-for="(part, partIndex) in splitContentWithRecommendations(msg.content)" :key="partIndex">
                <div v-if="part.type === 'text'">{{ part.content }}</div>
                <div v-else-if="part.type === 'recommendations'" class="recommendation-plans">
                  <div 
                    v-for="plan in msg.recommendedPlans" 
                    :key="plan.planId"
                    class="plan-card"
                    @click="handlePlanClick(plan)"
                  >
                    <div class="plan-name">{{ plan.name }}</div>
                  </div>
                </div>
              </template>
            </div>
            <div v-else>{{ msg.content }}</div>
        </div>

          <div v-if="!msg.owner && msg.isRecommendation" class="chatbot-msg bot-msg">
            <button @click="openReviewModal(msg)" class="chatbot-review-btn">
            챗봇 리뷰 작성하기
          </button>
        </div>
        </template>
        <p v-if="loading" class="chatbot-msg bot-msg loading-bubble">
          <span class="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>


        <ChatbotReviewModal
          v-if="showReviewModal"
          :chatRoomId="chatRoomId"
          :recommendationMessageId="getMessageId(currentReviewMessage)"
          :recommendPlans="getRecommendPlans(currentReviewMessage)"
          @close="closeReviewModal"
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
const currentReviewMessage = ref(null);
const answerType = ref('');

const openReviewModal = (message) => {
  currentReviewMessage.value = message;
  showReviewModal.value = true;
};

const closeReviewModal = () => {
  showReviewModal.value = false;
  currentReviewMessage.value = null;
};

const getRecommendPlans = (message) => {

  if (!message || !message.recommendedPlans || message.recommendedPlans.length === 0) {
    return {};
  }
  
  const plans = {};
  if (message.recommendedPlans[0]) {
    const firstPlan = message.recommendedPlans[0];
    plans.aPlan = firstPlan.name || firstPlan.planName || firstPlan.title || '알 수 없는 요금제';
  }
  if (message.recommendedPlans[1]) {
    const secondPlan = message.recommendedPlans[1];
    plans.bPlan = secondPlan.name || secondPlan.planName || secondPlan.title || '알 수 없는 요금제';
  }

  return plans;
};

const getMessageId = (message) => {
  const result = message?.messageId || '';

  return result;
};

const handleReviewSubmit = () => {

  closeReviewModal();
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

function splitContentWithRecommendations(content) {
  if (!content || !content.includes('[[RECOMMENDATION_LIST]]')) {
    return [{ type: 'text', content: content }];
  }
  
  const parts = content.split('[[RECOMMENDATION_LIST]]');
  const result = [];

  if (parts[0]) {
    result.push({ type: 'text', content: parts[0] });
  }
  
  result.push({ type: 'recommendations' });
  
  if (parts[1]) {
    result.push({ type: 'text', content: parts[1] });
  }
  
  return result;
}

function handlePlanClick(plan) {
  const planId = plan.planId;
  
  if (planId) {
    window.location.href = `/rateplan/storage/${planId}`;
  } 
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

      const processedMessages = messagesPage.item.map(msg => {

        const hasValidRecommendation = msg.recommendPlans && 
                                      msg.recommendPlans.length > 0 && 
                                      msg.recommendPlans[0].planId && 
                                      msg.recommendPlans[0].planId !== "";
        
        return {
          ...msg,
          isRecommendation: hasValidRecommendation,
          recommendedPlans: hasValidRecommendation ? msg.recommendPlans : []
        };
      });
      pastMessages.value = [...processedMessages.reverse(), ...pastMessages.value];
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
        
        const processedMessages = messagesPage.item.map(msg => {

          const hasValidRecommendation = msg.recommendPlans && 
                                        msg.recommendPlans.length > 0 && 
                                        msg.recommendPlans[0].planId && 
                                        msg.recommendPlans[0].planId !== "";
          
          return {
            ...msg,
            isRecommendation: hasValidRecommendation,
            recommendedPlans: hasValidRecommendation ? msg.recommendPlans : []
          };
        });
        pastMessages.value = [...processedMessages].reverse();
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


    // 봇 응답 메시지 추가
    const hasValidRecommendation = response.answerType === 'RECOMMEND' && 
                                   response.recommendPlans && 
                                   response.recommendPlans.length > 0;

    currentMessages.value.push({
      content: response.answer,
      owner: false,
      messageId: response.messageId,
      isLoading: false,
      isRecommendation: hasValidRecommendation,
      recommendedPlans: hasValidRecommendation ? response.recommendPlans : [],
      answerType: response.answerType
    });

    // 스크롤을 최하단으로 이동
    await nextTick();
    scrollToBottom();
  } catch (error) {

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

const handleAuthChange = () => {
  emit('close');
};

const handleStorageChange = (event) => {
  if (event.key === 'accessToken' && event.newValue === null) {
    emit('close');
  }
};

onMounted(() => {
  const box = document.querySelector('.chatbot-messages');
  if (box) box.addEventListener('scroll', onScroll);
  
  window.addEventListener('userLogout', handleAuthChange);
  window.addEventListener('userLogin', handleAuthChange);
  window.addEventListener('storage', handleStorageChange);
});

onBeforeUnmount(() => {
  const box = document.querySelector('.chatbot-messages');
  if (box) box.removeEventListener('scroll', onScroll);
  
  window.removeEventListener('userLogout', handleAuthChange);
  window.removeEventListener('userLogin', handleAuthChange);
  window.removeEventListener('storage', handleStorageChange);
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
