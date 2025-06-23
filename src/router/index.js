import { createRouter, createWebHistory } from "vue-router";
// 수정
import LoginPage from "@/views/LoginPage.vue";
import DashBoardPage from "@/views/DashBoardPage.vue";
import ChatBotReviewPage from "@/views/ChatBotReviewPage.vue";
import PlanDetailPage from "@/views/PlanDetailPage.vue"
import AdminRatePlanStorePage from "@/views/AdminRatePlanStorePage.vue"
import RatePlanAddPage from "@/views/RatePlanAddPage.vue"

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", name: "Login", component: LoginPage },
  {
    path: "/rateplan/storage",
    name: "RatePlanStore",
    component: () => import("@/views/RatePlanStorePage.vue"),
    meta: {
      keepAlive: true
    }
  },
  {
    path: "/rateplan/storage/:rateplanId",
    name: "PlanDetail",
    component: PlanDetailPage,
    props: true
  },
  {
    path: "/admin/rateplan/storage",
    name: "AdminRatePlanStore",
    component: AdminRatePlanStorePage,
    meta: {requiresAuth: true, requiresAdmin: true, keepAlive: true}
  },
  { 
    path: "/admin/dashboard",
    name: "DashBoard",
    component: DashBoardPage,
    meta: {requiresAuth: true, requiresAdmin: true}
  },
  {
    path: "/admin/reviews",
    name: "ChatBotReview",
    component: ChatBotReviewPage,
    meta: {requiresAuth: true, requiresAdmin: true}
  },
  { 
    path: "/admin/rateplan/add", 
    name: "RatePlanAdd", 
    component: RatePlanAddPage,
    meta: {requiresAuth: true, requiresAdmin: true}
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const userRole = localStorage.getItem("userRole"); // "USER" or "ADMIN"
  const { requiresAuth, requiresAdmin } = to.meta;

  // 1. 루트로 접근 시 역할에 따라 리디렉션
  if (to.path === "/") {
    if (!isLoggedIn) return next({ name: "Login" });
    return userRole === "ADMIN"
      ? next({ name: "DashBoard" })
      : next({ name: "RatePlanStore" });
  }

  // 2. 로그인 페이지 접근 시 이미 로그인했다면 리디렉션
  if (to.name === "Login" && isLoggedIn) {
    return userRole === "ADMIN"
      ? next({ name: "DashBoard" })
      : next({ name: "RatePlanStore" });
  }

  // 3. 로그인 필요 라우트인데 비로그인 상태
  if (requiresAuth && !isLoggedIn) {
    return next({ name: "Login" });
  }

  // 4. 관리자 권한 필요 라우트인데 일반 사용자거나 미로그인
  if (requiresAdmin && userRole !== "ADMIN") {
    return isLoggedIn
      ? next({ name: "RatePlanStore" }) // 일반 로그인 사용자는 사용자 페이지로
      : next({ name: "Login" });        // 비로그인은 로그인 페이지로
  }

  // 5. 그 외엔 통과
  next();
});

export default router;
