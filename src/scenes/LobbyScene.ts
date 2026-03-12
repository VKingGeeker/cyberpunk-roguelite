/**
 * 联机大厅场景
 * 显示房间列表、创建/加入房间、匹配等功能
 */

import Phaser from 'phaser';
import { GAME_CONFIG, MULTIPLAYER_CONFIG } from '../core/Config';
import { MultiplayerSystem, MultiplayerEvent, RemotePlayer } from '../systems/MultiplayerSystem';
import { ClassType } from '../core/Types';

// 大厅状态
enum LobbyState {
    CONNECTING,
    AUTHENTICATING,
    MAIN_MENU,
    MATCHING,
    ROOM_LIST,
    IN_ROOM,
    STARTING
}

// 房间数据
interface RoomListItem {
    id: string;
    name: string;
    maxPlayers: number;
    currentPlayers: number;
    gameMode: string;
    isPrivate: boolean;
    state: string;
    hostId: string;
    players: Array<{
        id: string;
        name: string;
        class: string;
        ready: boolean;
    }>;
}

export default class LobbyScene extends Phaser.Scene {
    private multiplayer: MultiplayerSystem;
    private state: LobbyState = LobbyState.CONNECTING;
    private playerName: string = '';
    private selectedClass: ClassType = ClassType.BIO_ENGINEER;
    private rooms: RoomListItem[] = [];
    private currentRoom: RoomListItem | null = null;
    private isReady: boolean = false;
    
    // UI元素
    private container!: Phaser.GameObjects.Container;
    private statusText!: Phaser.GameObjects.Text;
    private roomListContainer!: Phaser.GameObjects.Container;
    private roomContainer!: Phaser.GameObjects.Container;
    private playerSlots: Phaser.GameObjects.Container[] = [];
    
    // 动画
    private particleGraphics!: Phaser.GameObjects.Graphics;
    private particles: Array<{x: number; y: number; vx: number; vy: number; color: number; size: number; alpha: number; life: number}> = [];
    
    constructor() {
        super({ key: 'LobbyScene' });
        this.multiplayer = new MultiplayerSystem();
    }
    
    /**
     * 初始化场景
     */
    init(data: any): void {
        if (data && data.playerName) {
            this.playerName = data.playerName;
        }
        if (data && data.selectedClass) {
            this.selectedClass = data.selectedClass;
        }
    }
    
    /**
     * 创建场景
     */
    create(): void {
        this.createBackground();
        this.createUI();
        this.setupMultiplayerEvents();
        this.connectToServer();
    }
    
    /**
     * 创建背景
     */
    private createBackground(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 深色背景
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a0a1a, 1);
        graphics.fillRect(0, 0, width, height);
        
        // 霓虹网格
        graphics.lineStyle(1, 0x00ffff, 0.1);
        const gridSize = 60;
        for (let x = 0; x <= width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
        graphics.strokePath();
        
        // 粒子效果
        this.particleGraphics = this.add.graphics();
        this.time.addEvent({
            delay: 100,
            callback: () => this.updateParticles(),
            loop: true
        });
    }
    
    /**
     * 创建UI
     */
    private createUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.container = this.add.container(0, 0);
        
        // 标题
        const title = this.add.text(width / 2, 50, '// 联机大厅', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ff00ff',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        this.container.add(title);
        
        // 状态文本
        this.statusText = this.add.text(width / 2, 100, '正在连接服务器...', {
            fontSize: '20px',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace'
        });
        this.statusText.setOrigin(0.5);
        this.container.add(this.statusText);
        
        // 返回按钮
        this.createButton(100, height - 50, 150, 40, '<< 返回', 0xff0044, () => {
            this.disconnectAndReturn();
        });
    }
    
    /**
     * 设置联机事件
     */
    private setupMultiplayerEvents(): void {
        this.multiplayer.on(MultiplayerEvent.CONNECTED, () => {
            this.state = LobbyState.AUTHENTICATING;
            this.statusText.setText('正在认证...');
            
            // 发送认证
            this.multiplayer.authenticate(this.playerName, this.selectedClass);
        });
        
        this.multiplayer.on(MultiplayerEvent.AUTHENTICATED, (data) => {
            this.state = LobbyState.MAIN_MENU;
            this.statusText.setText(`已登录: ${data.playerInfo.name}`);
            this.showMainMenu();
        });
        
        this.multiplayer.on(MultiplayerEvent.ERROR, (data) => {
            this.showError(data.message || '发生错误');
        });
        
        this.multiplayer.on(MultiplayerEvent.DISCONNECTED, (data) => {
            this.showError('已断开连接: ' + (data?.reason || '未知原因'));
            this.state = LobbyState.CONNECTING;
        });
        
        this.multiplayer.on(MultiplayerEvent.MATCH_SEARCHING, (data) => {
            this.state = LobbyState.MATCHING;
            this.showMatchingUI(data);
        });
        
        this.multiplayer.on(MultiplayerEvent.MATCH_FOUND, (data) => {
            this.state = LobbyState.IN_ROOM;
            this.currentRoom = {
                id: data.roomId,
                name: '匹配房间',
                maxPlayers: data.players.length,
                currentPlayers: data.players.length,
                gameMode: 'coop',
                isPrivate: false,
                state: 'waiting',
                hostId: data.players[0]?.id || '',
                players: data.players
            };
            this.showRoomUI();
        });
        
        this.multiplayer.on(MultiplayerEvent.MATCH_CANCELLED, () => {
            this.state = LobbyState.MAIN_MENU;
            this.showMainMenu();
        });
        
        this.multiplayer.on(MultiplayerEvent.ROOM_CREATED, (data) => {
            this.state = LobbyState.IN_ROOM;
            this.currentRoom = data.room;
            this.showRoomUI();
        });
        
        this.multiplayer.on(MultiplayerEvent.ROOM_JOINED, (data) => {
            this.state = LobbyState.IN_ROOM;
            this.currentRoom = data.room;
            this.showRoomUI();
        });
        
        this.multiplayer.on(MultiplayerEvent.PLAYER_JOINED, (data) => {
            if (this.currentRoom) {
                this.currentRoom.players.push(data.player);
                this.updateRoomPlayers();
            }
        });
        
        this.multiplayer.on(MultiplayerEvent.PLAYER_LEFT, (data) => {
            if (this.currentRoom) {
                this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== data.playerId);
                this.updateRoomPlayers();
            }
        });
        
        this.multiplayer.on(MultiplayerEvent.PLAYER_READY_CHANGED, (data) => {
            if (this.currentRoom) {
                const player = this.currentRoom.players.find(p => p.id === data.playerId);
                if (player) {
                    player.ready = data.ready;
                    this.updateRoomPlayers();
                }
            }
        });
        
        this.multiplayer.on(MultiplayerEvent.HOST_CHANGED, (data) => {
            if (this.currentRoom) {
                this.currentRoom.hostId = data.newHostId;
                this.updateRoomPlayers();
            }
        });
        
        this.multiplayer.on(MultiplayerEvent.GAME_START, (data) => {
            this.state = LobbyState.STARTING;
            this.statusText.setText('游戏即将开始...');
            
            // 延迟后开始游戏
            this.time.delayedCall(1000, () => {
                this.startMultiplayerGame(data);
            });
        });
        
        this.multiplayer.on(MultiplayerEvent.SERVER_SHUTDOWN, (data) => {
            this.showError('服务器即将关闭: ' + data.message);
            this.time.delayedCall(data.gracePeriod, () => {
                this.disconnectAndReturn();
            });
        });
    }
    
    /**
     * 连接到服务器
     */
    private connectToServer(): void {
        this.state = LobbyState.CONNECTING;
        this.statusText.setText('正在连接服务器...');
        
        this.multiplayer.connect(MULTIPLAYER_CONFIG.serverUrl)
            .then(() => {
                console.log('[LobbyScene] 连接成功');
            })
            .catch((error) => {
                console.error('[LobbyScene] 连接失败:', error);
                this.showError('无法连接到服务器');
            });
    }
    
    /**
     * 显示主菜单
     */
    private showMainMenu(): void {
        this.clearDynamicUI();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const startY = 200;
        
        // 快速匹配按钮
        this.createButton(width / 2, startY, 300, 50, '>> 快速匹配', 0x00ffff, () => {
            this.multiplayer.findMatch('coop', 4);
        });
        
        // 创建房间按钮
        this.createButton(width / 2, startY + 70, 300, 50, '>> 创建房间', 0xff00ff, () => {
            this.showCreateRoomDialog();
        });
        
        // 浏览房间按钮
        this.createButton(width / 2, startY + 140, 300, 50, '>> 浏览房间', 0xffff00, () => {
            this.showRoomList();
        });
    }
    
    /**
     * 显示匹配UI
     */
    private showMatchingUI(data: any): void {
        this.clearDynamicUI();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 匹配中提示
        const matchingText = this.add.text(width / 2, height / 2 - 50, '正在匹配中...', {
            fontSize: '32px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        matchingText.setOrigin(0.5);
        this.container.add(matchingText);
        
        // 预计等待时间
        const waitText = this.add.text(width / 2, height / 2 + 10, `预计等待: ${data.estimatedWait}秒`, {
            fontSize: '20px',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace'
        });
        waitText.setOrigin(0.5);
        this.container.add(waitText);
        
        // 取消按钮
        this.createButton(width / 2, height / 2 + 80, 200, 40, '取消匹配', 0xff0044, () => {
            this.multiplayer.cancelMatch();
        });
        
        // 动画效果
        this.tweens.add({
            targets: matchingText,
            alpha: { from: 0.5, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * 显示创建房间对话框
     */
    private showCreateRoomDialog(): void {
        this.clearDynamicUI();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 对话框背景
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x0a0a2a, 0.95);
        dialogBg.fillRoundedRect(width / 2 - 200, height / 2 - 150, 400, 300, 8);
        dialogBg.lineStyle(2, 0x00ffff, 1);
        dialogBg.strokeRoundedRect(width / 2 - 200, height / 2 - 150, 400, 300, 8);
        this.container.add(dialogBg);
        
        // 标题
        const title = this.add.text(width / 2, height / 2 - 120, '// 创建房间', {
            fontSize: '24px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);
        this.container.add(title);
        
        // 房间名称
        const nameLabel = this.add.text(width / 2 - 150, height / 2 - 70, '房间名称:', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        this.container.add(nameLabel);
        
        // 玩家数量
        const playersLabel = this.add.text(width / 2 - 150, height / 2 - 30, '玩家数量:', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        this.container.add(playersLabel);
        
        // 创建按钮
        this.createButton(width / 2 - 80, height / 2 + 80, 140, 40, '创建', 0x00ff88, () => {
            this.multiplayer.createRoom({
                roomName: `${this.playerName}的房间`,
                maxPlayers: 4,
                gameMode: 'coop',
                isPrivate: false
            });
        });
        
        // 取消按钮
        this.createButton(width / 2 + 80, height / 2 + 80, 140, 40, '取消', 0xff0044, () => {
            this.showMainMenu();
        });
    }
    
    /**
     * 显示房间列表
     */
    private showRoomList(): void {
        this.clearDynamicUI();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 标题
        const title = this.add.text(width / 2, 150, '// 房间列表', {
            fontSize: '28px',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);
        this.container.add(title);
        
        // 房间列表容器
        this.roomListContainer = this.add.container(0, 0);
        this.container.add(this.roomListContainer);
        
        // 刷新按钮
        this.createButton(width / 2, height - 100, 200, 40, '刷新列表', 0x00ffff, () => {
            // 这里应该请求服务器获取房间列表
            this.refreshRoomList();
        });
        
        // 返回按钮
        this.createButton(width / 2, height - 50, 200, 40, '返回', 0xff0044, () => {
            this.showMainMenu();
        });
        
        // 模拟房间列表
        this.refreshRoomList();
    }
    
    /**
     * 刷新房间列表
     */
    private refreshRoomList(): void {
        if (!this.roomListContainer) return;
        
        this.roomListContainer.removeAll(true);
        
        // 模拟房间数据
        const mockRooms: RoomListItem[] = [
            {
                id: 'room1',
                name: '新手房间',
                maxPlayers: 4,
                currentPlayers: 2,
                gameMode: 'coop',
                isPrivate: false,
                state: 'waiting',
                hostId: 'player1',
                players: []
            },
            {
                id: 'room2',
                name: '高手挑战',
                maxPlayers: 4,
                currentPlayers: 3,
                gameMode: 'coop',
                isPrivate: false,
                state: 'waiting',
                hostId: 'player2',
                players: []
            }
        ];
        
        const startY = 200;
        
        mockRooms.forEach((room, index) => {
            const y = startY + index * 80;
            this.createRoomListItem(room, y);
        });
        
        if (mockRooms.length === 0) {
            const noRoomText = this.add.text(this.cameras.main.width / 2, startY, '暂无可用房间', {
                fontSize: '20px',
                color: '#888888',
                fontFamily: 'Courier New, monospace'
            });
            noRoomText.setOrigin(0.5);
            this.roomListContainer.add(noRoomText);
        }
    }
    
    /**
     * 创建房间列表项
     */
    private createRoomListItem(room: RoomListItem, y: number): void {
        const width = this.cameras.main.width;
        
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2a, 0.8);
        bg.fillRoundedRect(width / 2 - 250, y - 25, 500, 60, 4);
        bg.lineStyle(1, 0x00ffff, 0.5);
        bg.strokeRoundedRect(width / 2 - 250, y - 25, 500, 60, 4);
        this.roomListContainer.add(bg);
        
        // 房间名称
        const nameText = this.add.text(width / 2 - 230, y - 10, room.name, {
            fontSize: '18px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        this.roomListContainer.add(nameText);
        
        // 玩家数量
        const playersText = this.add.text(width / 2 + 100, y - 10, `${room.currentPlayers}/${room.maxPlayers}`, {
            fontSize: '16px',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace'
        });
        this.roomListContainer.add(playersText);
        
        // 加入按钮
        const joinBtn = this.add.text(width / 2 + 200, y, '加入', {
            fontSize: '16px',
            color: '#00ff88',
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#003322',
            padding: { x: 15, y: 5 }
        });
        joinBtn.setOrigin(0.5);
        joinBtn.setInteractive({ useHandCursor: true });
        
        joinBtn.on('pointerover', () => {
            joinBtn.setColor('#ffffff');
        });
        
        joinBtn.on('pointerout', () => {
            joinBtn.setColor('#00ff88');
        });
        
        joinBtn.on('pointerdown', () => {
            this.multiplayer.joinRoom(room.id);
        });
        
        this.roomListContainer.add(joinBtn);
    }
    
    /**
     * 显示房间UI
     */
    private showRoomUI(): void {
        this.clearDynamicUI();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 房间标题
        const roomTitle = this.add.text(width / 2, 150, `房间: ${this.currentRoom?.name || '未知'}`, {
            fontSize: '28px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        roomTitle.setOrigin(0.5);
        this.container.add(roomTitle);
        
        // 房间容器
        this.roomContainer = this.add.container(0, 0);
        this.container.add(this.roomContainer);
        
        // 创建玩家槽位
        this.createPlayerSlots();
        
        // 准备/取消准备按钮
        this.createButton(width / 2 - 100, height - 100, 180, 45, '准备', 0x00ff88, () => {
            this.isReady = !this.isReady;
            this.multiplayer.setReady(this.isReady);
        });
        
        // 开始游戏按钮（仅房主）
        if (this.multiplayer.isHost()) {
            this.createButton(width / 2 + 100, height - 100, 180, 45, '开始游戏', 0xffff00, () => {
                this.multiplayer.startGame();
            });
        }
        
        // 离开房间按钮
        this.createButton(width / 2, height - 50, 200, 40, '离开房间', 0xff0044, () => {
            this.multiplayer.leaveRoom();
            this.state = LobbyState.MAIN_MENU;
            this.showMainMenu();
        });
    }
    
    /**
     * 创建玩家槽位
     */
    private createPlayerSlots(): void {
        if (!this.roomContainer || !this.currentRoom) return;
        
        this.playerSlots = [];
        const width = this.cameras.main.width;
        const startY = 220;
        const slotHeight = 80;
        
        for (let i = 0; i < this.currentRoom.maxPlayers; i++) {
            const player = this.currentRoom.players[i];
            const slot = this.createPlayerSlot(width / 2, startY + i * slotHeight, player, i);
            this.playerSlots.push(slot);
            this.roomContainer.add(slot);
        }
    }
    
    /**
     * 创建玩家槽位
     */
    private createPlayerSlot(x: number, y: number, player: any, index: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2a, 0.8);
        bg.fillRoundedRect(-200, -30, 400, 60, 4);
        bg.lineStyle(1, player ? 0x00ffff : 0x333333, 0.8);
        bg.strokeRoundedRect(-200, -30, 400, 60, 4);
        container.add(bg);
        
        if (player) {
            // 玩家名称
            const nameText = this.add.text(-180, -10, player.name, {
                fontSize: '18px',
                color: player.ready ? '#00ff88' : '#ffffff',
                fontFamily: 'Courier New, monospace'
            });
            container.add(nameText);
            
            // 职业
            const classText = this.add.text(-180, 10, this.getClassName(player.class), {
                fontSize: '14px',
                color: '#888888',
                fontFamily: 'Courier New, monospace'
            });
            container.add(classText);
            
            // 准备状态
            if (player.ready) {
                const readyText = this.add.text(150, 0, '已准备', {
                    fontSize: '16px',
                    color: '#00ff88',
                    fontFamily: 'Courier New, monospace'
                });
                readyText.setOrigin(0.5);
                container.add(readyText);
            }
            
            // 房主标识
            if (player.id === this.currentRoom?.hostId) {
                const hostText = this.add.text(180, -10, '房主', {
                    fontSize: '12px',
                    color: '#ffff00',
                    fontFamily: 'Courier New, monospace'
                });
                container.add(hostText);
            }
        } else {
            // 空槽位
            const emptyText = this.add.text(0, 0, '等待玩家加入...', {
                fontSize: '16px',
                color: '#555555',
                fontFamily: 'Courier New, monospace'
            });
            emptyText.setOrigin(0.5);
            container.add(emptyText);
        }
        
        return container;
    }
    
    /**
     * 更新房间玩家
     */
    private updateRoomPlayers(): void {
        if (this.roomContainer) {
            this.roomContainer.removeAll(true);
            this.createPlayerSlots();
        }
    }
    
    /**
     * 获取职业名称
     */
    private getClassName(classType: string): string {
        const classNames: Record<string, string> = {
            'street_samurai': '街头武士',
            'data_hacker': '数据黑客',
            'bio_engineer': '生化改造者',
            'shadow_assassin': '暗影刺客'
        };
        return classNames[classType] || classType;
    }
    
    /**
     * 开始多人游戏
     */
    private startMultiplayerGame(data: any): void {
        // 保存联机数据到游戏配置
        this.scene.start('GameScene', {
            selectedClass: this.selectedClass,
            multiplayer: this.multiplayer,
            multiplayerData: data
        });
    }
    
    /**
     * 创建按钮
     */
    private createButton(x: number, y: number, width: number, height: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.9);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
        container.add(bg);
        
        // 文字
        const label = this.add.text(0, 0, text, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);
        container.add(label);
        
        // 交互区域
        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);
        
        // 悬停效果
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 0.2);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
            bg.lineStyle(3, color, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
            label.setColor('#ffffff');
            container.setScale(1.05);
        });
        
        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x0a0a1a, 0.9);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
            bg.lineStyle(2, color, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
            label.setColor(`#${color.toString(16).padStart(6, '0')}`);
            container.setScale(1);
        });
        
        hitArea.on('pointerdown', () => {
            container.setScale(0.95);
        });
        
        hitArea.on('pointerup', () => {
            container.setScale(1.05);
            callback();
        });
        
        this.container.add(container);
        return container;
    }
    
    /**
     * 显示错误消息
     */
    private showError(message: string): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const errorBg = this.add.rectangle(width / 2, height / 2, 400, 80, 0x000000, 0.9);
        errorBg.setStrokeStyle(2, 0xff0000, 1);
        
        const errorText = this.add.text(width / 2, height / 2, message, {
            fontSize: '18px',
            color: '#ff4444',
            fontFamily: 'Courier New, monospace'
        });
        errorText.setOrigin(0.5);
        
        this.tweens.add({
            targets: [errorBg, errorText],
            alpha: { from: 0, to: 1 },
            duration: 200,
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: [errorBg, errorText],
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            errorBg.destroy();
                            errorText.destroy();
                        }
                    });
                });
            }
        });
    }
    
    /**
     * 清除动态UI
     */
    private clearDynamicUI(): void {
        if (this.roomListContainer) {
            this.roomListContainer.removeAll(true);
        }
        if (this.roomContainer) {
            this.roomContainer.removeAll(true);
        }
        this.playerSlots = [];
    }
    
    /**
     * 断开连接并返回
     */
    private disconnectAndReturn(): void {
        this.multiplayer.cleanup();
        this.scene.start('MenuScene');
    }
    
    /**
     * 更新粒子
     */
    private updateParticles(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 添加新粒子
        if (this.particles.length < 50 && Math.random() < 0.3) {
            const colors = [0x00ffff, 0xff00ff, 0xffff00];
            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(1, 2);
            this.particles.push({
                x: Phaser.Math.Between(0, width),
                y: Phaser.Math.Between(0, height),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Phaser.Math.Between(0, colors.length - 1)],
                size: Phaser.Math.Between(1, 2),
                alpha: 0.5,
                life: Phaser.Math.Between(50, 150)
            });
        }
        
        // 更新粒子
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = Math.max(0.1, p.life / 100);
            return p.life > 0 && p.x > 0 && p.x < width && p.y > 0 && p.y < height;
        });
        
        // 重绘
        this.particleGraphics.clear();
        this.particles.forEach(p => {
            this.particleGraphics.fillStyle(p.color, p.alpha);
            this.particleGraphics.fillCircle(p.x, p.y, p.size);
        });
    }
    
    /**
     * 场景关闭
     */
    shutdown(): void {
        this.multiplayer.off(MultiplayerEvent.CONNECTED, () => {});
        this.multiplayer.off(MultiplayerEvent.AUTHENTICATED, () => {});
        this.multiplayer.off(MultiplayerEvent.ERROR, () => {});
        this.multiplayer.off(MultiplayerEvent.DISCONNECTED, () => {});
        this.multiplayer.off(MultiplayerEvent.MATCH_SEARCHING, () => {});
        this.multiplayer.off(MultiplayerEvent.MATCH_FOUND, () => {});
        this.multiplayer.off(MultiplayerEvent.MATCH_CANCELLED, () => {});
        this.multiplayer.off(MultiplayerEvent.ROOM_CREATED, () => {});
        this.multiplayer.off(MultiplayerEvent.ROOM_JOINED, () => {});
        this.multiplayer.off(MultiplayerEvent.PLAYER_JOINED, () => {});
        this.multiplayer.off(MultiplayerEvent.PLAYER_LEFT, () => {});
        this.multiplayer.off(MultiplayerEvent.PLAYER_READY_CHANGED, () => {});
        this.multiplayer.off(MultiplayerEvent.HOST_CHANGED, () => {});
        this.multiplayer.off(MultiplayerEvent.GAME_START, () => {});
        this.multiplayer.off(MultiplayerEvent.SERVER_SHUTDOWN, () => {});
    }
}
