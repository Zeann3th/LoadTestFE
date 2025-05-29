<script lang="ts" setup>
import { ref, computed } from 'vue';
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import { Endpoint, methodColors } from '../types';

interface Props {
    endpoint: Endpoint;
    index: number;
}

const props = defineProps<Props>();

const isExpanded = ref(false);
const isDraggedOver = ref(false);

function toggleExpanded() {
    isExpanded.value = !isExpanded.value;
}

const onDragStart = (event: DragEvent) => {
    if (event.dataTransfer) {
        event.dataTransfer.setData('application/json', JSON.stringify({
            type: 'endpoint',
            data: props.endpoint
        }));
        event.dataTransfer.effectAllowed = 'copy';
    }
}

const cleanedUrl = computed(() => {
    return props.endpoint.url
        .replace(/{{[^{}]*}}/, '')
        .replace(/^https?:\/\/[^/]+/, '');
});

const onDragEnd = () => {
    isDraggedOver.value = false;
}
</script>

<template>
    <div class="border border-gray-200 rounded-lg mb-2 bg-white shadow-sm transition-all duration-200"
        :class="{ 'opacity-50 transform scale-95': isDraggedOver }" draggable="true" @dragstart="onDragStart"
        @dragend="onDragEnd">
        <!-- Header Row -->
        <div class="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between" @click="toggleExpanded">
            <div class="flex items-center space-x-3 flex-1 overflow-hidden">
                <div class="flex items-center space-x-2 shrink-0">
                    <component :is="isExpanded ? ChevronDown : ChevronRight" :size="16" class="text-gray-600" />
                    <span :class="`px-2 py-1 text-xs font-semibold rounded border ${methodColors[endpoint.method]}`">
                        {{ endpoint.method }}
                    </span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 overflow-hidden">
                        <span class="font-medium text-gray-900 truncate">{{ endpoint.name }}</span>
                        <span class="text-sm text-gray-500 font-mono truncate max-w-[250px]">{{ cleanedUrl }}</span>
                    </div>
                </div>
            </div>
            <!-- Drag handle indicator -->
            <div class="text-gray-400 text-xs opacity-60">
                ⋮⋮
            </div>
        </div>

        <!-- Expanded Details -->
        <div v-if="isExpanded" class="border-t border-gray-200 p-4 bg-gray-50">
            <div class="space-y-3">
                <div>
                    <h4 class="font-semibold text-sm text-gray-700 mb-2">Request Details</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="font-medium text-gray-600">Method:</span>
                            <div class="mt-1">
                                <span
                                    :class="`px-2 py-1 text-xs font-semibold rounded border ${methodColors[endpoint.method]}`">
                                    {{ endpoint.method }}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span class="font-medium text-gray-600">URL:</span>
                            <div
                                class="mt-1 font-mono text-gray-800 bg-white p-2 rounded border border-gray-300 overflow-x-auto whitespace-nowrap">
                                {{ endpoint.url }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div v-if="endpoint.description">
                    <h4 class="font-semibold text-sm text-gray-700 mb-1">Description</h4>
                    <p class="text-sm text-gray-600"
                        style="white-space: normal; max-width: 600px; word-wrap: break-word;">
                        {{ endpoint.description }}
                    </p>
                </div>

                <!-- Parameters -->
                <div v-if="endpoint.parameters">
                    <span class="font-medium text-gray-600">Parameters:</span>
                    <div class="mt-1 bg-white p-2 rounded border border-gray-300 overflow-x-auto">
                        <pre class="text-sm text-gray-800">{{ JSON.stringify(endpoint.parameters, null, 2) }}</pre>
                    </div>
                </div>

                <!-- Headers -->
                <div v-if="endpoint.headers">
                    <span class="font-medium text-gray-600">Headers:</span>
                    <div class="mt-1 bg-white p-2 rounded border border-gray-300 overflow-x-auto">
                        <pre class="text-sm text-gray-800">{{ JSON.stringify(endpoint.headers, null, 2) }}</pre>
                    </div>
                </div>

                <!-- Body -->
                <div v-if="endpoint.body">
                    <span class="font-medium text-gray-600">Body:</span>
                    <div class="mt-1 bg-white p-2 rounded border border-gray-300 overflow-x-auto">
                        <pre class="text-sm text-gray-800">{{ JSON.stringify(endpoint.body, null, 2) }}</pre>
                    </div>
                </div>

                <!-- Timestamps -->
                <div class="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    <div>Created: {{ new Date(endpoint.createdAt).toLocaleDateString() }}</div>
                    <div>Updated: {{ new Date(endpoint.updatedAt).toLocaleDateString() }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add drag cursor when hovering over draggable items */
[draggable="true"] {
    cursor: grab;
}

[draggable="true"]:active {
    cursor: grabbing;
}
</style>