import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { Command } from '@tauri-apps/plugin-shell';

async function startApp() {
    try {
        const server = Command.sidecar('binaries/app');
        await server.spawn();
        console.log("Server started successfully");

        createApp(App)
            .use(router)
            .mount("#app");
    } catch (error) {
        console.error("Failed to start server:", error);
    }
}

startApp();