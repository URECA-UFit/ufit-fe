<template>
  <div class="rate-plan-list-container">
    <CommonHeader title="5G/LTE 요금제 목록" />

    <div class="sort-buttons">
      <button @click="sortByPrice('PRICE_ASC')" :class="{ 'active': sortType === 'PRICE_ASC' }">
        낮은 가격순
      </button>
      <button @click="sortByPrice('PRICE_DESC')" :class="{ 'active': sortType === 'PRICE_DESC' }">
        높은 가격순
      </button>
    </div>

    <div class="rate-plan-cards">
      <div
        v-for="plan in ratePlans"
        :key="plan.id"
        class="rate-plan-card"
        @click="goToDetail(plan.id)"
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
import { ref, onMounted, onActivated } from "vue";
import { useRouter } from "vue-router";
import ChatbotReviewModal from "@/components/ChatbotReviewModal.vue";
import Chatbot from "@/components/ChatbotComponent.vue";
import CommonHeader from "@/components/CommonHeader.vue";
import api from '@/api/axiosInstance';

const router = useRouter();
const showChatbot = ref(false);
const showReviewModal = ref(false);
const chatbotOpenTrigger = ref(false);
const sortType = ref('PRICE_ASC'); 

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
    const { data } = await api.get('/api/rateplans/storages', {
      params: {
        page: currentPage.value - 1,
        size: 5,
        sortType: sortType.value 
      }
    });
    ratePlans.value = data.content;
    totalPages.value = data.totalPages;
    totalElements.value = data.totalElements;
    console.log('API 응답 데이터:', data.content);
  } catch (e) {

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
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchRatePlans();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchRatePlans();
  }
};

const sortByPrice = (type) => {
  sortType.value = type;
  fetchRatePlans(); 
};

onMounted(() => {
  fetchRatePlans();
});

onActivated(() => {

  if (ratePlans.value.length === 0) {
    fetchRatePlans();
  }
});
</script>

<style scoped>

.rate-plan-list-container {
  padding: 0;
  font-family: "Pretendard", sans-serif;
  position: relative;
  background-color: #f0f2f5;
  min-height: 100vh;
}

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

.auth-button {
  padding: 10px 20px;
  border: 1px solid white;
  border-radius: 8px;
  background-color: transparent; 
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

.rate-plan-cards {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 40px;
  margin-bottom: 80px; 
}

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
  transform: translateY(-5px); 
}

.card-header {
  margin-bottom: 15px;
  position: relative; 
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
  margin-bottom: 0.2em; 
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

.fee-section {
  display: flex;
  flex-direction: column; 
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

.sort-buttons {
  display: flex;
  justify-content: flex-end; 
  padding: 0 40px 20px; 
  gap: 10px; 
}

.sort-buttons button {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.sort-buttons button:hover {
  background-color: #e0e0e0;
}

.sort-buttons button.active {
  background-color: #e0186f; 
  color: white;
  border-color: #e0186f;
}
</style>
