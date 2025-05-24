<script lang="ts" setup>
import { ref } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import Canvas from '../components/Canvas.vue';

const isSidebarCollapsed = ref(false);
const sidebarWidth = ref(500);
const isResizing = ref(false);

const selectedFlowId = ref<string | null>(null);

const handleFlowSelection = (id: string) => {
  selectedFlowId.value = id;
};

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  e.preventDefault();
};

const stopResize = () => {
  isResizing.value = false;
};

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  const newWidth = e.clientX;
  if (newWidth > 500 && newWidth < 600) {
    sidebarWidth.value = newWidth;
  }
};

window.addEventListener('mouseup', stopResize);
window.addEventListener('mousemove', onResize);
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <div v-if="!isSidebarCollapsed" class="h-full bg-gray-800 text-white relative"
      :style="{ width: sidebarWidth + 'px', minWidth: '150px', maxWidth: '600px' }">
      <Sidebar @flow-selected="handleFlowSelection" />

      <!-- Drag handle -->
      <div class="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-gray-600 transition-colors"
        @mousedown="startResize"></div>
    </div>

    <!-- Canvas -->
    <div class="flex-1 h-full overflow-auto">
      <Canvas :flowId="selectedFlowId" />
    </div>

    <!-- Floating Toggle Button -->
    <button @click="toggleSidebar"
      class="fixed bottom-4 left-4 z-50 bg-white border border-gray-300 shadow-lg px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition-all duration-200 font-medium">
      {{ isSidebarCollapsed ? '☰ Open Menu' : '✕ Close Menu' }}
    </button>
  </div>
</template>

<style scoped></style>