<template>
  <div class="rate-plan-list-container">
    <AdminMenuBar />
    <CommonHeader title="관리자용 5G/LTE 요금제 목록" />

    <div class="sort-buttons">
      <button @click="sortByPrice('lowestPrice')" :class="{ 'active': sortType === 'lowestPrice' }">
        낮은 가격순
      </button>
      <button @click="sortByPrice('highestPrice')" :class="{ 'active': sortType === 'highestPrice' }">
        높은 가격순
      </button>
      <button @click="sortByPrice('')" :class="{ 'active': sortType === '' }">
        기본순
      </button>
    </div>

    <div v-if="isLoading && ratePlansLength === 0" class="loading-container">
      <div class="loading-spinner"></div>
      <p>요금제 목록을 불러오는 중...</p>
    </div>

    <div v-if="ratePlansLength > 0" class="rate-plan-cards" ref="scrollContainer">
      <div
        v-for="(plan, index) in ratePlans"
        :key="`plan-${plan.ratePlanId || plan.id || index}`"
        class="rate-plan-card"
        :class="{ 'disabled': !plan.isEnabled, 'deleted': plan.isDeleted }"
        @click="plan.isEnabled && !plan.isDeleted ? goToDetail(plan.ratePlanId || plan.id) : null"
      >
        <div class="card-header">
          <h2
            class="plan-name"
            v-html="plan.planName ? plan.planName.replace('\\n', '<br>') : '제목 없음'"
          ></h2>
          <p class="plan-summary">{{ plan.summary || '요약 없음' }}</p>
        </div>
        <div class="card-body">
          <div class="fee-section">
            <span class="monthly-fee"
              >월 {{ formatCurrency(plan.monthlyFee || 0) }}원</span
            >
            <span class="discount-fee"
              >약정할인 월 {{ formatCurrency(plan.discountFee || 0) }}원</span
            >
          </div>
          <div class="action-section">
            <button 
              class="sales-status-button" 
              :class="{ 'selling': plan.isEnabled, 'not-selling': !plan.isEnabled }"
              @click.stop="toggleSalesStatus(plan.ratePlanId || plan.id)"
              :disabled="plan.isDeleted"
            >
              {{ plan.isEnabled ? '판매중' : '판매종료' }}
            </button>
            <button 
              class="delete-button" 
              :class="{ 'active': !plan.isEnabled && !plan.isDeleted, 'deleted': plan.isDeleted }"
              @click.stop="handleDeleteClick(plan.ratePlanId || plan.id)"
              :disabled="plan.isEnabled || plan.isDeleted"
            >
              {{ plan.isDeleted ? '삭제완료' : '삭제하기' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="isLoadingMore" class="loading-more">
        <div class="loading-spinner-small"></div>
        <p>더 많은 요금제를 불러오는 중...</p>
      </div>

      <div v-if="!hasMoreData && ratePlansLength > 0" class="no-more-data">
        <p>모든 요금제를 불러왔습니다.</p>
      </div>
    </div>

    <div v-else-if="!isLoading" class="empty-state">
      <p>등록된 요금제가 없습니다.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onActivated, onDeactivated, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import CommonHeader from "@/components/CommonHeader.vue";
import AdminMenuBar from '@/components/AdminMenuBar.vue'
import api from '@/api/axiosInstance';

function getAccessToken() {
    return localStorage.getItem('accessToken');
}

const router = useRouter();

const goToDetail = (rateplanId) => {
  if (!rateplanId) {
    console.error('rateplanId가 없습니다');
    return;
  }
  
  try {
    router.push({ name: 'PlanDetail', params: { rateplanId } });
  } catch (error) {
    console.error('라우터 이동 실패:', error);
  }
};

const ratePlans = ref([]);
const lastCursor = ref(null);
const isLoading = ref(false);
const isLoadingMore = ref(false);
const hasMoreData = ref(true);
const scrollContainer = ref(null);
const sortType = ref('');
const scrollPosition = ref(0);
const scrollTimeout = ref(null); 
const autoLoadTimer = ref(null); 

const ratePlansLength = computed(() => {
  return ratePlans.value ? ratePlans.value.length : 0;
});

const formatCurrency = (amount) => {
  return amount.toLocaleString("ko-KR");
};

const getDynamicSize = () => {
  const width = window.innerWidth;
  

  if (width >= 2560) {
    return 8; 
  } else if (width >= 1920) {
    return 6;
  } else {
    return 5; 
  }
};

const fetchRatePlans = async (isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
    ratePlans.value = [];
    lastCursor.value = null;
  }

  try {
    const accessToken = getAccessToken();
    const params = {
      size: getDynamicSize()
    };

    if (sortType.value && sortType.value !== '') {
      params.type = sortType.value;
    }

    if (isLoadMore && lastCursor.value != null && lastCursor.value !== '') {
      params.cursor = String(lastCursor.value);
    }

    const response = await api.get(`/api/admin/rateplans`, {
      params,
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const data = response.data;
    
    let newItems = [];
    if (Array.isArray(data)) {
      newItems = data;
    } else if (data && Array.isArray(data.item)) {
      newItems = data.item;
    } else if (data && Array.isArray(data.content)) {
      newItems = data.content;
    } else if (data && Array.isArray(data.items)) {
      newItems = data.items;
    } else if (data && typeof data === 'object') {
      for (const key in data) {
        if (Array.isArray(data[key])) {
          newItems = data[key];
          break;
        }
      }
    }
    
    let hasNext = false;
    if (data && typeof data === 'object') {
      hasNext = data.hasNext || data.hasNextPage || data.hasMore || false;
    }
    
    if (isLoadMore) {
      ratePlans.value = [...ratePlans.value, ...newItems];
    } else {
      ratePlans.value = newItems;
    }
    
    hasMoreData.value = hasNext;

    if (data && typeof data === 'object' && data.nextCursor) {
      lastCursor.value = data.nextCursor;
    } else {
      lastCursor.value = null;
    }

    await nextTick();
    autoLoadMoreIfNeeded();

  } catch (error) {
    if (error.response?.status === 500) {
      lastCursor.value = null;
      hasMoreData.value = false;
      
      if (isLoadMore) {
        console.log('추가 로드 중 500 에러, 더 이상 로드하지 않음');
      } else {
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } else {
      alert('요금제 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
    }
  } finally {
    if (isLoadMore) {
      isLoadingMore.value = false;
    } else {
      isLoading.value = false;
    }
  }
};

const checkScrollability = () => {
  if (!scrollContainer.value) return false;
  
  const container = scrollContainer.value;
  const hasScroll = container.scrollHeight > container.clientHeight;
  
  console.log('Scrollability check:', {
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
    hasScroll,
    containerHeight: container.offsetHeight
  });
  
  return hasScroll;
};

const autoLoadMoreIfNeeded = () => {
  if (!checkScrollability() && hasMoreData.value && !isLoadingMore.value) {
    
    if (autoLoadTimer.value) {
      clearTimeout(autoLoadTimer.value);
    }
    
    autoLoadTimer.value = setTimeout(() => {
      if (!checkScrollability() && hasMoreData.value && !isLoadingMore.value) {
        loadMoreData();
      }
    }, 1000);
  }
};

const handleScroll = () => {
  if (!scrollContainer.value || isLoadingMore.value || !hasMoreData.value) {
    return;
  }

  if (!checkScrollability()) {

    autoLoadMoreIfNeeded();
    return;
  }

  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value);
  }

  scrollTimeout.value = setTimeout(() => {
    const container = scrollContainer.value;
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

  
    if (scrollTop >= scrollHeight - clientHeight - 300) {
      loadMoreData();
    }
  }, 50); 
};

const loadMoreData = async () => {
  if (isLoadingMore.value || !hasMoreData.value) return;
  
  if (!lastCursor.value) {
    return;
  }
  
  await fetchRatePlans(true);
};

const setupScrollListener = async () => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll);
    
  } else {
    console.log('스크롤 컨테이너를 찾을 수 없음');
  }
};

const removeScrollListener = () => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll);
  }
};

const toggleSalesStatus = async (ratePlanId) => {
  const plan = ratePlans.value.find(p => (p.ratePlanId || p.id) === ratePlanId);
  if (!plan) return;

  try {
    const accessToken = getAccessToken();

    await api.patch(`/api/admin/rateplans/${ratePlanId}`, {
      isEnabled: !plan.isEnabled
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    plan.isEnabled = !plan.isEnabled;
    
    alert(`요금제가 ${plan.isEnabled ? '판매중' : '판매종료'} 상태로 변경되었습니다.`);
    
  } catch (error) {
    alert('판매 상태 변경에 실패했습니다. 다시 시도해주세요.');
  }
};

const handleDeleteClick = async (ratePlanId) => {
  if (confirm('정말로 이 요금제를 삭제하시겠습니까?')) {
    try {
      const accessToken = getAccessToken();

      await api.post(`/api/admin/rateplans/${ratePlanId}`, null, { 
        headers: { Authorization: `Bearer ${accessToken}` }}
      );

      const plan = ratePlans.value.find(p => (p.ratePlanId || p.id) === ratePlanId);
      if (plan) {
        plan.isDeleted = true;
      }

      alert('요금제가 성공적으로 삭제되었습니다.');
    } catch (error) {
      alert('요금제 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  }
};

const sortByPrice = async (type) => {
  console.log('새로운 정렬 타입:', type);
  
  sortType.value = type;

  removeScrollListener();
  
  lastCursor.value = null;
  hasMoreData.value = true;
  ratePlans.value = [];
  
  await fetchRatePlans(false);
  
  await setupScrollListener();

  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }

};

onMounted(async () => {
  if (ratePlans.value.length === 0) {
    await fetchRatePlans(false);
  }
  
  await nextTick();
  
  await setupScrollListener();
  
  autoLoadMoreIfNeeded();
});

onActivated(async () => {
  await setupScrollListener();
  
  await nextTick();

  requestAnimationFrame(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollPosition.value;
    }
  });
});

onDeactivated(() => {
  if (scrollContainer.value) {
    scrollPosition.value = scrollContainer.value.scrollTop;
  }
  removeScrollListener();
  
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value);
    scrollTimeout.value = null;
  }
  
  if (autoLoadTimer.value) {
    clearTimeout(autoLoadTimer.value);
    autoLoadTimer.value = null;
  }
});

onBeforeUnmount(() => {
  if (scrollContainer.value) {
    scrollPosition.value = scrollContainer.value.scrollTop;
  }
  removeScrollListener();
  
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value);
    scrollTimeout.value = null;
  }
  
  if (autoLoadTimer.value) {
    clearTimeout(autoLoadTimer.value);
    autoLoadTimer.value = null;
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
  height: calc(100vh - 280px); 
  min-height: 400px;
  max-height: calc(100vh - 200px); 
  overflow-y: auto;
  padding: 0 40px;
  margin-right: 300px; 
}

@media (min-width: 1920px) {
  .rate-plan-cards {
    height: calc(100vh - 320px);
    min-height: 500px;
    max-height: calc(100vh - 240px);
    margin-right: 350px;
  }
}

@media (min-width: 2560px) {
  .rate-plan-cards {
    height: calc(100vh - 360px);
    min-height: 600px;
    max-height: calc(100vh - 280px);
    margin-right: 400px;
  }
}

@media (max-width: 1366px) {
  .rate-plan-cards {
    height: calc(100vh - 260px);
    min-height: 350px;
    max-height: calc(100vh - 180px);
    margin-right: 280px;
  }
}

@media (min-width: 3840px) {
  .rate-plan-cards {
    height: calc(100vh - 400px);
    min-height: 800px;
    max-height: calc(100vh - 320px);
    margin-right: 450px;
  }
}

.rate-plan-cards::-webkit-scrollbar {
  width: 8px;
}

.rate-plan-cards::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.rate-plan-cards::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.rate-plan-cards::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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
  cursor: pointer;
}

.rate-plan-card:hover {
  transform: translateY(-5px); 
}

.rate-plan-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f8f8f8;
}

.rate-plan-card.disabled:hover {
  transform: none; 
}

.rate-plan-card.disabled .plan-name {
  color: #999;
}

.rate-plan-card.disabled .plan-summary {
  color: #bbb;
}

.rate-plan-card.disabled .monthly-fee {
  color: #ccc;
}

.rate-plan-card.disabled .discount-fee {
  color: #ddd;
}

.rate-plan-card.deleted {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f0f0f0;
  border: 2px solid #9e9e9e;
}

.rate-plan-card.deleted:hover {
  transform: none;
}

.rate-plan-card.deleted .plan-name {
  color: #666;
}

.rate-plan-card.deleted .plan-summary {
  color: #999;
}

.rate-plan-card.deleted .monthly-fee {
  color: #999;
}

.rate-plan-card.deleted .discount-fee {
  color: #bbb;
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
  position: relative;
  width: 100%; 
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
  min-width: 120px;
  text-align: center;
  flex-grow: 1;
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

.delete-button {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  text-align: center;
  flex-grow: 1;
}

.delete-button.active {
  background-color: #ff9800;
  color: white;
}

.delete-button.active:hover {
  background-color: #f57c00;
  transform: translateY(-1px);
}

.delete-button:disabled {
  background-color: #cccccc;
  color: #999999;
  cursor: not-allowed;
  transform: none;
}

.delete-button:disabled:hover {
  background-color: #cccccc;
  transform: none;
}

.delete-button.deleted {
  background-color: #9e9e9e;
  color: white;
  cursor: not-allowed;
}

.delete-button.deleted:hover {
  background-color: #9e9e9e;
  transform: none;
}

.trash_can-img {
  width: 40px;
  height: 40px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-button:hover .trash_can-img {
  opacity: 1;
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

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  margin-right: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #e0186f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-container p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
  font-style: italic;
}

.sort-buttons {
  display: flex;
  justify-content: flex-end; 
  padding: 0 40px 20px; 
  gap: 10px; 
  margin-right: 300px; 
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

/* 무한 스크롤 관련 스타일 */
.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  margin: 20px 0;
}

.loading-spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #e0186f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-more p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.no-more-data {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 20px;
  margin: 20px 0;
}

.no-more-data p {
  font-size: 14px;
  color: #999;
  margin: 0;
  font-style: italic;
}
</style>