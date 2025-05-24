<script lang="ts" setup>
import { Flow } from '../types';
defineProps<{ flow: Flow, index: number }>();
</script>

<template>
    <div class="border border-gray-200 rounded-md p-4 bg-gray-50 hover:bg-white shadow-sm transition">
        <h3 class="text-lg font-semibold text-gray-800">{{ flow.name }}</h3>
        <p class="text-sm text-gray-600 mt-1">{{ flow.description }}</p>
        <p v-if="flow.sequence" class="text-xs text-gray-400 mt-2">Steps: {{ flow.sequence.length }} | Updated: {{ new
            Date(flow.updatedAt).toLocaleString() }}</p>
    </div>
</template>
