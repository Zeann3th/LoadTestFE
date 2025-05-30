<script setup lang="ts">
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ref } from 'vue'
import type { RunOptions } from '@/types'
import { fetch } from '@tauri-apps/plugin-http'

const props = defineProps<{
    open: boolean
    flowId: string
}>()
const rawInput = ref('');
const emit = defineEmits(['close', 'run'])

const options = ref<RunOptions>({
    ccu: 100,
    threads: 2,
    duration: 360,
    rampUpTime: 200,
    input: ''
})

const loading = ref(false)

const handleRun = async () => {
    const payload = {
        ...options.value,
        input: rawInput.value ? JSON.parse(rawInput.value) : {}
    }
    loading.value = true
    await fetch(`http://localhost:31347/v1/flows/${props.flowId}/run`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    })
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
                <Label for="ccu" class="text-right">Concurrent Users</Label>
                <Input id="ccu" v-model="options.ccu" type="number" placeholder="100" />
                <!-- Threads -->
                <Label for="threads" class="text-right">Threads</Label>
                <Input id="threads" v-model="options.threads" type="number" placeholder="Threads" />
                <!-- Duration -->
                <Label for="duration" class="text-right">Duration (s)</Label>
                <Input id="duration" v-model="options.duration" type="number" placeholder="Duration (s)" />
                <!-- Ramp Up Time -->
                <Label for="ccu" class="text-right">Ramp Up Time</Label>
                <Input v-model="options.rampUpTime" type="number" placeholder="Ramp-up time (s)" />
                <!-- Input JSON -->
                <Label for="input" class="text-right">Additional Input</Label>
                <Textarea id="input" v-model="rawInput" placeholder="Enter JSON input here..." />
            </div>
            <DialogFooter>
                <Button variant="secondary" :disabled="loading" @click="emit('close')">Cancel</Button>
                <Button @click="handleRun">
                    <span v-if="loading"
                        class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {{ loading ? 'Running...' : 'Run' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
