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

const cleanedEndpointName = computed(() => {
    return props.endpoint.name.split('/').pop() || props.endpoint.name;
});

const projectName = computed(() => {
    return props.endpoint.name.split('/')[0] || 'Miscellaneous';
});

const onDragEnd = () => {
    isDraggedOver.value = false;
}
</script>

<template>
    <div class="border rounded-md mb-1.5 bg-white shadow-sm transition hover:shadow-md"
        :class="{ 'opacity-50 scale-95': isDraggedOver }" draggable="true" @dragstart="onDragStart"
        @dragend="onDragEnd">
        <!-- Header -->
        <div class="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between group"
            @click="toggleExpanded">
            <div class="flex items-center space-x-2.5 flex-1 overflow-hidden">
                <component :is="isExpanded ? ChevronDown : ChevronRight" :size="14" class="text-gray-500 shrink-0" />
                <span :class="`px-1.5 py-0.5 text-sm font-medium rounded ${methodColors[endpoint.method]}`">
                    {{ endpoint.method }}
                </span>
                <span class="font-medium text-gray-900 truncate text-sm">
                    {{ cleanedEndpointName }}
                </span>
                <span class="text-sm text-gray-500 font-mono truncate">
                    {{ cleanedUrl }}
                </span>
                <span class="text-sm text-gray-400 ml-auto shrink-0">
                    {{ projectName }}
                </span>
            </div>
            <div class="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition ml-2 shrink-0">⋮⋮</div>
        </div>

        <!-- Expanded -->
        <div v-if="isExpanded" class="border-t bg-gray-50/50">
            <div class="p-3 space-y-2.5 text-sm">
                <!-- Request Info -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div class="space-y-2">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-500 w-16">Method</span>
                            <span :class="`px-1.5 py-0.5 text-sm font-medium rounded ${methodColors[endpoint.method]}`">
                                {{ endpoint.method }}
                            </span>
                        </div>

                        <div v-if="endpoint.description" class="flex space-x-2">
                            <span class="text-sm font-medium text-gray-500 w-16 mt-0.5">Info</span>
                            <p class="text-sm text-gray-600 leading-relaxed">
                                {{ endpoint.description }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- URL -->
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-gray-500 w-16">URL</span>
                    <code
                        class="text-sm bg-white px-2 py-1 rounded border font-mono text-gray-800 flex-1 overflow-x-auto">
            {{ endpoint.url }}
          </code>
                </div>

                <!-- Parameters -->
                <div v-if="endpoint.parameters" class="bg-white border rounded">
                    <div class="px-2.5 py-1.5 bg-gray-50 border-b flex justify-between">
                        <span class="text-sm font-medium text-gray-700">Parameters</span>
                        <span class="text-sm text-gray-500">{{ Object.keys(endpoint.parameters).length }} items</span>
                    </div>
                    <div class="p-2.5 max-h-32 overflow-auto">
                        <pre class="text-sm text-gray-800 whitespace-pre-wrap">
              {{ JSON.stringify(endpoint.parameters, null, 2) }}
            </pre>
                    </div>
                </div>

                <!-- Headers -->
                <div v-if="endpoint.headers" class="bg-white border rounded">
                    <div class="px-2.5 py-1.5 bg-gray-50 border-b flex justify-between">
                        <span class="text-sm font-medium text-gray-700">Headers</span>
                        <span class="text-sm text-gray-500">{{ Object.keys(endpoint.headers).length }} items</span>
                    </div>
                    <div class="p-2.5 max-h-32 overflow-auto">
                        <pre class="text-sm text-gray-800 whitespace-pre-wrap"
                            v-text="JSON.stringify(endpoint.headers, null, 2)" />
                    </div>
                </div>

                <!-- Body -->
                <div v-if="endpoint.body" class="bg-white border rounded">
                    <div class="px-2.5 py-1.5 bg-gray-50 border-b">
                        <span class="text-sm font-medium text-gray-700">Request Body</span>
                    </div>
                    <div class="p-2.5 max-h-40 overflow-auto">
                        <pre class="text-sm text-gray-800 whitespace-pre-wrap"
                            v-text="JSON.stringify(endpoint.body, null, 2)" />
                    </div>
                </div>

                <!-- Timestamps -->
                <div class="flex justify-between text-xs text-gray-400">
                    <span>Created at: {{ new Date(endpoint.createdAt).toLocaleDateString() }}</span>
                    <span>Updated at: {{ new Date(endpoint.updatedAt).toLocaleDateString() }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
[draggable="true"] {
    cursor: grab;
}

[draggable="true"]:active {
    cursor: grabbing;
}

.overflow-auto::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

.overflow-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.overflow-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>