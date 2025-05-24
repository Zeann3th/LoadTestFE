export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"

export interface Endpoint {
    id: string;
    name: string;
    description: string;
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    body?: Record<string, any>;
    parameters?: Record<string, string>;
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