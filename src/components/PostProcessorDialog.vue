<script setup lang="ts">
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: boolean
    initialScript: string
    endpointName: string
    executionIndex: number
    loading: boolean
    error: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'save', script: string): void
}>()

const extensions = [json()]
const script = ref('')
const localError = ref('')

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            script.value = props.initialScript || '{}'
        }
    },
    { immediate: true }
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
    if (!validateJson(script.value)) {
        localError.value = 'Invalid JSON. Please enter a valid JSON object.'
        return
    }
    emit('save', script.value)
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
                <Codemirror id="input" v-model="script" :extensions="extensions" :style="{ height: '200px' }"
                    placeholder="{}" class="border rounded-lg" :disabled="loading" />
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
