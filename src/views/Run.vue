<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { WSClient, createWSClient } from "../ws";

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

// Bins logs into intervals and calculates average responseTime
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
    if (!chart) return;
    if (logBuffer.length === 0) return;

    // Extract and bin the new logs
    const binned = binLogs(logBuffer.splice(0), 1000);

    // Get existing data or empty array
    const option = chart.getOption();
    const oldData = (option?.series && Array.isArray(option.series) && option.series[0]?.data)
        ? (option.series[0].data as [number, number][])
        : [];

    // Merge old and new data and keep last 300 points
    const mergedData = [...oldData, ...binned]
        .sort((a, b) => a[0] - b[0])
        .slice(-300);

    // Calculate visible xAxis window: last 60 seconds
    const now = Date.now();
    const windowStart = now - 60000;

    // Filter points inside window (to avoid showing stale points outside axis range)
    const filteredData = mergedData.filter(([ts]) => ts >= windowStart);

    chart.setOption({
        series: [{ data: filteredData }],
        xAxis: {
            min: windowStart,
            max: now,
        },
    }, false); // false = merge option, don't overwrite all
}

onMounted(() => {
    if (chartRef.value) {
        chart = echarts.init(chartRef.value);

        chart.setOption({
            animation: false,
            xAxis: {
                type: 'time',
                name: 'Time',
                splitLine: { show: false },
            },
            yAxis: {
                type: 'value',
                name: 'Response Time (ms)',
                min: 0,
                splitLine: { show: true },
            },
            series: [{
                type: 'line',
                data: [],
                showSymbol: false,
                large: true,
                smooth: true,
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
    }

    wsClient = createWSClient(props.runId, {
        onLog: (logs: Log[]) => {
            logBuffer.push(...logs);
        },
        onDone: () => {
            console.log('Run completed');
        },
    });

    const interval = setInterval(updateChart, 1000);

    onBeforeUnmount(() => {
        wsClient?.disconnect();
        chart?.dispose();
        clearInterval(interval);
    });
});
</script>

<template>
    <div class="h-full w-full relative flex items-center justify-center">
        <div ref="chartRef" class="w-full max-w-4xl h-[400px]" />

        <div class="fixed bottom-4 left-4 z-50">
            <div class="relative">
                <div
                    class="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 shadow-lg rounded-full overflow-hidden text-sm whitespace-nowrap min-w-max">
                    <button @click="router.push(`/workspace/${flowId}`)" title="Go Back"
                        class="block w-full text-left px-4 py-2 hover:bg-gray-100 whitespace-nowrap min-w-max">
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
