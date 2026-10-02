import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/splash",
			name: "splash",
			component: () => import("../views/SplashView.vue"),
			meta: { fullScreen: true },
		},
		{
			path: "/login",
			name: "login",
			component: () => import("../views/LoginView.vue"),
			meta: { fullScreen: true },
		},
		{
			path: "/onboarding",
			name: "onboarding",
			component: () => import("../views/OnboardingView.vue"),
			meta: { fullScreen: true },
		},
		{
			path: "/",
			name: "home",
			component: HomeView,
		},
		{
			path: "/about",
			name: "about",
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import("../views/AboutView.vue"),
		},
	],
});

const PUBLIC_ROUTES = new Set(["splash", "login"]);

router.beforeEach((to) => {
	const auth = useAuthStore();
	const name = to.name as string;

	// Unauthenticated users can only visit splash & login
	if (!auth.isAuthenticated && !PUBLIC_ROUTES.has(name)) {
		return { name: "splash" };
	}

	// Authenticated users hitting splash/login get redirected in
	if (auth.isAuthenticated && PUBLIC_ROUTES.has(name)) {
		return { name: "home" };
	}
});

export default router;
