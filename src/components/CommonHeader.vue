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
/* global defineProps */
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/api/axiosInstance";

defineProps({
  title: {
    type: String,
    required: true
  }
});

const router = useRouter();
const route = useRoute();
const isLoggedIn = ref(false);

const checkLoginStatus = () => {
  isLoggedIn.value = !!localStorage.getItem("accessToken");
};

const handleStorageChange = (event) => {
  if (event.key === 'accessToken') {
    checkLoginStatus();
  }
};

onMounted(() => {
  checkLoginStatus();

  window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {

  window.removeEventListener('storage', handleStorageChange);
});

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
  } catch (e) {
    // intentionally empty
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      newValue: null,
      storageArea: localStorage
    }));
    
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