<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Search, Plus, Edit, Trash2, Activity } from 'lucide-vue-next';
import { Flow } from '../types';
import { fetch } from '@tauri-apps/plugin-http';
import FlowListItem from '../components/FlowListItem.vue';
import FlowDialog from '../components/FlowDialog.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useRouter } from 'vue-router';

import { Button } from '@/components/ui/button';

const flows = ref<Flow[]>([]);
const searchTerm = ref('');
const flowScrollContainer = ref<HTMLElement | null>(null);

const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const currentEditingFlow = ref<Flow | null>(null);
const flowToDelete = ref<Flow | null>(null);

const isCreatingFlow = ref(false);
const isUpdatingFlow = ref(false);
const isDeletingFlow = ref(false);

const flowPage = ref(1);
const limit = 20;
const flowTotalPages = ref(1);
const loadingFlows = ref(false);

const router = useRouter();

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

const handleCreateFlow = async (data: { name: string; description: string }) => {
    if (data.name.trim() === '' || data.description.trim() === '') return;

    isCreatingFlow.value = true;
    try {
        const res = await fetch('http://localhost:31347/v1/flows', {
            method: 'POST',
            body: JSON.stringify({
                name: data.name,
                description: data.description
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 201) {
            const newFlow = await res.json();
            flows.value.unshift(newFlow);
            isCreateDialogOpen.value = false;
        } else {
            console.error('Failed to create flow:', res.statusText);
        }
    } catch (err) {
        console.error('Error creating flow:', err);
    } finally {
        isCreatingFlow.value = false;
    }
};

const handleEditFlow = async (data: { name: string; description: string }) => {
    if (!currentEditingFlow.value) return;

    const req = {
        ...(data.name.trim() !== '' ? { name: data.name } : {}),
        ...(data.description.trim() !== '' ? { description: data.description } : {})
    };

    isUpdatingFlow.value = true;
    try {
        const res = await fetch(`http://localhost:31347/v1/flows/${currentEditingFlow.value.id}`, {
            method: 'PATCH',
            body: JSON.stringify(req),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 200) {
            const updatedFlow = await res.json();
            const index = flows.value.findIndex(f => f.id === updatedFlow.id);
            if (index !== -1) {
                flows.value[index] = updatedFlow;
            }
            currentEditingFlow.value = null;
            isEditDialogOpen.value = false;
        } else {
            console.error('Failed to update flow:', res.statusText);
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
        const res = await fetch(`http://localhost:31347/v1/flows/${flowToDelete.value.id}`, {
            method: 'DELETE'
        });

        if (res.status === 204) {
            flows.value = flows.value.filter(f => f.id !== flowToDelete.value!.id);
            flowToDelete.value = null;
            isDeleteDialogOpen.value = false;
        } else {
            console.error('Failed to delete flow:', res.statusText);
        }
    } catch (err) {
        console.error('Error deleting flow:', err);
    } finally {
        isDeletingFlow.value = false;
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

const openCreateDialog = () => {
    currentEditingFlow.value = null;
    isCreateDialogOpen.value = true;
};

const openEditDialog = (flowItem: Flow) => {
    currentEditingFlow.value = flowItem;
    isEditDialogOpen.value = true;
};

const openDeleteDialog = (flowItem: Flow) => {
    flowToDelete.value = flowItem;
    isDeleteDialogOpen.value = true;
};

const cancelCreateDialog = () => {
    currentEditingFlow.value = null;
    isCreateDialogOpen.value = false;
};

const cancelEditDialog = () => {
    currentEditingFlow.value = null;
    isEditDialogOpen.value = false;
};

const cancelDeleteDialog = () => {
    flowToDelete.value = null;
    isDeleteDialogOpen.value = false;
};

onMounted(() => {
    fetchFlows(true);
    if (flowScrollContainer.value) {
        flowScrollContainer.value.addEventListener('scroll', handleFlowScroll);
    }
});

onBeforeUnmount(() => {
    if (flowScrollContainer.value) {
        flowScrollContainer.value.removeEventListener('scroll', handleFlowScroll);
    }
});

const filteredFlows = computed(() =>
    flows.value.filter(flow =>
        flow.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        flow.description.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
);

const quickActions = [
    {
        title: 'Create New Flow',
        description: 'Start building your workflow',
        icon: Plus,
        action: openCreateDialog,
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    }
];

function onFlowClick(flow: Flow) {
    router.push({ path: `/workspace/${flow.id}` });
}

const currentHour = new Date().getHours();
const greeting = computed(() => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 17) return 'Good afternoon';
    return 'Good evening';
});
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

                    <!-- Quick Actions -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Flows List -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <!-- Search -->
                <div class="px-4 pt-6">
                    <div class="relative w-full">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
                        <input v-model="searchTerm" type="text" placeholder="Search flows..."
                            class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                    </div>
                </div>
                <div v-if="filteredFlows.length === 0 && !loadingFlows" class="text-center py-16">
                    <div class="max-w-md mx-auto">
                        <div
                            class="bg-gray-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <Activity class="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">
                            {{ searchTerm ? 'No flows found' : 'No flows yet' }}
                        </h3>
                        <p class="text-gray-500 mb-6">
                            {{ searchTerm ? 'Try adjusting your search terms' : 'Create your first flow to get started'
                            }}
                        </p>
                        <Button @click="openCreateDialog" class="inline-flex items-center gap-2">
                            <Plus class="h-4 w-4" />
                            Create Flow
                        </Button>
                    </div>
                </div>

                <div v-else ref="flowScrollContainer" class="max-h-96 overflow-y-auto">
                    <div class="divide-y divide-gray-100">
                        <div v-for="(flow, index) in filteredFlows" :key="flow.id"
                            class="group hover:bg-gray-50 transition-colors">
                            <div class="flex items-center justify-between p-4">
                                <div class="flex-1 cursor-pointer" @click="onFlowClick(flow)">
                                    <FlowListItem :flow="flow" :index="index" />
                                </div>
                                <div
                                    class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" @click.stop="openEditDialog(flow)"
                                        class="h-8 w-8 p-0">
                                        <Edit class="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" @click.stop="openDeleteDialog(flow)"
                                        class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="loadingFlows" class="text-center text-gray-500 text-sm py-8">
                        <div class="inline-flex items-center gap-2">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Loading...
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Flow Dialog -->
        <FlowDialog v-model:open="isCreateDialogOpen" :loading="isCreatingFlow" @submit="handleCreateFlow"
            @cancel="cancelCreateDialog" />

        <!-- Edit Flow Dialog -->
        <FlowDialog v-model:open="isEditDialogOpen" :flow="currentEditingFlow" :loading="isUpdatingFlow"
            @submit="handleEditFlow" @cancel="cancelEditDialog" />

        <!-- Delete Confirmation Dialog -->
        <ConfirmDialog v-model:open="isDeleteDialogOpen" :item-name="flowToDelete?.name" item-type="flow"
            :loading="isDeletingFlow" description="This action cannot be undone." @confirm="handleDeleteFlow"
            @cancel="cancelDeleteDialog" />
    </div>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>