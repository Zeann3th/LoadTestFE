<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
    Search, ChevronDown, ChevronRight, Folder, FolderOpen, Upload
} from 'lucide-vue-next';
import { Endpoint, Flow } from '../types';
import { fetch } from '@tauri-apps/plugin-http';
import EndpointListItem from './EndpointListItem.vue';
import FlowListItem from './FlowListItem.vue';

const endpoints = ref<Endpoint[]>([]);
const flows = ref<Flow[]>([]);
const searchTerm = ref('');
const isEndpointFolderExpanded = ref(false);
const isFlowFolderExpanded = ref(false);

const endpointScrollContainer = ref<HTMLElement | null>(null);
const flowScrollContainer = ref<HTMLElement | null>(null);

const isDragging = ref(false);

const endpointPage = ref(1);
const flowPage = ref(1);
const limit = 20;

const endpointTotalPages = ref(1);
const flowTotalPages = ref(1);

const loadingEndpoints = ref(false);
const loadingFlows = ref(false);

const emit = defineEmits<{
    (e: 'flowSelected', id: string): void;
}>();

const fetchEndpoints = async (isInitial = false) => {
    if (loadingEndpoints.value || endpointPage.value > endpointTotalPages.value) return;
    loadingEndpoints.value = true;

    try {
        const res = await fetch(`http://localhost:31347/v1/endpoints?page=${endpointPage.value}&limit=${limit}`, {
            method: 'GET',
        });
        const json = await res.json();

        if (isInitial) {
            endpoints.value = json.data;
        } else {
            endpoints.value.push(...json.data);
        }

        endpointTotalPages.value = json.total;

        endpointPage.value += 1;

    } catch (err) {
        console.error('Error fetching endpoints:', err);
    } finally {
        loadingEndpoints.value = false;
    }
};

const fetchFlows = async (isInitial = false) => {
    if (loadingFlows.value || flowPage.value > flowTotalPages.value) return;
    loadingFlows.value = true;

    try {
        const res = await fetch(`http://localhost:31347/v1/flows?page=${flowPage.value}&limit=${limit}`, {
            method: 'GET',
        });
        const json = await res.json();

        if (isInitial) {
            flows.value = json.data;
        } else {
            flows.value.push(...json.data);
        }

        flowTotalPages.value = json.total;

        flowPage.value += 1;

    } catch (err) {
        console.error('Error fetching flows:', err);
    } finally {
        loadingFlows.value = false;
    }
};

const handleEndpointScroll = () => {
    const el = endpointScrollContainer.value;
    if (!el) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        if (endpointPage.value <= endpointTotalPages.value && !loadingEndpoints.value) {
            fetchEndpoints();
        }
    }
};

const handleFlowScroll = () => {
    const el = flowScrollContainer.value;
    if (!el) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        if (flowPage.value <= flowTotalPages.value && !loadingFlows.value) {
            fetchFlows();
        }
    }
};

// Drag and Drop Handlers
const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = true;
};

const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = true;
};

const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(e.relatedTarget as Node)) {
        isDragging.value = false;
    }
};

const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = false;

    if (!e.dataTransfer || !e.dataTransfer.files.length) return;

    const file = e.dataTransfer.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:31347/v1/endpoints/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert(`File "${file.name}" uploaded successfully!`);
            endpointPage.value = 1;
            await fetchEndpoints(true);
        } else {
            alert(`Upload failed with status: ${response.status}`);
        }
    } catch (err) {
        console.error('Upload error:', err);
        alert('Error uploading file.');
    }
};

onMounted(() => {
    fetchEndpoints(true);
    fetchFlows(true);

    if (endpointScrollContainer.value) {
        endpointScrollContainer.value.addEventListener('scroll', handleEndpointScroll);
    }
    if (flowScrollContainer.value) {
        flowScrollContainer.value.addEventListener('scroll', handleFlowScroll);
    }
});

onBeforeUnmount(() => {
    if (endpointScrollContainer.value) {
        endpointScrollContainer.value.removeEventListener('scroll', handleEndpointScroll);
    }
    if (flowScrollContainer.value) {
        flowScrollContainer.value.removeEventListener('scroll', handleFlowScroll);
    }
});

const filteredEndpoints = computed(() =>
    endpoints.value.filter(endpoint =>
        endpoint.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        endpoint.method.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        endpoint.url.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
);

const filteredFlows = computed(() =>
    flows.value.filter(flow =>
        flow.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        flow.description.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
);
</script>

<template>
    <div class="relative h-full bg-gray-100 text-gray-900 transition-all duration-200"
        :class="{ 'bg-gray-200 ring-2 ring-blue-400': isDragging }" @dragover="onDragOver" @dragenter="onDragEnter"
        @dragleave="onDragLeave" @drop="onDrop">

        <!-- Drag overlay -->
        <div v-if="isDragging"
            class="absolute inset-0 bg-blue-600 bg-opacity-40 flex items-center justify-center pointer-events-none border-2 border-dashed border-blue-400 z-50">
            <div class="text-center">
                <Upload class="mx-auto mb-4 text-white" :size="48" />
                <p class="text-white text-xl font-bold mb-2">Drop file to upload</p>
                <p class="text-blue-100 text-sm">Release to upload your file</p>
            </div>
        </div>

        <div class="p-6 h-full overflow-hidden flex flex-col">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-4">Collections</h1>
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
                    <input v-model="searchTerm" type="text" placeholder="Search endpoints or flows..."
                        class="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500" />
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <!-- Endpoints Folder -->
                <div class="p-4 cursor-pointer hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-200"
                    @click="isEndpointFolderExpanded = !isEndpointFolderExpanded">
                    <component :is="isEndpointFolderExpanded ? ChevronDown : ChevronRight" :size="18" />
                    <component :is="isEndpointFolderExpanded ? FolderOpen : Folder" :size="18" class="text-blue-500" />
                    <span class="font-semibold text-gray-800">Endpoints</span>
                </div>

                <div v-if="isEndpointFolderExpanded" ref="endpointScrollContainer" class="p-4 overflow-y-auto flex-1"
                    @scroll="handleEndpointScroll">
                    <div v-if="filteredEndpoints.length === 0 && !loadingEndpoints"
                        class="text-center py-8 text-gray-500">
                        <Search :size="24" class="mx-auto mb-2 text-gray-400" />
                        <p>No endpoints found matching your search.</p>
                    </div>

                    <div v-else class="space-y-2">
                        <EndpointListItem v-for="(endpoint, index) in filteredEndpoints" :key="index"
                            :endpoint="endpoint" :index="index" />
                    </div>

                    <div v-if="loadingEndpoints" class="text-center text-gray-500 text-sm py-4">
                        Loading...
                    </div>
                </div>

                <!-- Flows Folder -->
                <div class="p-4 cursor-pointer hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-200"
                    @click="isFlowFolderExpanded = !isFlowFolderExpanded">
                    <component :is="isFlowFolderExpanded ? ChevronDown : ChevronRight" :size="18" />
                    <component :is="isFlowFolderExpanded ? FolderOpen : Folder" :size="18" class="text-green-600" />
                    <span class="font-semibold text-gray-800">Flows</span>
                </div>

                <div v-if="isFlowFolderExpanded" ref="flowScrollContainer" class="p-4 overflow-y-auto flex-1"
                    @scroll="handleFlowScroll">
                    <div v-if="filteredFlows.length === 0 && !loadingFlows" class="text-center py-8 text-gray-500">
                        <Search :size="24" class="mx-auto mb-2 text-gray-400" />
                        <p>No flows found matching your search.</p>
                    </div>

                    <div v-for="(flow, index) in filteredFlows" :key="flow.id" @click="emit('flowSelected', flow.id)"
                        class="cursor-pointer hover:bg-gray-100 rounded transition-colors">
                        <FlowListItem :flow="flow" :index="index" />
                    </div>

                    <div v-if="loadingFlows" class="text-center text-gray-500 text-sm py-4">
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
