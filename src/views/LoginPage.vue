<template>
  <div class="login-container">
    <div class="login-left">
      <div class="login-left-item">
        <img class="logo" src="@/assets/logo.png" alt="UFit 로고" />
      </div>
      <form @submit.prevent="handleLogin">
        <label>이메일</label>
        <input v-model="email" type="email" placeholder="이메일 주소를 입력해주세요" required />
        <label>비밀번호</label>
        <input v-model="password" type="password" placeholder="비밀번호를 입력해 주세요/8~15자,특수문자 3자 이상" required />
        <button type="submit">로그인</button>

        <button class="guest-button" @click="handleGuestBrowse">비회원으로 둘러보기</button>
      </form>
    </div>

    <div class="login-right">
      <img class="mascot" src="@/assets/mascot.png" alt="캐릭터" />
    </div>

    <div v-if="notification.message" :class="['notification-popup', notification.type]">
      <p>{{ notification.message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api/axiosInstance'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')

const router = useRouter()

const notification = ref({
  message: null,
  type: null 
});

let notificationTimeout = null; 


const showNotification = (message, type) => {

  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  notification.value = { message, type };

  notificationTimeout = setTimeout(() => {
    notification.value = { message: null, type: null };
    console.log('Notification hidden after timeout.');
  }, 3000);
};

const validateForm = () => {
  if (!email.value || !email.value.includes('@')) {
    showNotification('유효한 이메일 주소를 입력해주세요.', 'error');
    return false;
  }

  const passwordValue = password.value;

    const specialCharRegex = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g;
    const specialCharCount = (passwordValue.match(specialCharRegex) || []).length;

    const hasAlphabet = /[A-Za-z]/.test(passwordValue);
    const lengthValid = passwordValue.length >= 8 && passwordValue.length <= 15;

    if (!lengthValid) {
      showNotification('비밀번호는 8자 이상 15자 이하로 입력해주세요.', 'error');
      return false;
    }
    if (!hasAlphabet) {
      showNotification('비밀번호에 영어를 최소 1자를 포함해주세요.', 'error');
      return false;
    }
    if (specialCharCount < 3) {
      showNotification('비밀번호는 특수문자를 3자 이상 포함해야 합니다.', 'error');
      return false;
    }

  return true;
};


const handleLogin = async () => {

  if (!validateForm()) {
    return;
  }

  try {
    const res = await api.post('/api/auth/login', {
      email: email.value,
      password: password.value
    }, {
      withCredentials: true
    });

    const accessToken = res.headers['authorization']?.replace('Bearer ', '');

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);

      const userRole = res.data.role;
      localStorage.setItem('userRole', userRole);

      window.dispatchEvent(new StorageEvent('storage', {
        key: 'accessToken',
        newValue: accessToken,
        storageArea: localStorage
      }));

      window.dispatchEvent(new CustomEvent('userLogin'));

      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (userRole === 'USER') {
        router.push('/rateplan/storage'); 
      }

    } 
  } catch (err) {

    const errorMessage = err.response?.data?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
    showNotification(errorMessage, 'error');
  }
};

const handleGuestBrowse = () => {
  router.push('/rateplan/storage');
};

</script>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  font-family: 'Pretendard', sans-serif;
  position: relative;
  align-items: stretch;
}

.login-left {
  flex: 1;
  padding: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-left-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  width: 230px;
}

.login-left h2 {
  font-size: 32px;
  margin-bottom: 30px;
  margin-top: 0; 
}

form label {
  margin-top: 16px;
  display: block;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
}


button {
  margin-top: 24px;
  width: 100%;
  padding: 14px;
  background-color: #e0186f;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  box-sizing: border-box;
}

button:hover {
  background-color: #ffeaf4;
}

.guest-button{
  width: 100%;
  max-width: 400px;
  padding: 14px;
  margin-top: 10px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color 0.3s ease;
  background-color: white; 
  color: #333;
  border: none;
}

.guest-button:hover{
  background-color: #e0e0e0;
}

.login-right {
  flex: 1;
  background-color: #ffeaf4;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mascot {
  width: 200px;
  height: auto;
}

.notification-popup {
  position: fixed; 
  top: 20px;
  left: 50%;
  transform: translateX(-50%); 
  padding: 15px 25px;
  border-radius: 8px;
  font-weight: bold;
  color: white;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  text-align: center;
  animation: fadeInOut 3.5s forwards;
}

.notification-popup.error {
  background-color: #e0186f;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  10% { opacity: 1; transform: translateX(-50%) translateY(0); }
  90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}
</style>
