<script lang="ts" setup>
import { useRouter } from 'vue-router';

defineProps<{
    runId: string,
    flowId: string
}>();

const router = useRouter();

</script>

<template>
    <div class="fixed bottom-4 left-4 z-50">
        <div class="relative">
            <!-- Dropdown Menu -->
            <div
                class="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 shadow-lg rounded-full overflow-hidden text-sm whitespace-nowrap min-w-max">
                <button @click="router.push(`/workspace/${flowId}`)" title="Toggle Menu (⇧ + \)"
                    class="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap min-w-max">
                    {{ isSidebarCollapsed ? '☰ Open Menu' : '✕ Close Menu' }}
                </button>
            </div>
        </div>
    </div>
</template>