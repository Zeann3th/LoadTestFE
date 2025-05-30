<!-- components/Toolbar.vue -->
<script lang="ts" setup>
const emit = defineEmits(['play', 'settings', 'home']);

const onSettingsClick = () => {
    emit('settings');
};

const onPlayClick = () => {
    emit('play');
};

const onHomeClick = () => {
    emit('home');
};
</script>

<template>
    <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div class="bg-white border border-gray-300 shadow-lg rounded-full px-4 py-2 flex items-center gap-3">
            <!-- Home Icon -->
            <button @click="onHomeClick" class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Home">
                <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" stroke-width="2"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3 9.75L12 3l9 6.75V20a1 1 0 01-1 1h-5.25a.75.75 0 01-.75-.75v-5.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v5.5a.75.75 0 01-.75.75H4a1 1 0 01-1-1V9.75z" />
                </svg>
            </button>

            <!-- Settings Icon -->
            <button @click="onSettingsClick" class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Settings">
                <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            <!-- Play Icon -->
            <button @click="onPlayClick" class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Play">
                <svg class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"></path>
                </svg>
            </button>
        </div>
    </div>
</template>
