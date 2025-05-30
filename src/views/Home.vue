<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Search, Plus, Edit, Trash2 } from 'lucide-vue-next';
import { Flow } from '../types';
import { fetch } from '@tauri-apps/plugin-http';
import FlowListItem from '../components/FlowListItem.vue';
import FlowDialog from '../components/FlowDialog.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useRouter } from 'vue-router';

// shadcn-vue components
import { Button } from '@/components/ui/button';

const flows = ref<Flow[]>([]);
const searchTerm = ref('');
const flowScrollContainer = ref<HTMLElement | null>(null);

// Dialog states
const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const currentEditingFlow = ref<Flow | null>(null);
const flowToDelete = ref<Flow | null>(null);

// Loading states
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

function onFlowClick(flow: Flow) {
    router.push({ path: `/workspace/${flow.id}` });
}
</script>

<template>
    <div class="h-full flex flex-col p-6 bg-white rounded shadow relative">
        <h1 class="text-3xl font-bold mb-6">Flows</h1>

        <div class="relative mb-4 w-full max-w-md">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
            <input v-model="searchTerm" type="text" placeholder="Search flows..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div ref="flowScrollContainer" class="overflow-y-auto flex-1 border border-gray-200 rounded p-4"
            style="max-height: 600px;">
            <div v-if="filteredFlows.length === 0 && !loadingFlows" class="text-center py-8 text-gray-500">
                No flows found matching your search.
            </div>

            <div v-for="(flow, index) in filteredFlows" :key="flow.id"
                class="mb-2 group hover:bg-gray-50 rounded transition-colors border border-gray-100 p-3">
                <div class="flex items-center justify-between">
                    <div class="flex-1 cursor-pointer" @click="onFlowClick(flow)">
                        <FlowListItem :flow="flow" :index="index" />
                    </div>
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" @click.stop="openEditDialog(flow)" class="h-8 w-8 p-0">
                            <Edit class="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" @click.stop="openDeleteDialog(flow)"
                            class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div v-if="loadingFlows" class="text-center text-gray-500 text-sm py-4">
                Loading...
            </div>
        </div>

        <!-- Floating Add Button -->
        <Button @click="openCreateDialog"
            class="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
            size="icon">
            <Plus class="h-6 w-6" />
        </Button>

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

<style scoped></style>