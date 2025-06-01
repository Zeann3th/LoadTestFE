import { io, Socket } from 'socket.io-client';

export interface WSClientOptions {
    onLog: (logs: any[]) => void;
    onDone: (data: { message: string }) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: any) => void;
    serverUrl?: string;
}

export class WSClient {
    private socket: Socket;
    private runId: string;
    private isConnected: boolean = false;

    constructor(runId: string, options: WSClientOptions) {
        this.runId = runId;
        const serverUrl = options.serverUrl || 'http://localhost:31347';

        this.socket = io(serverUrl.replace("http://", "ws://"), {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket'],
        });

        this.setupEventListeners(options);
    }

    private setupEventListeners(options: WSClientOptions) {
        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            this.isConnected = true;
            this.joinFlow();
            options.onConnect?.();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from WebSocket server:', reason);
            this.isConnected = false;
            options.onDisconnect?.();
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            options.onError?.(error);
        });

        this.socket.on('flow:log', (logs: any[]) => {
            options.onLog(logs);
        });

        this.socket.on('flow:done', (data: { message: string }) => {
            options.onDone(data);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            options.onError?.(error);
        });
    }

    private joinFlow() {
        if (this.isConnected) {
            this.socket.emit('join-flow', this.runId);
            console.log(`Joined flow room: ${this.runId}`);
        }
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    public reconnect() {
        if (this.socket) {
            this.socket.connect();
        }
    }

    public isSocketConnected(): boolean {
        return this.isConnected && this.socket.connected;
    }

    public getSocket(): Socket {
        return this.socket;
    }
}

export const createWSClient = (runId: string, options: WSClientOptions): WSClient => {
    return new WSClient(runId, options);
};