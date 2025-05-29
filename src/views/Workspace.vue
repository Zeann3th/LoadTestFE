<script lang="ts" setup>
import { ref } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import Canvas from '../components/Canvas.vue';
import { useRouter } from 'vue-router';

const isSidebarCollapsed = ref(false);
const sidebarWidth = ref(500);
const isResizing = ref(false);
const router = useRouter();
const showMenu = ref(false);

defineProps<{
  flowId: string
}>();

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
  if (newWidth > 500 && newWidth < 900) {
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
      <Sidebar />

      <!-- Drag handle -->
      <div class="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-gray-600 transition-colors"
        @mousedown="startResize"></div>
    </div>

    <!-- Canvas -->
    <div class="flex-1 h-full overflow-auto">
      <Canvas :flowId="flowId" />
    </div>

    <!-- Floating Toggle Button -->
    <div class="fixed bottom-4 left-4 z-50">
      <div class="relative">
        <!-- Menu Toggle Button -->
        <button @click="showMenu = !showMenu"
          class="bg-white border border-gray-300 shadow-lg px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition-all duration-200 font-medium whitespace-nowrap min-w-max">
          ☰ Menu
        </button>

        <!-- Dropdown Menu -->
        <div v-if="showMenu"
          class="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden text-sm whitespace-nowrap min-w-max">
          <button @click="router.push('/')"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap min-w-max">
            ← Go Back
          </button>
          <button @click="toggleSidebar"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap min-w-max">
            {{ isSidebarCollapsed ? '☰ Open Menu' : '✕ Close Menu' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>