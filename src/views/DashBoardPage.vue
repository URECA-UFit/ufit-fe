<template>
  <div>
    <AdminMenuBar />
    <header class="list-header">
      <h1>요금제 대시보드</h1>
    </header>
    <div v-if="loading">로딩 중...</div>
    <div v-else-if="!hasData" class="no-data">
      <p>데이터가 없습니다.</p>
    </div>
    <div v-else class="chart-area-wrapper">
      <div
        class="chart-area"
        @mousemove="onChartMouseMove"
        @mouseleave="onChartMouseLeave"
        :style="{ position: 'relative', width: '800px', height: '400px', margin: '0 auto' }"
      >
        <Bar 
          :data="chartData" 
          :options="chartOptions" 
          :width="800" 
          :height="400"
        />
        <button
          class="side-pagination left"
          :class="{ active: hoverSide === 'left' }"
          @click="fetchPreviousPage"
          :disabled="!hasPrevious"
        >
          ◀
        </button>
        <button
          class="side-pagination right"
          :class="{ active: hoverSide === 'right' }"
          @click="fetchNextPage"
          :disabled="!hasNext"
        >
          ▶
        </button>
      </div>
      <div class="pagination">
        <span>Page : {{ currentPage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import api from '@/api/axiosInstance'
import AdminMenuBar from '@/components/AdminMenuBar.vue'

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const loading = ref(false)
const currentPage = ref(1)
const hasPrevious = ref(false)
const hasNext = ref(false)
const ratePlanMetrics = ref([])
const hoverSide = ref(null) // 'left' or 'right' or null

const colors = [
  '#e0186f', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
  '#9966FF', '#FF9F40', '#8c564b', '#e377c2', '#7f7f7f',
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff',
  '#ff00ff', '#c0c0c0', '#800000', '#808000', '#008000' 
]; // 요금제 수에 맞게 색상 추가

const hasData = computed(() => {
  return ratePlanMetrics.value && ratePlanMetrics.value.length > 0
})

const fetchRatePlanMetrics = async (page) => {
  loading.value = true
  try {
    console.log('API 요청 시작:', `/api/admin/rateplans/metrics?page=${page}&size=10`)
    const response = await api.get(`/api/admin/rateplans/metrics`, {
      params: {
        page: page,
        size: 10
      },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    console.log('API 응답:', response.data)
    const data = response.data

    // API 응답 데이터 처리
    ratePlanMetrics.value = data.item || []
    
    // 페이지네이션 상태 업데이트
    hasPrevious.value = data.hasPrevious
    hasNext.value = data.hasNext
    currentPage.value = data.page

    console.log('Page:', data.page, 'HasPrevious:', data.hasPrevious, 'HasNext:', data.hasNext)
  } catch (error) {
    console.error('요금제 메트릭 조회 실패:', error)
    console.error('에러 상세:', error.response?.data || error.message)
    // 에러 시 빈 배열로 초기화
    ratePlanMetrics.value = []
    hasPrevious.value = false
    hasNext.value = false
    currentPage.value = 1
  } finally {
    loading.value = false
  }
}

const fetchPreviousPage = () => {
  if (hasPrevious.value) {
    fetchRatePlanMetrics(currentPage.value - 1)
  }
}

const fetchNextPage = () => {
  if (hasNext.value) {
    fetchRatePlanMetrics(currentPage.value + 1)
  }
}

function onChartMouseMove(e) {
  const rect = e.target.getBoundingClientRect()
  const x = e.clientX - rect.left
  if (x < rect.width / 2) {
    hoverSide.value = 'left'
  } else {
    hoverSide.value = 'right'
  }
}
function onChartMouseLeave() {
  hoverSide.value = null
}

onMounted(() => {
  fetchRatePlanMetrics(1)
})

const chartData = computed(() => {
  const datasets = ratePlanMetrics.value.map((item, index) => {
    const color = colors[index % colors.length];
    return {
      label: item.planName, // 요금제 이름이 레전드 레이블이 됩니다.
      data: [item.popularity === 0 ? 0.1 : item.popularity],
      backgroundColor: color,
      borderColor: color,
      borderWidth: 1
    };
  });

  return {
    labels: ['요금제 인기도'], // X축 레이블을 일반적인 텍스트로 설정
    datasets: datasets
  };
})

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '인기도'
      },
      ticks: {}
    },
    x: {
      display: false, // X축 레이블 숨김
      title: {
        display: false, // X축 제목 숨김
        text: ''
      }
    }
  },
  plugins: {
    legend: {
      display: true, // 레전드 표시
      position: 'right', // 레전드 우측 배치
      labels: {
        boxWidth: 10, // 네모의 너비를 10px로 설정
        boxHeight: 10 // 네모의 높이를 10px로 설정 (정사각형)
      }
    },
    title: {
      display: true,
      text: '요금제별 인기도'
    }
  }
})

// ratePlanMetrics가 변경될 때마다 차트 데이터 및 y축 옵션 업데이트
watch(ratePlanMetrics, (newMetrics) => {
  if (newMetrics && newMetrics.length > 0) {
    const max = Math.max(...newMetrics.map(item => item.popularity))
    chartOptions.value.scales.y.max = Math.ceil(max * 1.1)
    chartOptions.value.scales.y.ticks.stepSize = Math.ceil(max / 5)
  }
}, { immediate: true })
</script>

<style scoped>
.chart-area-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.chart-area {
  position: relative;
  width: 800px;
  height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}
.side-pagination {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 60px;
  background: #e0186f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 24px;
  opacity: 0.5;
  cursor: pointer;
  z-index: 2;
  transition: opacity 0.2s, background 0.2s;
  pointer-events: auto;
}
.side-pagination.left {
  left: -50px;
}
.side-pagination.right {
  right: -50px;
}
.side-pagination.active {
  opacity: 1;
  background: #c0155e;
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

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.7);
  border-radius: 12px;
  box-shadow: 0 1px 8px rgba(230,0,122,0.07) inset;
  padding: 8px 22px;
  min-width: 120px;
  font-size: 17px;
  font-weight: 600;
  color: #e6007a;
  border: 1.5px solid #e6007a;
  letter-spacing: 0.5px;
  transition: box-shadow 0.2s, border 0.2s, background 0.2s;
}
.pagination span {
  font-size: 20px;
  font-weight: 700;
  color: #e6007a;
  letter-spacing: 0.5px;
  padding: 0 2px;
}


.no-data {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}
</style>