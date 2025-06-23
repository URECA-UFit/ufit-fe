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
  const userRole = localStorage.getItem("userRole"); 
  const { requiresAuth, requiresAdmin } = to.meta;

  if (to.path === "/") {
    if (!isLoggedIn) return next({ name: "Login" });
    return userRole === "ADMIN"
      ? next({ name: "DashBoard" })
      : next({ name: "RatePlanStore" });
  }

  if (to.name === "Login" && isLoggedIn) {
    return userRole === "ADMIN"
      ? next({ name: "DashBoard" })
      : next({ name: "RatePlanStore" });
  }

  if (requiresAuth && !isLoggedIn) {
    return next({ name: "Login" });
  }

  if (requiresAdmin && userRole !== "ADMIN") {
    return isLoggedIn
      ? next({ name: "RatePlanStore" }) 
      : next({ name: "Login" });      
  }

  next();
});

export default router;
