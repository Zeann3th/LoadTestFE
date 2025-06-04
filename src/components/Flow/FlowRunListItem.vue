<script lang="ts" setup>
import { FlowRun } from '@/types';
import { computed } from 'vue';


interface Props {
    run: FlowRun;
    index: number;
}

const props = defineProps<Props>();

const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-green-500';
        case 'RUNNING':
            return 'bg-blue-500';
        case 'PENDING':
            return 'bg-yellow-500';
        case 'FAILED':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-green-100 text-green-800';
        case 'RUNNING':
            return 'bg-blue-100 text-blue-800';
        case 'PENDING':
            return 'bg-yellow-100 text-yellow-800';
        case 'FAILED':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const formatDuration = (seconds: number) => {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const slicedRunId = computed(() => {
    return props.run.id.substring(0, 6)
})
</script>

<template>
    <div class="flex items-center justify-between w-full">
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
                <div class="flex items-center gap-2">
                    <div :class="[
                        'w-3 h-3 rounded-full',
                        getStatusColor(run.status)
                    ]"></div>
                    <span :class="[
                        'text-sm font-medium px-2 py-1 rounded-full',
                        getStatusBadgeClass(run.status)
                    ]">
                        {{ run.status }}
                    </span>
                </div>
                <span class="text-sm text-gray-500" :title="run.id">
                    Run #{{ slicedRunId }}
                </span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <span class="text-gray-500">CCU:</span>
                    <span class="font-medium ml-1">{{ run.ccu.toLocaleString() }}</span>
                </div>
                <div>
                    <span class="text-gray-500">Threads:</span>
                    <span class="font-medium ml-1">{{ run.threads }}</span>
                </div>
                <div>
                    <span class="text-gray-500">Duration:</span>
                    <span class="font-medium ml-1">{{ formatDuration(run.duration) }}</span>
                </div>
                <div>
                    <span class="text-gray-500">Ramp Up:</span>
                    <span class="font-medium ml-1">{{ formatDuration(run.rampUpTime) }}</span>
                </div>
            </div>
            <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <div>
                    <span>Created:</span>
                    <span class="ml-1">{{ formatDate(run.createdAt) }}</span>
                </div>
                <div v-if="run.status === 'COMPLETED'">
                    <span>Completed:</span>
                    <span class="ml-1">{{ formatDate(run.updatedAt) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>