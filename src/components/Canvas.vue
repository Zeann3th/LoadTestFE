<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { Connection, Position, VueFlow, useVueFlow } from '@vue-flow/core';
import { Controls } from '@vue-flow/controls';
import { Background } from '@vue-flow/background';
import { Endpoint, CanvasEndpoint, VueFlowNode, VueFlowEdge } from '../types';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import CanvasNode from './CanvasNode.vue';
import { fetch } from '@tauri-apps/plugin-http';
import { debounce } from '../utils';

const props = defineProps<{
    flowId: string | null;
}>();

const canvasEndpoints = ref<CanvasEndpoint[]>([]);
const isDragOver = ref(false);

const { onConnect, addNodes, removeNodes, addEdges, project } = useVueFlow();

const nodes = ref<VueFlowNode[]>([]);
const edges = ref<VueFlowEdge[]>([]);

const connectionSequence = computed<string[]>(() => {
    if (nodes.value.length === 0 || edges.value.length === 0) return [];

    const inDegree = new Map<string, number>();
    const outEdges = new Map<string, string[]>();

    nodes.value.forEach(node => {
        inDegree.set(node.id, 0);
        outEdges.set(node.id, []);
    });

    edges.value.forEach(edge => {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        outEdges.get(edge.source)?.push(edge.target);
    });

    const queue: string[] = [];
    const result: string[] = [];

    inDegree.forEach((degree, nodeId) => {
        if (degree === 0) queue.push(nodeId);
    });

    while (queue.length > 0) {
        const current = queue.shift();
        if (current) {
            result.push(current);
            const neighbors = outEdges.get(current) || [];
            neighbors.forEach(neighbor => {
                inDegree.set(neighbor, (inDegree.get(neighbor) || 1) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            });
        }
    }

    return result;
});

async function saveSequence(sequence: string[]) {
    try {
        await fetch(`http://localhost:31347/v1/flows/${props.flowId}`, {
            method: 'PATCH',
            body: JSON.stringify({ sequence }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (err) {
        console.error('Failed to save execution order:', err);
    }
}

const debouncedSaveOrder = debounce((order: string[]) => {
    saveSequence(order);
}, 1000);

watch(connectionSequence, (newOrder) => {
    console.log('Connection order updated:', newOrder);
    if (newOrder.length > 0) {
        debouncedSaveOrder([...newOrder]);
    }
});

onConnect((connection: Connection) => {
    console.log('New connection:', connection);
    const newEdge: VueFlowEdge = {
        id: `edge-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
    };
    addEdges([newEdge]);
});

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

const onCanvasDrop = (event: DragEvent) => {
    event.preventDefault();
    isDragOver.value = false;

    const data = event.dataTransfer?.getData('application/json');
    if (!data) return;

    try {
        const dragData = JSON.parse(data);
        if (dragData.type === 'endpoint') {
            const endpoint = dragData.data as Endpoint;
            const canvasElement = event.currentTarget as HTMLElement;
            const canvasRect = canvasElement.getBoundingClientRect();
            const canvasX = event.clientX - canvasRect.left;
            const canvasY = event.clientY - canvasRect.top;
            const flowPosition = project({ x: canvasX, y: canvasY });

            const newCanvasEndpoint: CanvasEndpoint = {
                ...endpoint,
                canvasId: `canvas-${endpoint.id}-${Date.now()}`,
                x: flowPosition.x,
                y: flowPosition.y,
                width: 300,
                height: 150
            };

            canvasEndpoints.value.push(newCanvasEndpoint);

            const newNode: VueFlowNode = {
                id: newCanvasEndpoint.canvasId,
                type: 'endpoint',
                position: { x: flowPosition.x, y: flowPosition.y },
                data: {
                    endpoint: newCanvasEndpoint,
                    onDelete: () => removeEndpoint(newCanvasEndpoint.canvasId)
                },
                sourcePosition: Position.Right,
                targetPosition: Position.Left
            };

            addNodes([newNode]);
        }
    } catch (error) {
        console.error('Error parsing drag data:', error);
    }
}

function removeEndpoint(canvasId: string) {
    const index = canvasEndpoints.value.findIndex(ep => ep.canvasId === canvasId);
    if (index > -1) {
        canvasEndpoints.value.splice(index, 1);
    }
    removeNodes([canvasId]);
}

const nodeTypes = {
    endpoint: CanvasNode
};
</script>

<template>
    <div class="h-full bg-gray-50 relative overflow-hidden">
        <VueFlow v-model:nodes="nodes" v-model:edges="edges" :node-types="nodeTypes" class="vue-flow-container"
            :default-viewport="{ zoom: 1 }" :default-edge-options="{ type: 'smoothstep', animated: true }"
            fit-view-on-init @dragover="onCanvasDragOver" @dragleave="onCanvasDragLeave" @drop="onCanvasDrop">

            <Background pattern-color="#e5e7eb" :gap="40" variant="lines" :class="{ 'bg-blue-50': isDragOver }" />
            <Controls position="bottom-right" />

            <div v-if="isDragOver && nodes.length === 0"
                class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div class="text-center">
                    <div class="text-6xl mb-4">📋</div>
                    <p class="text-xl font-semibold text-blue-600">Drop endpoint here</p>
                    <p class="text-sm text-blue-500">Release to add to canvas</p>
                </div>
            </div>

            <div v-if="!flowId && nodes.length === 0 && !isDragOver"
                class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="text-center text-gray-500">
                    <div class="text-6xl mb-4">🎨</div>
                    <h2 class="text-2xl font-semibold mb-2">Canvas Ready</h2>
                    <p class="text-lg">Drag endpoints from the sidebar to start building your flow</p>
                </div>
            </div>
        </VueFlow>

        <!-- ✅ Show only if edges exist -->
        <div v-if="edges.length > 0 && connectionSequence.length > 0"
            class="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border max-w-xs z-20">
            <h4 class="font-semibold text-sm mb-2 flex items-center">
                🔗 Execution Order:
            </h4>
            <div class="space-y-1 max-h-48 overflow-y-auto">
                <div v-for="(nodeId, index) in connectionSequence" :key="nodeId"
                    class="text-xs flex items-center space-x-2">
                    <span class="font-mono text-gray-600 bg-gray-100 px-1 rounded">{{ index + 1 }}</span>
                    <span class="truncate">
                        {{canvasEndpoints.find(ep => ep.canvasId === nodeId)?.name || 'Unknown'}}
                    </span>
                </div>
            </div>
        </div>

        <div v-if="nodes.length > 1 && edges.length === 0"
            class="absolute top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs z-20">
            <p class="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> Drag from the small circles on the right side of nodes to the left side of
                other nodes to create connections!
            </p>
        </div>
    </div>
</template>

<style scoped>
.vue-flow-container {
    height: 100%;
    width: 100%;
}

:deep(.vue-flow__handle) {
    width: 12px;
    height: 12px;
    border: 2px solid #3b82f6;
    background: white;
}

:deep(.vue-flow__handle-right) {
    right: -6px;
}

:deep(.vue-flow__handle-left) {
    left: -6px;
}

:deep(.vue-flow__handle:hover) {
    background: #3b82f6;
    transform: scale(1.2);
}

:deep(.vue-flow__edge) {
    stroke-width: 2px;
}

:deep(.vue-flow__edge.selected) {
    stroke-width: 3px;
}

:deep(.vue-flow__controls) {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.vue-flow__minimap) {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
}
</style>
