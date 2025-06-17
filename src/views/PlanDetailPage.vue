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
      <div class="plan-card">
        <div class="plan-card-title">데이터</div>
        <div class="plan-card-content">{{ plan.dataAllowance || '-' }}</div>
      </div>
      <div class="plan-card">
        <div class="plan-card-title">공유 데이터</div>
        <div class="plan-card-content">{{ plan.shareData || plan.dataSharing || '-' }}</div>
      </div>
      <div class="plan-card">
        <div class="plan-card-title">음성통화</div>
        <div class="plan-card-content">{{ plan.voiceAllowance || '-' }}</div>
      </div>
      <div class="plan-card">
        <div class="plan-card-title">문자메시지</div>
        <div class="plan-card-content">{{ plan.smsAllowance || '-' }}</div>
      </div>
      <div class="plan-card">
        <div class="plan-card-title">기본혜택</div>
        <div class="plan-card-content">{{ plan.basicBenefit?.basic_benefit || '-' }}</div>
      </div>
    </div>
    <!-- 하단 회색 영역 -->
    <div class="plan-detail-bottom"></div>
    <!-- 버튼/챗봇 -->
    <button class="floating-action-button" @click="handleMascotClick">
      <img class="mascot-img" src="@/assets/mascot.png" alt="UFit 마스코트" />
    </button>
    <Chatbot
      v-if="showChatbot"
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
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
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

const handleMascotClick = () => {
  showChatbot.value = !showChatbot.value;
};

const goToReviewPage = () => {
  showReviewModal.value = true;
};

const handleReviewSubmit = (review) => {
  console.log("리뷰 제출됨:", review);
  // TODO: 실제 API로 리뷰 전송
};

const formatCurrency = (amount) => {
  return amount ? amount.toLocaleString("ko-KR") : "-";
};

onMounted(async () => {
  try {
    const rateplanId = route.params.rateplanId
    console.log('PlanDetailPage mounted with rateplanId:', rateplanId);
    console.log('API 데이터 호출 시도 중 (PlanDetailPage):', `/api/rateplans/storages/${rateplanId}`);
    // 실제 API 연동
    const { data } = await axios.get(`/api/rateplans/storages/${rateplanId}`)
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
  width: 100vw;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  background: #fff;
  font-family: "Pretendard", sans-serif;
}
.plan-detail-pink {
  position: absolute;               
  width: 100%;
  height: 60vh;
  left: 0;
  top: 0;
  background: rgba(230, 2, 126, 0.7);
  min-height: 350px;
}
.plan-detail-title {
  position: absolute;
  left: 6vw;
  top: 9vh;
  font-size: 2.8rem;
  font-weight: 700;
  color: #000;
}
.plan-detail-desc {
  position: absolute;
  left: 6vw;
  top: 15vh;
  font-size: 1.2rem;
  color: #000;
}
.plan-detail-line {
  position: absolute;
  left: 6vw;
  top: 23vh;
  width: 88vw;
  border-bottom: 2px solid #797070;
}
.plan-detail-fee {
  position: absolute;
  right: 6vw;
  top: 10vh;
  font-size: 2rem;
  font-weight: 700;
  color: #000;
}
.plan-detail-discount {
  position: absolute;
  right: 6vw;
  top: 15vh;
  font-size: 1.2rem;
  color: #000;
}
.plan-card-row {
  position: absolute;
  left: 0;
  top: 28vh;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 2vw;
  z-index: 2;
  padding-left: 6vw;
}
.plan-card {
  background: #e6027e;
  border-radius: 1.2rem;
  width: 13vw;
  min-width: 150px;
  max-width: 220px;
  height: 22vh;
  min-height: 140px;
  max-height: 250px;
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
  word-break: keep-all;
}
.plan-detail-bottom {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 28vh;
  min-height: 180px;
  background: rgba(217, 217, 217, 0.4);
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
</style>
