/**
 * 游戏主场景
 * 核心游戏逻辑所在场景
 */

import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import PowerUp, { PowerUpType, PowerUpRarity } from '../entities/PowerUp';
import TimeFragment from '../entities/TimeFragment';
import Hologram from '../entities/Hologram';
import Drone from '../entities/Drone';
import { GAME_CONFIG, MULTIPLAYER_CONFIG } from '../core/Config';
import { EnemyType, ClassType, EnemyRarity } from '../core/Types';
import { getEnemyTemplate, rollLoot } from '../data/Enemies';
import { EVENTS } from '../data/Events';
import { TimeRewindSystem, TIME_REWIND_CONFIG } from '../systems/TimeRewindSystem';
import { RandomEventSystem } from '../systems/RandomEventSystem';
import { AudioManager } from '../systems/AudioManager';
import { MultiplayerSystem, MultiplayerEvent, RemotePlayer } from '../systems/MultiplayerSystem';
import { SoundType } from '../core/Types';

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private powerUps: PowerUp[] = [];
    private timeFragments: TimeFragment[] = [];
    private holograms: Hologram[] = []; // 全息幻影列表
    private drones: Drone[] = []; // 无人机列表
    private timeElapsed: number = 0;
    private levelTime: number = GAME_CONFIG.level.duration;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private powerUpTimer!: Phaser.Time.TimerEvent;
    private isGameOver: boolean = false;
    private isPaused: boolean = false;
    private timeRewindSystem!: TimeRewindSystem;
    private randomEventSystem!: RandomEventSystem;
    private enemyPool: Enemy[] = []; // 敌人对象池
    private currentSpawnInterval: number = 0; // 当前敌人生成间隔
    private selectedClass: ClassType | undefined; // 选择的职业
    
    // 联机系统
    private multiplayer: MultiplayerSystem | null = null;
    private isMultiplayer: boolean = false;
    private remotePlayers: Map<string, Phaser.GameObjects.Container> = new Map();
    private difficultyMultiplier: number = 1.0;
    private audioManager!: AudioManager;

    constructor() {
        super({ key: 'GameScene', active: false });
    }

    /**
     * 初始化场景
     */
    init(data: any): void {
        // 接收职业选择数据
        if (data && data.selectedClass) {
            this.selectedClass = data.selectedClass as ClassType;
        }
        
        // 检查是否为联机模式（只有明确传入时才启用）
        // 使用严格比较，确保只有明确传入时才启用联机模式
        if (data && typeof data.multiplayer === 'boolean' && data.multiplayer === true) {
            this.multiplayer = data.multiplayer;
            this.isMultiplayer = true;
        } else {
            this.isMultiplayer = false;
            this.multiplayer = null;
        }
        
        // 检查联机游戏数据
        if (data && data.multiplayerData) {
            // 使用服务器提供的随机种子
            const seed = data.multiplayerData.seed;
            // 可以用种子初始化随机数生成器
            console.log(`[GameScene] 联机游戏种子: ${seed}`);
            
            // 设置难度倍率
            const playerCount = data.multiplayerData.players?.length || 1;
            this.difficultyMultiplier = 1 + (playerCount - 1) * MULTIPLAYER_CONFIG.difficultyScaling.perPlayerBonus;
            this.difficultyMultiplier = Math.min(
                this.difficultyMultiplier,
                MULTIPLAYER_CONFIG.difficultyScaling.maxMultiplier
            );
        }
    }

    /**
     * 创建场景
     */
    create(): void {
        // 重置状态
        this.isGameOver = false;
        this.enemies = [];
        this.powerUps = [];
        this.timeFragments = [];
        this.holograms = [];
        this.drones = [];
        this.timeElapsed = 0;

        // 创建地图
        this.createMap();

        // 创建玩家
        this.createPlayer();

        // 设置相机跟随玩家
        this.setupCamera();

        // 生成初始道具
        this.spawnInitialPowerUps();

        // 生成敌人和启动敌人生成器
        this.spawnInitialEnemies();
        this.startEnemySpawner();

        // 启动道具生成定时器
        this.startPowerUpSpawner();

        // 创建UI场景
        this.scene.launch('UIScene', { player: this.player });

        // 监听敌人被击败事件
        this.events.on('enemyDefeated', this.onEnemyDefeated, this);
        
        // 监听敌人超出边界事件
        this.events.on('enemyOutOfBounds', this.onEnemyOutOfBounds, this);

        // 添加键盘监听 - 打开合成界面
        this.input.keyboard!.on('keydown-C', () => {
            this.openCraftingScene();
        }, this);

        // 添加键盘监听 - 存档功能
        this.input.keyboard!.on('keydown-F5', () => {
            this.quickSave();
        }, this);

        this.input.keyboard!.on('keydown-F9', () => {
            this.quickLoad();
        }, this);

        this.input.keyboard!.on('keydown-S', (event: KeyboardEvent) => {
            if (event.ctrlKey) {
                this.openSaveScene('save');
            }
        }, this);

        this.input.keyboard!.on('keydown-L', (event: KeyboardEvent) => {
            if (event.ctrlKey) {
                this.openSaveScene('load');
            }
        }, this);

        // 添加键盘监听 - 时间回溯功能
        this.input.keyboard!.on('keydown-T', () => {
            this.openTimeRewindScene();
        }, this);

        // 添加键盘监听 - ESC键暂停功能
        this.input.keyboard!.on('keydown-ESC', () => {
            this.togglePause();
        }, this);

        // 添加键盘监听 - 测试菜单（仅开发环境，F12键）
        if (import.meta.env.DEV) {
            this.input.keyboard!.on('keydown-F12', (event: KeyboardEvent) => {
                event.preventDefault();
                this.openTestMenu();
            }, this);
        }

        // 监听时间回溯事件
        this.events.on('time-rewind', this.onTimeRewind, this);

        // 监听全息幻影事件
        this.events.on('hologram-spawned', this.onHologramSpawned, this);

        // 监听无人机创建事件
        this.events.on('drone-spawned', this.onDroneSpawned, this);
        this.events.on('drone-destroyed', this.onDroneDestroyed, this);

        // 监听职业能力系统召唤无人机事件（数据黑客职业）
        this.events.on('summon-drone', this.onSummonDrone, this);

        // 监听暂停/恢复事件
        this.events.on('pause-game', this.pauseGame, this);
        this.events.on('resume-game', this.resumeGame, this);

        // 初始化游戏时间
        this.data.set('gameTime', 0);

        // 初始化时间回溯系统
        this.initTimeRewindSystem();

        // 初始化随机事件系统
        this.initRandomEventSystem();

        // 初始化音效系统
        this.initAudioSystem();
        
        // 初始化联机系统
        if (this.isMultiplayer && this.multiplayer) {
            this.initMultiplayerSystem();
        }

        // 初始化测试系统（仅开发环境）
        if (import.meta.env.DEV) {
            this.initTestSystem();
        }
    }

    /**
     * 创建地图 - 赛博朋克风格
     */
    private createMap(): void {
        const worldWidth = GAME_CONFIG.worldWidth;
        const worldHeight = GAME_CONFIG.worldHeight;

        // 创建地图背景
        const graphics = this.add.graphics();
        
        // 深色背景渐变
        for (let y = 0; y < worldHeight; y += 4) {
            const alpha = 0.3 + (y / worldHeight) * 0.2;
            graphics.fillStyle(0x0a0a1a, alpha);
            graphics.fillRect(0, y, worldWidth, 4);
        }

        // 绘制霓虹网格地板
        this.drawNeonGrid(graphics, worldWidth, worldHeight);

        // 绘制电路板纹理
        this.drawCircuitPattern(graphics, worldWidth, worldHeight);

        // 添加随机霓虹光点
        this.addNeonLights(graphics, worldWidth, worldHeight);

        // 绘制边界 - 霓虹警告区
        this.drawNeonBorder(graphics, worldWidth, worldHeight);

        // 创建世界边界
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // 添加扫描线效果
        this.addScanlineEffect();
    }

    /**
     * 绘制霓虹网格
     */
    private drawNeonGrid(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const gridSize = 80;
        
        // 主网格 - 青色霓虹
        graphics.lineStyle(1, 0x00ffff, 0.15);
        for (let x = 0; x <= width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
        graphics.strokePath();

        // 次网格 - 品红色
        graphics.lineStyle(1, 0xff00ff, 0.08);
        const subGridSize = 20;
        for (let x = 0; x <= width; x += subGridSize) {
            if (x % gridSize !== 0) {
                graphics.moveTo(x, 0);
                graphics.lineTo(x, height);
            }
        }
        for (let y = 0; y <= height; y += subGridSize) {
            if (y % gridSize !== 0) {
                graphics.moveTo(0, y);
                graphics.lineTo(width, y);
            }
        }
        graphics.strokePath();

        // 网格交叉点发光
        graphics.fillStyle(0x00ffff, 0.3);
        for (let x = 0; x <= width; x += gridSize) {
            for (let y = 0; y <= height; y += gridSize) {
                if (Math.random() < 0.3) {
                    graphics.fillCircle(x, y, 2);
                }
            }
        }
    }

    /**
     * 绘制电路板纹理
     */
    private drawCircuitPattern(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        graphics.lineStyle(2, 0x0066ff, 0.2);
        
        // 随机电路路径
        for (let i = 0; i < 50; i++) {
            const startX = Phaser.Math.Between(0, width);
            const startY = Phaser.Math.Between(0, height);
            
            graphics.beginPath();
            graphics.moveTo(startX, startY);
            
            let currentX = startX;
            let currentY = startY;
            
            // 绘制电路路径
            for (let j = 0; j < 5; j++) {
                const direction = Phaser.Math.Between(0, 3);
                const length = Phaser.Math.Between(30, 100);
                
                switch (direction) {
                    case 0: currentX += length; break;
                    case 1: currentX -= length; break;
                    case 2: currentY += length; break;
                    case 3: currentY -= length; break;
                }
                
                currentX = Phaser.Math.Clamp(currentX, 0, width);
                currentY = Phaser.Math.Clamp(currentY, 0, height);
                graphics.lineTo(currentX, currentY);
            }
            
            graphics.strokePath();
            
            // 电路节点
            graphics.fillStyle(0x00ffff, 0.4);
            graphics.fillCircle(currentX, currentY, 3);
        }
    }

    /**
     * 添加霓虹光点
     */
    private addNeonLights(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        const colors = [0x00ffff, 0xff00ff, 0xffff00, 0xff6600, 0x9900ff];
        
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(50, width - 50);
            const y = Phaser.Math.Between(50, height - 50);
            const color = colors[Phaser.Math.Between(0, colors.length - 1)];
            const radius = Phaser.Math.Between(10, 30);
            
            // 光晕
            graphics.fillStyle(color, 0.05);
            graphics.fillCircle(x, y, radius);
            
            // 中心点
            graphics.fillStyle(color, 0.3);
            graphics.fillCircle(x, y, 2);
        }
    }

    /**
     * 绘制霓虹边界
     */
    private drawNeonBorder(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
        // 外层发光
        graphics.lineStyle(8, 0xff0066, 0.2);
        graphics.strokeRect(15, 15, width - 30, height - 30);
        
        // 中层
        graphics.lineStyle(3, 0xff0066, 0.5);
        graphics.strokeRect(10, 10, width - 20, height - 20);
        
        // 内层
        graphics.lineStyle(1, 0xff0066, 0.8);
        graphics.strokeRect(5, 5, width - 10, height - 10);
        
        // 角落装饰
        const cornerSize = 40;
        graphics.lineStyle(2, 0xff0066, 1);
        
        // 左上
        graphics.moveTo(5, cornerSize);
        graphics.lineTo(5, 5);
        graphics.lineTo(cornerSize, 5);
        
        // 右上
        graphics.moveTo(width - cornerSize, 5);
        graphics.lineTo(width - 5, 5);
        graphics.lineTo(width - 5, cornerSize);
        
        // 左下
        graphics.moveTo(5, height - cornerSize);
        graphics.lineTo(5, height - 5);
        graphics.lineTo(cornerSize, height - 5);
        
        // 右下
        graphics.moveTo(width - cornerSize, height - 5);
        graphics.lineTo(width - 5, height - 5);
        graphics.lineTo(width - 5, height - cornerSize);
        
        graphics.strokePath();
    }

    /**
     * 添加扫描线效果
     */
    private addScanlineEffect(): void {
        // 创建扫描线纹理
        const scanlineGraphics = this.add.graphics();
        scanlineGraphics.fillStyle(0x00ffff, 0.03);
        
        for (let y = 0; y < GAME_CONFIG.worldHeight; y += 4) {
            scanlineGraphics.fillRect(0, y, GAME_CONFIG.worldWidth, 2);
        }
        
        scanlineGraphics.setDepth(1000);
        scanlineGraphics.setAlpha(0.5);
        
        // 扫描线移动动画
        this.tweens.add({
            targets: scanlineGraphics,
            alpha: { from: 0.3, to: 0.6 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 设置相机跟随
     */
    private setupCamera(): void {
        const worldWidth = GAME_CONFIG.worldWidth;
        const worldHeight = GAME_CONFIG.worldHeight;

        // 设置相机边界为世界大小
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBackgroundColor('#0f0f1f');
        
        // 相机跟随玩家，带有平滑跟随效果
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    /**
     * 创建玩家
     */
    private createPlayer(): void {
        const startX = GAME_CONFIG.worldWidth / 2;
        const startY = GAME_CONFIG.worldHeight / 2;

        // 创建玩家实体（传入选择的职业）
        this.player = new Player(this, startX, startY, this.selectedClass);

        // 设置玩家在世界边界内
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);

        // 监听玩家死亡事件（只监听一次）
        this.player.once('playerDeath', () => {
            this.onPlayerDeath();
        });
    }

    /**
     * 生成初始道具
     */
    private spawnInitialPowerUps(): void {
        // 在地图上随机生成道具
        const powerUpCount = 30; // 初始生成30个道具

        for (let i = 0; i < powerUpCount; i++) {
            this.spawnRandomPowerUp();
        }
    }

    /**
     * 生成随机道具 - 经验:其他 = 9:1
     */
    private spawnRandomPowerUp(): void {
        if (this.isGameOver) return;

        const worldWidth = GAME_CONFIG.worldWidth;
        const worldHeight = GAME_CONFIG.worldHeight;
        const margin = 100;

        // 随机位置
        const x = Phaser.Math.Between(margin, worldWidth - margin);
        const y = Phaser.Math.Between(margin, worldHeight - margin);

        // 类型选择：90%概率是经验，10%概率是其他
        let type: PowerUpType;
        if (Math.random() < 0.9) {
            type = PowerUpType.EXPERIENCE;
        } else {
            // 其他类型随机选择
            const otherTypes = [
                PowerUpType.HEALTH,
                PowerUpType.ATTACK_BOOST,
                PowerUpType.DEFENSE_BOOST,
                PowerUpType.SPEED_BOOST,
                PowerUpType.CRIT_BOOST
            ];
            type = otherTypes[Phaser.Math.Between(0, otherTypes.length - 1)];
        }

        // 随机稀有度（加权）
        const rand = Math.random();
        let rarity: PowerUpRarity;
        if (rand < 0.5) {
            rarity = PowerUpRarity.COMMON;
        } else if (rand < 0.8) {
            rarity = PowerUpRarity.RARE;
        } else if (rand < 0.95) {
            rarity = PowerUpRarity.EPIC;
        } else {
            rarity = PowerUpRarity.LEGENDARY;
        }

        this.spawnPowerUp(x, y, type, rarity);
    }

    /**
     * 生成指定道具
     */
    private spawnPowerUp(x: number, y: number, type: PowerUpType, rarity: PowerUpRarity): void {
        const powerUp = new PowerUp(this, x, y, type, rarity);
        this.powerUps.push(powerUp);
        
        // 使用闭包变量防止重复触发
        let isCollected = false;

        // 添加与玩家的碰撞检测
        this.physics.add.overlap(this.player, powerUp, () => {
            // 防止重复触发
            if (isCollected) return;
            isCollected = true;
            
            // 立即禁用物理体
            const body = powerUp.body as Phaser.Physics.Arcade.Body;
            if (body) body.enable = false;
            
            // 应用效果
            powerUp.applyTo(this.player);

            // 从列表中移除
            const index = this.powerUps.indexOf(powerUp);
            if (index > -1) {
                this.powerUps.splice(index, 1);
            }

            // 简单的收集动画
            this.tweens.add({
                targets: powerUp,
                scale: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => powerUp.destroy()
            });
        });
    }

    /**
     * 收集道具（保留用于其他地方调用）
     */
    private collectPowerUp(powerUp: PowerUp): void {
        // 应用效果
        powerUp.applyTo(this.player);

        // 从列表中移除
        const index = this.powerUps.indexOf(powerUp);
        if (index > -1) {
            this.powerUps.splice(index, 1);
        }

        // 销毁道具
        powerUp.collect();
    }

    /**
     * 生成初始敌人
     */
    private spawnInitialEnemies(): void {
        // 生成普通敌人
        for (let i = 0; i < GAME_CONFIG.level.enemyCount; i++) {
            this.spawnEnemyFromEdge(EnemyType.COMMON);
        }

        // 生成精英敌人
        for (let i = 0; i < GAME_CONFIG.level.eliteCount; i++) {
            this.spawnEnemyFromEdge(EnemyType.ELITE);
        }
    }

    /**
     * 启动敌人持续生成器
     * 使用动态难度曲线调整生成间隔
     */
    private startEnemySpawner(): void {
        // 初始化生成间隔
        const curveConfig = GAME_CONFIG.level.difficultyCurve;
        this.currentSpawnInterval = curveConfig.enabled 
            ? curveConfig.initialSpawnInterval 
            : GAME_CONFIG.level.enemySpawnInterval;
        
        this.spawnTimer = this.time.addEvent({
            delay: this.currentSpawnInterval,
            callback: () => {
                // 只有在敌人数量未达到上限且游戏未结束时才生成新敌人
                if (!this.isGameOver && this.enemies.length < GAME_CONFIG.level.maxEnemies) {
                    // 80% 概率生成普通敌人，20% 概率生成精英
                    const type = Math.random() < 0.8 ? EnemyType.COMMON : EnemyType.ELITE;
                    this.spawnEnemyFromEdge(type);
                }
                
                // 动态更新生成间隔
                this.updateSpawnInterval();
            },
            loop: true
        });
    }
    
    /**
     * 更新敌人生成间隔
     * 根据游戏时间动态调整难度
     */
    private updateSpawnInterval(): void {
        const curveConfig = GAME_CONFIG.level.difficultyCurve;
        
        // 如果未启用难度曲线，直接返回
        if (!curveConfig.enabled) return;
        
        // 计算当前进度（0-1）
        const progress = Math.min(this.timeElapsed / curveConfig.curveDuration, 1);
        
        // 根据曲线类型计算当前间隔
        let easedProgress: number;
        switch (curveConfig.curveType) {
            case 'linear':
                easedProgress = progress;
                break;
            case 'ease-in':
                // 开始慢，后期加速
                easedProgress = progress * progress;
                break;
            case 'ease-out':
                // 开始快，后期减速
                easedProgress = 1 - (1 - progress) * (1 - progress);
                break;
            case 'ease-in-out':
                // 先慢后快再慢
                easedProgress = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                break;
            default:
                easedProgress = progress;
        }
        
        // 计算新的生成间隔
        const newInterval = curveConfig.initialSpawnInterval - 
            (curveConfig.initialSpawnInterval - curveConfig.minSpawnInterval) * easedProgress;
        
        // 如果间隔变化超过10%，更新定时器
        if (Math.abs(newInterval - this.currentSpawnInterval) > this.currentSpawnInterval * 0.1) {
            this.currentSpawnInterval = Math.round(newInterval);
            
            // 重新创建定时器以应用新的间隔
            this.spawnTimer.destroy();
            this.spawnTimer = this.time.addEvent({
                delay: this.currentSpawnInterval,
                callback: () => {
                    if (!this.isGameOver && this.enemies.length < GAME_CONFIG.level.maxEnemies) {
                        const type = Math.random() < 0.8 ? EnemyType.COMMON : EnemyType.ELITE;
                        this.spawnEnemyFromEdge(type);
                    }
                    this.updateSpawnInterval();
                },
                loop: true
            });
        }
    }

    /**
     * 启动道具生成定时器
     */
    private startPowerUpSpawner(): void {
        this.powerUpTimer = this.time.addEvent({
            delay: 5000, // 每5秒生成一个道具
            callback: () => {
                if (!this.isGameOver && this.powerUps.length < 50) {
                    this.spawnRandomPowerUp();
                }
            },
            loop: true
        });
    }

    /**
     * 从世界边界外生成敌人 - 改进为在玩家周围生成，增加割草感
     * 支持动态等级和稀有度
     */
    private spawnEnemyFromEdge(type: EnemyType): void {
        if (this.isGameOver) return;
        
        // 安全检查：确保玩家存在
        if (!this.player || !this.player.active) return;

        // 在玩家周围生成敌人，距离玩家 400-800 像素的环形区域
        const playerX = this.player.x;
        const playerY = this.player.y;
        const minDistance = 400;
        const maxDistance = 800;
        
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        
        let x = playerX + Math.cos(angle) * distance;
        let y = playerY + Math.sin(angle) * distance;
        
        // 确保在世界边界内
        x = Phaser.Math.Clamp(x, 50, GAME_CONFIG.worldWidth - 50);
        y = Phaser.Math.Clamp(y, 50, GAME_CONFIG.worldHeight - 50);
        
        // 计算敌人等级（基于游戏时间，每60秒提升1级）
        const enemyLevel = Math.max(1, Math.floor(this.timeElapsed / 60) + 1);
        
        // 随机决定稀有度（基于等级和概率）
        const rarity = this.rollEnemyRarity(enemyLevel);

        const enemy = this.getEnemyFromPool(x, y, type, enemyLevel, rarity);
        if (enemy) {
            this.enemies.push(enemy);
            enemy.setTarget(this.player);

            this.physics.add.collider(this.player, enemy, this.handlePlayerEnemyCollision, undefined, this);
            
            // 限制敌人之间的碰撞检测数量，提高性能
            const maxColliders = 10;
            const nearbyEnemies = this.enemies.slice(-maxColliders);
            for (const otherEnemy of nearbyEnemies) {
                if (otherEnemy !== enemy) {
                    this.physics.add.collider(enemy, otherEnemy);
                }
            }
        }
    }
    
    /**
     * 根据等级随机决定敌人稀有度
     */
    private rollEnemyRarity(level: number): EnemyRarity | undefined {
        // BOSS类型不随机稀有度
        // 基础概率
        const baseEliteChance = 0.05;
        const baseRareChance = 0.02;
        const baseLegendaryChance = 0.005;
        
        // 等级加成（每级增加概率）
        const levelBonus = level * 0.005;
        
        const rand = Math.random();
        
        // 传说概率
        if (rand < baseLegendaryChance + levelBonus * 0.5) {
            return EnemyRarity.LEGENDARY;
        }
        // 稀有概率
        if (rand < baseRareChance + levelBonus) {
            return EnemyRarity.RARE;
        }
        // 精英概率
        if (rand < baseEliteChance + levelBonus * 2) {
            return EnemyRarity.ELITE;
        }
        
        // 普通
        return undefined; // 让Enemy类自动决定
    }

    /**
     * 从对象池获取敌人
     */
    private getEnemyFromPool(x: number, y: number, type: EnemyType, level: number = 1, rarity?: EnemyRarity): Enemy | null {
        for (let i = 0; i < this.enemyPool.length; i++) {
            const enemy = this.enemyPool[i];
            if (!enemy.active) {
                if (enemy.scene) {
                    enemy.reset(x, y, type, level, rarity);
                    return enemy;
                } else {
                    this.enemyPool.splice(i, 1);
                    i--;
                }
            }
        }

        if (this.enemyPool.length < 50) {
            const enemy = new Enemy(this, x, y, type, level, rarity);
            this.enemyPool.push(enemy);
            return enemy;
        }

        return null;
    }

    /**
     * 回收敌人到对象池
     */
    private returnEnemyToPool(enemy: Enemy): void {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
        
        // 禁用敌人但不销毁
        enemy.setActive(false);
        enemy.setVisible(false);
        
        // 重置敌人属性，准备下次重用
        enemy.setScale(1);
        enemy.setAlpha(1);
        
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.enable = false;
            body.setVelocity(0, 0);
        }
    }

    /**
     * 处理玩家与敌人碰撞
     */
    private handlePlayerEnemyCollision(
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ): void {
        if ((player as Player).takeDamage && !this.isGameOver) {
            const enemyObj = enemy as Enemy;
            const enemyStats = enemyObj.getStats();
            const damage = Math.max(1, enemyStats.attack - (player as Player).getStats().defense);
            (player as Player).takeDamage(damage);
        }
    }

    /**
     * 敌人被击败处理
     */
    private onEnemyDefeated(enemy: Enemy): void {
        if (this.isGameOver) return;

        this.player.addKill();

        const enemyType = enemy.getEnemyType();
        const template = getEnemyTemplate(enemyType);
        if (template) {
            const loot = rollLoot(template);
            for (const itemId of loot) {
                this.player.addItem(itemId);
            }
            this.player.addExperience(template.experience);

            // 击败敌人时有概率掉落道具
            this.tryDropPowerUp(enemy.x, enemy.y, enemyType);
            
            // 击败敌人时有概率掉落时空碎片
            this.spawnTimeFragment(enemy.x, enemy.y);
        }

        // 击败精英敌人时尝试触发随机事件
        if (enemyType === EnemyType.ELITE || enemyType === EnemyType.BOSS) {
            this.tryTriggerRandomEvent();
        }

        // 回收敌人到对象池
        this.returnEnemyToPool(enemy);
    }
    
    /**
     * 敌人超出边界处理
     */
    private onEnemyOutOfBounds(enemy: Enemy): void {
        // 直接回收敌人到对象池，不掉落奖励
        this.returnEnemyToPool(enemy);
    }

    /**
     * 尝试掉落道具
     */
    private tryDropPowerUp(x: number, y: number, enemyType: EnemyType): void {
        // 根据敌人类型决定掉落概率
        const dropRates: Partial<Record<EnemyType, number>> = {
            [EnemyType.COMMON]: 0.1,   // 10%
            [EnemyType.ELITE]: 0.3,    // 30%
            [EnemyType.BOSS]: 0.8,     // 80%
            [EnemyType.RANGED]: 0.15,  // 15%
            [EnemyType.SUMMONER]: 0.2, // 20%
            [EnemyType.SPLITTER]: 0.15, // 15%
            [EnemyType.BOSS_MECH_BEAST]: 0.9,
            [EnemyType.BOSS_DATA_GHOST]: 0.9,
            [EnemyType.BOSS_BIO_TYRANT]: 0.9
        };

        const dropRate = dropRates[enemyType] ?? 0.1;
        if (Math.random() < dropRate) {
            const types = Object.values(PowerUpType);
            const type = types[Phaser.Math.Between(0, types.length - 1)];

            // 精英和Boss掉落更高稀有度
            let rarity: PowerUpRarity;
            if (enemyType === EnemyType.BOSS) {
                rarity = Math.random() < 0.5 ? PowerUpRarity.EPIC : PowerUpRarity.LEGENDARY;
            } else if (enemyType === EnemyType.ELITE) {
                rarity = Math.random() < 0.5 ? PowerUpRarity.RARE : PowerUpRarity.EPIC;
            } else {
                rarity = Math.random() < 0.7 ? PowerUpRarity.COMMON : PowerUpRarity.RARE;
            }

            this.spawnPowerUp(x, y, type, rarity);
        }
    }

    /**
     * 玩家死亡处理
     */
    private onPlayerDeath(): void {
        if (this.isGameOver) return;
        this.isGameOver = true;

        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }
        if (this.powerUpTimer) {
            this.powerUpTimer.destroy();
        }

        this.physics.pause();

        this.time.delayedCall(500, () => {
            this.showGameOver();
        });
    }

    /**
     * 显示游戏结束界面
     */
    private showGameOver(): void {
        const centerX = this.cameras.main.scrollX + GAME_CONFIG.width / 2;
        const centerY = this.cameras.main.scrollY + GAME_CONFIG.height / 2;

        const container = this.add.container(centerX, centerY);
        container.setDepth(1000);

        const bg = this.add.rectangle(0, 0, 450, 320, 0x000000, 0.9);
        bg.setStrokeStyle(3, 0xff0000, 1);
        container.add(bg);

        const gameOverText = this.add.text(0, -100, '游戏结束', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ff0000',
            fontFamily: 'Courier New, monospace'
        });
        gameOverText.setOrigin(0.5);
        container.add(gameOverText);

        const statsText = this.add.text(0, -20, `击败敌人: ${this.player.getKillCount()}\n等级: ${this.player.getLevel()}`, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            lineSpacing: 10
        });
        statsText.setOrigin(0.5);
        container.add(statsText);

        const restartBtn = this.add.rectangle(0, 80, 200, 50, 0x1a1a2e, 1);
        restartBtn.setStrokeStyle(2, 0x00ffff, 1);
        container.add(restartBtn);

        const restartLabel = this.add.text(0, 80, '重新开始', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        restartLabel.setOrigin(0.5);
        container.add(restartLabel);

        restartBtn.setInteractive({ useHandCursor: true });

        restartBtn.on('pointerover', () => {
            restartBtn.setFillStyle(0x00ffff, 0.3);
            restartLabel.setColor('#ffffff');
        });

        restartBtn.on('pointerout', () => {
            restartBtn.setFillStyle(0x1a1a2e, 1);
            restartLabel.setColor('#00ffff');
        });

        restartBtn.on('pointerdown', () => {
            this.restartGame();
        });
    }

    /**
     * 重新开始游戏
     */
    private restartGame(): void {
        // 清理玩家资源
        if (this.player) {
            this.player.cleanup();
        }

        // 清理敌人
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];

        // 清理对象池中的敌人
        this.enemyPool.forEach(enemy => enemy.destroy());
        this.enemyPool = [];

        // 清理道具
        this.powerUps.forEach(powerUp => powerUp.destroy());
        this.powerUps = [];

        // 清理全息幻影
        this.holograms.forEach(hologram => hologram.destroy());
        this.holograms = [];

        // 销毁定时器
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }
        if (this.powerUpTimer) {
            this.powerUpTimer.destroy();
        }

        // 清理音效系统
        if (this.audioManager) {
            this.audioManager.stopBGM();
        }

        // 移除事件监听
        this.events.off('enemyDefeated', this.onEnemyDefeated, this);
        this.events.off('enemyOutOfBounds', this.onEnemyOutOfBounds, this);
        this.events.off('time-rewind', this.onTimeRewind, this);
        this.events.off('hologram-spawned', this.onHologramSpawned, this);
        this.events.off('play-sound');
        this.events.off('volume-changed');
        this.events.off('toggle-mute');

        // 停止UI场景并重启游戏场景
        this.scene.stop('UIScene');
        this.scene.restart();
    }

    /**
     * 打开合成界面
     */
    private openCraftingScene(): void {
        if (this.isGameOver) return;
        
        // 暂停游戏场景
        this.physics.pause();
        
        // 启动合成场景
        this.scene.launch('CraftingScene', { 
            player: this.player,
            onClose: () => {
                // 关闭合成场景后恢复游戏
                this.physics.resume();
            }
        });
    }

    /**
     * 更新场景
     */
    update(time: number, delta: number): void {
        if (this.isGameOver) return;

        if (this.player && !this.player.getIsDead()) {
            this.player.update(time, delta);
        }

        for (const enemy of this.enemies) {
            enemy.update(time, delta);
        }

        // 更新全息幻影
        for (const hologram of this.holograms) {
            hologram.update(time, delta);
        }

        // 更新无人机
        for (const drone of this.drones) {
            drone.update(time, delta);
        }

        this.timeElapsed += delta / 1000;
        
        // 性能优化：定期清理远离玩家的敌人和道具
        this.cleanupDistantEntities();
        
        // 发射 update 事件供 UIScene 监听
        this.events.emit('update', time, delta);
        
        // 联机同步
        if (this.isMultiplayer && this.multiplayer) {
            this.syncPlayerState();
            // 每500ms同步一次敌人状态
            if (Math.floor(time / 500) !== Math.floor((time - delta) / 500)) {
                this.syncEnemyState();
            }
        }
    }
    
    /**
     * 清理远离玩家的实体 - 性能优化
     */
    private cleanupDistantEntities(): void {
        const maxDistance = 1200; // 超过这个距离的敌人会被清理
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // 清理远离的敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = Phaser.Math.Distance.Between(
                playerX, playerY, enemy.x, enemy.y
            );
            if (distance > maxDistance && this.enemies.length > 20) {
                this.returnEnemyToPool(enemy);
            }
        }
        
        // 清理过多的道具
        while (this.powerUps.length > 30) {
            const oldestPowerUp = this.powerUps.shift();
            if (oldestPowerUp) oldestPowerUp.destroy();
        }
    }

    // ========== 存档系统相关方法 ==========

    /**
     * 快速保存（自动存档槽位）
     */
    private quickSave(): void {
        if (this.isGameOver) return;

        const playerStats = this.player.getStats();
        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            player: this.player.getSaveData(),
            stats: {
                attack: playerStats.attack,
                defense: playerStats.defense,
                attackSpeed: playerStats.attackSpeed,
                critRate: playerStats.critRate,
                critDamage: playerStats.critDamage,
                moveSpeed: playerStats.moveSpeed
            },
            gameTime: this.data.get('gameTime') || 0
        };

        // 导入SaveSystem
        import('../systems/SaveSystem').then(({ SaveSystem }) => {
            const success = SaveSystem.autoSave(saveData as any);
            
            if (success) {
                this.showSaveMessage('游戏已保存', '#00ff00');
            } else {
                this.showSaveMessage('保存失败', '#ff0000');
            }
        });
    }

    /**
     * 快速加载
     */
    private quickLoad(): void {
        import('../systems/SaveSystem').then(({ SaveSystem }) => {
            const data = SaveSystem.loadAutoSave();
            
            if (!data) {
                this.showSaveMessage('没有找到存档', '#ff0000');
                return;
            }

            // 应用存档数据
            this.player.loadSaveData(data);
            this.data.set('gameTime', data.gameTime || 0);
            
            // 清理现有敌人和道具
            this.enemies.forEach(e => e.destroy());
            this.enemies = [];
            this.powerUps.forEach(p => p.destroy());
            this.powerUps = [];
            
            // 重新生成敌人
            this.spawnInitialEnemies();
            
            this.showSaveMessage('游戏已加载', '#00ffff');
        });
    }

    /**
     * 打开存档界面
     */
    private openSaveScene(mode: 'save' | 'load'): void {
        if (this.isGameOver) return;

        this.physics.pause();
        
        this.scene.launch('SaveScene', { 
            player: this.player,
            mode: mode
        });
    }

    /**
     * 显示存档消息
     */
    private showSaveMessage(text: string, color: string): void {
        const msg = this.add.text(this.cameras.main.scrollX + 640, 
            this.cameras.main.scrollY + 100, text, {
            fontSize: '24px',
            color: color,
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(2000);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 50,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    // ========== 时间回溯系统相关方法 ==========

    /**
     * 初始化时间回溯系统
     */
    private initTimeRewindSystem(): void {
        this.timeRewindSystem = new TimeRewindSystem(this);
        
        // 设置回调
        this.timeRewindSystem.setCallbacks(
            (snapshot) => {
                console.log(`[TimeRewind] 快照创建: ${snapshot.metadata.label}`);
                this.showTimeRewindMessage(`时间快照已保存`, '#00ffff');
            },
            (snapshot) => {
                console.log(`[TimeRewind] 回溯到: ${snapshot.metadata.label}`);
            },
            (count) => {
                // 通知UI更新时空碎片显示
                this.events.emit('time-fragments-changed', count);
            }
        );

        // 启动自动快照
        this.timeRewindSystem.startAutoSnapshot(
            () => this.getPlayerSnapshotData(),
            () => this.getWorldSnapshotData()
        );
    }

    /**
     * 获取玩家快照数据
     */
    private getPlayerSnapshotData() {
        const stats = this.player.getStats();
        const weapons = this.player.getOwnedWeapons().map((w: any) => w.id);
        const skills = this.player.getOwnedSkillIds();
        
        // 获取完整的技能数据（包含等级和冷却时间）
        const ownedSkills = this.player.getSaveData().ownedSkills;
        
        return {
            x: this.player.x,
            y: this.player.y,
            hp: stats.hp,
            maxHp: stats.maxHp,
            level: this.player.getLevel(),
            experience: this.player.getExperience(),
            maxExperience: this.player.getMaxExperience(),
            killCount: this.player.getKillCount(),
            weapons,
            activeWeaponSlot: this.player.getActiveWeaponSlot(),
            skills,
            ownedSkills, // 添加完整技能数据
            stats: {
                attack: stats.attack,
                defense: stats.defense,
                attackSpeed: stats.attackSpeed,
                critRate: stats.critRate,
                critDamage: stats.critDamage,
                moveSpeed: stats.moveSpeed
            }
        };
    }

    /**
     * 获取世界快照数据
     */
    private getWorldSnapshotData() {
        return {
            enemiesDefeated: this.player.getKillCount(),
            gameTime: this.data.get('gameTime') || 0
        };
    }

    /**
     * 打开时间回溯界面
     */
    private openTimeRewindScene(): void {
        if (this.isGameOver) return;

        this.physics.pause();
        
        this.scene.launch('TimeRewindScene', {
            player: this.player,
            timeRewindSystem: this.timeRewindSystem
        });
    }

    /**
     * 时间回溯回调
     */
    private onTimeRewind(data: { snapshot: any }): void {
        const snapshot = data.snapshot;
        if (!snapshot) return;

        console.log('[GameScene] 应用时间回溯数据');
        
        // 先暂停物理引擎，防止恢复过程中出现异常
        this.physics.pause();
        
        // 恢复玩家状态
        this.player.loadSaveData({
            version: '1.0.0',
            timestamp: snapshot.timestamp,
            player: snapshot.playerData,
            stats: snapshot.playerData.stats,
            gameTime: snapshot.worldData.gameTime
        });

        // 设置玩家位置
        this.player.setPosition(snapshot.playerData.x, snapshot.playerData.y);

        // 确保玩家物理体已启用
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        if (playerBody) {
            playerBody.enable = true;
            playerBody.setVelocity(0, 0);
        }

        // 清理现有敌人 - 正确回收到对象池
        for (const enemy of this.enemies) {
            this.returnEnemyToPool(enemy);
        }
        this.enemies = [];
        
        // 清理道具
        this.powerUps.forEach(p => p.destroy());
        this.powerUps = [];
        
        // 清理时空碎片
        this.timeFragments.forEach(f => f.destroy());
        this.timeFragments = [];

        // 恢复游戏时间
        this.data.set('gameTime', snapshot.worldData.gameTime);

        // 重新生成敌人
        this.spawnInitialEnemies();

        // 恢复物理引擎和游戏
        this.physics.resume();
        
        // 确保所有敌人和玩家的物理体正确激活
        this.time.delayedCall(50, () => {
            // 确保玩家物理体启用
            const pBody = this.player.body as Phaser.Physics.Arcade.Body;
            if (pBody) {
                pBody.enable = true;
            }
            
            // 确保敌人物理体启用
            for (const enemy of this.enemies) {
                if (enemy && enemy.active) {
                    const body = enemy.body as Phaser.Physics.Arcade.Body;
                    if (body) {
                        body.enable = true;
                    }
                    enemy.setTarget(this.player);
                }
            }
        });

        // 显示成功消息
        this.showTimeRewindMessage(`时间回溯成功！`, '#00ff00');
        
        // 确保 TimeRewindScene 已关闭
        if (this.scene.isActive('TimeRewindScene')) {
            this.scene.stop('TimeRewindScene');
        }
    }

    /**
     * 生成时空碎片
     */
    private spawnTimeFragment(x: number, y: number): void {
        if (Math.random() > TIME_REWIND_CONFIG.fragmentDropRate) return;

        const fragment = new TimeFragment(this, x, y, TIME_REWIND_CONFIG.fragmentDropAmount);
        this.timeFragments.push(fragment);
        
        // 保存 fragment 的值和引用
        const fragmentValue = fragment.getValue();
        let isCollected = false;
        
        // 设置与玩家的碰撞检测
        this.physics.add.overlap(this.player, fragment, () => {
            // 使用闭包变量防止重复触发
            if (isCollected) return;
            isCollected = true;
            
            // 立即禁用物理体
            const body = fragment.body as Phaser.Physics.Arcade.Body;
            if (body) body.enable = false;
            
            // 添加碎片
            this.timeRewindSystem.addTimeFragments(fragmentValue);
            
            // 从列表中移除
            const index = this.timeFragments.indexOf(fragment);
            if (index > -1) {
                this.timeFragments.splice(index, 1);
            }
            
            // 延迟一帧后处理视觉效果，确保物理引擎完成当前帧
            this.time.delayedCall(1, () => {
                if (!fragment.scene) return;
                
                // 显示收集提示
                const text = this.add.text(fragment.x, fragment.y - 20, `+${fragmentValue} 时空碎片`, {
                    fontSize: '16px',
                    color: '#00ffff',
                    fontFamily: 'Courier New, monospace',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5).setDepth(200);
                
                this.tweens.add({
                    targets: text,
                    y: text.y - 40,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => text.destroy()
                });
                
                // 简单的收集动画
                this.tweens.add({
                    targets: fragment,
                    scale: 0,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => fragment.destroy()
                });
            });
        });
    }

    /**
     * 显示时间回溯消息
     */
    private showTimeRewindMessage(text: string, color: string): void {
        const msg = this.add.text(this.cameras.main.scrollX + 640, 
            this.cameras.main.scrollY + 50, text, {
            fontSize: '20px',
            color: color,
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(2000);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 40,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    /**
     * 获取时间回溯系统
     */
    public getTimeRewindSystem(): TimeRewindSystem {
        return this.timeRewindSystem;
    }

    /**
     * 初始化音效系统
     */
    private initAudioSystem(): void {
        this.audioManager = new AudioManager(this);
        
        // 开始播放背景音乐
        this.audioManager.playBGM(SoundType.BGM_GAME);
        
        // 监听音效事件
        this.events.on('play-sound', (soundType: SoundType) => {
            this.audioManager.playSound(soundType);
        });
        
        // 监听音量变化事件
        this.events.on('volume-changed', (volumes: { master: number; music: number; sfx: number }) => {
            this.audioManager.setMasterVolume(volumes.master);
            this.audioManager.setMusicVolume(volumes.music);
            this.audioManager.setSFXVolume(volumes.sfx);
        });
        
        // 监听静音切换事件
        this.events.on('toggle-mute', () => {
            this.audioManager.toggleMute();
        });
        
        console.log('[GameScene] 音效系统初始化完成');
    }

    /**
     * 获取音效管理器
     */
    public getAudioManager(): AudioManager {
        return this.audioManager;
    }

    /**
     * 全息幻影生成事件
     */
    private onHologramSpawned(hologram: Hologram): void {
        this.holograms.push(hologram);
        
        // 监听全息幻影销毁事件
        hologram.once('destroy', () => {
            const index = this.holograms.indexOf(hologram);
            if (index > -1) {
                this.holograms.splice(index, 1);
            }
        });
    }

    /**
     * 无人机创建事件
     */
    private onDroneSpawned(drone: Drone): void {
        this.drones.push(drone);
        
        // 监听无人机销毁事件
        drone.once('destroy', () => {
            const index = this.drones.indexOf(drone);
            if (index > -1) {
                this.drones.splice(index, 1);
            }
        });

        console.log('[GameScene] 无人机已添加到场景');
    }

    /**
     * 无人机销毁事件
     */
    private onDroneDestroyed(drone: Drone): void {
        console.log('[GameScene] 无人机已销毁');
    }

    /**
     * 职业能力系统召唤无人机事件（数据黑客职业）
     * 由 ClassAbilitySystem 触发
     */
    private onSummonDrone(data: { x: number; y: number; damage: number; duration: number }): void {
        console.log('[GameScene] 收到召唤无人机事件');
        
        // 检查是否已有活跃无人机
        const activeDrones = this.drones.filter(d => d.getIsActive());
        if (activeDrones.length >= 3) {
            console.log('[GameScene] 已有3个活跃无人机，暂不召唤');
            return;
        }

        // 创建无人机
        const drone = new Drone(this, data.x, data.y, this.player!, {
            hp: 50,
            attack: data.damage,
            duration: data.duration / 1000 // 转换为秒
        });

        // drone-spawned 事件会在 Drone 构造函数中触发
        // 这会自动将无人机添加到 drones 数组中
        console.log('[GameScene] 召唤无人机成功');
    }

    // ========== 测试系统相关方法 ==========

    /**
     * 初始化测试系统（仅开发环境）
     */
    private initTestSystem(): void {
        if (!import.meta.env.DEV) return;

        // 监听测试事件
        this.events.on('test-spawn-enemy', (type: EnemyType) => {
            this.spawnTestEnemy(type);
        });

        this.events.on('test-clear-enemies', () => {
            this.clearAllEnemies();
        });

        this.events.on('test-kill-enemies', () => {
            this.killAllEnemies();
        });

        this.events.on('test-damage-enemies', (percent: number) => {
            this.damageAllEnemies(percent);
        });

        this.events.on('test-slow-enemies', () => {
            this.slowAllEnemies();
        });

        this.events.on('test-trigger-event', (eventId: string) => {
            this.triggerTestEvent(eventId);
        });

        console.log('[GameScene] 测试系统已初始化');
    }

    /**
     * 打开测试菜单（仅开发环境）
     */
    private openTestMenu(): void {
        if (!import.meta.env.DEV) return;
        
        // 暂停游戏
        this.scene.pause();
        
        // 启动测试菜单场景
        this.scene.launch('TestMenuScene', { player: this.player });
    }

    /**
     * 生成测试敌人
     */
    public spawnTestEnemy(type: EnemyType, level: number = 1, rarity?: EnemyRarity): void {
        if (!this.player || !this.player.active) return;

        // 在玩家附近生成
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 200;
        const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 50, GAME_CONFIG.worldWidth - 50);
        const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 50, GAME_CONFIG.worldHeight - 50);

        const enemy = this.getEnemyFromPool(x, y, type, level, rarity);
        if (enemy) {
            this.enemies.push(enemy);
            enemy.setTarget(this.player);
            this.physics.add.collider(this.player, enemy, this.handlePlayerEnemyCollision, undefined, this);
        }
    }

    /**
     * 清除所有敌人
     */
    private clearAllEnemies(): void {
        this.enemies.forEach(enemy => {
            this.returnEnemyToPool(enemy);
        });
        this.enemies = [];
    }

    /**
     * 击杀所有敌人
     */
    private killAllEnemies(): void {
        const enemiesToKill = [...this.enemies];
        enemiesToKill.forEach(enemy => {
            enemy.takeDamage(99999);
        });
    }

    /**
     * 对所有敌人造成伤害
     */
    private damageAllEnemies(percent: number): void {
        this.enemies.forEach(enemy => {
            const damage = enemy.getStats().maxHp * percent;
            enemy.takeDamage(damage);
        });
    }

    /**
     * 减速所有敌人
     */
    private slowAllEnemies(): void {
        this.enemies.forEach(enemy => {
            const stats = enemy.getStats();
            enemy['stats'].moveSpeed = stats.moveSpeed * 0.5;
        });
    }

    /**
     * 触发测试事件
     */
    private triggerTestEvent(eventId: string): void {
        const eventData = EVENTS[eventId];
        if (eventData) {
            this.openEventScene(eventData);
        }
    }

    // ========== 暂停系统相关方法 ==========

    /**
     * 切换暂停状态
     */
    private togglePause(): void {
        if (this.isGameOver) return;
        
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    /**
     * 暂停游戏
     */
    private pauseGame(): void {
        if (this.isGameOver || this.isPaused) return;
        
        this.isPaused = true;

        // 暂停物理引擎
        this.physics.pause();

        // 暂停所有计时器
        if (this.spawnTimer) {
            this.spawnTimer.paused = true;
        }
        if (this.powerUpTimer) {
            this.powerUpTimer.paused = true;
        }

        // 暂停所有动画
        this.tweens.pauseAll();

        // 暂停时间回溯系统
        if (this.timeRewindSystem) {
            this.timeRewindSystem.pause();
        }

        // 暂停音效系统
        if (this.audioManager) {
            this.audioManager.pause();
        }

        // 启动暂停场景
        this.scene.launch('PauseScene');
    }

    /**
     * 恢复游戏
     */
    private resumeGame(): void {
        if (!this.isPaused) return;
        
        this.isPaused = false;

        // 恢复物理引擎
        this.physics.resume();

        // 恢复所有计时器
        if (this.spawnTimer) {
            this.spawnTimer.paused = false;
        }
        if (this.powerUpTimer) {
            this.powerUpTimer.paused = false;
        }

        // 恢复所有动画
        this.tweens.resumeAll();

        // 恢复时间回溯系统
        if (this.timeRewindSystem) {
            this.timeRewindSystem.resume();
        }

        // 恢复音效系统
        if (this.audioManager) {
            this.audioManager.resume();
        }
    }

    /**
     * 检查游戏是否暂停
     */
    public getIsPaused(): boolean {
        return this.isPaused;
    }

    // ========== 随机事件系统相关方法 ==========

    /**
     * 初始化随机事件系统
     */
    private initRandomEventSystem(): void {
        this.randomEventSystem = new RandomEventSystem(this);
        
        // 设置玩家引用
        this.randomEventSystem.setPlayer(this.player);
        
        // 设置回调
        this.randomEventSystem.setCallbacks(
            (event) => {
                console.log(`[RandomEvent] 触发事件: ${event.name}`);
                this.openEventScene(event);
            },
            (result) => {
                console.log(`[RandomEvent] 事件结果: ${result.message}`);
                this.showEventResultMessage(result);
            }
        );

        // 监听时空碎片相关事件
        this.events.on('add-time-fragments', (value: number) => {
            if (this.timeRewindSystem) {
                this.timeRewindSystem.addTimeFragments(value);
            }
        });

        this.events.on('consume-time-fragments', (value: number) => {
            if (this.timeRewindSystem) {
                const currentFragments = this.timeRewindSystem.getTimeFragments();
                if (currentFragments >= value) {
                    // 这里需要添加消耗时空碎片的方法
                    // 暂时通过事件通知
                    this.events.emit('time-fragments-changed', currentFragments - value);
                }
            }
        });

        // 监听事件敌人生成
        this.events.on('spawn-event-enemies', (data: { type: EnemyType; count: number }) => {
            for (let i = 0; i < data.count; i++) {
                this.spawnEnemyFromEdge(data.type);
            }
        });
    }

    /**
     * 尝试触发随机事件
     */
    private tryTriggerRandomEvent(): void {
        if (this.isGameOver || this.isPaused) return;

        const currentTime = this.timeElapsed;
        const killCount = this.player.getKillCount();
        const playerLevel = this.player.getLevel();

        const event = this.randomEventSystem.tryTriggerEvent(currentTime, killCount, playerLevel);
        
        if (event) {
            // 事件已触发，打开事件场景
            this.openEventScene(event);
        }
    }

    /**
     * 打开事件场景
     */
    private openEventScene(event: any): void {
        if (this.isGameOver) return;

        // 暂停游戏
        this.physics.pause();

        // 启动事件场景
        this.scene.launch('EventScene', {
            eventSystem: this.randomEventSystem,
            player: this.player,
            event: event,
            onClose: () => {
                if (this.physics) {
                    this.physics.resume();
                }
            }
        });
    }

    /**
     * 显示事件结果消息
     */
    private showEventResultMessage(result: any): void {
        const centerX = this.cameras.main.scrollX + GAME_CONFIG.width / 2;
        const centerY = this.cameras.main.scrollY + 100;

        const container = this.add.container(centerX, centerY);
        container.setDepth(2000);

        // 背景
        const bg = this.add.rectangle(0, 0, 400, 60, 0x000000, 0.9);
        bg.setStrokeStyle(2, result.success ? 0x00ff00 : 0xff0000, 1);
        container.add(bg);

        // 消息文本
        const messageText = this.add.text(0, 0, result.message, {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            align: 'center'
        });
        messageText.setOrigin(0.5);
        container.add(messageText);

        // 动画
        this.tweens.add({
            targets: container,
            alpha: { from: 0, to: 1 },
            y: centerY - 20,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.tweens.add({
                        targets: container,
                        alpha: 0,
                        y: centerY - 50,
                        duration: 300,
                        onComplete: () => container.destroy()
                    });
                });
            }
        });
    }

    /**
     * 获取随机事件系统
     */
    public getRandomEventSystem(): RandomEventSystem {
        return this.randomEventSystem;
    }

    // ========== 联机系统相关方法 ==========

    /**
     * 初始化联机系统
     */
    private initMultiplayerSystem(): void {
        if (!this.multiplayer) return;

        console.log('[GameScene] 初始化联机系统');

        // 监听远程玩家更新
        this.multiplayer.on(MultiplayerEvent.PLAYER_UPDATE, (data: any) => {
            this.handleRemotePlayerUpdate(data);
        });

        // 监听技能使用
        this.multiplayer.on(MultiplayerEvent.SKILL_USED, (data: any) => {
            this.handleRemoteSkillUse(data);
        });

        // 监听物品拾取
        this.multiplayer.on(MultiplayerEvent.ITEM_PICKED_UP, (data: any) => {
            this.handleRemoteItemPickup(data);
        });

        // 监听伤害事件
        this.multiplayer.on(MultiplayerEvent.DAMAGE_DEALT, (data: any) => {
            this.handleRemoteDamageDealt(data);
        });

        // 监听敌人更新
        this.multiplayer.on(MultiplayerEvent.ENEMY_UPDATE, (data: any) => {
            this.handleEnemyUpdate(data);
        });

        // 监听时间回溯投票
        this.multiplayer.on(MultiplayerEvent.TIME_REWIND_VOTE_UPDATE, (data: any) => {
            this.handleTimeRewindVote(data);
        });

        // 监听时间回溯执行
        this.multiplayer.on(MultiplayerEvent.TIME_REWIND_EXECUTE, (data: any) => {
            this.handleTimeRewindExecute(data);
        });

        // 监听玩家断开连接
        this.multiplayer.on(MultiplayerEvent.PLAYER_LEFT, (data: any) => {
            this.handlePlayerDisconnect(data);
        });
    }

    /**
     * 处理远程玩家更新
     */
    private handleRemotePlayerUpdate(data: any): void {
        // 更新远程玩家位置
        this.multiplayer?.updateRemotePlayers(16.67); // 假设60fps
    }

    /**
     * 处理远程技能使用
     */
    private handleRemoteSkillUse(data: any): void {
        if (data.playerId === this.multiplayer?.getPlayerId()) return;

        // 触发技能效果（由技能系统处理）
        this.events.emit('remote-skill-use', {
            playerId: data.playerId,
            skillId: data.skillId,
            targetX: data.targetX,
            targetY: data.targetY
        });
    }

    /**
     * 处理远程物品拾取
     */
    private handleRemoteItemPickup(data: any): void {
        // 移除被其他玩家拾取的物品
        const index = this.powerUps.findIndex(p => p.x === data.position?.x && p.y === data.position?.y);
        if (index !== -1) {
            const powerUp = this.powerUps[index];
            this.powerUps.splice(index, 1);
            powerUp.destroy();
        }
    }

    /**
     * 处理远程伤害事件
     */
    private handleRemoteDamageDealt(data: any): void {
        // 显示伤害数字
        if (data.position) {
            this.showDamageNumber(data.position.x, data.position.y, data.damage, data.isCrit);
        }
    }

    /**
     * 处理敌人更新
     */
    private handleEnemyUpdate(data: any): void {
        // 同步敌人状态（非房主）
        if (!this.multiplayer?.isHost()) {
            for (const enemyData of data.enemies) {
                const enemy = this.enemies.find(e => e.id === enemyData.id);
                if (enemy) {
                    enemy.setPosition(enemyData.x, enemyData.y);
                    // 更新其他状态...
                }
            }
        }
    }

    /**
     * 处理时间回溯投票
     */
    private handleTimeRewindVote(data: any): void {
        // 显示投票状态
        const votes = Object.values(data.votes) as boolean[];
        const yesCount = votes.filter(v => v).length;
        
        this.showTimeRewindVoteMessage(yesCount, data.totalPlayers);
    }

    /**
     * 处理时间回溯执行
     */
    private handleTimeRewindExecute(data: any): void {
        // 执行时间回溯
        this.events.emit('time-rewind', { snapshotId: data.snapshotId });
    }

    /**
     * 处理玩家断开连接
     */
    private handlePlayerDisconnect(data: any): void {
        // 移除远程玩家显示
        const remotePlayerDisplay = this.remotePlayers.get(data.playerId);
        if (remotePlayerDisplay) {
            remotePlayerDisplay.destroy();
            this.remotePlayers.delete(data.playerId);
        }

        // 显示断开消息
        this.showMultiplayerMessage(`${data.playerName} 已断开连接`, 0xff6600);
    }

    /**
     * 显示伤害数字
     */
    private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
        const color = isCrit ? '#ffff00' : '#ffffff';
        const size = isCrit ? '24px' : '18px';

        const text = this.add.text(x, y - 20, damage.toString(), {
            fontSize: size,
            fontStyle: 'bold',
            color: color,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(500);

        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示时间回溯投票消息
     */
    private showTimeRewindVoteMessage(yesCount: number, totalPlayers: number): void {
        const msg = this.add.text(
            this.cameras.main.scrollX + GAME_CONFIG.width / 2,
            this.cameras.main.scrollY + 150,
            `时间回溯投票: ${yesCount}/${totalPlayers}`,
            {
                fontSize: '20px',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace',
                backgroundColor: '#000000',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setDepth(2000);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    /**
     * 显示联机消息
     */
    private showMultiplayerMessage(text: string, color: number): void {
        const msg = this.add.text(
            this.cameras.main.scrollX + GAME_CONFIG.width / 2,
            this.cameras.main.scrollY + 80,
            text,
            {
                fontSize: '18px',
                color: `#${color.toString(16).padStart(6, '0')}`,
                fontFamily: 'Courier New, monospace',
                backgroundColor: '#000000',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setDepth(2000);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 30,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    /**
     * 同步玩家状态
     */
    private syncPlayerState(): void {
        if (!this.isMultiplayer || !this.multiplayer || !this.player) return;

        const stats = this.player.getStats();
        this.multiplayer.sendPlayerUpdate({
            x: this.player.x,
            y: this.player.y,
            velocityX: (this.player.body as Phaser.Physics.Arcade.Body).velocity.x,
            velocityY: (this.player.body as Phaser.Physics.Arcade.Body).velocity.y,
            facing: this.player.facing || 0,
            state: this.player.getState?.() || 'idle',
            hp: stats.hp
        });
    }

    /**
     * 同步敌人状态（仅房主）
     */
    private syncEnemyState(): void {
        if (!this.isMultiplayer || !this.multiplayer || !this.multiplayer.isHost()) return;

        const enemyData = this.enemies.slice(0, 20).map(enemy => ({
            id: enemy.id,
            type: enemy.getEnemyType(),
            x: enemy.x,
            y: enemy.y,
            hp: enemy.getStats().hp,
            state: enemy.getState?.() || 'idle'
        }));

        this.multiplayer.sendEnemyUpdate(enemyData);
    }

    /**
     * 获取难度倍率
     */
    public getDifficultyMultiplier(): number {
        return this.difficultyMultiplier;
    }

    /**
     * 是否为联机模式
     */
    public isMultiplayerMode(): boolean {
        return this.isMultiplayer;
    }

    /**
     * 获取联机系统
     */
    public getMultiplayerSystem(): MultiplayerSystem | null {
        return this.multiplayer;
    }
}
