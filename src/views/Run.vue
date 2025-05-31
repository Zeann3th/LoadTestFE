<script lang="ts" setup>

defineProps<{
    runId: string
}>();

</script>

<template>
    <div class="run-view">
        <h1>Run ID: {{ runId }}</h1>
        <p>This is the run view for run ID: {{ runId }}</p>
        <!-- Additional content can be added here -->
    </div>
</template>