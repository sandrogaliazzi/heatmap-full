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

import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: LoginView,
    },

    {
      path: "/heatmap",
      name: "HeatMap",
      component: HeatMapView,
    },
    {
      path: "/",
      redirect: "/heatmap",
    },
    {
      path: "/dashboard",
      component: DashboardView,
      children: [
        {
          path: "",
          component: AdminPanel,
        },
        {
          path: "/users",
          name: "user-list",
          component: UserList,
        },
        {
          path: "/logs",
          name: "logs-list",
          component: LogsList,
        },
        {
          path: "/camera",
          name: "camera-list",
          component: CameraList,
        },
      ],
    },
    {
      path: "/comercial",
      name: "Comercial",
      component: DashboardComercial,
    },
    {
      path: "/:pathMatch(.*)*",
      component: PageNotFoundView,
    },
  ],
});

router.beforeEach((to, from) => {
  const user = useUserStore();
  const { isAuthenticated } = storeToRefs(user);

  //if (to.name == "Comercial") return { name: "Comercial" };

  if (
    // make sure the user is authenticated
    !isAuthenticated.value &&
    !localStorage.getItem("user") &&
    // ❗️ Avoid an infinite redirect
    to.name !== "Login" &&
    to.name !== "Comercial"
  ) {
    // redirect the user to the login page
    return { name: "Login" };
  }

  //if (to.name === "Login" && user.isAuthenticated) return { name: "HeatMap" };
});

export default router;
