<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import type { FlowRun } from '@/types';
import FlowRunListItem from './FlowRunListItem.vue';
import { Button } from '@/components/ui/button';

const props = defineProps<{
    runs: FlowRun[];
    loading: boolean;
    reloading: boolean;
    canLoadMore: boolean;
}>();

const emit = defineEmits<{
    (e: 'load-more'): void;
    (e: 'reload'): void;
    (e: 'redirect', runId: string, flowId: string): void;
    (e: 'report', runId: string): void;
}>();

const runScrollContainer = ref<HTMLElement | null>(null);

const handleRunScroll = () => {
    const el = runScrollContainer.value;
    if (!el || props.loading || props.reloading || !props.canLoadMore) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        emit('load-more');
    }
};

const handleRunClick = (run: FlowRun) => {
    if (run.status === 'PENDING' || run.status === 'RUNNING') {
        emit('redirect', run.id, run.flowId);
    } else if (run.status === 'COMPLETED') {
        emit('report', run.id);
    }
};

onMounted(() => {
    if (runScrollContainer.value) {
        runScrollContainer.value.addEventListener('scroll', handleRunScroll);
    }
});

onBeforeUnmount(() => {
    if (runScrollContainer.value) {
        runScrollContainer.value.removeEventListener('scroll', handleRunScroll);
    }
});
</script>

<template>
    <div id="flowruns" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-4 pt-6 pb-4">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">Recent Runs</h2>
                <Button @click="emit('reload')" variant="outline" size="default"
                    :disabled="props.reloading || props.loading"
                    class="px-3 py-2 flex items-center gap-2 hover:bg-gray-50">
                    <RefreshCw :class="['h-4 w-4', { 'animate-spin': props.reloading }]" />
                    <span class="hidden sm:inline">Reload</span>
                </Button>
            </div>
        </div>

        <div v-if="props.runs.length === 0 && !props.loading && !props.reloading" class="text-center py-16">
            <p class="text-gray-500">No runs found yet.</p>
        </div>

        <div v-else ref="runScrollContainer" class="max-h-96 overflow-y-auto">
            <div class="divide-y divide-gray-100">
                <div v-for="(run) in props.runs" :key="run.id"
                    class="group hover:bg-gray-50 transition-colors p-4 cursor-pointer" @click="handleRunClick(run)">
                    <FlowRunListItem :run="run" :index="props.runs.indexOf(run)" />
                </div>
            </div>

            <div v-if="props.loading && !props.reloading" class="text-center text-gray-500 text-sm py-8">
                <div class="inline-flex items-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading more runs...
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
