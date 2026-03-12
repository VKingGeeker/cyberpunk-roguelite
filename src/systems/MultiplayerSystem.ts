/**
 * 联机系统
 * 处理客户端与服务器的通信、状态同步和延迟补偿
 */

import { MULTIPLAYER_CONFIG } from '../core/Config';
import { 
    MultiplayerState, 
    RoomData, 
    PlayerSyncData, 
    EnemySyncData,
    SkillSyncData,
    ItemSyncData,
    DamageSyncData,
    TimeRewindVoteData
} from '../core/Types';
import { ClassType } from '../core/Types';

type Socket = any;

/**
 * 联机系统事件类型
 */
export enum MultiplayerEvent {
    // 连接事件
    CONNECTED = 'mp-connected',
    DISCONNECTED = 'mp-disconnected',
    AUTHENTICATED = 'mp-authenticated',
    ERROR = 'mp-error',
    
    // 匹配事件
    MATCH_SEARCHING = 'mp-match-searching',
    MATCH_FOUND = 'mp-match-found',
    MATCH_CANCELLED = 'mp-match-cancelled',
    
    // 房间事件
    ROOM_CREATED = 'mp-room-created',
    ROOM_JOINED = 'mp-room-joined',
    ROOM_LEFT = 'mp-room-left',
    PLAYER_JOINED = 'mp-player-joined',
    PLAYER_LEFT = 'mp-player-left',
    PLAYER_READY_CHANGED = 'mp-player-ready-changed',
    HOST_CHANGED = 'mp-host-changed',
    
    // 游戏事件
    GAME_START = 'mp-game-start',
    GAME_END = 'mp-game-end',
    
    // 同步事件
    PLAYER_UPDATE = 'mp-player-update',
    ENEMY_UPDATE = 'mp-enemy-update',
    SKILL_USED = 'mp-skill-used',
    ITEM_PICKED_UP = 'mp-item-picked-up',
    DAMAGE_DEALT = 'mp-damage-dealt',
    
    // 时间回溯事件
    TIME_REWIND_VOTE_UPDATE = 'mp-time-rewind-vote-update',
    TIME_REWIND_EXECUTE = 'mp-time-rewind-execute',
    
    // 服务器事件
    SERVER_SHUTDOWN = 'mp-server-shutdown'
}

/**
 * 远程玩家数据
 */
export interface RemotePlayer {
    id: string;
    name: string;
    class: ClassType;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    facing: number;
    state: string;
    hp: number;
    maxHp: number;
    lastUpdate: number;
    // 延迟补偿
    positionBuffer: Array<{x: number; y: number; timestamp: number}>;
    isLocal: boolean;
}

/**
 * 联机系统类
 */
export class MultiplayerSystem {
    private socket: Socket | null = null;
    private state: MultiplayerState = MultiplayerState.DISCONNECTED;
    private playerId: string | null = null;
    private playerInfo: any = null;
    private currentRoom: RoomData | null = null;
    private remotePlayers: Map<string, RemotePlayer> = new Map();
    private eventListeners: Map<string, Set<Function>> = new Map();
    
    // 延迟补偿
    private latency: number = 0;
    private serverTimeOffset: number = 0;
    private lastPingTime: number = 0;
    private pingInterval: any = null;
    
    // 状态同步
    private lastSyncTime: number = 0;
    private syncInterval: number = MULTIPLAYER_CONFIG.syncInterval;
    private pendingUpdates: any[] = [];
    
    // 延迟补偿缓冲区大小
    private readonly POSITION_BUFFER_SIZE = 20;
    
    constructor() {
        this.initEventListeners();
    }
    
    /**
     * 初始化事件监听器映射
     */
    private initEventListeners(): void {
        Object.values(MultiplayerEvent).forEach(event => {
            this.eventListeners.set(event, new Set());
        });
    }
    
    /**
     * 连接到服务器
     */
    connect(serverUrl?: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            if (this.socket && this.socket.connected) {
                resolve(true);
                return;
            }
            
            const url = serverUrl || MULTIPLAYER_CONFIG.serverUrl;
            
            try {
                let io: any = null;
                
                try {
                    const moduleName = 'socket.io-client';
                    const socketIoModule = await import(/* @vite-ignore */ moduleName);
                    io = socketIoModule.io;
                } catch (e) {
                    console.warn('[Multiplayer] socket.io-client未安装，联机功能不可用');
                    reject(new Error('socket.io-client未安装'));
                    return;
                }
                
                if (!io) {
                    reject(new Error('socket.io-client加载失败'));
                    return;
                }
                
                this.socket = io(url, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 10000
                });
                
                this.setupSocketHandlers();
                
                this.socket.on('connect', () => {
                    console.log('[Multiplayer] 连接成功');
                    this.state = MultiplayerState.CONNECTED;
                    this.emit(MultiplayerEvent.CONNECTED);
                    
                    this.startPingInterval();
                    
                    resolve(true);
                });
                
                this.socket.on('connect_error', (error: any) => {
                    console.error('[Multiplayer] 连接失败:', error);
                    this.emit(MultiplayerEvent.ERROR, { message: '连接失败', error });
                    reject(error);
                });
                
            } catch (error) {
                console.error('[Multiplayer] 连接异常:', error);
                reject(error);
            }
        });
    }
    
    /**
     * 断开连接
     */
    disconnect(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.state = MultiplayerState.DISCONNECTED;
        this.playerId = null;
        this.playerInfo = null;
        this.currentRoom = null;
        this.remotePlayers.clear();
        
        this.emit(MultiplayerEvent.DISCONNECTED);
        console.log('[Multiplayer] 已断开连接');
    }
    
    /**
     * 设置Socket处理器
     */
    private setupSocketHandlers(): void {
        if (!this.socket) return;
        
        // 认证成功
        this.socket.on('authenticated', (data) => {
            console.log('[Multiplayer] 认证成功:', data);
            this.playerId = data.playerId;
            this.playerInfo = data.playerInfo;
            this.state = MultiplayerState.AUTHENTICATED;
            this.emit(MultiplayerEvent.AUTHENTICATED, data);
        });
        
        // 错误
        this.socket.on('error', (data) => {
            console.error('[Multiplayer] 服务器错误:', data);
            this.emit(MultiplayerEvent.ERROR, data);
        });
        
        // 匹配中
        this.socket.on('match-searching', (data) => {
            console.log('[Multiplayer] 匹配中:', data);
            this.state = MultiplayerState.MATCHING;
            this.emit(MultiplayerEvent.MATCH_SEARCHING, data);
        });
        
        // 匹配成功
        this.socket.on('match-found', (data) => {
            console.log('[Multiplayer] 匹配成功:', data);
            this.state = MultiplayerState.IN_ROOM;
            this.emit(MultiplayerEvent.MATCH_FOUND, data);
        });
        
        // 取消匹配
        this.socket.on('match-cancelled', () => {
            console.log('[Multiplayer] 匹配已取消');
            this.state = MultiplayerState.AUTHENTICATED;
            this.emit(MultiplayerEvent.MATCH_CANCELLED);
        });
        
        // 房间创建成功
        this.socket.on('room-created', (data) => {
            console.log('[Multiplayer] 房间创建成功:', data);
            this.currentRoom = data.room;
            this.state = MultiplayerState.IN_ROOM;
            this.emit(MultiplayerEvent.ROOM_CREATED, data);
        });
        
        // 加入房间成功
        this.socket.on('join-success', (data) => {
            console.log('[Multiplayer] 加入房间成功:', data);
            this.currentRoom = data.room;
            this.state = MultiplayerState.IN_ROOM;
            this.emit(MultiplayerEvent.ROOM_JOINED, data);
        });
        
        // 加入房间失败
        this.socket.on('join-failed', (data) => {
            console.log('[Multiplayer] 加入房间失败:', data);
            this.emit(MultiplayerEvent.ERROR, data);
        });
        
        // 离开房间
        this.socket.on('left-room', () => {
            console.log('[Multiplayer] 离开房间');
            this.currentRoom = null;
            this.state = MultiplayerState.AUTHENTICATED;
            this.remotePlayers.clear();
            this.emit(MultiplayerEvent.ROOM_LEFT);
        });
        
        // 玩家加入
        this.socket.on('player-joined', (data) => {
            console.log('[Multiplayer] 玩家加入:', data);
            if (this.currentRoom) {
                this.currentRoom.players.push(data.player);
            }
            this.emit(MultiplayerEvent.PLAYER_JOINED, data);
        });
        
        // 玩家离开
        this.socket.on('player-left', (data) => {
            console.log('[Multiplayer] 玩家离开:', data);
            if (this.currentRoom) {
                this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== data.playerId);
            }
            this.remotePlayers.delete(data.playerId);
            this.emit(MultiplayerEvent.PLAYER_LEFT, data);
        });
        
        // 玩家断开连接
        this.socket.on('player-disconnected', (data) => {
            console.log('[Multiplayer] 玩家断开连接:', data);
            this.remotePlayers.delete(data.playerId);
            this.emit(MultiplayerEvent.PLAYER_LEFT, data);
        });
        
        // 玩家准备状态改变
        this.socket.on('player-ready-changed', (data) => {
            console.log('[Multiplayer] 玩家准备状态改变:', data);
            if (this.currentRoom) {
                const player = this.currentRoom.players.find(p => p.id === data.playerId);
                if (player) {
                    player.ready = data.ready;
                }
            }
            this.emit(MultiplayerEvent.PLAYER_READY_CHANGED, data);
        });
        
        // 房主变更
        this.socket.on('host-changed', (data) => {
            console.log('[Multiplayer] 房主变更:', data);
            if (this.currentRoom) {
                this.currentRoom.hostId = data.newHostId;
            }
            this.emit(MultiplayerEvent.HOST_CHANGED, data);
        });
        
        // 游戏开始
        this.socket.on('game-start', (data) => {
            console.log('[Multiplayer] 游戏开始:', data);
            this.state = MultiplayerState.PLAYING;
            
            // 初始化远程玩家
            data.players.forEach((playerData: any) => {
                if (playerData.id !== this.playerId) {
                    this.remotePlayers.set(playerData.id, {
                        id: playerData.id,
                        name: playerData.name,
                        class: playerData.class,
                        x: playerData.spawnPosition.x,
                        y: playerData.spawnPosition.y,
                        velocityX: 0,
                        velocityY: 0,
                        facing: 0,
                        state: 'idle',
                        hp: 100,
                        maxHp: 100,
                        lastUpdate: Date.now(),
                        positionBuffer: [],
                        isLocal: false
                    });
                }
            });
            
            this.emit(MultiplayerEvent.GAME_START, data);
        });
        
        // 玩家位置更新
        this.socket.on('player-updated', (data) => {
            this.handleRemotePlayerUpdate(data);
        });
        
        // 敌人状态更新
        this.socket.on('enemy-updated', (data) => {
            this.emit(MultiplayerEvent.ENEMY_UPDATE, data);
        });
        
        // 技能使用
        this.socket.on('skill-used', (data) => {
            this.emit(MultiplayerEvent.SKILL_USED, data);
        });
        
        // 物品拾取
        this.socket.on('item-picked-up', (data) => {
            this.emit(MultiplayerEvent.ITEM_PICKED_UP, data);
        });
        
        // 伤害事件
        this.socket.on('damage-dealt', (data) => {
            this.emit(MultiplayerEvent.DAMAGE_DEALT, data);
        });
        
        // 时间回溯投票更新
        this.socket.on('time-rewind-vote-update', (data) => {
            this.emit(MultiplayerEvent.TIME_REWIND_VOTE_UPDATE, data);
        });
        
        // 时间回溯执行
        this.socket.on('time-rewind-execute', (data) => {
            this.emit(MultiplayerEvent.TIME_REWIND_EXECUTE, data);
        });
        
        // 服务器关闭
        this.socket.on('server-shutdown', (data) => {
            console.log('[Multiplayer] 服务器即将关闭:', data);
            this.emit(MultiplayerEvent.SERVER_SHUTDOWN, data);
        });
        
        // 断开连接
        this.socket.on('disconnect', (reason) => {
            console.log('[Multiplayer] 断开连接:', reason);
            this.state = MultiplayerState.DISCONNECTED;
            this.emit(MultiplayerEvent.DISCONNECTED, { reason });
        });
    }
    
    /**
     * 开始心跳检测
     */
    private startPingInterval(): void {
        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.lastPingTime = Date.now();
                this.socket.emit('ping', (serverTime: number) => {
                    const now = Date.now();
                    this.latency = now - this.lastPingTime;
                    this.serverTimeOffset = serverTime - Math.floor((now + this.lastPingTime) / 2);
                });
            }
        }, 5000);
    }
    
    /**
     * 认证
     */
    authenticate(playerName: string, playerClass: ClassType): void {
        if (!this.socket || !this.socket.connected) {
            this.emit(MultiplayerEvent.ERROR, { message: '未连接到服务器' });
            return;
        }
        
        this.socket.emit('authenticate', {
            playerName,
            playerClass
        });
    }
    
    /**
     * 查找匹配
     */
    findMatch(gameMode: string = 'coop', playerCount: number = 4): void {
        if (!this.socket || !this.socket.connected) {
            this.emit(MultiplayerEvent.ERROR, { message: '未连接到服务器' });
            return;
        }
        
        this.socket.emit('find-match', {
            gameMode,
            playerCount
        });
    }
    
    /**
     * 取消匹配
     */
    cancelMatch(): void {
        if (this.socket) {
            this.socket.emit('cancel-match');
        }
    }
    
    /**
     * 创建房间
     */
    createRoom(options: {
        roomName?: string;
        maxPlayers?: number;
        gameMode?: string;
        isPrivate?: boolean;
        password?: string;
    }): void {
        if (!this.socket || !this.socket.connected) {
            this.emit(MultiplayerEvent.ERROR, { message: '未连接到服务器' });
            return;
        }
        
        this.socket.emit('create-room', options);
    }
    
    /**
     * 加入房间
     */
    joinRoom(roomId: string, password?: string): void {
        if (!this.socket || !this.socket.connected) {
            this.emit(MultiplayerEvent.ERROR, { message: '未连接到服务器' });
            return;
        }
        
        this.socket.emit('join-room', {
            roomId,
            password
        });
    }
    
    /**
     * 离开房间
     */
    leaveRoom(): void {
        if (this.socket) {
            this.socket.emit('leave-room');
        }
    }
    
    /**
     * 设置准备状态
     */
    setReady(ready: boolean): void {
        if (this.socket) {
            this.socket.emit('set-ready', { ready });
        }
    }
    
    /**
     * 开始游戏（仅房主）
     */
    startGame(): void {
        if (this.socket) {
            this.socket.emit('start-game');
        }
    }
    
    /**
     * 发送玩家更新
     */
    sendPlayerUpdate(data: PlayerSyncData): void {
        if (!this.socket || this.state !== MultiplayerState.PLAYING) return;
        
        const now = Date.now();
        if (now - this.lastSyncTime < this.syncInterval) {
            // 将更新加入待发送队列
            this.pendingUpdates.push(data);
            return;
        }
        
        this.lastSyncTime = now;
        
        this.socket.emit('player-update', {
            ...data,
            timestamp: now
        });
        
        // 发送待处理的更新
        if (this.pendingUpdates.length > 0) {
            this.pendingUpdates = [];
        }
    }
    
    /**
     * 发送敌人更新（仅房主）
     */
    sendEnemyUpdate(enemies: EnemySyncData[]): void {
        if (!this.socket || this.state !== MultiplayerState.PLAYING) return;
        
        this.socket.emit('enemy-update', {
            enemies,
            timestamp: Date.now()
        });
    }
    
    /**
     * 发送技能使用
     */
    sendSkillUse(data: SkillSyncData): void {
        if (!this.socket || this.state !== MultiplayerState.PLAYING) return;
        
        this.socket.emit('skill-use', {
            ...data,
            timestamp: Date.now()
        });
    }
    
    /**
     * 发送物品拾取
     */
    sendItemPickup(data: ItemSyncData): void {
        if (!this.socket || this.state !== MultiplayerState.PLAYING) return;
        
        this.socket.emit('item-pickup', {
            ...data,
            timestamp: Date.now()
        });
    }
    
    /**
     * 发送伤害事件
     */
    sendDamageDealt(data: DamageSyncData): void {
        if (!this.socket || this.state !== MultiplayerState.PLAYING) return;
        
        this.socket.emit('damage-dealt', {
            ...data,
            timestamp: Date.now()
        });
    }
    
    /**
     * 发送时间回溯投票
     */
    sendTimeRewindVote(vote: boolean, snapshotId: string): void {
        if (!this.socket || this.state !== MultiplayerState.PLAYING) return;
        
        this.socket.emit('time-rewind-vote', {
            vote,
            snapshotId
        });
    }
    
    /**
     * 处理远程玩家更新（延迟补偿）
     */
    private handleRemotePlayerUpdate(data: any): void {
        const remotePlayer = this.remotePlayers.get(data.playerId);
        if (!remotePlayer) return;
        
        // 添加到位置缓冲区
        remotePlayer.positionBuffer.push({
            x: data.data.x,
            y: data.data.y,
            timestamp: data.data.timestamp
        });
        
        // 限制缓冲区大小
        if (remotePlayer.positionBuffer.length > this.POSITION_BUFFER_SIZE) {
            remotePlayer.positionBuffer.shift();
        }
        
        // 更新其他状态
        remotePlayer.velocityX = data.data.velocityX;
        remotePlayer.velocityY = data.data.velocityY;
        remotePlayer.facing = data.data.facing;
        remotePlayer.state = data.data.state;
        remotePlayer.hp = data.data.hp;
        remotePlayer.lastUpdate = Date.now();
    }
    
    /**
     * 获取延迟补偿后的远程玩家位置
     */
    getRemotePlayerPosition(playerId: string): { x: number; y: number } | null {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (!remotePlayer || remotePlayer.positionBuffer.length === 0) {
            return null;
        }
        
        // 计算渲染时间点（当前时间 - 延迟 - 额外缓冲）
        const renderTime = Date.now() - this.latency - MULTIPLAYER_CONFIG.interpolationDelay;
        
        // 在缓冲区中找到两个时间点进行插值
        const buffer = remotePlayer.positionBuffer;
        
        // 找到第一个时间大于渲染时间的点
        let i = 0;
        while (i < buffer.length && buffer[i].timestamp < renderTime) {
            i++;
        }
        
        if (i === 0) {
            // 所有数据都比渲染时间新，使用最新的
            return { x: buffer[0].x, y: buffer[0].y };
        }
        
        if (i >= buffer.length) {
            // 所有数据都比渲染时间旧，使用最旧的
            return { x: buffer[buffer.length - 1].x, y: buffer[buffer.length - 1].y };
        }
        
        // 在两个点之间插值
        const before = buffer[i - 1];
        const after = buffer[i];
        const t = (renderTime - before.timestamp) / (after.timestamp - before.timestamp);
        
        return {
            x: before.x + (after.x - before.x) * t,
            y: before.y + (after.y - before.y) * t
        };
    }
    
    /**
     * 更新远程玩家位置（插值）
     */
    updateRemotePlayers(delta: number): void {
        for (const [id, player] of this.remotePlayers) {
            const targetPos = this.getRemotePlayerPosition(id);
            if (targetPos) {
                // 平滑插值
                const lerpFactor = Math.min(1, delta / 100 * MULTIPLAYER_CONFIG.interpolationSpeed);
                player.x += (targetPos.x - player.x) * lerpFactor;
                player.y += (targetPos.y - player.y) * lerpFactor;
            }
        }
    }
    
    /**
     * 获取远程玩家列表
     */
    getRemotePlayers(): RemotePlayer[] {
        return Array.from(this.remotePlayers.values());
    }
    
    /**
     * 获取远程玩家
     */
    getRemotePlayer(playerId: string): RemotePlayer | undefined {
        return this.remotePlayers.get(playerId);
    }
    
    /**
     * 注册事件监听器
     */
    on(event: MultiplayerEvent, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.add(callback);
        }
    }
    
    /**
     * 移除事件监听器
     */
    off(event: MultiplayerEvent, callback: Function): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }
    
    /**
     * 触发事件
     */
    private emit(event: MultiplayerEvent, data?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[Multiplayer] 事件处理错误 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 获取当前状态
     */
    getState(): MultiplayerState {
        return this.state;
    }
    
    /**
     * 获取玩家ID
     */
    getPlayerId(): string | null {
        return this.playerId;
    }
    
    /**
     * 获取玩家信息
     */
    getPlayerInfo(): any {
        return this.playerInfo;
    }
    
    /**
     * 获取当前房间
     */
    getCurrentRoom(): RoomData | null {
        return this.currentRoom;
    }
    
    /**
     * 获取延迟
     */
    getLatency(): number {
        return this.latency;
    }
    
    /**
     * 是否已连接
     */
    isConnected(): boolean {
        return this.socket !== null && this.socket.connected;
    }
    
    /**
     * 是否在游戏中
     */
    isPlaying(): boolean {
        return this.state === MultiplayerState.PLAYING;
    }
    
    /**
     * 是否是房主
     */
    isHost(): boolean {
        return this.currentRoom?.hostId === this.playerId;
    }
    
    /**
     * 清理资源
     */
    cleanup(): void {
        this.disconnect();
        this.eventListeners.forEach(listeners => listeners.clear());
        this.remotePlayers.clear();
        this.pendingUpdates = [];
    }
}
