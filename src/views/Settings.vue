<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Database, Workflow, History, AlertTriangle, ArrowLeft, Bug } from 'lucide-vue-next';
import { fetch } from '@tauri-apps/plugin-http';

const router = useRouter();
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
import { APP_BACKEND } from '@/env';
import { toast } from 'vue-sonner';

const goBack = () => {
    router.push('/');
};

const confirmationDialog = ref({
    open: false,
    title: '',
    description: '',
    action: null as (() => void) | null,
    loading: false
});

const deleteRuns = async () => {
    const res = await fetch(`${APP_BACKEND}/v1/runs`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        toast.error('Failed to delete runs');
        confirmationDialog.value.loading = false;
        return;
    }
    confirmationDialog.value.loading = false;
    confirmationDialog.value.open = false;
};

const deleteAllEndpoints = async () => {
    const res = await fetch(`${APP_BACKEND}/v1/endpoints`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        toast.error('Failed to delete endpoints');
        confirmationDialog.value.loading = false;
        return;
    }
    confirmationDialog.value.loading = false;
    confirmationDialog.value.open = false;
};

const deleteAllFlows = async () => {
    const res = await fetch(`${APP_BACKEND}/v1/flows`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        toast.error('Failed to delete flows');
        confirmationDialog.value.loading = false;
        return;
    }
    confirmationDialog.value.loading = false;
    confirmationDialog.value.open = false;
};

const showConfirmation = (title: string, description: string, action: () => void) => {
    confirmationDialog.value = {
        open: true,
        title,
        description,
        action,
        loading: false
    };
};

const handleConfirm = async () => {
    if (confirmationDialog.value.action) {
        confirmationDialog.value.loading = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        confirmationDialog.value.action();
    }
};

const generalSettings = [
    {
        title: 'Delete Previous Runs',
        description: 'Remove all historical run data and execution logs to free up storage space.',
        icon: History,
        action: () => showConfirmation(
            'Delete Previous Runs?',
            'This will permanently delete all run history and execution logs. This action cannot be undone.',
            deleteRuns
        ),
        variant: 'default' as const,
        buttonText: 'Clear History'
    },
    {
        title: 'Report an Issue',
        description: 'If you encounter any bugs or issues, please report them to help us improve the application.',
        icon: Bug,
        action: () => open('https://github.com/Zeann3th/LoadTestFE/issues'),
        variant: 'default' as const,
        buttonText: 'Report Issue'
    }
];

const dangerZoneSettings = [
    {
        title: 'Delete All Endpoints',
        description: 'Permanently remove all API endpoints and their configurations from your workspace.',
        icon: Database,
        action: () => showConfirmation(
            'Delete All Endpoints?',
            'This will permanently delete all endpoints and their configurations. All API connections will be lost and this action cannot be undone.',
            deleteAllEndpoints
        ),
        variant: 'destructive' as const,
        buttonText: 'Delete Endpoints'
    },
    {
        title: 'Delete All Flows',
        description: 'Remove all workflow configurations and automation flows from your account.',
        icon: Workflow,
        action: () => showConfirmation(
            'Delete All Flows?',
            'This will permanently delete all workflow configurations and automation flows. All automated processes will stop and this action cannot be undone.',
            deleteAllFlows
        ),
        variant: 'destructive' as const,
        buttonText: 'Delete Flows'
    }
];
</script>

<template>
    <div class="max-w-6xl mx-auto p-6 space-y-8">
        <!-- Page Header with Back Button -->
        <div class="flex items-center gap-4">
            <Button @click="goBack" variant="ghost" size="sm" class="flex items-center gap-2 hover:bg-gray-100">
                <ArrowLeft class="h-4 w-4" />
                Back
            </Button>
            <div class="space-y-2 flex-1">
                <h1 class="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
                <p class="text-gray-600">Manage your workspace configuration and data.</p>
            </div>
        </div>

        <!-- General Settings Section -->
        <section class="space-y-4">
            <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-gray-800">General</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card v-for="setting in generalSettings" :key="setting.title" class="hover:shadow-md transition-shadow">
                    <CardHeader class="pb-3">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <component :is="setting.icon" class="h-5 w-5 text-blue-600" />
                            </div>
                            <CardTitle class="text-lg">{{ setting.title }}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent class="pb-4">
                        <CardDescription class="text-sm leading-relaxed">
                            {{ setting.description }}
                        </CardDescription>
                    </CardContent>
                    <CardFooter>
                        <Button @click="setting.action" :variant="setting.variant" class="w-full">
                            {{ setting.buttonText }}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </section>

        <!-- Danger Zone Section -->
        <section class="space-y-4">
            <div class="flex items-center gap-2">
                <AlertTriangle class="h-5 w-5 text-red-600" />
                <h2 class="text-xl font-semibold text-red-700">Danger Zone</h2>
            </div>
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-800 mb-4">
                    These actions are irreversible and will permanently delete data from your workspace.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card v-for="setting in dangerZoneSettings" :key="setting.title"
                        class="border-red-200 hover:shadow-md transition-shadow">
                        <CardHeader class="pb-3">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-red-100 rounded-lg">
                                    <component :is="setting.icon" class="h-5 w-5 text-red-600" />
                                </div>
                                <CardTitle class="text-lg text-red-900">{{ setting.title }}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent class="pb-4">
                            <CardDescription class="text-sm leading-relaxed text-red-700">
                                {{ setting.description }}
                            </CardDescription>
                        </CardContent>
                        <CardFooter>
                            <Button @click="setting.action" :variant="setting.variant" class="w-full">
                                <Trash2 class="h-4 w-4 mr-2" />
                                {{ setting.buttonText }}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>

        <!-- Confirmation Dialog -->
        <AlertDialog v-model:open="confirmationDialog.open">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle class="flex items-center gap-2">
                        <AlertTriangle class="h-5 w-5 text-amber-500" />
                        {{ confirmationDialog.title }}
                    </AlertDialogTitle>
                    <AlertDialogDescription class="text-sm leading-relaxed">
                        {{ confirmationDialog.description }}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel :disabled="confirmationDialog.loading">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction @click="handleConfirm" class="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        :disabled="confirmationDialog.loading">
                        <div v-if="confirmationDialog.loading" class="mr-2">
                            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        </div>
                        {{ confirmationDialog.loading ? 'Processing...' : 'Confirm' }}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>