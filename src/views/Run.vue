<script lang="ts" setup>
import { APP_BACKEND } from "../env";
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { save } from "@tauri-apps/plugin-dialog";
import { download } from "@tauri-apps/plugin-upload";
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
</script>

<template>
    <div class="w-screen h-screen bg-white relative overflow-hidden">
        <div ref="chartRef" class="absolute inset-0" />

        <div v-if="isComplete" class="absolute top-6 right-6 z-50">
            <button @click="handleExport"
                class="bg-green-500 text-white font-semibold px-4 py-2 rounded shadow hover:bg-green-600 transition">
                Download Report
            </button>
        </div>

        <div class="absolute bottom-6 left-6 z-50">
            <button @click="router.push(`/workspace/${flowId}`)"
                class="bg-white border border-gray-300 px-4 py-2 rounded-full shadow hover:bg-gray-100 transition">
                &lt; Go Back
            </button>
        </div>
    </div>
</template>
