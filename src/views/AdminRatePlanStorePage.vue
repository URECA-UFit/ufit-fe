<template>
  <div class="rate-plan-list-container">
    <AdminMenuBar />
    <CommonHeader title="관리자용 5G/LTE 요금제 목록" />

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
          <div class="action-section">
            <button 
              class="sales-status-button" 
              :class="{ 'selling': plan.isSelling, 'not-selling': !plan.isSelling }"
              @click.stop="toggleSalesStatus(plan.ratePlanId)"
            >
              {{ plan.isSelling ? '판매중' : '판매종료' }}
            </button>
            <button class="delete-button" @click.stop="handleDeleteClick">
              <img class="trash_can-img" src="@/assets/trash_can.png" alt="삭제" />
            </button>
          </div>
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
import CommonHeader from "@/components/CommonHeader.vue";
import AdminMenuBar from '@/components/AdminMenuBar.vue'

const router = useRouter();

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
          isSelling: true,
        },
        {
          ratePlanId: 2,
          planName: "5G 프리미어 레귤러\n테더링",
          summary: "5G 프리미어 레귤러",
          monthlyFee: 75000,
          discountFee: 46000,
          isSelling: false,
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

const toggleSalesStatus = (ratePlanId) => {
  const plan = ratePlans.value.find(p => p.ratePlanId === ratePlanId);
  if (plan) {
    plan.isSelling = !plan.isSelling;
    console.log(`요금제 ${ratePlanId} 판매 상태 변경: ${plan.isSelling ? '판매중' : '판매종료'}`);
    // TODO: 실제 API로 상태 변경 요청
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
  margin-right: 300px;
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
  position: relative; /* 삭제 버튼 위치 조정을 위해 */
  width: 100%; /* 전체 너비 사용 */
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

/* 판매 상태 섹션 */
.action-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.sales-status-button {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px; /* 가로 길이 증가 */
  text-align: center;
  flex-grow: 1; /* 남은 공간을 차지하도록 */
}

.sales-status-button.selling {
  background-color: #4CAF50;
  color: white;
}

.sales-status-button.selling:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.sales-status-button.not-selling {
  background-color: #f44336;
  color: white;
}

.sales-status-button.not-selling:hover {
  background-color: #da190b;
  transform: translateY(-1px);
}

/* 삭제 버튼 스타일 */
.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  flex-shrink: 0; /* 크기 고정 */
}

.delete-button:hover {
  background-color: #f0f0f0;
}

.trash_can-img {
  width: 40px; /* 이미지 크기 줄임 */
  height: 40px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-button:hover .trash_can-img {
  opacity: 1;
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