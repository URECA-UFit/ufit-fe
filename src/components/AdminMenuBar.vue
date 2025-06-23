<template>
  <nav class="admin-menu-bar">
    <ul>
      <li :class="{ active: isActive('/admin/dashboard') }" @click="goTo('/admin/dashboard')">
        <span class="icon">📊</span> <span class="label">대시보드</span>
      </li>
      <li :class="{ active: isActive('/admin/reviews') }" @click="goTo('/admin/reviews')">
        <span class="icon">📝</span> <span class="label">리뷰 목록</span>
      </li>
      <li :class="{ active: isActive('/admin/rateplan/storage') }" @click="goTo('/admin/rateplan/storage')">
        <span class="icon">📦</span> <span class="label">요금제 목록</span>
      </li>
      <li :class="{ active: isActive('/rateplan/add') }" @click="goTo('/admin/rateplan/add')">
        <span class="icon">➕</span> <span class="label">요금제 추가</span>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

function goTo(path) {
  if (route.path !== path) {
    router.push(path)
  }
}
function isActive(path) {
  return route.path === path
}
</script>

<style scoped>
.admin-menu-bar {
  position: fixed;
  top: 50%;
  right: 60px;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #fff7fa 0%, #ffe6f7 100%);
  border: none;
  border-radius: 22px;
  box-shadow: 0 8px 32px rgba(224,24,111,0.13), 0 1.5px 8px rgba(230,0,122,0.07) inset;
  padding: 38px 32px;
  z-index: 1000;
  min-width: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s cubic-bezier(.4,2,.6,1);
  border: 1.5px solid #f5b3d6;
}
.admin-menu-bar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.admin-menu-bar li {
  font-size: 20px;
  font-weight: 600;
  color: #e0186f;
  cursor: pointer;
  padding: 12px 0 12px 0;
  border-radius: 12px;
  transition: background 0.22s, color 0.22s, font-weight 0.22s, box-shadow 0.22s;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: none;
  background: none;
  border: none;
  letter-spacing: 0.5px;
}
.admin-menu-bar li .icon {
  font-size: 22px;
  margin-right: 2px;
}
.admin-menu-bar li .label {
  font-size: 18px;
}
.admin-menu-bar li.active {
  background: linear-gradient(90deg, #e0186f 60%, #f0e180 100%);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 4px 16px rgba(224,24,111,0.13);
  border: none;
}
.admin-menu-bar li.active .label {
  color: #fff;
}
.admin-menu-bar li:hover:not(.active) {
  background: #f7e6ef;
  color: #e0186f;
  box-shadow: 0 2px 8px rgba(224,24,111,0.07);
}
.admin-menu-bar li:active {
  background: #ffe6f7;
}

@media (max-width: 900px) {
  .admin-menu-bar {
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    transform: none;
    width: 100vw;
    min-width: unset;
    border-radius: 0;
    border: none;
    border-top: 2.5px solid #e0186f;
    box-shadow: 0 -2px 16px rgba(224,24,111,0.10);
    padding: 0;
    flex-direction: row;
    align-items: stretch;
    justify-content: center;
    background: linear-gradient(90deg, #fff7fa 0%, #ffe6f7 100%);
  }
  .admin-menu-bar ul {
    flex-direction: row;
    gap: 0;
    width: 100%;
    justify-content: space-around;
  }
  .admin-menu-bar li {
    flex: 1 1 0;
    font-size: 15px;
    padding: 14px 0 10px 0;
    border-radius: 0;
    border: none;
    border-right: 1.5px solid #f5b3d6;
    background: none;
    justify-content: center;
    text-align: center;
    gap: 6px;
  }
  .admin-menu-bar li:last-child {
    border-right: none;
  }
  .admin-menu-bar li.active {
    background: linear-gradient(90deg, #e0186f 60%, #f0e180 100%);
    color: #fff;
    font-weight: 800;
    border-radius: 0;
    border: none;
    box-shadow: 0 2px 8px rgba(224,24,111,0.10);
  }
  .admin-menu-bar li .icon {
    font-size: 18px;
  }
  .admin-menu-bar li .label {
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .admin-menu-bar li {
    font-size: 12px;
    padding: 10px 0 7px 0;
    gap: 4px;
  }
  .admin-menu-bar li .icon {
    font-size: 15px;
  }
  .admin-menu-bar li .label {
    font-size: 11px;
  }
}
</style>
