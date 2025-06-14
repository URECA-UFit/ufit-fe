<template>
  <div class="chatbot-review-list-container">
    <CommonHeader title="챗봇 리뷰 내역" />

    <div class="chatbot-review-cards">
      <div
        v-for="review in chatBotReviews"
        :key="review.chatBotReviewId"
        class="chatbot-review-card">
        <!-- 좌측 컬럼 -->
        <div class="review-info">
          <p class="label">질문 요약</p>
          <p class="question">{{ review.questionSummery }}</p>

          <p class="label">추천 요금제</p>
          <p class="plan">{{ review.recommandPlan }}</p>
        </div>

        <!-- 우측 컬럼 -->
        <div class="review-content">
          <div class="stars">
            <!-- ★ 갯수만큼 반복 -->
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

    <div class="pagination">
      <button :disabled="currentPage <= 1" @click="prevPage">이전</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage >= totalPages" @click="nextPage">
        다음
      </button>
      <p class="total-elements">총 {{ totalElements }}개</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import CommonHeader from "@/components/CommonHeader.vue";

const chatBotReviews = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalElements = ref(0);

const fetchChatBotReview = async () => {
  try {
    /* API 완성되면 axios로 api가져올 것! */
    const dummyData = {
      items: [
        {
          chatBotReviewId: 1,
          questionSummery:
            "유튜브 많이보고, 음악 서비스를 구독하고 있는데 앎자는 요금제 추천해줘",
          recommandPlan: "5G 슈퍼 플랜, 5G 함께 플랜",
          rate: 4,
          content: "답변 굿",
        },
        {
          chatBotReviewId: 2,
          questionSummery:
            "유튜브 많이보고, 음악 서비스를 구독하고 있는데 앎자는 요금제 추천해줘",
          recommandPlan: "5G 슈퍼 플랜, 5G 함께 플랜",
          rate: 4,
          content: "답변 굿",
        },
      ],
      page: 1,
      size: 5,
      totalPages: 3,
      totalElements: 30,
    };

    chatBotReviews.value = dummyData.items;
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
    // fetchChatBotReview(); // 실제 API 연동 시 주석 해제
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    // fetchChatBotReview(); // 실제 API 연동 시 주석 해제
  }
};

onMounted(fetchChatBotReview);
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
  ); /* 호버 시 투명도 있는 흰색 배경 */
}

/* 리뷰 카드 목록 */
.chatbot-review-cards {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 40px;
  margin-bottom: 80px; /* FAB 공간 확보 */
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
  align-items: flex-end; /* 판매중과 가격을 하단으로 정렬 */
  flex-grow: 1; /* 카드 내용이 충분히 공간을 차지하도록 */
}

.chatbot-review-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 40px;
}

.chatbot-review-card {
  display: flex;
  flex-direction: row; /* 좌우 배치 */
  gap: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  align-items: flex-start; /* 위쪽 기준 정렬 */
}

.review-info,
.review-content {
  text-align: left; /* 가운데 정렬 해제 */
}

.review-info {
  flex: 2; /* 왼쪽 넓이 비중 */
}

.review-content {
  flex: 1; /* 오른쪽 넓이 비중 */
  border-left: 1px solid #eee; /* 좌측 구분선 */
  padding-left: 20px;
}

/* 레이블 */
.label {
  font-weight: 600;
  margin: 12px 0 4px;
}

/* 일반 텍스트 */
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
  margin-bottom: 5px; /* 할인 요금과의 간격 */
}

.discount-fee {
  font-size: 16px; /* 할인 요금 크게 */
  font-weight: 800;
  color: #999;
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
