<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import Canvas from '../components/Canvas.vue';
import Toolbar from '../components/Toolbar.vue';
import { useRouter } from 'vue-router';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import RunDialog from '@/components/RunDialog.vue'

const isSidebarCollapsed = ref(true);
const sidebarWidth = ref(500);
const isResizing = ref(false);
const router = useRouter();
const isToggling = ref(false);
const showMenu = ref(false);

const props = defineProps<{
  flowId: string
}>();

const toggleSidebar = async () => {
  if (isToggling.value) return;

  isToggling.value = true;
  isSidebarCollapsed.value = !isSidebarCollapsed.value;

  setTimeout(() => {
    isToggling.value = false;
  }, 100);
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

const handleKeydown = (e: KeyboardEvent) => {
  if (e.shiftKey && e.key === '\\') {
    e.preventDefault();
    e.stopPropagation();
    toggleSidebar();
  }
};

const openMenu = () => {
  showMenu.value = true;
};

const closeMenu = () => {
  showMenu.value = false;
};

const handleRunStarted = (runId: string) => {
  showMenu.value = false;
  router.push(`/flows/${props.flowId}/runs/${runId}`);
};

onMounted(async () => {
  try {
    await register('Shift+\\', toggleSidebar);
  } catch (error) {
    console.warn('Failed to register global shortcut:', error);
    document.addEventListener('keydown', handleKeydown);
  }

  window.addEventListener('mouseup', stopResize);
  window.addEventListener('mousemove', onResize);
});

onBeforeUnmount(async () => {
  try {
    await unregister('Shift+\\');
  } catch (error) {
    console.warn('Failed to unregister global shortcut:', error);
  }

  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('mouseup', stopResize);
  window.removeEventListener('mousemove', onResize);
});
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

    <!-- Toolbar -->
    <Toolbar @play="openMenu" @home="router.push('/')" />

    <!-- Floating Toggle Button -->
    <div class="fixed bottom-4 left-4 z-50">
      <div class="relative">
        <!-- Dropdown Menu -->
        <div
          class="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 shadow-lg rounded-full overflow-hidden text-sm whitespace-nowrap min-w-max">
          <button @click="toggleSidebar" title="Toggle Menu (⇧ + \)"
            class="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap min-w-max">
            {{ isSidebarCollapsed ? '☰ Open Menu' : '✕ Close Menu' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showMenu" class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all"></div>
    <RunDialog :open="showMenu" :flowId="flowId" @close="closeMenu" @run="handleRunStarted" />
  </div>
</template>

<style scoped></style>