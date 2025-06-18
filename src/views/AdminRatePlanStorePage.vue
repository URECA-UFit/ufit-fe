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

    <!-- 로딩 상태 표시 -->
    <div v-if="isLoading && ratePlansLength === 0" class="loading-container">
      <div class="loading-spinner"></div>
      <p>요금제 목록을 불러오는 중...</p>
    </div>

    <!-- 요금제 목록 -->
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

      <!-- 추가 로딩 인디케이터 -->
      <div v-if="isLoadingMore" class="loading-more">
        <div class="loading-spinner-small"></div>
        <p>더 많은 요금제를 불러오는 중...</p>
      </div>

      <!-- 더 이상 데이터가 없을 때 -->
      <div v-if="!hasMoreData && ratePlansLength > 0" class="no-more-data">
        <p>모든 요금제를 불러왔습니다.</p>
      </div>
    </div>

    <!-- 데이터가 없을 때 -->
    <div v-else-if="!isLoading" class="empty-state">
      <p>등록된 요금제가 없습니다.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import CommonHeader from "@/components/CommonHeader.vue";
import AdminMenuBar from '@/components/AdminMenuBar.vue'
import api from '@/api/axiosInstance';

function getAccessToken() {
    return localStorage.getItem('accessToken');
}

const router = useRouter();
const route = useRoute();

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
const sortType = ref(''); // 기본 정렬 타입을 빈 문자열로 설정 (정렬 없음)

// computed 속성으로 길이 계산
const ratePlansLength = computed(() => {
  return ratePlans.value ? ratePlans.value.length : 0;
});

const formatCurrency = (amount) => {
  return amount.toLocaleString("ko-KR");
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
      size: 5
    };

    // 정렬 타입이 있을 때만 파라미터 추가
    if (sortType.value && sortType.value !== '') {
      params.type = sortType.value;
    }

    // 추가 로드 시에만 커서 추가 (초기 로드 시에는 커서 없음)
    if (isLoadMore && lastCursor.value != null && lastCursor.value !== '') {
      // 커서 값을 문자열로 변환하여 전송
      params.cursor = String(lastCursor.value);
    }

    console.log('=== API 호출 정보 ===');
    console.log('API 호출 파라미터:', params);
    console.log('정렬 타입:', sortType.value);
    console.log('isLoadMore:', isLoadMore);
    console.log('lastCursor:', lastCursor.value);
    console.log('현재 데이터 개수:', ratePlans.value.length);

    const response = await api.get(`/api/admin/rateplans`, {
      params,
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('=== API 응답 정보 ===');
    console.log('응답 데이터:', response.data);
    console.log('응답 상태:', response.status);
    
    const data = response.data;
    
    // 데이터 구조 확인 및 안전한 추출
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
      // 첫 번째 배열을 찾기
      for (const key in data) {
        if (Array.isArray(data[key])) {
          newItems = data[key];
          break;
        }
      }
    }
    
    // hasNext 확인 - 백엔드 응답 구조에 따라 다양한 방식으로 확인
    let hasNext = false;
    if (data && typeof data === 'object') {
      hasNext = data.hasNext || data.hasNextPage || data.hasMore || false;
    }
    
    if (isLoadMore) {
      // 추가 로드 시 기존 데이터에 추가
      ratePlans.value = [...ratePlans.value, ...newItems];
    } else {
      // 초기 로드 시 데이터 교체
      ratePlans.value = newItems;
    }
    
    // 더 이상 데이터가 있는지 확인
    hasMoreData.value = hasNext;
    console.log('hasMoreData 설정:', hasMoreData.value);

    // 커서 업데이트 (nextCursor 사용)
    if (data && typeof data === 'object' && data.nextCursor) {
      lastCursor.value = data.nextCursor;
      console.log('nextCursor로 커서 업데이트:', lastCursor.value);
    } else {
      lastCursor.value = null;
      console.log('nextCursor 없음, 커서 null');
    }

  } catch (error) {
    console.error("=== 에러 상세 정보 ===");
    console.error("요금제 목록 조회 실패:", error);
    console.error("에러 응답:", error.response?.data);
    console.error("에러 상태:", error.response?.status);
    console.error("에러 메시지:", error.message);
    console.error("에러 스택:", error.stack);
    
    if (error.response?.status === 500) {
      // 500 에러 발생 시 커서 초기화하고 첫 페이지부터 다시 로드
      console.log('500 에러 발생, 커서 초기화 후 재시도');
      lastCursor.value = null;
      hasMoreData.value = false;
      
      if (isLoadMore) {
        // 추가 로드 중 에러 발생 시 더 이상 로드하지 않음
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

// 스크롤 이벤트 핸들러
const handleScroll = () => {
  if (!scrollContainer.value || isLoadingMore.value || !hasMoreData.value) {
    return;
  }

  const container = scrollContainer.value;
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;

  // 스크롤이 하단에 도달했는지 확인 (여유분 100px)
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    console.log('스크롤 하단 도달, 추가 데이터 로드 시작');
    loadMoreData();
  }
};

// 추가 데이터 로드
const loadMoreData = async () => {
  if (isLoadingMore.value || !hasMoreData.value) return;
  
  // 커서 값 검증
  if (!lastCursor.value) {
    console.log('커서 값이 없어서 추가 로드를 중단합니다.');
    return;
  }
  
  await fetchRatePlans(true);
};

// 스크롤 이벤트 리스너 등록/해제
const setupScrollListener = async () => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll);
    console.log('스크롤 리스너 등록됨');
  } else {
    console.log('스크롤 컨테이너를 찾을 수 없음');
  }
};

const removeScrollListener = () => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll);
    console.log('스크롤 리스너 제거됨');
  }
};

const toggleSalesStatus = async (ratePlanId) => {
  const plan = ratePlans.value.find(p => (p.ratePlanId || p.id) === ratePlanId);
  if (!plan) return;

  try {
    const accessToken = getAccessToken();
    
    // 백엔드 API 호출하여 판매 상태 변경
    await api.patch(`/api/admin/rateplans/${ratePlanId}`, {
      isEnabled: !plan.isEnabled
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // 성공 시 로컬 상태 업데이트
    plan.isEnabled = !plan.isEnabled;
    
    // 성공 메시지
    alert(`요금제가 ${plan.isEnabled ? '판매중' : '판매종료'} 상태로 변경되었습니다.`);
    
  } catch (error) {
    console.error('판매 상태 변경 실패:', error);
    alert('판매 상태 변경에 실패했습니다. 다시 시도해주세요.');
  }
};

// 삭제 버튼 클릭 핸들러
const handleDeleteClick = async (ratePlanId) => {
  if (confirm('정말로 이 요금제를 삭제하시겠습니까?')) {
    try {
      const accessToken = getAccessToken();

      await api.post(`/api/admin/rateplans/delete/${ratePlanId}`, null, { 
        headers: { Authorization: `Bearer ${accessToken}` }}
      );

      // 삭제 성공 시 해당 요금제의 isDeleted 속성을 true로 설정
      const plan = ratePlans.value.find(p => (p.ratePlanId || p.id) === ratePlanId);
      if (plan) {
        plan.isDeleted = true;
      }

      alert('요금제가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('요금제 삭제 실패:', error);
      alert('요금제 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  }
};

const sortByPrice = async (type) => {
  console.log('새로운 정렬 타입:', type);
  
  sortType.value = type;
  
  // 정렬 시 스크롤 리스너 제거
  removeScrollListener();
  
  // 정렬 타입 변경 시 모든 상태 초기화
  lastCursor.value = null;
  hasMoreData.value = true;
  ratePlans.value = [];
  
  // 정렬 타입 변경 시 첫 페이지부터 다시 로드
  await fetchRatePlans(false);
  
  // 데이터 로드 완료 후 스크롤 리스너 재등록
  await setupScrollListener();
  
  // 스크롤 위치를 맨 위로 초기화
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }
  
  console.log('=== 정렬 변경 완료 ===');
};

onMounted(async () => {
  await fetchRatePlans(false);
  // DOM이 업데이트된 후 스크롤 리스너 등록
  await setupScrollListener();
});

// 라우트 변경 감지하여 스크롤 리스너 재등록
watch(() => route.path, async (newPath, oldPath) => {
  if (newPath === '/admin/rateplan/storage' && oldPath !== newPath) {
    // 기존 리스너 제거 후 재등록
    removeScrollListener();
    await setupScrollListener();
  }
});

onUnmounted(() => {
  removeScrollListener();
});
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
  height: calc(100vh - 280px); /* 헤더, 정렬 버튼, 패딩 등을 고려한 높이 */
  overflow-y: auto;
  padding: 0 40px;
  margin-right: 300px; /* AdminMenuBar 공간 확보 */
}

/* 스크롤바 스타일링 */
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
  cursor: pointer;
}

.rate-plan-card:hover {
  transform: translateY(-5px); /* 호버 시 약간 위로 */
}

/* 판매종료 상태의 카드 스타일 */
.rate-plan-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f8f8f8;
}

.rate-plan-card.disabled:hover {
  transform: none; /* 호버 시 움직임 없음 */
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

/* 삭제된 요금제 카드 스타일 */
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

/* 로딩 상태 스타일 */
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

/* 빈 상태 스타일 */
.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
  font-style: italic;
}

/* Sort Buttons Styles */
.sort-buttons {
  display: flex;
  justify-content: flex-end; /* 버튼을 오른쪽으로 정렬 */
  padding: 0 40px 20px; /* 카드 목록 위에 위치하도록 패딩 조정 */
  gap: 10px; /* 버튼 간 간격 */
  margin-right: 300px; /* AdminMenuBar 공간 확보 */
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
  background-color: #e0186f; /* 활성 버튼 색상 */
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