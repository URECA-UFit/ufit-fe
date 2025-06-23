<template>
  <div class="plan-detail-bg">
    <div class="plan-detail-pink"></div>
    <div class="plan-detail-title">{{ plan.planName }}</div>
    <div class="plan-detail-desc">{{ plan.summary }}</div>
    <div class="plan-detail-line"></div>
    <div class="plan-detail-fee">
      월 {{ formatCurrency(plan.monthlyFee) }}원
    </div>
    <div class="plan-detail-discount">
      약정 할인 시 월 {{ formatCurrency(plan.discountFee) }}원
    </div>
    <!-- 카드 5개 -->
    <div class="plan-card-row">
      <div class="plan-card" v-if="showDataCard">
        <div class="plan-card-title">데이터</div>
        <div class="plan-card-content">{{ plan.dataAllowance }}</div>
      </div>
      <div class="plan-card" v-if="showVoiceCard">
        <div class="plan-card-title">음성통화</div>
        <div class="plan-card-content">{{ plan.voiceAllowance }}</div>
      </div>
      <div class="plan-card" v-if="showSmsCard">
        <div class="plan-card-title">문자메시지</div>
        <div class="plan-card-content">{{ plan.smsAllowance }}</div>
      </div>
    </div>
    <div class="plan-detail-bottom"></div>
    <!-- 혜택 안내 영역을 페이지의 가장 마지막에 위치, 배경색을 흰색으로 변경 -->
    <div v-if="showBenefitSection" class="plan-benefit-section">
      <div class="benefit-title">혜택 안내</div>
      <div class="benefit-list">
        <div v-if="hasBasicBenefit" class="benefit-item">
          <span class="benefit-label">기본혜택</span>
          <span class="benefit-content">{{ plan.basicBenefit.basic_benefit }}</span>
        </div>
        <div v-if="hasSpecialBenefit" class="benefit-item">
          <span class="benefit-label">특별혜택</span>
          <span class="benefit-content" v-html="parsedSpecialBenefit"></span>
        </div>
        <div v-if="hasDiscountBenefit" class="benefit-item">
          <span class="benefit-label">할인혜택</span>
          <span class="benefit-content" v-html="parsedDiscountBenefit"></span>
        </div>
      </div>
    </div>
    <!-- 버튼/챗봇 -->
    <button class="floating-action-button" @click="handleMascotClick">
      <img class="mascot-img" src="@/assets/mascot.png" alt="UFit 마스코트" />
    </button>
    <Chatbot
      v-if="showChatbot"
      :openTrigger="chatbotOpenTrigger"
      @close="showChatbot = false"
      @review="goToReviewPage"
    />
    <ChatbotReviewModal
      v-if="showReviewModal"
      @close="showReviewModal = false"
      @submit="handleReviewSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import api from "@/api/axiosInstance";
import ChatbotReviewModal from "@/components/ChatbotReviewModal.vue";
import Chatbot from "@/components/ChatbotComponent.vue";

const route = useRoute();

// 예시 하드코딩 데이터
const examplePlan = {
  planName: "5G 프리미엄",
  summary: "U⁺5G 서비스를 마음껏 즐길 수 있는 5G 요금제",
  monthlyFee: 85000,
  discountFee: 58000,
  dataAllowance: "무제한",
  shareData: "테더링+쉐어링 70GB",
  voiceAllowance: "집/이동전화 무제한",
  smsAllowance: "기본제공",
  basicBenefit: "U+ 모바일tv 기본 월정액 무료",
};

const plan = ref({ ...examplePlan });
const showChatbot = ref(false);
const showReviewModal = ref(false);
const chatbotOpenTrigger = ref(false);

const handleMascotClick = () => {
  showChatbot.value = !showChatbot.value;
  if (showChatbot.value) {
    chatbotOpenTrigger.value = false;
    setTimeout(() => { chatbotOpenTrigger.value = true; }, 0);
  }
};

const goToReviewPage = () => {
  showReviewModal.value = true;
};

const handleReviewSubmit = () => {
  console.log("리뷰 제출됨");
  // TODO: 실제 API로 리뷰 전송
};

const formatCurrency = (amount) => {
  return amount ? amount.toLocaleString("ko-KR") : "-";
};

// 값이 유효한지 (null, undefined, 빈 문자열이 아닌지) 확인하는 헬퍼
const isValid = (value) => value !== null && value !== undefined && value.toString().trim() !== '';

const showDataCard = computed(() => isValid(plan.value.dataAllowance));
const showVoiceCard = computed(() => isValid(plan.value.voiceAllowance));
const showSmsCard = computed(() => isValid(plan.value.smsAllowance));

const parsedDiscountBenefit = computed(() => {
  const raw = plan.value.discountBenefit;
  if (!raw) return '';
  
  if (typeof raw === 'string') {
    return raw.split('/').map(s => s.trim()).join('<br/>');
  }
  // discountBenefit이 객체이고, discount_benefit 키가 문자열이면 출력
  if (typeof raw === 'object' && typeof raw.discount_benefit === 'string') {
    return raw.discount_benefit.split('/').map(s => s.trim()).join('<br/>');
  }
  return '';
});

const parsedSpecialBenefit = computed(() => {
  const raw = plan.value.specialBenefit;
  if (!raw || typeof raw.special_benefit !== 'string') return '';
  return raw.special_benefit.split('/').map(s => s.trim()).join('<br/>');
});

const hasBasicBenefit = computed(() => {
  const raw = plan.value.basicBenefit;
  return raw && typeof raw.basic_benefit === 'string' && raw.basic_benefit.trim() !== '';
});
const hasSpecialBenefit = computed(() => {
  const raw = plan.value.specialBenefit;
  return raw && typeof raw.special_benefit === 'string' && raw.special_benefit.trim() !== '';
});
const hasDiscountBenefit = computed(() => {
  const raw = plan.value.discountBenefit;
  if (!raw) return false;
  if (typeof raw === 'string') return raw.trim() !== '';
  if (typeof raw === 'object' && typeof raw.discount_benefit === 'string') return raw.discount_benefit.trim() !== '';
  return false;
});
const showBenefitSection = computed(() => hasBasicBenefit.value || hasSpecialBenefit.value || hasDiscountBenefit.value);

onMounted(async () => {
  try {
    const rateplanId = route.params.rateplanId
    console.log('PlanDetailPage mounted with rateplanId:', rateplanId);
    console.log('API 데이터 호출 시도 중 (PlanDetailPage):', `/api/rateplans/storages/${rateplanId}`);
    // 실제 API 연동
    const { data } = await api.get(`/api/rateplans/storages/${rateplanId}`)
    console.log('API response:', data);
    plan.value = data
  } catch (e) {
    console.error('API 오류:', e)
    // 실패 시 하드코딩 데이터 사용
    plan.value = { ...examplePlan }
  }
});
</script>

<style scoped>
.plan-detail-bg {
  width: 100%;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  background: #fff;
  font-family: "Pretendard", sans-serif;
  overflow-x: hidden;
}
.plan-detail-pink {
  position: absolute;               
  width: 100%;
  height: 70vh;
  left: 0;
  top: 0;
  background: linear-gradient(to bottom, rgba(255, 228, 225, 0.7), rgba(255, 192, 203, 0.7)); /* 더 연하고 입체적인 그라데이션 핑크 */
  min-height: 400px;
}
.plan-detail-title {
  position: absolute;
  left: 12vw;
  top: 12vh;
  font-size: 2.8rem;
  font-weight: 700;
  color: #000;
}
.plan-detail-desc {
  position: absolute;
  left: 12vw;
  top: 21vh;
  font-size: 1.2rem;
  color: #000;
  max-width: 76vw;
  word-break: keep-all;
  white-space: normal;
  text-align: left;
}
.plan-detail-line {
  position: absolute;
  left: 12vw;
  top: 28vh;
  width: 76vw;
  border-bottom: 2px solid #797070;
}
.plan-detail-fee {
  position: absolute;
  right: 12vw;
  top: 13vh;
  font-size: 2rem;
  font-weight: 700;
  color: #000;
}
.plan-detail-discount {
  position: absolute;
  right: 12vw;
  top: 18vh;
  font-size: 1.2rem;
  color: #000;
}
.plan-card-row {
  position: absolute;
  top: 35vh;
  width: auto;
  margin-left: 12vw;
  display: flex;
  justify-content: flex-start;
  gap: 2vw;
  z-index: 2;
  padding-left: 0;
}
.plan-card {
  background: #FFF0F5; /* 그라데이션 없이 정말정말 연한 핑크 (LavenderBlush) */
  border-radius: 1.2rem;
  width: 13vw;
  min-width: 150px;
  max-width: 220px;
  height: 13vw;
  min-height: 150px;

  max-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.2rem 1.4rem;
  box-sizing: border-box;
  text-align: left;
}
.plan-card-title,
.plan-card-content {
  text-align: left;
  width: 100%;
}
.plan-card-title {
  font-size: 1rem;
  color: #000;
  margin-bottom: 0.7rem;
}
.plan-card-content {
  font-size: 1.3rem;
  font-weight: 700;
  color: #000;
  word-break: break-word;
  white-space: pre-line;
  overflow-wrap: break-word;
  overflow-y: auto;
  max-height: 100%;
}
.plan-detail-bottom {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 15vh;
  min-height: 100px;
  background: #fff;
  z-index: 1;
}
/* 챗봇/문어 버튼 스타일 */
.floating-action-button {
  position: fixed;
  bottom: 25px;
  right: 40px;
  border: none;
  background: none;
  z-index: 1001;
  cursor: pointer;
  padding: 0;
}
.floating-action-button .mascot-img {
  width: 70px;
  height: auto;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border-radius: 50%;
}
.floating-action-button:hover .mascot-img {
  transform: scale(1.1);
}
.chatbot-box {
  position: fixed;
  bottom: 105px;
  right: 40px;
  width: 700px;
  height: 530px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  font-family: "Pretendard", sans-serif;
  animation: slideInUp 0.3s ease-out;
}
.chatbot-header {
  background-color: #e0186f;
  color: white;
  padding: 12px 16px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 14px 14px 0 0;
}
.chatbot-header span {
  font-size: 16px;
}
.chatbot-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0 5px;
}
.chatbot-messages {
  flex-grow: 1;
  padding: 12px;
  overflow-y: auto;
  font-size: 14px;
  color: #333;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
}
.chatbot-msg {
  background-color: #ffeaf4;
  color: #333;
  padding: 10px 14px;
  border-radius: 12px;
  margin: 8px 0;
  align-self: flex-start;
  max-width: 85%;
  word-wrap: break-word;
  line-height: 1.4;
  font-size: 14px;
}
.chatbot-input {
  display: flex;
  border-top: 1px solid #eee;
  padding: 10px;
  background-color: #fff;
}
.chatbot-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  margin-right: 8px;
}
.chatbot-input button {
  padding: 8px 16px;
  background-color: #e0186f;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.chatbot-input button:hover {
  background-color: #c0155e;
}
@keyframes slideInUp {
  from {
    transform: translateY(20px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
.plan-benefit-section {
  width: 90vw;
  left: 0;
  right: 0;
  margin: 0 auto;
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  padding: 1.2rem 1.5rem;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: absolute;
  bottom: 3vh;
  z-index: 10;
  max-height: 20vh;
  overflow-y: auto;

}
.benefit-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  color: #e0186f;
}
.benefit-list {
  width: 100%;
}
.benefit-item {
  margin-bottom: 0.8rem;
  display: flex;
  align-items: flex-start;
}
.benefit-label {
  font-weight: 600;
  color: #e0186f;
  margin-right: 1rem;
  min-width: 80px;
}
.benefit-content {
  color: #222;
  font-size: 1.1rem;
  word-break: break-word;
  text-align: left;
}
</style>
