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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
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
const isLoggedIn = ref(false);

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem("accessToken");
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