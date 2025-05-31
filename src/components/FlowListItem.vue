<script lang="ts" setup>
import { computed } from 'vue';
import { Flow } from '../types';

const props = defineProps<{
    flow: Flow;
    index: number;
    showActions?: boolean;
}>();

defineEmits<{
    edit: [flow: Flow];
    delete: [flow: Flow];
}>();

const formattedDate = computed(() => {
    return new Date(props.flow.updatedAt).toLocaleDateString('en-US', {
        timeZone: "Asia/Ho_Chi_Minh",
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

const isRecent = computed(() => {
    const updatedDate = new Date(props.flow.updatedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
});
</script>

<template>
    <div class="w-full">
        <div class="flex items-center gap-2 mb-1">
            <h3 class="font-semibold text-gray-900 truncate">
                {{ flow.name }}
            </h3>
            <span v-if="isRecent"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                New
            </span>
        </div>
        <p class="text-gray-600 line-clamp-2 text-sm mb-1">
            {{ flow.description }}
        </p>
        <div class="text-xs text-gray-500">
            Last updated: {{ formattedDate }}
        </div>
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    /* autoprefixer: off */
    -webkit-box-orient: vertical;
    /* autoprefixer: on */
    overflow: hidden;
}
</style>