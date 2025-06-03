<script lang="ts" setup>
import { APP_BACKEND } from '@/env';
import { ref, computed, onMounted } from 'vue';
import { Plus, Activity } from 'lucide-vue-next';
import type { Flow, FlowRun } from '../types';
import { fetch } from '@tauri-apps/plugin-http';

import FlowList from '@/components/Flow/FlowList.vue';
import FlowRunList from '@/components/Flow/FlowRunList.vue';
import FlowDialog from '@/components/Flow/FlowDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useRouter } from 'vue-router';
import { save } from '@tauri-apps/plugin-dialog';
import { download } from '@tauri-apps/plugin-upload';

const flows = ref<Flow[]>([]);
const runs = ref<FlowRun[]>([]);

const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const currentEditingFlow = ref<Flow | null>(null);
const flowToDelete = ref<Flow | null>(null);

const isCreatingFlow = ref(false);
const isUpdatingFlow = ref(false);
const isDeletingFlow = ref(false);

const flowPage = ref(1);
const runPage = ref(1);
const limit = 20;
const flowTotalPages = ref(1);
const runTotalPages = ref(1);

const loadingFlows = ref(false);
const loadingRuns = ref(false);
const isReloadingFlows = ref(false);
const isReloadingRuns = ref(false);

const router = useRouter();

const fetchFlows = async (isInitialOrReload = false) => {
    if (loadingFlows.value && !isInitialOrReload) return;
    if (!isInitialOrReload && flowPage.value > flowTotalPages.value) return;

    loadingFlows.value = true;
    if (isInitialOrReload) {
        flowPage.value = 1;
        flowTotalPages.value = 1;
    }

    try {
        const res = await fetch(`${APP_BACKEND}/v1/flows?page=${flowPage.value}&limit=${limit}`, {
            method: 'GET',
        });
        const json = await res.json();

        if (isInitialOrReload) {
            flows.value = json.data || [];
        } else {
            flows.value.push(...(json.data || []));
        }

        flowTotalPages.value = json.total || 1;
        if (json.data && json.data.length > 0) {
            flowPage.value += 1;
        } else if (!isInitialOrReload) {
            flowPage.value = flowTotalPages.value + 1;
        }
    } catch (err) {
        console.error('Error fetching flows:', err);
    } finally {
        loadingFlows.value = false;
    }
};

const fetchRuns = async (isInitialOrReload = false) => {
    if (loadingRuns.value && !isInitialOrReload) return;
    if (!isInitialOrReload && runPage.value > runTotalPages.value) return;

    loadingRuns.value = true;
    if (isInitialOrReload) {
        runPage.value = 1;
        runTotalPages.value = 1;
    }

    try {
        const res = await fetch(`${APP_BACKEND}/v1/runs?page=${runPage.value}&limit=${limit}`, {
            method: 'GET',
        });
        const json = await res.json();

        if (isInitialOrReload) {
            runs.value = json.data || [];
        } else {
            runs.value.push(...(json.data || []));
        }

        runTotalPages.value = json.total || 1;
        if (json.data && json.data.length > 0) {
            runPage.value += 1;
        } else if (!isInitialOrReload) {
            runPage.value = runTotalPages.value + 1;
        }
    } catch (err) {
        console.error('Error fetching runs:', err);
    } finally {
        loadingRuns.value = false;
    }
};

const reloadFlows = async () => {
    if (isReloadingFlows.value || loadingFlows.value) return;
    isReloadingFlows.value = true;
    await fetchFlows(true);
    isReloadingFlows.value = false;
};

const reloadRuns = async () => {
    if (isReloadingRuns.value || loadingRuns.value) return;
    isReloadingRuns.value = true;
    await fetchRuns(true);
    isReloadingRuns.value = false;
};

const handleCreateFlow = async (data: { name: string; description?: string }) => {
    if (data.name.trim() === '') return;
    isCreatingFlow.value = true;
    try {
        const res = await fetch(`${APP_BACKEND}/v1/flows`, {
            method: 'POST',
            body: JSON.stringify({
                name: data.name,
                ...(data.description?.trim() ? { description: data.description } : {})
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.status === 201) {
            const newFlow = await res.json();
            flows.value.unshift(newFlow);
            isCreateDialogOpen.value = false;
        } else {
            console.error('Failed to create flow:', await res.text());
        }
    } catch (err) {
        console.error('Error creating flow:', err);
    } finally {
        isCreatingFlow.value = false;
    }
};

const handleEditFlow = async (data: { name: string; description?: string }) => {
    if (!currentEditingFlow.value) return;
    isUpdatingFlow.value = true;
    try {
        const reqBody: { name?: string; description?: string } = {};
        if (data.name.trim()) reqBody.name = data.name.trim();
        if (data.description?.trim()) reqBody.description = data.description.trim();
        else if (data.description === '') reqBody.description = '';

        const res = await fetch(`${APP_BACKEND}/v1/flows/${currentEditingFlow.value.id}`, {
            method: 'PATCH',
            body: JSON.stringify(reqBody),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.status === 200) {
            const updatedFlow = await res.json();
            const index = flows.value.findIndex(f => f.id === updatedFlow.id);
            if (index !== -1) {
                flows.value[index] = updatedFlow;
            } else {
                flows.value.unshift(updatedFlow);
            }
            currentEditingFlow.value = null;
            isEditDialogOpen.value = false;
        } else {
            console.error('Failed to update flow:', await res.text());
        }
    } catch (err) {
        console.error('Error updating flow:', err);
    } finally {
        isUpdatingFlow.value = false;
    }
};

const handleDeleteFlow = async () => {
    if (!flowToDelete.value) return;
    isDeletingFlow.value = true;
    try {
        const res = await fetch(`${APP_BACKEND}/v1/flows/${flowToDelete.value.id}`, { method: 'DELETE' });
        if (res.status === 204) {
            flows.value = flows.value.filter(f => f.id !== flowToDelete.value!.id);
            flowToDelete.value = null;
            isDeleteDialogOpen.value = false;
        } else {
            console.error('Failed to delete flow:', await res.text());
        }
    } catch (err) {
        console.error('Error deleting flow:', err);
    } finally {
        isDeletingFlow.value = false;
    }
};

const loadMoreFlows = () => { fetchFlows(); };
const loadMoreRuns = () => { fetchRuns(); };

const openCreateDialog = () => {
    currentEditingFlow.value = null;
    isCreateDialogOpen.value = true;
};

const openEditDialog = (flowItem: Flow) => {
    currentEditingFlow.value = { ...flowItem };
    isEditDialogOpen.value = true;
};

const openDeleteDialog = (flowItem: Flow) => {
    flowToDelete.value = flowItem;
    isDeleteDialogOpen.value = true;
};

const cancelCreateDialog = () => { isCreateDialogOpen.value = false; };
const cancelEditDialog = () => { currentEditingFlow.value = null; isEditDialogOpen.value = false; };
const cancelDeleteDialog = () => { flowToDelete.value = null; isDeleteDialogOpen.value = false; };

const scrollToFlowRun = () => {
    document.getElementById('flowruns')?.scrollIntoView({ behavior: 'smooth' });
};

onMounted(() => {
    fetchFlows(true);
    fetchRuns(true);
});

const canLoadMoreFlows = computed(() => flowPage.value <= flowTotalPages.value);
const canLoadMoreRuns = computed(() => runPage.value <= runTotalPages.value);

const quickActions = [
    { title: 'Create New Flow', description: 'Start building your workflow', icon: Plus, action: openCreateDialog, color: 'bg-gradient-to-r from-blue-500 to-blue-600', hoverColor: 'hover:from-blue-600 hover:to-blue-700' },
    { title: 'Run History', description: 'View recent flow runs', icon: Activity, action: scrollToFlowRun, color: 'bg-gradient-to-r from-green-500 to-green-600', hoverColor: 'hover:from-green-600 hover:to-green-700' }
];

const onFlowClick = (flow: Flow) => {
    router.push({ path: `/workspace/${flow.id}` });
};

const currentHour = new Date().getHours();
const greeting = computed(() => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 17) return 'Good afternoon';
    return 'Good evening';
});

const handleExport = async (runId: string) => {
    try {
        const path = await save({
            defaultPath: `report-${runId}.pdf`,
            filters: [{
                name: `PDF Document`,
                extensions: ['pdf']
            }]
        })

        if (!path) return;

        await download(
            `${APP_BACKEND}/v1/runs/${runId}/report`,
            path
        )
    } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to generate report. Please try again.");
    }
}

const handleRedirect = (runId: string, flowId: string) => {
    router.push({ path: `flows/${flowId}/runs/${runId}` });
};
</script>

<template>
    <div class="min-h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <!-- Hero Section -->
        <div class="relative overflow-hidden bg-white border-b border-gray-100">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
            <div class="relative px-6 py-8">
                <div class="max-w-7xl mx-auto">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h1 class="text-4xl font-bold text-gray-900 mb-2">
                                {{ greeting }} 👋
                            </h1>
                            <p class="text-lg text-gray-600">
                                Ready to streamline your workflows?
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <div v-for="action in quickActions" :key="action.title" @click="action.action"
                            :class="[action.color, action.hoverColor, 'p-6 rounded-xl text-white cursor-pointer transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl']">
                            <div class="flex items-center justify-between mb-3">
                                <component :is="action.icon" class="h-8 w-8" />
                                <div class="opacity-20">
                                    <component :is="action.icon" class="h-12 w-12" />
                                </div>
                            </div>
                            <h3 class="text-lg font-semibold mb-1">{{ action.title }}</h3>
                            <p class="text-sm opacity-90">{{ action.description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-6 py-8 space-y-8">
            <FlowList :flows="flows" :loading="loadingFlows && !isReloadingFlows" :reloading="isReloadingFlows"
                :can-load-more="canLoadMoreFlows" @load-more="loadMoreFlows" @reload="reloadFlows"
                @edit="openEditDialog" @delete="openDeleteDialog" @item-click="onFlowClick"
                @open-create-dialog="openCreateDialog" />

            <FlowRunList :runs="runs" :loading="loadingRuns && !isReloadingRuns" :reloading="isReloadingRuns"
                :can-load-more="canLoadMoreRuns" @load-more="loadMoreRuns" @reload="reloadRuns"
                @redirect="handleRedirect" @report="handleExport" />
        </div>

        <!-- Dialogs -->
        <FlowDialog v-if="isCreateDialogOpen" v-model:open="isCreateDialogOpen" :loading="isCreatingFlow"
            @submit="handleCreateFlow" @cancel="cancelCreateDialog" />

        <FlowDialog v-if="isEditDialogOpen" v-model:open="isEditDialogOpen" :flow="currentEditingFlow"
            :loading="isUpdatingFlow" @submit="handleEditFlow" @cancel="cancelEditDialog" />

        <ConfirmDialog v-if="isDeleteDialogOpen" v-model:open="isDeleteDialogOpen" :item-name="flowToDelete?.name"
            item-type="flow" :loading="isDeletingFlow" description="This action cannot be undone."
            @confirm="handleDeleteFlow" @cancel="cancelDeleteDialog" />
    </div>
</template>