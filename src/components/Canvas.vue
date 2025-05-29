<script lang="ts" setup>
import { ref } from 'vue';
import { X, Move } from 'lucide-vue-next';
import { Endpoint, CanvasEndpoint, methodColors } from '../types';

defineProps<{
    flowId: string | null;
}>();

const canvasEndpoints = ref<CanvasEndpoint[]>([]);
const isDragOver = ref(false);
const draggedEndpoint = ref<CanvasEndpoint | null>(null);
const dragOffset = ref({ x: 0, y: 0 });
const isActivelyDragging = ref(false);

function onCanvasDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
    isDragOver.value = true;
}

function onCanvasDragLeave(event: DragEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        isDragOver.value = false;
    }
}

function onCanvasDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver.value = false;

    const data = event.dataTransfer?.getData('application/json');
    if (!data) return;

    try {
        const dragData = JSON.parse(data);
        if (dragData.type === 'endpoint') {
            const endpoint = dragData.data as Endpoint;
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

            const newCanvasEndpoint: CanvasEndpoint = {
                ...endpoint,
                canvasId: `canvas-${endpoint.id}-${Date.now()}`,
                x: event.clientX - rect.left - 150,
                y: event.clientY - rect.top - 75,
                width: 300,
                height: 150
            };

            canvasEndpoints.value.push(newCanvasEndpoint);
        }
    } catch (error) {
        console.error('Error parsing drag data:', error);
    }
}

function onEndpointMouseDown(event: MouseEvent, endpoint: CanvasEndpoint) {
    if ((event.target as HTMLElement).closest('.delete-btn')) return;

    draggedEndpoint.value = endpoint;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    event.preventDefault();
}

function onMouseMove(event: MouseEvent) {
    if (!draggedEndpoint.value) return;

    const canvas = document.querySelector('.canvas-container') as HTMLElement;
    const canvasRect = canvas.getBoundingClientRect();

    draggedEndpoint.value.x = event.clientX - canvasRect.left - dragOffset.value.x;
    draggedEndpoint.value.y = event.clientY - canvasRect.top - dragOffset.value.y;

    draggedEndpoint.value.x = Math.max(0, Math.min(draggedEndpoint.value.x, canvasRect.width - draggedEndpoint.value.width));
    draggedEndpoint.value.y = Math.max(0, Math.min(draggedEndpoint.value.y, canvasRect.height - draggedEndpoint.value.height));
}

function onMouseUp() {
    draggedEndpoint.value = null;
    dragOffset.value = { x: 0, y: 0 };
}

function removeEndpoint(canvasId: string) {
    const index = canvasEndpoints.value.findIndex(ep => ep.canvasId === canvasId);
    if (index > -1) {
        canvasEndpoints.value.splice(index, 1);
    }
}

document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);
</script>

<template>
    <div class="h-full bg-gray-50 relative overflow-hidden">
        <!-- Canvas Area -->
        <div class="canvas-container w-full h-full relative grid-background" :class="{
            'drag-over-background': isDragOver,
            'grid-background-active': isDragOver
        }" @dragover="onCanvasDragOver" @dragleave="onCanvasDragLeave" @drop="onCanvasDrop">

            <!-- Drop Zone Indicator -->
            <div v-if="isDragOver && canvasEndpoints.length === 0"
                class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div class="text-center">
                    <div class="text-6xl mb-4">📋</div>
                    <p class="text-xl font-semibold text-blue-600">Drop endpoint here</p>
                    <p class="text-sm text-blue-500">Release to add to canvas</p>
                </div>
            </div>

            <!-- Flow Selection Message -->
            <div v-if="!flowId && canvasEndpoints.length === 0 && !isDragOver"
                class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-gray-500">
                    <div class="text-6xl mb-4">🎨</div>
                    <h2 class="text-2xl font-semibold mb-2">Canvas Ready</h2>
                    <p class="text-lg">Drag endpoints from the sidebar to start building your flow</p>
                </div>
            </div>

            <!-- Canvas Endpoints -->
            <div v-for="endpoint in canvasEndpoints" :key="endpoint.canvasId"
                class="absolute bg-white rounded-lg shadow-lg border-2 border-gray-200 cursor-move hover:shadow-xl select-none"
                :class="{
                    'border-blue-400 shadow-2xl z-50 endpoint-dragging': draggedEndpoint?.canvasId === endpoint.canvasId,
                    'hover:border-gray-300 transition-shadow duration-200': draggedEndpoint?.canvasId !== endpoint.canvasId,
                    'transition-none': isActivelyDragging
                }" :style="{
                    left: endpoint.x + 'px',
                    top: endpoint.y + 'px',
                    width: endpoint.width + 'px',
                    minHeight: endpoint.height + 'px',
                    transform: draggedEndpoint?.canvasId === endpoint.canvasId ? 'scale(1.02)' : 'scale(1)',
                    transition: draggedEndpoint?.canvasId === endpoint.canvasId ? 'none' : 'transform 0.2s ease'
                }" @mousedown="onEndpointMouseDown($event, endpoint)">
                <!-- Header -->
                <div class="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
                    <div class="flex items-center space-x-2">
                        <Move :size="16" class="text-gray-400" />
                        <span
                            :class="`px-2 py-1 text-xs font-semibold rounded border ${methodColors[endpoint.method]}`">
                            {{ endpoint.method }}
                        </span>
                    </div>
                    <button @click="removeEndpoint(endpoint.canvasId)"
                        class="delete-btn p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <X :size="16" />
                    </button>
                </div>

                <!-- Content -->
                <div class="p-3 space-y-2">
                    <div>
                        <h3 class="font-semibold text-gray-900 text-sm truncate">{{ endpoint.name }}</h3>
                        <p class="text-xs text-gray-500 font-mono truncate">{{ endpoint.url }}</p>
                    </div>

                    <div v-if="endpoint.description" class="text-xs text-gray-600 line-clamp-2">
                        {{ endpoint.description }}
                    </div>

                    <!-- Quick Info -->
                    <div class="flex flex-wrap gap-1 mt-2">
                        <span v-if="endpoint.parameters && Object.keys(endpoint.parameters).length > 0"
                            class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {{ Object.keys(endpoint.parameters).length }} Params
                        </span>
                        <span v-if="endpoint.headers && Object.keys(endpoint.headers).length > 0"
                            class="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                            {{ Object.keys(endpoint.headers).length }} Headers
                        </span>
                        <span v-if="endpoint.body && Object.keys(endpoint.body).length > 0"
                            class="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">
                            Body
                        </span>
                    </div>
                </div>
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

.canvas-container {
    user-select: none;
    overflow: hidden;
}

.cursor-move:active {
    cursor: grabbing !important;
}

.canvas-container * {
    pointer-events: auto;
}

.canvas-container .endpoint-dragging {
    pointer-events: none;
    will-change: transform;
}

.grid-background {
    background-image:
        linear-gradient(rgba(156, 163, 175, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(156, 163, 175, 0.15) 1px, transparent 1px);
    background-size: 40px 40px;
    background-color: #f9fafb;
    transition: all 0.3s ease;
}

.grid-background-active {
    background-image:
        linear-gradient(rgba(59, 130, 246, 0.25) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.25) 1px, transparent 1px);
    background-size: 40px 40px;
    background-color: #eff6ff;
}

.drag-over-background {
    border: 2px dashed rgba(59, 130, 246, 0.5);
    animation: pulse-border 2s infinite;
}

@keyframes pulse-border {

    0%,
    100% {
        border-color: rgba(59, 130, 246, 0.5);
    }

    50% {
        border-color: rgba(59, 130, 246, 0.8);
    }
}

.grid-background::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image:
        radial-gradient(circle at 40px 40px, rgba(156, 163, 175, 0.2) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    opacity: 0.4;
}

.grid-background-active::before {
    background-image:
        radial-gradient(circle at 40px 40px, rgba(59, 130, 246, 0.3) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.6;
}
</style>