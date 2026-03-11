/**
 * 游戏主场景
 * 核心游戏逻辑所在场景
 */

import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import PowerUp, { PowerUpType, PowerUpRarity } from '../entities/PowerUp';
import TimeFragment from '../entities/TimeFragment';
import { GAME_CONFIG } from '../core/Config';
import { EnemyType } from '../core/Types';
import { getEnemyTemplate, rollLoot } from '../data/Enemies';
import { TimeRewindSystem, TIME_REWIND_CONFIG } from '../systems/TimeRewindSystem';

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private powerUps: PowerUp[] = [];
    private timeFragments: TimeFragment[] = [];
    private timeElapsed: number = 0;
    private levelTime: number = GAME_CONFIG.level.duration;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private powerUpTimer!: Phaser.Time.TimerEvent;
    private isGameOver: boolean = false;
    private timeRewindSystem!: TimeRewindSystem;

    constructor() {
        super({ key: 'GameScene', active: false });
    }

    /**
     * 创建场景
     */
    create(): void {
        // 重置状态
        this.isGameOver = false;
        this.enemies = [];
        this.powerUps = [];
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

        // 监听时间回溯事件
        this.events.on('time-rewind', this.onTimeRewind, this);

        // 初始化游戏时间
        this.data.set('gameTime', 0);

        // 初始化时间回溯系统
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

        // 创建玩家实体
        this.player = new Player(this, startX, startY);

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
     */
    private startEnemySpawner(): void {
        this.spawnTimer = this.time.addEvent({
            delay: GAME_CONFIG.level.enemySpawnInterval,
            callback: () => {
                // 只有在敌人数量未达到上限且游戏未结束时才生成新敌人
                if (!this.isGameOver && this.enemies.length < GAME_CONFIG.level.maxEnemies) {
                    // 80% 概率生成普通敌人，20% 概率生成精英
                    const type = Math.random() < 0.8 ? EnemyType.COMMON : EnemyType.ELITE;
                    this.spawnEnemyFromEdge(type);
                }
            },
            loop: true
        });
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
     */
    private spawnEnemyFromEdge(type: EnemyType): void {
        if (this.isGameOver) return;

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

        const enemy = new Enemy(this, x, y, type);
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
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

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
    }

    /**
     * 尝试掉落道具
     */
    private tryDropPowerUp(x: number, y: number, enemyType: EnemyType): void {
        // 根据敌人类型决定掉落概率
        const dropRates: Record<EnemyType, number> = {
            [EnemyType.COMMON]: 0.1,   // 10%
            [EnemyType.ELITE]: 0.3,    // 30%
            [EnemyType.BOSS]: 0.8      // 80%
        };

        if (Math.random() < dropRates[enemyType]) {
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

        const gameOverText = this.add.text(0, -100, 'GAME OVER', {
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

        // 清理道具
        this.powerUps.forEach(powerUp => powerUp.destroy());
        this.powerUps = [];

        // 销毁定时器
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }
        if (this.powerUpTimer) {
            this.powerUpTimer.destroy();
        }

        // 移除事件监听
        this.events.off('enemyDefeated', this.onEnemyDefeated, this);

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

        this.timeElapsed += delta / 1000;
        
        // 性能优化：定期清理远离玩家的敌人和道具
        this.cleanupDistantEntities();
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
                enemy.destroy();
                this.enemies.splice(i, 1);
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
            SaveSystem.autoSave(saveData as any);
            
            // 显示保存成功提示
            this.showSaveMessage('游戏已保存', '#00ff00');
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

        // 清理现有敌人和道具
        this.enemies.forEach(e => e.destroy());
        this.enemies = [];
        this.powerUps.forEach(p => p.destroy());
        this.powerUps = [];
        this.timeFragments.forEach(f => f.destroy());
        this.timeFragments = [];

        // 恢复游戏时间
        this.data.set('gameTime', snapshot.worldData.gameTime);

        // 重新生成敌人
        this.spawnInitialEnemies();

        // 恢复游戏
        this.physics.resume();

        this.showTimeRewindMessage(`时间回溯成功！`, '#00ff00');
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
}
