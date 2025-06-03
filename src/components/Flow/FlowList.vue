<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Search, Plus, Edit, Trash2, Activity, RefreshCw } from 'lucide-vue-next';
import type { Flow } from '../../types';
import FlowListItem from './FlowListItem.vue';
import { Button } from '@/components/ui/button';

const props = defineProps<{
    flows: Flow[];
    loading: boolean;
    reloading: boolean;
    canLoadMore: boolean;
}>();

const emit = defineEmits<{
    (e: 'load-more'): void;
    (e: 'reload'): void;
    (e: 'edit', flow: Flow): void;
    (e: 'delete', flow: Flow): void;
    (e: 'item-click', flow: Flow): void;
    (e: 'open-create-dialog'): void;
}>();

const searchTerm = ref('');
const flowScrollContainer = ref<HTMLElement | null>(null);

const filteredFlows = computed(() =>
    props.flows.filter(flow =>
        flow.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        (flow.description && flow.description.toLowerCase().includes(searchTerm.value.toLowerCase()))
    )
);

const handleFlowScroll = () => {
    const el = flowScrollContainer.value;
    if (!el || props.loading || props.reloading || !props.canLoadMore) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        emit('load-more');
    }
};

onMounted(() => {
    if (flowScrollContainer.value) {
        flowScrollContainer.value.addEventListener('scroll', handleFlowScroll);
    }
});

onBeforeUnmount(() => {
    if (flowScrollContainer.value) {
        flowScrollContainer.value.removeEventListener('scroll', handleFlowScroll);
    }
});

watch(() => props.flows, () => {
    // If list is externally reset (e.g. after reload and initial items are few),
    // scroll might not be at top. Ensure it is to avoid incorrect "bottom" detection.
    if (flowScrollContainer.value && flowScrollContainer.value.scrollTop !== 0 && filteredFlows.value.length < (props.flows.length / 2)) { // Heuristic
        // flowScrollContainer.value.scrollTop = 0; // Or reconsider this if it causes issues
    }
}, { deep: true });

</script>

<template>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-4 pt-6 pb-4">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">Flows</h2>
                <Button @click="emit('reload')" variant="outline" size="default"
                    :disabled="props.reloading || props.loading"
                    class="px-3 py-2 flex items-center gap-2 hover:bg-gray-50">
                    <RefreshCw :class="['h-4 w-4', { 'animate-spin': props.reloading }]" />
                    <span class="hidden sm:inline">Reload</span>
                </Button>
            </div>
        </div>

        <div class="relative m-4">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
            <input v-model="searchTerm" type="text" placeholder="Search flows..."
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
        </div>

        <div v-if="filteredFlows.length === 0 && !props.loading && !props.reloading" class="text-center py-16">
            <div class="max-w-md mx-auto">
                <div class="bg-gray-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Activity class="h-12 w-12 text-gray-400" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">
                    {{ searchTerm ? 'No flows found matching your search.' : 'No flows yet.' }}
                </h3>
                <p class="text-gray-500 mb-6">
                    {{ searchTerm ?
                        'Try adjusting your search terms or create a new flow.' :
                        'Create your first flow to get started.' }}
                </p>
                <Button @click="emit('open-create-dialog')" class="inline-flex items-center gap-2">
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
                        <div class="flex-1 cursor-pointer min-w-0" @click="emit('item-click', flow)">
                            <FlowListItem :flow="flow" :index="index" />
                        </div>
                        <div
                            class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button variant="ghost" size="sm" @click.stop="emit('edit', flow)" class="h-8 w-8 p-0">
                                <Edit class="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" @click.stop="emit('delete', flow)"
                                class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="props.loading && !props.reloading" class="text-center text-gray-500 text-sm py-8">
                <div class="inline-flex items-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading more flows...
                </div>
            </div>
        </div>
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