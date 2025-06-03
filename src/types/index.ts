import { Position } from '@vue-flow/core'

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"

export interface Endpoint {
    id: string;
    name: string;
    description: string;
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    body?: Record<string, any>;
    parameters?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface Flow {
    id: string;
    name: string;
    description: string;
    sequence: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ActionNode extends Endpoint {
    postProcessor?: Record<string, any>;
}

export interface FlowDetail {
    id: string;
    name: string;
    description: string;
    sequence: ActionNode[];
    createdAt: string;
    updatedAt: string;
}

export interface CanvasEndpoint extends Endpoint {
    canvasId: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-800 border-green-300',
    POST: 'bg-blue-100 text-blue-800 border-blue-300',
    PUT: 'bg-orange-100 text-orange-800 border-orange-300',
    DELETE: 'bg-red-100 text-red-800 border-red-300',
    PATCH: 'bg-purple-100 text-purple-800 border-purple-300',
    OPTIONS: 'bg-gray-100 text-gray-800 border-gray-300',
    HEAD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

export interface VueFlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
    sourcePosition?: Position;
    targetPosition?: Position;
}

export interface VueFlowEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    style?: Record<string, any>;
}

export interface Connection {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

export interface RunOptions {
    ccu: number;
    threads: number;
    duration: number;
    rampUpTime: number;
    input: string;
    credentials?: string;
}