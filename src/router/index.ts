import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

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
    }
  ]
});

router.beforeEach(async (to, _, next) => {
  document.title = to.meta.title || "Postman";
  next();
});

export default router;
