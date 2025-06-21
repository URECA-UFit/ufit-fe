<template>
  <header class="list-header">
    <h1>{{ title }}</h1>
    <button
      class="auth-button"
      @click="isLoggedIn ? handleLogout() : router.push('/login')"
    >
      {{ isLoggedIn ? "로그아웃" : "로그인" }}
    </button>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/api/axiosInstance";

/* eslint-disable no-undef */
defineProps({
  title: {
    type: String,
    required: true
  }
});
/* eslint-enable no-undef */

const router = useRouter();
const route = useRoute();
const isLoggedIn = ref(false);

// 로그인 상태를 확인하는 함수
const checkLoginStatus = () => {
  isLoggedIn.value = !!localStorage.getItem("accessToken");
};

// localStorage 변화를 감지하는 이벤트 리스너
const handleStorageChange = (event) => {
  if (event.key === 'accessToken') {
    checkLoginStatus();
  }
};

onMounted(() => {
  checkLoginStatus();
  // localStorage 변화 감지 이벤트 리스너 등록
  window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
  // 이벤트 리스너 제거
  window.removeEventListener('storage', handleStorageChange);
});

// 라우트 변경 시마다 로그인 상태 확인
watch(() => route.path, () => {
  checkLoginStatus();
});

const handleLogout = async () => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    await api.post(
      "/api/auth/logout",
      {},
      {
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error("로그아웃 중 오류 발생:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    
    // localStorage 변화 이벤트를 수동으로 발생시켜 다른 컴포넌트에서 감지할 수 있도록 함
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      newValue: null,
      storageArea: localStorage
    }));
    
    // 이벤트로 로그아웃 알림
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    isLoggedIn.value = false;
    router.push("/login");
  }
};
</script>

<style scoped>
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
  background-color: rgba(255, 255, 255, 0.2);
}
</style> 