import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import { Command } from '@tauri-apps/plugin-shell';

const server = Command.sidecar('binaries/app');
server.spawn().then(() => {
    console.log("Server started successfully");
});

createApp(App)
    .use(router)
    .mount("#app");
