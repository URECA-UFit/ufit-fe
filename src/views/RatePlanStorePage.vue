<template>
  <div class="rate-plan-list-container">
    <header class="list-header">
      <h1>5G/LTE 요금제 목록</h1>
      <button
        class="auth-button"
        @click="isLoggedIn ? handleLogout() : router.push('/login')"
      >
        {{ isLoggedIn ? "로그아웃" : "로그인" }}
      </button>
    </header>

    <div class="rate-plan-cards">
      <div
        v-for="plan in ratePlans"
        :key="plan.ratePlanId"
        class="rate-plan-card"
        @click="goToDetail(plan.ratePlanId)"
      >
        <div class="card-header">
          <h2
            class="plan-name"
            v-html="plan.planName.replace('\\n', '<br>')"
          ></h2>
          <p class="plan-summary">{{ plan.summary }}</p>
        </div>
        <div class="card-body">
          <div class="fee-section">
            <span class="monthly-fee"
              >월 {{ formatCurrency(plan.monthlyFee) }}원</span
            >
            <span class="discount-fee"
              >약정할인 월 {{ formatCurrency(plan.discountFee) }}원</span
            >
          </div>
        </div>
      </div>
    </div>

    <button class="floating-action-button" @click="handleMascotClick">
      <img class="mascot-img" src="@/assets/mascot.png" alt="UFit 마스코트" />
    </button>

    <Chatbot
      v-if="showChatbot"
      :openTrigger="chatbotOpenTrigger"
      @close="showChatbot = false"
      @review="goToReviewPage"
    />

    <div class="pagination">
      <button :disabled="currentPage <= 1" @click="prevPage">이전</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage >= totalPages" @click="nextPage">
        다음
      </button>
      <p class="total-elements">총 {{ totalElements }}개</p>
    </div>
    <ChatbotReviewModal
      v-if="showReviewModal"
      @close="showReviewModal = false"
      @submit="handleReviewSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios"; // axios 추가
import ChatbotReviewModal from "@/components/ChatbotReviewModal.vue";
import Chatbot from "@/components/ChatbotComponent.vue";

const router = useRouter();
const isLoggedIn = ref(false);
const showChatbot = ref(false);
const showReviewModal = ref(false);
const chatbotOpenTrigger = ref(false);

// 컴포넌트 마운트 시 로그인 상태 확인
onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem("accessToken");
});

// 로그아웃 핸들러
const handleLogout = async () => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    await axios.post(
      "/api/auth/logout",
      {},
      {
        headers: {
          // 'Authorization' 헤더에 'Bearer ' 접두사와 함께 가져온 토큰 값을 사용합니다.
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error("로그아웃 중 오류 발생:", error);
  } finally {
    localStorage.removeItem("accessToken"); // Access Token 제거
    isLoggedIn.value = false; // 로그인 상태 업데이트
    router.push("/login"); // 로그인 페이지로 리다이렉트
  }
};

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

const handleReviewSubmit = (review) => {
  console.log("리뷰 제출됨:", review);
  // TODO: 실제 API로 리뷰 전송
};

const goToDetail = (rateplanId) => {
  console.log('goToDetail called with rateplanId:', rateplanId);
  router.push({ name: 'PlanDetail', params: { rateplanId } });
};

const ratePlans = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalElements = ref(0);

const formatCurrency = (amount) => {
  return amount.toLocaleString("ko-KR");
};

const fetchRatePlans = async () => {
  try {
    /* API 완성되면 axios로 api가져올 것! */
    const dummyData = {
      items: [
        {
          ratePlanId: 1,
          planName: "5G 프리미어 에센셜\n테더링+쉐어링",
          summary: "5G 프리미어 에센셜",
          monthlyFee: 80000,
          discountFee: 56000,
        },
        {
          ratePlanId: 2,
          planName: "5G 프리미어 레귤러\n테더링",
          summary: "5G 프리미어 레귤러",
          monthlyFee: 75000,
          discountFee: 46000,
        },
      ],
      page: 1,
      size: 5,
      totalPages: 3,
      totalElements: 30,
    };

    ratePlans.value = dummyData.items;
    currentPage.value = dummyData.page;
    totalPages.value = dummyData.totalPages;
    totalElements.value = dummyData.totalElements;
  } catch (e) {
    console.error("API 오류", e);
    // 실제 API 연동 시 에러 처리 로직 추가
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    // fetchRatePlans(); // 실제 API 연동 시 주석 해제
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    // fetchRatePlans(); // 실제 API 연동 시 주석 해제
  }
};

onMounted(fetchRatePlans);
</script>

<style scoped>
/* 전체 컨테이너 및 배경 */
.rate-plan-list-container {
  padding: 0;
  font-family: "Pretendard", sans-serif;
  position: relative;
  background-color: #f0f2f5;
  min-height: 100vh;
}

/* 헤더 */
.list-header {
  background-color: #e0186f;
  color: white;
  padding: 45px 40px;
  margin-bottom: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h1 {
  font-size: 28px;
  margin: 0;
  font-weight: 700;
}

/* 로그인/로그아웃 버튼 */
.auth-button {
  padding: 10px 20px;
  border: 1px solid white;
  border-radius: 8px;
  background-color: transparent; /* 투명 배경 */
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.auth-button:hover {
  background-color: rgba(
    255,
    255,
    255,
    0.2
  ); /* 호버 시 투명도 있는 흰색 배경 */
}

/* 요금제 카드 목록 */
.rate-plan-cards {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 40px;
  margin-bottom: 80px; /* FAB 공간 확보 */
}

/* 각 요금제 카드 */
.rate-plan-card {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: none;
  transition: transform 0.2s ease;
  margin-bottom: 20px;
}

.rate-plan-card:hover {
  transform: translateY(-5px); /* 호버 시 약간 위로 */
}

.card-header {
  margin-bottom: 15px;
  position: relative; /* 뱃지 위치 조정을 위해 */
}

.plan-name {
  font-size: 20px;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 5px;
  line-height: 1.4;
  color: #333;
}

.plan-name ::v-deep(br) {
  content: "";
  display: block;
  margin-bottom: 0.2em; /* 줄바꿈 시 간격 */
}

.plan-summary {
  font-size: 15px;
  color: #777;
  margin-top: 0;
  margin-bottom: 10px;
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end; /* 판매중과 가격을 하단으로 정렬 */
  flex-grow: 1; /* 카드 내용이 충분히 공간을 차지하도록 */
}

.fee-section {
  display: flex;
  flex-direction: column; /* 월 요금과 할인 요금을 세로로 정렬 */
  align-items: flex-start;
}

.monthly-fee {
  font-size: 22px;
  color: #e0186f;
  font-weight: 500;
  margin-bottom: 5px; /* 할인 요금과의 간격 */
}

.discount-fee {
  font-size: 16px; /* 할인 요금 크게 */
  font-weight: 800;
  color: #999;
}

/* 마스코트 버튼 */
.floating-action-button {
  position: fixed;
  bottom: 25px; /* 챗봇 박스와 겹치지 않도록 조정 */
  right: 40px; /* 챗봇 박스와 겹치지 않도록 조정 */
  border: none;
  background: none;
  z-index: 1001; /* 챗봇 박스 위에 표시 */
  cursor: pointer;
  padding: 0; /* 패딩 제거 */
}

.floating-action-button .mascot-img {
  width: 70px; /* 이미지 크기 조정 */
  height: auto;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); /* 마스코트 이미지에 그림자 */
  border-radius: 50%; /* 마스코트 이미지 둥글게 */
}

.floating-action-button:hover .mascot-img {
  transform: scale(1.1);
}

/* 챗봇 박스 */
.chatbot-box {
  position: fixed;
  bottom: 105px; /* 마스코트 버튼 바로 위 (마스코트 높이 + 여백) */
  right: 40px; /* 마스코트 버튼과 정렬 */
  width: 700px;
  height: 530px;
  background-color: #fff;
  border-radius: 16px; /* 모든 모서리를 둥글게 */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  font-family: "Pretendard", sans-serif;
  animation: slideInUp 0.3s ease-out; /* 등장 애니메이션 */
}

.chatbot-header {
  background-color: #e0186f;
  color: white;
  padding: 12px 16px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 14px 14px 0 0; /* 상단 모서리만 둥글게 */
}

.chatbot-header span {
  font-size: 16px;
}

.chatbot-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px; /* X 아이콘 크기 키움 */
  cursor: pointer;
  padding: 0 5px;
}

.chatbot-messages {
  flex-grow: 1; /* 메시지 영역이 남은 공간을 차지 */
  padding: 12px;
  overflow-y: auto;
  font-size: 14px;
  color: #333;
  background-color: #f9f9f9; /* 메시지 배경색 */
  display: flex; /* 메시지를 정렬하기 위해 flexbox */
  flex-direction: column; /* 세로로 메시지 쌓기 */
}

.chatbot-msg {
  background-color: #ffeaf4;
  color: #333;
  padding: 10px 14px;
  border-radius: 12px;
  margin: 8px 0; /* 메시지 간 간격 */
  align-self: flex-start; /* 기본적으로 왼쪽 정렬 */
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

.chatbot-review-btn {
  background-color: #fa3d8f;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.chatbot-review-btn:hover {
  background-color: #e0186f;
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

/* 챗봇 등장 애니메이션 */
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

/* Pagination Styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 30px;
  padding-bottom: 30px;
}

.pagination button {
  padding: 10px 18px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #555;
  transition: background-color 0.2s, border-color 0.2s;
}

.pagination button:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #bbb;
}

.pagination button:disabled {
  color: #aaa;
  border-color: #eee;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.pagination span {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.total-elements {
  font-size: 14px;
  color: #777;
  margin-left: 15px;
}
</style>
