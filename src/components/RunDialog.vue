<script setup lang="ts">
import { APP_BACKEND } from '../env'
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
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'

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
    input: '{}',
    credentials: '[]'
})

const loading = ref(false)

const selectCredentialsFile = async () => {
    try {
        const selected = await openFileDialog({
            multiple: false,
            filters: [{
                name: 'JSON',
                extensions: ['json']
            }, {
                name: 'Text',
                extensions: ['txt']
            }]
        })

        if (selected) {
            const filePath = Array.isArray(selected) ? selected[0] : selected
            const contents = await readTextFile(filePath)

            try {
                JSON.parse(contents)
                options.value.credentials = contents
            } catch (parseError) {
                console.error('Invalid JSON file:', parseError)
                alert('Selected file does not contain valid JSON')
            }
        }
    } catch (error) {
        console.error('Error reading file:', error)
        alert('Error reading file: ' + error)
    }
}

const handleRun = async () => {
    loading.value = true
    try {
        let parsedInput = {}
        let parsedCredentials = []
        try {
            parsedInput = JSON.parse(options.value.input || '{}')
            parsedCredentials = JSON.parse(options.value.credentials || '[]')
        } catch (parseError) {
            console.warn('Invalid JSON input, using empty object:', parseError)
            parsedInput = {}
        }

        const payload = {
            ...options.value,
            input: parsedInput,
            credentials: parsedCredentials
        }

        const response = await fetch(`${APP_BACKEND}/v1/flows/${props.flowId}/run`, {
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
        <DialogContent class="!max-w-5xl !w-full">
            <DialogHeader>
                <DialogTitle>Configure Run</DialogTitle>
                <DialogDescription>Adjust performance test parameters</DialogDescription>
            </DialogHeader>

            <div class="grid grid-cols-2 gap-8 py-4">
                <!-- Left Column -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Test Parameters</h3>

                    <!-- CCU -->
                    <div class="space-y-2">
                        <Label for="ccu" class="text-sm font-medium">Concurrent Users</Label>
                        <Input id="ccu" v-model="options.ccu" type="number" placeholder="100" />
                    </div>

                    <!-- Threads -->
                    <div class="space-y-2">
                        <Label for="threads" class="text-sm font-medium">Threads</Label>
                        <Input id="threads" v-model="options.threads" type="number" placeholder="2" />
                    </div>

                    <!-- Duration -->
                    <div class="space-y-2">
                        <Label for="duration" class="text-sm font-medium">Duration (seconds)</Label>
                        <Input id="duration" v-model="options.duration" type="number" placeholder="360" />
                    </div>

                    <!-- Ramp Up Time -->
                    <div class="space-y-2">
                        <Label for="rampup" class="text-sm font-medium">Ramp Up Time (seconds)</Label>
                        <Input id="rampup" v-model="options.rampUpTime" type="number" placeholder="200" />
                    </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Configuration Data</h3>

                    <!-- Credentials JSON -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label for="credentials" class="text-sm font-medium">Credentials</Label>
                            <Button variant="outline" size="sm" @click="selectCredentialsFile">
                                Select File
                            </Button>
                        </div>
                        <Codemirror id="credentials" v-model="options.credentials" :extensions="extensions"
                            :style="{ height: '140px' }" placeholder="[]" class="border rounded-lg" />
                    </div>

                    <!-- Input JSON -->
                    <div class="space-y-2">
                        <Label for="input" class="text-sm font-medium">Additional Input</Label>
                        <Codemirror id="input" v-model="options.input" :extensions="extensions"
                            :style="{ height: '140px' }" placeholder="{}" class="border rounded-lg" />
                    </div>
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