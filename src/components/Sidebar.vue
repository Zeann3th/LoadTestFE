<script lang="ts" setup>
import { APP_BACKEND } from '../env'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
    Search, ChevronDown, ChevronRight, Folder, FolderOpen
} from 'lucide-vue-next';
import { Endpoint } from '../types';
import { fetch } from '@tauri-apps/plugin-http';
import EndpointListItem from './EndpointListItem.vue';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'vue-sonner';

const endpoints = ref<Endpoint[]>([]);
const searchTerm = ref('');
const isFolderExpanded = ref(true);

const scrollContainer = ref<HTMLElement | null>(null);

const isDragging = ref(false);

const page = ref(1);
const limit = 20;
const totalPages = ref(1);

const loading = ref(false);

const uploadDialogOpen = ref(false);
const uploadLoading = ref(false);
const pendingFile = ref<File | null>(null);
const uploadFormData = ref({
    projectName: ''
});

const fetchEndpoints = async (isInitial = false) => {
    if (loading.value || page.value > totalPages.value) return;
    loading.value = true;

    try {
        if (isInitial) {
            page.value = 1;
            totalPages.value = 1;
            endpoints.value = [];
        }

        const res = await fetch(`${APP_BACKEND}/v1/endpoints?page=${page.value}&limit=${limit}`, {
            method: 'GET',
        });

        if (!res.ok) {
            toast.error(`Failed to fetch endpoints: ${res.status} - ${res.statusText}`);
        }

        const json = await res.json();

        if (isInitial) {
            endpoints.value = json.data;
        } else {
            endpoints.value.push(...json.data);
        }

        totalPages.value = json.total;
        page.value += 1;

    } catch (err) {
        toast.error('Error fetching endpoints: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
        loading.value = false;
    }
};

const handleScroll = () => {
    const el = scrollContainer.value;
    if (!el) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        if (page.value <= totalPages.value && !loading.value) {
            fetchEndpoints();
        }
    }
};

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
    pendingFile.value = file;
    uploadFormData.value.projectName = '';
    uploadDialogOpen.value = true;
};

const handleUploadSubmit = async () => {
    if (!pendingFile.value || !uploadFormData.value.projectName.trim()) return;

    uploadLoading.value = true;

    try {
        const formData = new FormData();
        formData.append('file', pendingFile.value);
        formData.append('projectName', uploadFormData.value.projectName.trim());

        const response = await fetch(`${APP_BACKEND}/v1/endpoints/upload`, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert(`File "${pendingFile.value.name}" uploaded successfully!`);
            page.value = 1;
            await fetchEndpoints(true);
            handleUploadCancel();
        } else {
            toast.error(`Failed uploading file: ${response.status} - ${response.statusText}`);
        }
    } catch (err) {
        toast.error('Error uploading file', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
        uploadLoading.value = false;
    }
};

const handleUploadCancel = () => {
    uploadDialogOpen.value = false;
    pendingFile.value = null;
    uploadFormData.value.projectName = '';
};

const isUploadFormValid = computed(() =>
    uploadFormData.value.projectName.trim() !== ''
);

onMounted(() => {
    fetchEndpoints(true);

    if (scrollContainer.value) {
        scrollContainer.value.addEventListener('scroll', handleScroll);
    }
});

onBeforeUnmount(() => {
    if (scrollContainer.value) {
        scrollContainer.value.removeEventListener('scroll', handleScroll);
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
</script>

<template>
    <div class="relative h-full bg-gray-100 text-gray-900 transition-all duration-200"
        :class="{ 'bg-gray-200 ring-2 ring-blue-400': isDragging }" @dragover="onDragOver" @dragenter="onDragEnter"
        @dragleave="onDragLeave" @drop="onDrop">

        <div class="p-6 h-full overflow-hidden flex flex-col">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-4">Collections</h1>
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
                    <input v-model="searchTerm" type="text" placeholder="Search endpoints..."
                        class="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500" />
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <!-- Endpoints Folder -->
                <div class="p-4 cursor-pointer hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-200"
                    @click="isFolderExpanded = !isFolderExpanded">
                    <component :is="isFolderExpanded ? ChevronDown : ChevronRight" :size="18" />
                    <component :is="isFolderExpanded ? FolderOpen : Folder" :size="18" class="text-blue-500" />
                    <span class="font-semibold text-gray-800">Endpoints</span>
                </div>

                <div v-if="isFolderExpanded" ref="scrollContainer" class="p-4 overflow-y-auto flex-1"
                    @scroll="handleScroll">
                    <div v-if="filteredEndpoints.length === 0 && !loading" class="text-center py-8 text-gray-500">
                        <Search :size="24" class="mx-auto mb-2 text-gray-400" />
                        <p>No endpoints found matching your search.</p>
                    </div>

                    <div v-else class="space-y-2">
                        <EndpointListItem v-for="(endpoint, index) in filteredEndpoints" :key="index"
                            :endpoint="endpoint" :index="index" />
                    </div>

                    <div v-if="loading" class="text-center text-gray-500 text-sm py-4">
                        Loading...
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Dialog -->
        <Dialog :open="uploadDialogOpen" @update:open="uploadDialogOpen = $event">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                    <DialogDescription>
                        Enter a project name for the uploaded file.
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label for="file-name" class="text-right">File</Label>
                        <div class="col-span-3 text-sm text-gray-600">
                            {{ pendingFile?.name }}
                        </div>
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                        <Label for="project-name" class="text-right">Project Name</Label>
                        <Input id="project-name" v-model="uploadFormData.projectName" class="col-span-3"
                            placeholder="Enter project name" :disabled="uploadLoading" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" @click="handleUploadCancel" :disabled="uploadLoading">
                        Cancel
                    </Button>
                    <Button type="button" @click="handleUploadSubmit" :disabled="!isUploadFormValid || uploadLoading">
                        <span v-if="uploadLoading" class="mr-2">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        </span>
                        Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<style scoped></style>