import { createRouter, createWebHistory } from "vue-router";
// 수정
import LoginPage from "../views/LoginPage.vue";
import DashBoardPage from "../views/DashBoardPage.vue";
import RatePlanStorePage from "../views/RatePlanStorePage.vue";
import ChatBotReviewPage from "../views/ChatBotReviewPage.vue";
import PlanDetailPage from '../views/PlanDetailPage.vue'
import AdminRatePlanStorePage from "../views/AdminRatePlanStorePage.vue"
import RatePlanAddPage from "../views/RatePlanAddPage.vue"

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", name: "Login", component: LoginPage },
  {
    path: "/admin/rateplan/storage",
    name: "AdmonRatePlanStore",
    component: AdminRatePlanStorePage,
  },
  {
    path: "/rateplan/storage",
    name: "RatePlanStore",
    component: RatePlanStorePage,
  },
  {
    path: "/rateplan/storage/:rateplanId",
    name: "PlanDetail",
    component: PlanDetailPage,
    props: true
  },
  { path: "/dashboard", name: "DashBoard", component: DashBoardPage },
  { path: "/reviews", name: "ChatBotReview", component: ChatBotReviewPage },
  { path: "/rateplan/add", name: "RatePlanAdd", component: RatePlanAddPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem("accessToken"); // 로그인 상태 확인
  const requiresAuth = to.meta.requiresAuth; // 해당 라우트가 인증을 필요로 하는지 확인
  const requiresAdmin = to.meta.requiresAdmin; // 해당 라우트가 관리자 권한을 필요로 하는지 확인
  const userRole = localStorage.getItem("userRole"); // 사용자 역할 가져오기

  if (to.path === "/") {
    if (isLoggedIn) {
      if (userRole === "ADMIN") {
        next({ name: "Dashboard" }); // 관리자는 대시보드
      } else {
        // 일반 사용자 (USER)
        next({ name: "RatePlanStore" }); // 일반 사용자는 요금제 목록
      }
    } else {
      next({ name: "Login" }); // 로그인 안 되어 있으면 로그인 페이지
    }
    return; // 이 경우 다음 가드 체인으로 넘어가지 않고 종료
  }

  // 2. 로그인 페이지 접근 제어 (기존 로직)
  if (to.name === "Login" && isLoggedIn) {
    if (userRole === "ADMIN") {
      next({ name: "Dashboard" });
    } else {
      next({ name: "RatePlanStore" });
    }
    return; // 이 경우 다음 가드 체인으로 넘어가지 않고 종료
  }

  if (requiresAuth && !isLoggedIn) {
    next({ name: "Login" });
    return;
  }

  // 사용자가 로그인 페이지로 이동하려 하는데 이미 로그인되어 있다면,
  // 요금제 목록 페이지로 리디렉션
  if (requiresAdmin && (userRole !== "ADMIN" || !isLoggedIn)) {
    // 관리자 권한이 필요한데 관리자가 아니거나 로그인 안 된 경우
    if (isLoggedIn && userRole === "USER") {
      next({ name: "RatePlanStore" }); // 일반 사용자는 요금제 목록으로
    } else {
      next({ name: "Login" }); // 비로그인 사용자는 로그인 페이지로
    }
    return;
  }

  if (requiresAuth && !isLoggedIn) {
    next({ name: "Login" });
    return;
  }

  // 그 외의 경우는 정상적으로 이동 허용
  else {
    next();
  }
});

export default router;
