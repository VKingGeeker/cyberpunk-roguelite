/**
 * Socket管理器
 * 处理所有Socket.io事件和通信
 */

import { v4 as uuidv4 } from 'uuid';

// 玩家状态
const PlayerState = {
    LOBBY: 'lobby',
    MATCHING: 'matching',
    IN_ROOM: 'in_room',
    PLAYING: 'playing'
};

// 玩家信息
const players = new Map();

// 匹配队列
const matchmakingQueue = [];

export class SocketManager {
    constructor(io, roomManager) {
        this.io = io;
        this.roomManager = roomManager;
        this.players = players;
        this.matchmakingQueue = matchmakingQueue;
    }

    /**
     * 注册Socket事件处理器
     */
    registerSocketHandlers(socket) {
        // 玩家认证
        socket.on('authenticate', (data) => this.handleAuthenticate(socket, data));
        
        // 匹配系统
        socket.on('find-match', (data) => this.handleFindMatch(socket, data));
        socket.on('cancel-match', () => this.handleCancelMatch(socket));
        
        // 房间系统
        socket.on('create-room', (data) => this.handleCreateRoom(socket, data));
        socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
        socket.on('leave-room', () => this.handleLeaveRoom(socket));
        socket.on('set-ready', (data) => this.handleSetReady(socket, data));
        socket.on('start-game', () => this.handleStartGame(socket));
        
        // 游戏同步
        socket.on('player-update', (data) => this.handlePlayerUpdate(socket, data));
        socket.on('enemy-update', (data) => this.handleEnemyUpdate(socket, data));
        socket.on('skill-use', (data) => this.handleSkillUse(socket, data));
        socket.on('item-pickup', (data) => this.handleItemPickup(socket, data));
        socket.on('damage-dealt', (data) => this.handleDamageDealt(socket, data));
        
        // 时间回溯投票
        socket.on('time-rewind-vote', (data) => this.handleTimeRewindVote(socket, data));
        
        // 断开连接
        socket.on('disconnect', () => this.handleDisconnect(socket));
        
        // 心跳
        socket.on('ping', (callback) => {
            if (typeof callback === 'function') {
                callback(Date.now());
            }
        });
    }

    /**
     * 处理玩家认证
     */
    handleAuthenticate(socket, data) {
        const { playerName, playerClass } = data;
        
        // 创建玩家信息
        const playerInfo = {
            id: socket.id,
            name: playerName || `玩家_${socket.id.substring(0, 4)}`,
            class: playerClass || 'bio_engineer',
            state: PlayerState.LOBBY,
            roomId: null,
            lastActivity: Date.now(),
            latency: 0
        };
        
        this.players.set(socket.id, playerInfo);
        
        socket.emit('authenticated', {
            success: true,
            playerId: socket.id,
            playerInfo: playerInfo
        });
        
        console.log(`[SocketManager] 玩家认证成功: ${playerInfo.name} (${socket.id})`);
    }

    /**
     * 处理匹配请求
     */
    handleFindMatch(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) {
            socket.emit('error', { message: '未认证' });
            return;
        }
        
        const { gameMode, playerCount } = data;
        
        // 更新玩家状态
        player.state = PlayerState.MATCHING;
        player.matchPreferences = { gameMode, playerCount };
        
        // 添加到匹配队列
        this.matchmakingQueue.push({
            socket,
            player,
            timestamp: Date.now()
        });
        
        socket.emit('match-searching', {
            position: this.matchmakingQueue.length,
            estimatedWait: this.estimateWaitTime()
        });
        
        console.log(`[SocketManager] 玩家开始匹配: ${player.name}`);
        
        // 尝试匹配
        this.tryMatchmaking();
    }

    /**
     * 处理取消匹配
     */
    handleCancelMatch(socket) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        // 从匹配队列移除
        const index = this.matchmakingQueue.findIndex(item => item.socket.id === socket.id);
        if (index !== -1) {
            this.matchmakingQueue.splice(index, 1);
        }
        
        player.state = PlayerState.LOBBY;
        delete player.matchPreferences;
        
        socket.emit('match-cancelled');
        console.log(`[SocketManager] 玩家取消匹配: ${player.name}`);
    }

    /**
     * 尝试匹配
     */
    tryMatchmaking() {
        // 按游戏模式和人数分组
        const groups = new Map();
        
        for (const item of this.matchmakingQueue) {
            const key = `${item.player.matchPreferences?.gameMode || 'default'}_${item.player.matchPreferences?.playerCount || 4}`;
            
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        }
        
        // 检查每个分组是否满足条件
        for (const [key, group] of groups) {
            const targetCount = parseInt(key.split('_')[1]) || 4;
            
            if (group.length >= targetCount) {
                // 创建房间
                const matchedPlayers = group.slice(0, targetCount);
                const room = this.roomManager.createRoom({
                    gameMode: key.split('_')[0],
                    maxPlayers: targetCount
                });
                
                // 添加玩家到房间
                for (const item of matchedPlayers) {
                    this.roomManager.addPlayerToRoom(room.id, item.socket, item.player);
                    
                    // 从匹配队列移除
                    const index = this.matchmakingQueue.indexOf(item);
                    if (index !== -1) {
                        this.matchmakingQueue.splice(index, 1);
                    }
                }
                
                // 通知所有玩家
                this.io.to(room.id).emit('match-found', {
                    roomId: room.id,
                    players: Array.from(room.players.values()).map(p => ({
                        id: p.id,
                        name: p.name,
                        class: p.class
                    }))
                });
                
                console.log(`[SocketManager] 匹配成功，房间: ${room.id}`);
            }
        }
    }

    /**
     * 估算等待时间
     */
    estimateWaitTime() {
        const queueLength = this.matchmakingQueue.length;
        // 简单估算：每10秒匹配一个玩家
        return Math.max(5, queueLength * 10);
    }

    /**
     * 处理创建房间
     */
    handleCreateRoom(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) {
            socket.emit('error', { message: '未认证' });
            return;
        }
        
        const { roomName, maxPlayers, gameMode, isPrivate, password } = data;
        
        // 创建房间
        const room = this.roomManager.createRoom({
            name: roomName || `${player.name}的房间`,
            maxPlayers: maxPlayers || 4,
            gameMode: gameMode || 'coop',
            isPrivate: isPrivate || false,
            password: password,
            hostId: socket.id
        });
        
        // 添加玩家到房间
        this.roomManager.addPlayerToRoom(room.id, socket, player);
        
        socket.emit('room-created', {
            roomId: room.id,
            room: room.toClientData()
        });
        
        console.log(`[SocketManager] 房间创建: ${room.id} by ${player.name}`);
    }

    /**
     * 处理加入房间
     */
    handleJoinRoom(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) {
            socket.emit('error', { message: '未认证' });
            return;
        }
        
        const { roomId, password } = data;
        
        // 检查房间是否存在
        const room = this.roomManager.getRoom(roomId);
        if (!room) {
            socket.emit('join-failed', { reason: '房间不存在' });
            return;
        }
        
        // 检查密码
        if (room.isPrivate && room.password !== password) {
            socket.emit('join-failed', { reason: '密码错误' });
            return;
        }
        
        // 检查房间是否已满
        if (room.players.size >= room.maxPlayers) {
            socket.emit('join-failed', { reason: '房间已满' });
            return;
        }
        
        // 检查游戏是否已开始
        if (room.state === 'playing') {
            socket.emit('join-failed', { reason: '游戏已开始' });
            return;
        }
        
        // 添加玩家到房间
        this.roomManager.addPlayerToRoom(roomId, socket, player);
        
        socket.emit('join-success', {
            roomId: room.id,
            room: room.toClientData()
        });
        
        // 通知其他玩家
        socket.to(roomId).emit('player-joined', {
            player: {
                id: player.id,
                name: player.name,
                class: player.class
            }
        });
        
        console.log(`[SocketManager] 玩家加入房间: ${player.name} -> ${roomId}`);
    }

    /**
     * 处理离开房间
     */
    handleLeaveRoom(socket) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const roomId = player.roomId;
        const room = this.roomManager.getRoom(roomId);
        
        if (room) {
            // 通知其他玩家
            socket.to(roomId).emit('player-left', {
                playerId: socket.id,
                playerName: player.name
            });
            
            // 如果是房主离开，转移房主
            if (room.hostId === socket.id) {
                const newHost = Array.from(room.players.keys()).find(id => id !== socket.id);
                if (newHost) {
                    room.hostId = newHost;
                    this.io.to(roomId).emit('host-changed', {
                        newHostId: newHost
                    });
                }
            }
        }
        
        this.roomManager.removePlayerFromRoom(roomId, socket.id);
        
        socket.emit('left-room');
        console.log(`[SocketManager] 玩家离开房间: ${player.name}`);
    }

    /**
     * 处理准备状态
     */
    handleSetReady(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room) return;
        
        room.setPlayerReady(socket.id, data.ready);
        
        // 通知房间内所有玩家
        this.io.to(player.roomId).emit('player-ready-changed', {
            playerId: socket.id,
            ready: data.ready
        });
        
        console.log(`[SocketManager] 玩家准备状态: ${player.name} -> ${data.ready}`);
    }

    /**
     * 处理开始游戏
     */
    handleStartGame(socket) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room) return;
        
        // 只有房主可以开始游戏
        if (room.hostId !== socket.id) {
            socket.emit('error', { message: '只有房主可以开始游戏' });
            return;
        }
        
        // 检查所有玩家是否准备
        const allReady = Array.from(room.players.values()).every(p => p.ready);
        if (!allReady) {
            socket.emit('error', { message: '所有玩家必须准备' });
            return;
        }
        
        // 开始游戏
        room.state = 'playing';
        room.gameStartTime = Date.now();
        
        // 生成随机种子
        const gameSeed = Math.floor(Math.random() * 1000000);
        room.gameSeed = gameSeed;
        
        // 通知所有玩家
        this.io.to(player.roomId).emit('game-start', {
            seed: gameSeed,
            players: Array.from(room.players.values()).map(p => ({
                id: p.id,
                name: p.name,
                class: p.class,
                spawnPosition: this.getSpawnPosition(Array.from(room.players.keys()).indexOf(p.id), room.players.size)
            }))
        });
        
        console.log(`[SocketManager] 游戏开始: 房间 ${player.roomId}`);
    }

    /**
     * 获取出生位置
     */
    getSpawnPosition(playerIndex, totalPlayers) {
        const centerX = 1600; // 地图中心
        const centerY = 1200;
        const radius = 100;
        
        const angle = (playerIndex / totalPlayers) * Math.PI * 2;
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
        };
    }

    /**
     * 处理玩家更新
     */
    handlePlayerUpdate(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room || room.state !== 'playing') return;
        
        // 更新玩家数据
        player.lastActivity = Date.now();
        
        // 广播给房间内其他玩家（延迟补偿）
        socket.to(player.roomId).emit('player-updated', {
            playerId: socket.id,
            data: {
                x: data.x,
                y: data.y,
                velocityX: data.velocityX,
                velocityY: data.velocityY,
                facing: data.facing,
                state: data.state,
                hp: data.hp,
                timestamp: data.timestamp || Date.now()
            }
        });
    }

    /**
     * 处理敌人更新
     */
    handleEnemyUpdate(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        // 只有房主同步敌人状态
        const room = this.roomManager.getRoom(player.roomId);
        if (!room || room.hostId !== socket.id) return;
        
        socket.to(player.roomId).emit('enemy-updated', {
            enemies: data.enemies,
            timestamp: data.timestamp || Date.now()
        });
    }

    /**
     * 处理技能使用
     */
    handleSkillUse(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room || room.state !== 'playing') return;
        
        // 广播技能使用
        this.io.to(player.roomId).emit('skill-used', {
            playerId: socket.id,
            skillId: data.skillId,
            targetX: data.targetX,
            targetY: data.targetY,
            timestamp: data.timestamp || Date.now()
        });
    }

    /**
     * 处理物品拾取
     */
    handleItemPickup(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room || room.state !== 'playing') return;
        
        // 广播物品被拾取
        this.io.to(player.roomId).emit('item-picked-up', {
            playerId: socket.id,
            itemId: data.itemId,
            itemData: data.itemData,
            timestamp: data.timestamp || Date.now()
        });
    }

    /**
     * 处理伤害事件
     */
    handleDamageDealt(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room || room.state !== 'playing') return;
        
        // 广播伤害事件
        this.io.to(player.roomId).emit('damage-dealt', {
            sourceId: socket.id,
            targetId: data.targetId,
            targetType: data.targetType, // 'enemy' or 'player'
            damage: data.damage,
            isCrit: data.isCrit,
            position: data.position,
            timestamp: data.timestamp || Date.now()
        });
    }

    /**
     * 处理时间回溯投票
     */
    handleTimeRewindVote(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.roomId) return;
        
        const room = this.roomManager.getRoom(player.roomId);
        if (!room || room.state !== 'playing') return;
        
        // 记录投票
        if (!room.timeRewindVotes) {
            room.timeRewindVotes = new Map();
        }
        
        room.timeRewindVotes.set(socket.id, data.vote);
        
        // 广播投票状态
        this.io.to(player.roomId).emit('time-rewind-vote-update', {
            votes: Object.fromEntries(room.timeRewindVotes),
            totalPlayers: room.players.size
        });
        
        // 检查是否所有玩家都投票
        if (room.timeRewindVotes.size === room.players.size) {
            const allAgree = Array.from(room.timeRewindVotes.values()).every(v => v);
            
            if (allAgree) {
                // 执行时间回溯
                this.io.to(player.roomId).emit('time-rewind-execute', {
                    snapshotId: data.snapshotId
                });
            }
            
            // 重置投票
            room.timeRewindVotes.clear();
        }
    }

    /**
     * 处理断开连接
     */
    handleDisconnect(socket) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        console.log(`[SocketManager] 玩家断开连接: ${player.name}`);
        
        // 从匹配队列移除
        const matchIndex = this.matchmakingQueue.findIndex(item => item.socket.id === socket.id);
        if (matchIndex !== -1) {
            this.matchmakingQueue.splice(matchIndex, 1);
        }
        
        // 处理房间
        if (player.roomId) {
            const room = this.roomManager.getRoom(player.roomId);
            
            if (room) {
                // 通知其他玩家
                socket.to(player.roomId).emit('player-disconnected', {
                    playerId: socket.id,
                    playerName: player.name
                });
                
                // 如果在游戏中，给玩家一个重连机会
                if (room.state === 'playing') {
                    // 标记玩家为断开状态，保留30秒
                    player.disconnected = true;
                    player.disconnectTime = Date.now();
                    
                    // 30秒后移除
                    setTimeout(() => {
                        if (player.disconnected && player.roomId === room.id) {
                            this.roomManager.removePlayerFromRoom(room.id, socket.id);
                        }
                    }, 30000);
                } else {
                    // 不在游戏中直接移除
                    this.roomManager.removePlayerFromRoom(player.roomId, socket.id);
                }
            }
        }
        
        // 移除玩家
        this.players.delete(socket.id);
    }

    /**
     * 获取房间列表
     */
    getRoomList() {
        return this.roomManager.getAllRooms().map(room => room.toClientData());
    }
}
