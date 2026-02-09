import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView";
import HeatMapView from "@/views/HeatMapView";
import DashboardView from "@/views/DashboardView";
import PageNotFoundView from "@/views/PageNotFoundView";
import AdminPanel from "@/components/Dashboard/AdminPanel";
import UserList from "@/components/Dashboard/UserList";
import LogsList from "@/components/Dashboard/LogsList";
import CameraList from "@/components/Dashboard/CameraList";
import DashboardComercial from "@/views/DashboardComercialView";
import ViabilityView from "@/views/ViabilityView.vue";
import OltList from "@/components/Dashboard/OltList.vue";
import AuditoriaVIew from "@/views/AuditoriaVIew.vue";

import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", name: "Login", component: LoginView },

    { path: "/heatmap", name: "HeatMap", component: HeatMapView },

    { path: "/", redirect: "/heatmap" },

    { path: "/viabilidade", name: "Viabilidade", component: ViabilityView },

    { path: "/auditoria", name: "Auditoria", component: AuditoriaVIew },

    {
      path: "/drawflow",
      name: "DrawFlow",
      component: () => import("@/components/teste.vue"),
    },

    {
      path: "/dashboard",
      component: DashboardView,
      children: [
        { path: "", component: AdminPanel },

        {
          path: "/users",
          name: "user-list",
          component: UserList,
          meta: { requiresAuth: true, allowedRoles: ["adm"] },
        },
        {
          path: "/olt",
          name: "olt-list",
          component: OltList,
          meta: { requiresAuth: true, allowedRoles: ["adm"] },
        },
        {
          path: "/logs",
          name: "logs-list",
          component: LogsList,
          meta: { requiresAuth: true, allowedRoles: ["adm"] },
        },
        {
          path: "/camera",
          name: "camera-list",
          component: CameraList,
          meta: { requiresAuth: true, allowedRoles: ["adm", "tecnico"] },
        },
      ],
    },

    { path: "/comercial", name: "Comercial", component: DashboardComercial },

    { path: "/:pathMatch(.*)*", component: PageNotFoundView },
  ],
});

// Middleware para autenticação e controle de role
router.beforeEach((to, _) => {
  const userStore = useUserStore();
  const { isAuthenticated, user } = storeToRefs(userStore);

  const localUser = localStorage.getItem("user");
  const parsedUser = localUser ? JSON.parse(localUser) : null;
  const userCategory = user.value?.category || parsedUser?.category;

  // Redireciona para login se não estiver autenticado
  if (
    !isAuthenticated.value &&
    !localUser &&
    to.name !== "Login" &&
    to.name !== "Comercial"
  ) {
    return { name: "Login" };
  }

  // Valida role se necessário
  if (to.meta.requiresAuth && to.meta.allowedRoles) {
    if (!userCategory || !to.meta.allowedRoles.includes(userCategory)) {
      // Pode redirecionar para uma página de acesso negado ou home
      return { name: "HeatMap" };
    }
  }

  // Redireciona para Viabilidade se for vendedor ou visitante
  if (userCategory === "convidado") {
    if (to.name !== "Viabilidade") return { name: "Viabilidade" };
  }

  // Exemplo de impedir ir para login se já estiver logado
  if (to.name === "Login" && isAuthenticated.value) return { name: "HeatMap" };
});

export default router;
