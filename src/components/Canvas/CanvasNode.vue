<script lang="ts" setup>
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { Move, X, Settings } from 'lucide-vue-next'
import { ref } from 'vue'
import { fetch } from '@tauri-apps/plugin-http'
import PostProcessorDialog from './PostProcessorDialog.vue'
import { APP_BACKEND } from '@/env'
import { methodColors } from '@/types'

const props = defineProps<NodeProps<any>>()

const showDialog = ref(false)
const postProcessorText = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const openEditDialog = () => {
    const processor = props.data.endpoint.postProcessor
    postProcessorText.value = typeof processor === 'string'
        ? processor
        : JSON.stringify(processor ?? {}, null, 2)

    errorMessage.value = ''
    showDialog.value = true
}

const closeDialog = () => {
    showDialog.value = false
    postProcessorText.value = ''
    errorMessage.value = ''
}

const savePostProcessor = async (script: string) => {
    if (!props.data.flowId || !props.data.executionIndex) {
        errorMessage.value = 'Missing flow ID or execution index'
        return
    }

    try {
        isLoading.value = true
        errorMessage.value = ''

        const response = await fetch(`${APP_BACKEND}/v1/flows/${props.data.flowId}/processor`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sequence: props.data.executionIndex,
                postProcessor: JSON.parse(script)
            })
        })

        if (response.ok) {
            console.log('Post-processor saved successfully')
            if (props.data.endpoint) {
                props.data.endpoint.postProcessor = script
            }
            closeDialog()
        } else {
            const errorText = await response.text()
            errorMessage.value = `Failed to save: ${response.status} ${errorText}`
        }
    } catch (error) {
        console.error('Error saving post-processor:', error)
        errorMessage.value = error instanceof Error ? error.message : 'Unknown error occurred'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div>
        <div class="endpoint-node bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:shadow-xl select-none"
            style="width: 300px; min-height: 150px; position: relative;" @dblclick="openEditDialog">

            <Handle type="target" :position="Position.Left" :connectable="props.connectable" :style="{ zIndex: 10 }" />
            <Handle type="source" :position="Position.Right" :connectable="props.connectable" :style="{ zIndex: 10 }" />

            <div class="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
                <div class="flex items-center space-x-2 vue-flow__drag-handle">
                    <Move :size="16" class="text-gray-400" />
                    <span
                        :class="'px-2 py-1 text-xs font-semibold rounded border ' + methodColors[props.data.endpoint.method]">
                        {{ props.data.endpoint.method }}
                    </span>
                    <span v-if="props.data.executionIndex > 0"
                        class="px-2 py-1 text-xs font-bold bg-blue-500 text-white rounded-full">
                        {{ props.data.executionIndex }}
                    </span>
                </div>
                <div class="flex items-center space-x-1">
                    <button @click.stop="openEditDialog"
                        class="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Configure postprocessor">
                        <Settings :size="16" />
                    </button>
                    <button @click="props.data.onDelete"
                        class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <X :size="16" />
                    </button>
                </div>
            </div>

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
                    <span
                        v-if="props.data.endpoint.parameters && Object.keys(props.data.endpoint.parameters).length > 0"
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
                    <span v-if="props.data.endpoint.postProcessor"
                        class="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                        Post-processor
                    </span>
                </div>
            </div>
        </div>

        <PostProcessorDialog v-model="showDialog" :initialScript="postProcessorText"
            :endpointName="props.data.endpoint.name" :executionIndex="props.data.executionIndex" :loading="isLoading"
            :error="errorMessage" @save="savePostProcessor" />
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
    cursor: pointer;
}

.endpoint-node:hover {
    border-color: #93c5fd;
}

textarea::-webkit-scrollbar {
    width: 8px;
}

textarea::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
