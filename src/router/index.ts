import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Workspace from "../views/Workspace.vue";
import Run from "@/views/Run.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "Home",
      component: Home,
      meta: {
        title: "Home",
      }
    },
    {
      path: "/workspace/:flowId",
      name: "Workspace",
      props: true,
      component: Workspace,
      meta: {
        title: "Workspace",
      }
    },
    {
      path: "/flows/:flowId/runs/:runId",
      name: "Flow Run",
      props: true,
      component: Run,
      meta: {
        title: "Flow Run",
      }
    }
  ]
});

router.beforeEach(async (to, _, next) => {
  document.title = to.meta.title || "Postman";
  next();
});

export default router;
