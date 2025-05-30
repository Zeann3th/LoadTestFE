<script setup lang="ts">
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: boolean
    initialScript: string | object
    endpointName: string
    executionIndex: number
    loading: boolean
    error: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'save', script: string): void
}>()

const scriptText = ref(
    typeof props.initialScript === 'object'
        ? JSON.stringify(props.initialScript, null, 2)
        : props.initialScript
)
const localError = ref('')

watch(
    () => props.initialScript,
    (newVal) => {
        scriptText.value = typeof newVal === 'object'
            ? JSON.stringify(newVal, null, 2)
            : newVal
        localError.value = ''
    }
)

const validateJson = (text: string): boolean => {
    try {
        JSON.parse(text)
        return true
    } catch {
        return false
    }
}

const onSave = () => {
    if (!validateJson(scriptText.value)) {
        localError.value = 'Invalid JSON. Please enter a valid JSON object.'
        return
    }
    emit('save', scriptText.value)
    localError.value = ''
}
</script>

<template>
    <Dialog :open="modelValue" @update:open="val => emit('update:modelValue', val)">
        <DialogContent class="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Configure Post-processor</DialogTitle>
                <DialogDescription>
                    Configure the post-processor for step {{ executionIndex }}: {{ endpointName }}
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4">
                <Textarea v-model="scriptText" class="h-64 font-mono text-sm"
                    placeholder="Enter post-processor script as JSON... (supports 'extract', 'delay' (in ms))"
                    :disabled="loading" />
                <div v-if="localError || error"
                    class="p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                    {{ localError || error }}
                </div>
                <div class="p-3 bg-primary/10 border border-primary rounded-lg text-primary text-sm">
                    <strong>Tip:</strong> Provide a JSON object to extract values or delay (in ms) from the response.
                </div>
            </div>

            <DialogFooter>
                <Button variant="secondary" @click="emit('update:modelValue', false)" :disabled="loading">
                    Cancel
                </Button>
                <Button @click="onSave" :disabled="loading">
                    <span v-if="loading"
                        class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {{ loading ? 'Saving...' : 'Save' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>