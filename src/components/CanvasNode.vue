<script lang="ts" setup>
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { Move, X } from 'lucide-vue-next'
import { methodColors } from '../types'

const props = defineProps<NodeProps<any>>()
</script>

<template>
    <div class="endpoint-node bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:shadow-xl select-none"
        style="width: 300px; min-height: 150px; position: relative;">
        <!-- Connection Handles -->
        <Handle type="target" :position="Position.Left" :connectable="props.connectable" :style="{ zIndex: 10 }" />
        <Handle type="source" :position="Position.Right" :connectable="props.connectable" :style="{ zIndex: 10 }" />

        <!-- Header -->
        <div class="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
            <div class="flex items-center space-x-2 vue-flow__drag-handle">
                <Move :size="16" class="text-gray-400" />
                <span
                    :class="'px-2 py-1 text-xs font-semibold rounded border ' + methodColors[props.data.endpoint.method]">
                    {{ props.data.endpoint.method }}
                </span>
            </div>
            <button @click="props.data.onDelete"
                class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                <X :size="16" />
            </button>
        </div>

        <!-- Content -->
        <div class="p-3 space-y-2">
            <div>
                <h3 class="font-semibold text-gray-900 text-sm truncate">
                    {{ props.data.endpoint.name }}
                </h3>
                <p class="text-xs text-gray-500 font-mono truncate">
                    {{ props.data.endpoint.url }}
                </p>
            </div>

            <div v-if="props.data.endpoint.description" class="text-xs text-gray-600 line-clamp-2">
                {{ props.data.endpoint.description }}
            </div>

            <div class="flex flex-wrap gap-1 mt-2">
                <span v-if="props.data.endpoint.parameters && Object.keys(props.data.endpoint.parameters).length > 0"
                    class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    {{ Object.keys(props.data.endpoint.parameters).length }} Params
                </span>
                <span v-if="props.data.endpoint.headers && Object.keys(props.data.endpoint.headers).length > 0"
                    class="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                    {{ Object.keys(props.data.endpoint.headers).length }} Headers
                </span>
                <span v-if="props.data.endpoint.body && Object.keys(props.data.endpoint.body).length > 0"
                    class="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">
                    Body
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.endpoint-node {
    transition: all 0.2s ease;
}

/* .endpoint-node:hover {
    transform: translateY(-1px);
} */
</style>
