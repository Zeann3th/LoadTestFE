<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { Flow } from '../types';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    open: boolean;
    flow?: Flow | null;
    loading?: boolean;
}

interface Emits {
    (e: 'update:open', value: boolean): void;
    (e: 'submit', data: { name: string; description?: string }): void;
    (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
    flow: null,
    loading: false
});

const emit = defineEmits<Emits>();

const formData = ref({
    name: '',
    description: ''
});

const isEditMode = computed(() => props.flow !== null);

const dialogTitle = computed(() =>
    isEditMode.value ? 'Edit Flow' : 'Create New Flow'
);

const dialogDescription = computed(() =>
    isEditMode.value
        ? 'Update the details of your flow.'
        : 'Add a new flow to your workspace. Fill in the details below.'
);

const submitButtonText = computed(() =>
    isEditMode.value ? 'Update Flow' : 'Create Flow'
);

const isFormValid = computed(() =>
    formData.value.name.trim() !== ''
);

watch(() => props.flow, (newFlow) => {
    if (newFlow) {
        formData.value = {
            name: newFlow.name,
            description: newFlow.description || ''
        };
    } else {
        formData.value = {
            name: '',
            description: ' '
        };
    }
}, { immediate: true });

watch(() => props.open, (isOpen) => {
    if (!isOpen) {
        formData.value = {
            name: '',
            description: ''
        };
    } else if (props.flow) {
        formData.value = {
            name: props.flow.name,
            description: props.flow.description || ''
        };
    }
});

const handleSubmit = () => {
    if (isFormValid.value) {
        const submitData: { name: string; description?: string } = {
            name: formData.value.name.trim()
        };

        if (formData.value.description.trim()) {
            submitData.description = formData.value.description.trim();
        }

        emit('submit', submitData);
    }
};

const handleCancel = () => {
    formData.value = {
        name: '',
        description: ''
    };
    emit('cancel');
    emit('update:open', false);
};

const handleOpenChange = (value: boolean) => {
    emit('update:open', value);
};
</script>

<template>
    <Dialog :open="open" @update:open="handleOpenChange">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{{ dialogTitle }}</DialogTitle>
                <DialogDescription>
                    {{ dialogDescription }}
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="flow-name" class="text-right">Name</Label>
                    <Input id="flow-name" v-model="formData.name" class="col-span-3" placeholder="Enter flow name"
                        :disabled="loading" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="flow-description" class="text-right">Description</Label>
                    <Textarea id="flow-description" v-model="formData.description" class="col-span-3"
                        placeholder="Enter flow description (optional)" rows="3" :disabled="loading" />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" @click="handleCancel" :disabled="loading">
                    Cancel
                </Button>
                <Button type="button" @click="handleSubmit" :disabled="!isFormValid || loading">
                    <span v-if="loading" class="mr-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </span>
                    {{ submitButtonText }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>