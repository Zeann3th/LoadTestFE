<script lang="ts" setup>
import { APP_BACKEND } from "@/env";
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { save } from "@tauri-apps/plugin-dialog";
import { download } from "@tauri-apps/plugin-upload";
import { WSClient, createWSClient } from "@/ws";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowLeft, Activity, Clock } from 'lucide-vue-next';

const props = defineProps<{
    runId: string;
    flowId: string;
}>();

const router = useRouter();
const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
let wsClient: WSClient | null = null;

interface Log {
    createdAt: string;
    responseTime: number;
}

let logBuffer: Log[] = [];

function binLogs(data: Log[], intervalMs: number): [number, number][] {
    const bins = new Map<number, number[]>();

    for (const log of data) {
        const ts = new Date(log.createdAt).getTime();
        const binnedTs = Math.floor(ts / intervalMs) * intervalMs;
        if (!bins.has(binnedTs)) bins.set(binnedTs, []);
        bins.get(binnedTs)!.push(log.responseTime);
    }

    return Array.from(bins.entries()).map(([ts, values]) => [
        ts,
        values.reduce((a, b) => a + b, 0) / values.length,
    ]);
}

function updateChart() {
    if (!chart || logBuffer.length === 0) return;

    const binned = binLogs(logBuffer.splice(0), 1000);

    const option = chart.getOption();
    const oldData = (option?.series && Array.isArray(option.series) && option.series[0]?.data)
        ? (option.series[0].data as [number, number][])
        : [];

    const mergedData = [...oldData, ...binned]
        .sort((a, b) => a[0] - b[0])
        .slice(-300);

    const now = Date.now();
    const windowStart = now - 60000;

    const filteredData = mergedData.filter(([ts]) => ts >= windowStart);

    chart.setOption({
        series: [{ data: filteredData }],
        xAxis: {
            min: windowStart,
            max: now,
        },
    }, false);
}

const isComplete = ref(false);

function resizeChart() {
    chart?.resize();
}

let interval: ReturnType<typeof setInterval>;

onMounted(async () => {
    await nextTick();
    if (chartRef.value) {
        chart = echarts.init(chartRef.value);
        chart.setOption({
            animation: false,
            xAxis: {
                type: 'time',
                name: 'Time',
                axisLine: { show: true, lineStyle: { color: '#ccc' } },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#eee' }
                },
            },
            yAxis: {
                type: 'value',
                name: 'Response Time (ms)',
                min: 0,
                axisLine: { show: true, lineStyle: { color: '#ccc' } },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#eee' }
                },
            },
            series: [{
                type: 'line',
                data: [],
                showSymbol: false,
                large: true,
                smooth: true,
                lineStyle: {
                    color: '#22c55e',
                },
                itemStyle: {
                    color: '#22c55e',
                }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    if (!params.length) return '';
                    const point = params[0];
                    const time = new Date(point.data[0]).toLocaleTimeString();
                    return `Time: ${time}<br/>Response Time: ${point.data[1].toFixed(2)} ms`;
                }
            },
        });

        window.addEventListener('resize', resizeChart);
        resizeChart();
    }

    wsClient = createWSClient(props.runId, {
        onLog: (logs: Log[]) => {
            logBuffer.push(...logs);
        },
        onDone: () => {
            isComplete.value = true;
            console.log('Run completed');
        },
    });

    interval = setInterval(updateChart, 1000);
});

onBeforeUnmount(() => {
    wsClient?.disconnect();
    chart?.dispose();
    clearInterval(interval);
    window.removeEventListener('resize', resizeChart);
});

const handleExport = async () => {
    if (!isComplete.value) return;
    try {
        const path = await save({
            defaultPath: `report-${props.runId}.pdf`,
            filters: [{
                name: `PDF Document`,
                extensions: ['pdf']
            }]
        })

        if (!path) return;

        await download(
            `${APP_BACKEND}/v1/runs/${props.runId}/report`,
            path
        )
    } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to generate report. Please try again.");
    }
}

const goBack = () => {
    router.push(`/workspace/${props.flowId}`);
};
</script>

<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <div class="max-w-7xl mx-auto space-y-6">
            <!-- Header Section -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <Button @click="goBack" variant="ghost" size="sm" class="flex items-center gap-2 hover:bg-gray-100">
                        <ArrowLeft class="h-4 w-4" />
                        Back to Workspace
                    </Button>
                    <div class="space-y-1">
                        <h1 class="text-3xl font-bold tracking-tight text-gray-900">Performance Monitor</h1>
                        <div class="flex items-center gap-3">
                            <p class="text-gray-600">Run ID: {{ runId }}</p>
                            <Badge :variant="isComplete ? 'default' : 'secondary'" class="flex items-center gap-1">
                                <Activity class="h-3 w-3" />
                                {{ isComplete ? 'Completed' : 'Running' }}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Button @click="handleExport" :disabled="!isComplete" :variant="isComplete ? 'default' : 'secondary'"
                    class="flex items-center gap-2" :class="{ 'opacity-50 cursor-not-allowed': !isComplete }">
                    <Download class="h-4 w-4" />
                    Download Report
                </Button>
            </div>

            <!-- Chart Card -->
            <Card class="shadow-lg border-0">
                <CardHeader class="pb-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-green-100 rounded-lg">
                                <Clock class="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle class="text-xl">Response Time Analytics</CardTitle>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent class="p-0">
                    <div class="h-[600px] w-full">
                        <div ref="chartRef" class="w-full h-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>