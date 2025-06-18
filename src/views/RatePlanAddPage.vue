<template>
  <div class="rate-plan-add-container">
    <CommonHeader title="요금제 생성" />
    <div class="form-area">
      <form @submit.prevent="handleSubmit" class="rate-plan-form">
        <div class="form-row">
          <div class="form-group">
            <label>요금제 이름<span class="required">*</span></label>
            <input v-model="form.planName" required />
          </div>
          <div class="form-group">
            <label>요약<span class="required">*</span></label>
            <input v-model="form.summary" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>요금제 금액<span class="required">*</span></label>
            <input v-model="form.monthlyFee" required />
          </div>
          <div class="form-group">
            <label>약정 할인 금액<span class="required">*</span></label>
            <input v-model="form.discountFee" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>사용 가능 데이터량<span class="required">*</span></label>
            <input v-model="form.data_allowance" required />
          </div>
          <div class="form-group">
            <label>사용 가능 통화량<span class="required">*</span></label>
            <input v-model="form.voice_allowance" required />
          </div>
          <div class="form-group">
            <label>사용 가능 문자 메시지<span class="required">*</span></label>
            <input v-model="form.sms_allowance" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group wide">
            <label>기본 혜택<span class="required">*</span></label>
            <input v-model="form.basic_benefit" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group wide">
            <label>특별 혜택<span class="required">*</span></label>
            <input v-model="form.special_benefit" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group wide">
            <label>할인 혜택<span class="required">*</span></label>
            <input v-model="form.discount_benefit" required />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="submit-btn">생성</button>
          <button type="button" class="cancel-btn" @click="handleCancel">취소</button>
        </div>
      </form>
    </div>
    <div class="menu-bar-area">
      <AdminMenuBar />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/axiosInstance'
import CommonHeader from "@/components/CommonHeader.vue";
import AdminMenuBar from '@/components/AdminMenuBar.vue';

function getAccessToken() {
    return localStorage.getItem('accessToken');
}

const router = useRouter();
const form = ref({
  planName: '',
  summary: '',
  monthlyFee: '',
  discountFee: '',
  data_allowance: '',
  voice_allowance: '',
  sms_allowance: '',
  basic_benefit: '',
  special_benefit: '',
  discount_benefit: '',
});

const handleSubmit = async () => {
  try {
    // 입력값 검증
    if (!validateForm()) {
      return;
    }

    // API 요청 데이터 구성
    const requestData = {
      planName: form.value.planName,
      summary: form.value.summary,
      monthlyFee: parseInt(form.value.monthlyFee),
      discountFee: parseInt(form.value.discountFee),
      data_allowance: form.value.data_allowance,
      voice_allowance: form.value.voice_allowance,
      sms_allowance: form.value.sms_allowance,
      basic_benefit: {
        basic_benefit: form.value.basic_benefit
      },
      special_benefit: {
        special_benefit: form.value.special_benefit
      },
      discount_benefit: {
        discount_benefit: form.value.discount_benefit
      }
    };

    const accessToken = getAccessToken();
    // API 호출
    const response = await api.post(`/api/admin/rateplans`, requestData, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (response.status === 201) {
      alert('요금제가 성공적으로 생성되었습니다!');
      router.push("/admin/rateplan/storage");
    }
  } catch (error) {
    console.error('요금제 생성 중 오류 발생:', error);
    if (error.response) {
      // 서버에서 반환한 에러 메시지가 있는 경우
      alert(`요금제 생성 실패: ${error.response.data.message || '알 수 없는 오류가 발생했습니다.'}`);
    } else {
      // 네트워크 오류 등 기타 에러
      alert('요금제 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }
};

const validateForm = () => {
  // 필수 입력값 검증
  const requiredFields = [
    { name: '요금제 이름', value: form.value.planName },
    { name: '요약', value: form.value.summary },
    { name: '요금제 금액', value: form.value.monthlyFee },
    { name: '약정 할인 금액', value: form.value.discountFee },
    { name: '사용 가능 데이터량', value: form.value.data_allowance },
    { name: '사용 가능 통화량', value: form.value.voice_allowance },
    { name: '사용 가능 문자 메시지', value: form.value.sms_allowance },
    { name: '기본 혜택', value: form.value.basic_benefit },
    { name: '특별 혜택', value: form.value.special_benefit },
    { name: '할인 혜택', value: form.value.discount_benefit }
  ];

  for (const field of requiredFields) {
    if (!field.value || field.value.trim() === '') {
      alert(`${field.name}을(를) 입력해주세요.`);
      return false;
    }
  }

  // 금액 필드 숫자 검증
  if (isNaN(parseInt(form.value.monthlyFee)) || isNaN(parseInt(form.value.discountFee))) {
    alert('요금제 금액과 약정 할인 금액은 숫자로 입력해주세요.');
    return false;
  }

  // 할인 금액이 기본 금액보다 큰 경우 검증
  if (parseInt(form.value.discountFee) >= parseInt(form.value.monthlyFee)) {
    alert('약정 할인 금액은 기본 요금제 금액보다 작아야 합니다.');
    return false;
  }

  return true;
};

const handleCancel = () => {
  router.back();
};
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
.form-area {
  flex: 1;
  margin-top: 60px;
  margin-left: 20px;
  margin-right: 120px;
}

.rate-plan-form {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.form-row {
  display: flex;
  gap: 40px;
  align-items: center;
}
.form-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width: 180px;
  margin-bottom: 0;
}
.form-group.wide {
  flex: 2;
}
label {
  font-weight: 600;
  margin-bottom: 7px;
  color: #222;
  min-width: 0;
  text-align: left;
  margin-right: 0;
}
.required {
  color: #e0186f;
  margin-left: 2px;
}
input, textarea {
  border: 1.5px solid #bbb;
  border-radius: 7px;
  padding: 10px 12px;
  font-size: 1rem;
  background: #fff;
  transition: border 0.2s;
  width: 100%;
}
input:focus, textarea:focus {
  border: 1.5px solid #c42a74;
  outline: none;
}
textarea {
  resize: vertical;
}
.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 18px;
}
.submit-btn {
  background: #c42a74;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 10px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.submit-btn:hover {
  background: #a01e5a;
}
.cancel-btn {
  background: #fff;
  color: #222;
  border: 1.5px solid #bbb;
  border-radius: 7px;
  padding: 10px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border 0.2s;
}
.cancel-btn:hover {
  background: #f5f5f5;
  border: 1.5px solid #c42a74;
}
.menu-bar-area {
  position: fixed;
  top: 180px;
  right: 60px;
  width: 200px;
  z-index: 20;
}
@media (max-width: 1100px) {
  .form-area {
    margin-right: 220px;
  }
  .menu-bar-area {
    right: 20px;
    width: 160px;
  }
}
@media (max-width: 800px) {
  .form-area {
    margin-left: 10px;
    margin-right: 10px;
  }
  .menu-bar-area {
    display: none;
  }
  .form-row {
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
  }
}
</style>