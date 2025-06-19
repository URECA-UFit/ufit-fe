<template>
  <div class="chatbot-review-list-container">
    <AdminMenuBar />
    <CommonHeader title="챗봇 리뷰 내역" />

    <div class="chatbot-review-cards">
      <div
        v-for="review in chatBotReviews"
        :key="review.chatBotReviewId"
        class="chatbot-review-card">
        <div class="review-info">
          <p class="label">질문 요약</p>
          <p class="question">{{ review.questionSummary }}</p>

          <p class="label">추천 요금제</p>
          <p class="plan">{{ review.recommendPlan }}</p>
        </div>

        <div class="review-content">
          <div class="stars">
            <span v-for="n in review.rate" :key="`star-on-${n}`">★</span>
            <span
              v-for="n in 5 - review.rate"
              :key="`star-off-${n}`"
              class="off"
              >☆</span
            >
          </div>
          <p class="content">{{ review.content }}</p>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-indicator">
      데이터 로딩 중...
    </div>
    <div v-if="!hasNext && !isLoading && chatBotReviews.length > 0" class="end-of-list">
      더 이상 리뷰가 없습니다.
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import CommonHeader from "@/components/CommonHeader.vue";
import AdminMenuBar from '@/components/AdminMenuBar.vue'
import api from '@/api/axiosInstance';

const chatBotReviews = ref([]);
const cursor = ref(null);
const hasNext = ref(true);
const pageSize = 5;
const isLoading = ref(false); 
const fetchChatBotReview = async () => {
  console.log('fetchChatBotReview 호출됨'); // 디버깅용
  
  if (isLoading.value || !hasNext.value) {
    return;
  }

  isLoading.value = true;

  try {
    const token = localStorage.getItem("accessToken");
    const params = { size: pageSize };
    if (cursor.value) {
      params.cursor = cursor.value; 
    }

    console.log('API 호출 직전: 토큰 및 파라미터', { token, params });

    const res = await api.get("/api/admin/chats/reviews", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params // params 객체를 전달
    });
  
    chatBotReviews.value = [...chatBotReviews.value, ...res.data.item];

    cursor.value = res.data.cursor;
    hasNext.value = res.data.hasNext;

  } catch (e) {
    console.error("API 오류:", e); 
  
  } finally {
    isLoading.value = false; 
  }
};

const handleScroll = () => {

  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;

  console.log(`scrollTop: ${scrollTop}, clientHeight: ${clientHeight}, scrollHeight: ${scrollHeight}`);
  if (scrollTop + clientHeight >= scrollHeight - 100) {

    fetchChatBotReview(); 
  }
};

onMounted(() => {
  fetchChatBotReview(); 
  window.addEventListener('scroll', handleScroll); 
});

</script>

<style scoped>
/* 전체 컨테이너 및 배경 */
.chatbot-review-list-container {
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
  ); 
}

/* 리뷰 카드 목록 */
.chatbot-review-cards {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 40px;
  /* margin-bottom: 80px; FAB 공간 확보 */
}

/* 각 리뷰 카드 */
.chatbot-review-card {
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

.chatbot-review-card:hover {
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
  align-items: flex-end;
  flex-grow: 1;
}

.chatbot-review-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 40px;
}

.chatbot-review-card {
  display: flex;
  flex-direction: row; 
  margin-right: 300px;
  gap: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  align-items: flex-start; /* 위쪽 기준 정렬 */
}

.review-info,
.review-content {
  text-align: left;
}

.review-info {
  flex: 2; 
}

.review-content {
  flex: 1; 
  border-left: 1px solid #eee; 
  padding-left: 20px;
}

.label {
  font-weight: 600;
  margin: 12px 0 4px;
}

.text {
  margin-bottom: 12px;
  line-height: 1.5;
  color: #333;
}

/* 별점 */
.stars {
  font-size: 18px;
  color: #f5a623;
  margin-bottom: 8px;
}
.stars .off {
  color: #ddd;
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
  margin-bottom: 5px; 
}

.discount-fee {
  font-size: 16px; 
  font-weight: 800;
  color: #999;
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
