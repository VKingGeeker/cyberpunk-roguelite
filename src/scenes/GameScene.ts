/**
 * 游戏主场景
 * 核心游戏逻辑所在场景
 */

import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import PowerUp, { PowerUpType, PowerUpRarity } from '../entities/PowerUp';
import { GAME_CONFIG } from '../core/Config';
import { EnemyType } from '../core/Types';
import { getEnemyTemplate, rollLoot } from '../data/Enemies';

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private powerUps: PowerUp[] = [];
    private timeElapsed: number = 0;
    private levelTime: number = GAME_CONFIG.level.duration;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private powerUpTimer!: Phaser.Time.TimerEvent;
    private isGameOver: boolean = false;

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

        // 创建初始敌人
        this.spawnInitialEnemies();

        // 启动持续生成敌人的定时器
        this.startEnemySpawner();

        // 启动道具生成定时器
        this.startPowerUpSpawner();

        // 创建UI场景
        this.scene.launch('UIScene', { player: this.player });

        // 监听敌人被击败事件
        this.events.on('enemyDefeated', this.onEnemyDefeated, this);
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
     * 生成随机道具
     */
    private spawnRandomPowerUp(): void {
        if (this.isGameOver) return;

        const worldWidth = GAME_CONFIG.worldWidth;
        const worldHeight = GAME_CONFIG.worldHeight;
        const margin = 100;

        // 随机位置
        const x = Phaser.Math.Between(margin, worldWidth - margin);
        const y = Phaser.Math.Between(margin, worldHeight - margin);

        // 随机类型
        const types = Object.values(PowerUpType);
        const type = types[Phaser.Math.Between(0, types.length - 1)];

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

        // 添加与玩家的碰撞检测
        this.physics.add.overlap(this.player, powerUp, () => {
            this.collectPowerUp(powerUp);
        });
    }

    /**
     * 收集道具
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
     * 从世界边界外生成敌人
     */
    private spawnEnemyFromEdge(type: EnemyType): void {
        if (this.isGameOver) return;

        const worldWidth = GAME_CONFIG.worldWidth;
        const worldHeight = GAME_CONFIG.worldHeight;
        const margin = 50;

        let x: number, y: number;

        const edge = Phaser.Math.Between(0, 3);

        switch (edge) {
            case 0:
                x = Phaser.Math.Between(50, worldWidth - 50);
                y = -margin;
                break;
            case 1:
                x = Phaser.Math.Between(50, worldWidth - 50);
                y = worldHeight + margin;
                break;
            case 2:
                x = -margin;
                y = Phaser.Math.Between(50, worldHeight - 50);
                break;
            case 3:
                x = worldWidth + margin;
                y = Phaser.Math.Between(50, worldHeight - 50);
                break;
            default:
                x = -margin;
                y = worldHeight / 2;
        }

        const enemy = new Enemy(this, x, y, type);
        this.enemies.push(enemy);
        enemy.setTarget(this.player);

        this.physics.add.collider(this.player, enemy, this.handlePlayerEnemyCollision, undefined, this);
        
        for (const otherEnemy of this.enemies) {
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
        this.scene.stop('UIScene');
        this.scene.restart();
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
    }
}
