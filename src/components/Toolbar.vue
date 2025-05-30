<!-- components/Toolbar.vue -->
<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
const emit = defineEmits<{
    (e: 'play'): void;
    (e: 'home'): void;
}>();

const onPlayClick = () => {
    emit('play');
};

const onHomeClick = () => {
    emit('home');
};

onMounted(async () => {
    await register('CmdOrCtrl+Shift+H', () => {
        onHomeClick();
    });
    await register('CmdOrCtrl+Shift+P', () => {
        onPlayClick();
    });
});

onBeforeUnmount(async () => {
    await unregister('CmdOrCtrl+Shift+H');
    await unregister('CmdOrCtrl+Shift+P');
});

</script>

<template>
    <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div class="bg-white border border-gray-300 shadow-lg rounded-full px-4 py-2 flex items-center gap-3">
            <!-- Home Icon -->
            <button @click="onHomeClick" class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Home (⌘ + ⇧ + H)">
                <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" stroke-width="2"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1h-5.25a.75.75 0 01-.75-.75v-5.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v5.5a.75.75 0 01-.75.75H4a1 1 0 01-1-1V9.75z" />
                </svg>
            </button>

            <!-- Play Icon -->
            <button @click="onPlayClick" class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Play (⌘ + ⇧ + P)">
                <svg class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"></path>
                </svg>
            </button>
        </div>
    </div>
</template>
