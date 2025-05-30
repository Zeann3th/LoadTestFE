<script lang="ts" setup>
import { computed } from 'vue';

// shadcn-vue components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
    open: boolean;
    title?: string;
    description?: string;
    itemName?: string;
    itemType?: string;
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
}

interface Emits {
    (e: 'update:open', value: boolean): void;
    (e: 'confirm'): void;
    (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    itemName: '',
    itemType: 'item',
    loading: false,
    confirmText: 'Delete',
    cancelText: 'Cancel'
});

const emit = defineEmits<Emits>();

const fullDescription = computed(() => {
    let desc = props.description;

    if (props.itemName) {
        desc += ` This will permanently delete the ${props.itemType} "${props.itemName}" and remove all associated data.`;
    }

    return desc;
});

const handleConfirm = () => {
    emit('confirm');
};

const handleCancel = () => {
    emit('cancel');
    emit('update:open', false);
};

const handleOpenChange = (value: boolean) => {
    emit('update:open', value);
};
</script>

<template>
    <AlertDialog :open="open" @update:open="handleOpenChange">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{{ title }}</AlertDialogTitle>
                <AlertDialogDescription>
                    {{ fullDescription }}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="handleCancel" :disabled="loading">
                    {{ cancelText }}
                </AlertDialogCancel>
                <AlertDialogAction @click="handleConfirm" class="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    :disabled="loading">
                    <span v-if="loading" class="mr-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    </span>
                    {{ confirmText }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>