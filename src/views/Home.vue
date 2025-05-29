<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Search } from 'lucide-vue-next';
import { Flow } from '../types';
import { fetch } from '@tauri-apps/plugin-http';
import FlowListItem from '../components/FlowListItem.vue';
import { useRouter } from 'vue-router';

const flows = ref<Flow[]>([]);
const searchTerm = ref('');
const flowScrollContainer = ref<HTMLElement | null>(null);

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

const handleFlowScroll = () => {
    const el = flowScrollContainer.value;
    if (!el) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        if (flowPage.value <= flowTotalPages.value && !loadingFlows.value) {
            fetchFlows();
        }
    }
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
    <div class="h-full flex flex-col p-6 bg-white rounded shadow">
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
                class="mb-2 cursor-pointer hover:bg-gray-100 rounded transition-colors" @click="onFlowClick(flow)">
                <FlowListItem :flow="flow" :index="index" />
            </div>

            <div v-if="loadingFlows" class="text-center text-gray-500 text-sm py-4">
                Loading...
            </div>
        </div>
    </div>
</template>

<style scoped></style>
