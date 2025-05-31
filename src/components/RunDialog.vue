<script setup lang="ts">
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { Label } from '@/components/ui/label'
import { ref } from 'vue'
import type { RunOptions } from '@/types'
import { fetch } from '@tauri-apps/plugin-http'

const props = defineProps<{
    open: boolean
    flowId: string
}>()

const emit = defineEmits(['close', 'run'])

const extensions = [json()]

const options = ref<RunOptions>({
    ccu: 100,
    threads: 2,
    duration: 360,
    rampUpTime: 200,
    input: '{}'
})

const loading = ref(false)

const handleRun = async () => {
    loading.value = true
    try {
        let parsedInput = {}
        try {
            parsedInput = JSON.parse(options.value.input || '{}')
        } catch (parseError) {
            console.warn('Invalid JSON input, using empty object:', parseError)
            parsedInput = {}
        }

        const payload = {
            ...options.value,
            input: parsedInput
        }

        const response = await fetch(`http://localhost:31347/v1/flows/${props.flowId}/run`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (response.ok) {
            const data = await response.json()
            const runId = data.id
            emit('run', runId)
            emit('close')
        } else {
            console.error('Failed to start run:', response.statusText)
        }
    } catch (error) {
        console.error('Error starting run:', error)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="emit('close')">
        <DialogContent class="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Configure Run</DialogTitle>
                <DialogDescription>Adjust performance test parameters</DialogDescription>
            </DialogHeader>
            <div class="space-y-4 py-4">
                <!-- CCU -->
                <div>
                    <Label for="ccu" class="text-right">Concurrent Users</Label>
                    <Input id="ccu" v-model="options.ccu" type="number" placeholder="100" />
                </div>
                <!-- Threads -->
                <div>
                    <Label for="threads" class="text-right">Threads</Label>
                    <Input id="threads" v-model="options.threads" type="number" placeholder="Threads" />
                </div>
                <!-- Duration -->
                <div>
                    <Label for="duration" class="text-right">Duration (s)</Label>
                    <Input id="duration" v-model="options.duration" type="number" placeholder="Duration (s)" />
                </div>
                <!-- Ramp Up Time -->
                <div>
                    <Label for="rampup" class="text-right">Ramp Up Time</Label>
                    <Input id="rampup" v-model="options.rampUpTime" type="number" placeholder="Ramp-up time (s)" />
                </div>
                <!-- Input JSON -->
                <div>
                    <Label for="input" class="text-right">Additional Input</Label>
                    <Codemirror id="input" v-model="options.input" :extensions="extensions" :style="{ height: '200px' }"
                        placeholder="{}" class="border rounded-lg" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="secondary" :disabled="loading" @click="emit('close')">Cancel</Button>
                <Button @click="handleRun" :disabled="loading">
                    <span v-if="loading"
                        class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {{ loading ? 'Running...' : 'Run' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>