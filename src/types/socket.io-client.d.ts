/**
 * socket.io-client 类型声明
 * 用于解决模块找不到的问题
 */

declare module 'socket.io-client' {
    import { EventEmitter } from 'events';

    interface SocketOptions {
        forceNew?: boolean;
        reconnection?: boolean;
        reconnectionAttempts?: number;
        reconnectionDelay?: number;
        reconnectionDelayMax?: number;
        timeout?: number;
        transports?: string[];
        upgrade?: boolean;
        rememberUpgrade?: boolean;
        path?: string;
        query?: object;
        extraHeaders?: { [header: string]: string };
        withCredentials?: boolean;
        auth?: object;
    }

    interface Socket extends EventEmitter {
        id: string;
        connected: boolean;
        disconnected: boolean;

        connect(): Socket;
        disconnect(): Socket;
        close(): Socket;
        emit(event: string, ...args: any[]): Socket;
        on(event: string, listener: (...args: any[]) => void): Socket;
        once(event: string, listener: (...args: any[]) => void): Socket;
        off(event: string, listener?: (...args: any[]) => void): Socket;
        removeAllListeners(event?: string): Socket;
        volatile: {
            emit(event: string, ...args: any[]): Socket;
        };
        compress(compress: boolean): Socket;
        timeout(timeout: number): {
            emit(event: string, ...args: any[]): Socket;
        };
    }

    interface ManagerOptions extends SocketOptions {
        parser?: any;
    }

    interface Manager extends EventEmitter {
        opts: ManagerOptions;
        nsps: { [namespace: string]: Socket };
        sockets: Socket;
        reconnection(): boolean;
        reconnection(v: boolean): Manager;
        reconnectionAttempts(): number;
        reconnectionAttempts(v: number): Manager;
        reconnectionDelay(): number;
        reconnectionDelay(v: number): Manager;
        reconnectionDelayMax(): number;
        reconnectionDelayMax(v: number): Manager;
        timeout(): number;
        timeout(v: number): Manager;
        open(fn?: (err?: Error) => void): Manager;
        connect(fn?: (err?: Error) => void): Manager;
        socket(nsp: string, opts?: SocketOptions): Socket;
        close(): Manager;
        disconnect(): Manager;
    }

    function io(uri?: string, opts?: SocketOptions): Socket;
    function io(opts?: SocketOptions): Socket;

    export { io, Socket, SocketOptions, Manager, ManagerOptions };
    export default io;
}
