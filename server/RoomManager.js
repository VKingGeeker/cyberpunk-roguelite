/**
 * 房间管理器
 * 管理游戏房间、玩家分配和状态
 */

import { v4 as uuidv4 } from 'uuid';

// 房间状态
const RoomState = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished'
};

export class Room {
    constructor(options) {
        this.id = uuidv4();
        this.name = options.name || '未命名房间';
        this.maxPlayers = options.maxPlayers || 4;
        this.gameMode = options.gameMode || 'coop';
        this.isPrivate = options.isPrivate || false;
        this.password = options.password || null;
        this.hostId = options.hostId || null;
        
        this.players = new Map();
        this.state = RoomState.WAITING;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.gameStartTime = null;
        this.gameSeed = null;
        
        // 游戏数据
        this.gameData = {
            wave: 1,
            enemiesDefeated: 0,
            itemsDropped: [],
            events: []
        };
    }

    /**
     * 添加玩家
     */
    addPlayer(socket, playerInfo) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }
        
        this.players.set(socket.id, {
            id: socket.id,
            name: playerInfo.name,
            class: playerInfo.class,
            ready: false,
            joinedAt: Date.now()
        });
        
        socket.join(this.id);
        playerInfo.roomId = this.id;
        playerInfo.state = 'in_room';
        
        this.lastActivity = Date.now();
        return true;
    }

    /**
     * 移除玩家
     */
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return false;
        
        this.players.delete(playerId);
        this.lastActivity = Date.now();
        
        // 如果房间空了，标记为完成
        if (this.players.size === 0) {
            this.state = RoomState.FINISHED;
        }
        
        return true;
    }

    /**
     * 设置玩家准备状态
     */
    setPlayerReady(playerId, ready) {
        const player = this.players.get(playerId);
        if (!player) return false;
        
        player.ready = ready;
        this.lastActivity = Date.now();
        return true;
    }

    /**
     * 检查是否所有玩家都准备
     */
    isAllReady() {
        if (this.players.size === 0) return false;
        return Array.from(this.players.values()).every(p => p.ready);
    }

    /**
     * 转换为客户端数据
     */
    toClientData() {
        return {
            id: this.id,
            name: this.name,
            maxPlayers: this.maxPlayers,
            currentPlayers: this.players.size,
            gameMode: this.gameMode,
            isPrivate: this.isPrivate,
            state: this.state,
            hostId: this.hostId,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                class: p.class,
                ready: p.ready
            })),
            createdAt: this.createdAt
        };
    }
}

export class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.playerRoomMap = new Map(); // 玩家ID -> 房间ID 映射
    }

    /**
     * 创建房间
     */
    createRoom(options) {
        const room = new Room(options);
        this.rooms.set(room.id, room);
        
        console.log(`[RoomManager] 房间创建: ${room.id} (${room.name})`);
        return room;
    }

    /**
     * 获取房间
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    /**
     * 删除房间
     */
    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        // 移除所有玩家
        for (const playerId of room.players.keys()) {
            this.playerRoomMap.delete(playerId);
        }
        
        this.rooms.delete(roomId);
        console.log(`[RoomManager] 房间删除: ${roomId}`);
        return true;
    }

    /**
     * 添加玩家到房间
     */
    addPlayerToRoom(roomId, socket, playerInfo) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        const success = room.addPlayer(socket, playerInfo);
        if (success) {
            this.playerRoomMap.set(socket.id, roomId);
        }
        
        return success;
    }

    /**
     * 从房间移除玩家
     */
    removePlayerFromRoom(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        const success = room.removePlayer(playerId);
        if (success) {
            this.playerRoomMap.delete(playerId);
            
            // 如果房间空了，删除房间
            if (room.players.size === 0) {
                this.deleteRoom(roomId);
            }
        }
        
        return success;
    }

    /**
     * 获取玩家所在房间
     */
    getPlayerRoom(playerId) {
        const roomId = this.playerRoomMap.get(playerId);
        if (!roomId) return null;
        
        return this.rooms.get(roomId);
    }

    /**
     * 获取所有房间
     */
    getAllRooms() {
        return Array.from(this.rooms.values()).filter(room => 
            room.state !== RoomState.FINISHED && !room.isPrivate
        );
    }

    /**
     * 获取公开房间列表
     */
    getPublicRooms() {
        return this.getAllRooms().filter(room => !room.isPrivate);
    }

    /**
     * 清理过期房间
     */
    cleanupInactiveRooms(maxInactiveTime = 30 * 60 * 1000) { // 默认30分钟
        let cleanedCount = 0;
        const now = Date.now();
        
        for (const [roomId, room] of this.rooms) {
            // 检查是否过期
            if (now - room.lastActivity > maxInactiveTime) {
                this.deleteRoom(roomId);
                cleanedCount++;
            }
            // 检查是否游戏结束且空房间
            else if (room.state === RoomState.FINISHED && room.players.size === 0) {
                this.deleteRoom(roomId);
                cleanedCount++;
            }
        }
        
        return cleanedCount;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            totalRooms: this.rooms.size,
            waitingRooms: Array.from(this.rooms.values()).filter(r => r.state === RoomState.WAITING).length,
            playingRooms: Array.from(this.rooms.values()).filter(r => r.state === RoomState.PLAYING).length,
            totalPlayers: this.playerRoomMap.size
        };
    }

    /**
     * 更新房间游戏数据
     */
    updateRoomGameData(roomId, gameData) {
        const room = this.rooms.get(roomId);
        if (!room) return false;
        
        room.gameData = { ...room.gameData, ...gameData };
        room.lastActivity = Date.now();
        return true;
    }

    /**
     * 动态调整难度
     */
    calculateDynamicDifficulty(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return 1.0;
        
        const playerCount = room.players.size;
        
        // 基础难度调整
        // 2人: 1.3x
        // 3人: 1.6x
        // 4人: 2.0x
        const difficultyMultiplier = 1 + (playerCount - 1) * 0.3;
        
        // 根据游戏进度增加难度
        const waveMultiplier = 1 + (room.gameData.wave - 1) * 0.1;
        
        return difficultyMultiplier * waveMultiplier;
    }

    /**
     * 分配掉落物
     */
    assignDrop(roomId, dropData) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        // 轮流分配或随机分配
        const players = Array.from(room.players.values());
        if (players.length === 0) return null;
        
        // 简单的轮流分配
        const assigneeIndex = room.gameData.itemsDropped.length % players.length;
        const assignee = players[assigneeIndex];
        
        room.gameData.itemsDropped.push({
            ...dropData,
            assignedTo: assignee.id,
            timestamp: Date.now()
        });
        
        return assignee.id;
    }
}
