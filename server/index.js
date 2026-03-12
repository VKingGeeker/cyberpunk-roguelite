/**
 * 赛博朋克Roguelite - 多人游戏服务器
 * Node.js + Socket.io 实现
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketManager } from './SocketManager.js';
import { RoomManager } from './RoomManager.js';

// 服务器配置
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// 创建HTTP服务器
const httpServer = createServer();

// 创建Socket.io服务器
const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true
    },
    // 传输配置
    transports: ['websocket', 'polling'],
    // 心跳配置
    pingInterval: 10000,
    pingTimeout: 5000
});

// 初始化管理器
const roomManager = new RoomManager();
const socketManager = new SocketManager(io, roomManager);

// 服务器启动
httpServer.listen(PORT, () => {
    console.log(`[Server] 赛博朋克Roguelite服务器已启动`);
    console.log(`[Server] 端口: ${PORT}`);
    console.log(`[Server] CORS: ${CORS_ORIGIN}`);
    console.log(`[Server] 时间: ${new Date().toLocaleString('zh-CN')}`);
});

// 处理新连接
io.on('connection', (socket) => {
    console.log(`[Server] 新连接: ${socket.id}`);
    
    // 注册所有事件处理器
    socketManager.registerSocketHandlers(socket);
});

// 定期清理过期房间
setInterval(() => {
    const cleanedRooms = roomManager.cleanupInactiveRooms();
    if (cleanedRooms > 0) {
        console.log(`[Server] 清理了 ${cleanedRooms} 个过期房间`);
    }
}, 60000); // 每分钟清理一次

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('[Server] 收到SIGTERM信号，开始优雅关闭...');
    
    // 通知所有客户端服务器即将关闭
    io.emit('server-shutdown', {
        message: '服务器即将关闭',
        gracePeriod: 5000
    });
    
    // 给客户端5秒时间处理
    setTimeout(() => {
        io.close(() => {
            console.log('[Server] 服务器已关闭');
            process.exit(0);
        });
    }, 5000);
});

process.on('SIGINT', () => {
    console.log('[Server] 收到SIGINT信号，开始优雅关闭...');
    
    io.emit('server-shutdown', {
        message: '服务器即将关闭',
        gracePeriod: 5000
    });
    
    setTimeout(() => {
        io.close(() => {
            console.log('[Server] 服务器已关闭');
            process.exit(0);
        });
    }, 5000);
});

// 导出用于测试
export { io, roomManager, socketManager };
