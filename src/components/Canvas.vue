<script lang="ts" setup>
defineProps<{
    flowId: string | null;
}>();

</script>

<template>
    <h1 v-if="!flowId">Hello</h1>
    <h1 v-if="flowId">Selected Flow {{ flowId }}</h1>
</template>

<style scoped></style>
