/**
 * 游戏主场景
 * 核心游戏逻辑所在场景
 */

import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import { GAME_CONFIG } from '../core/Config';
import { EnemyType } from '../core/Types';
import { getEnemyTemplate, calculateEnemyStats, rollLoot } from '../data/Enemies';

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies: Enemy[] = [];
    private timeElapsed: number = 0;
    private levelTime: number = GAME_CONFIG.level.duration;

    // 输入控制
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyS!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private key1!: Phaser.Input.Keyboard.Key;
    private key2!: Phaser.Input.Keyboard.Key;
    private key3!: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: 'GameScene', active: false });
    }

    /**
     * 创建场景
     */
    create(): void {
        // 初始化输入
        this.initializeInput();

        // 创建地图
        this.createMap();

        // 创建玩家
        this.createPlayer();

        // 创建敌人
        this.spawnEnemies();

        // 创建UI场景
        this.scene.launch('UIScene', { player: this.player });

        // 监听敌人被击败事件
        this.events.on('enemyDefeated', this.onEnemyDefeated, this);
    }

    /**
     * 初始化输入控制
     */
    private initializeInput(): void {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keyW = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.key1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.key3 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    }

    /**
     * 创建地图
     */
    private createMap(): void {
        // 创建地图背景
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0f0f1f, 1);
        graphics.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

        // 绘制网格地板
        graphics.lineStyle(1, 0x1a1a2e, 0.5);
        const tileSize = GAME_CONFIG.tileSize;
        for (let x = 0; x < GAME_CONFIG.width; x += tileSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, GAME_CONFIG.height);
        }
        for (let y = 0; y < GAME_CONFIG.height; y += tileSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(GAME_CONFIG.width, y);
        }
        graphics.strokePath();

        // 创建世界边界
        this.physics.world.setBounds(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

        // 设置摄像机
        this.cameras.main.setBounds(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        this.cameras.main.setBackgroundColor('#0f0f1f');
    }

    /**
     * 创建玩家
     */
    private createPlayer(): void {
        const startX = GAME_CONFIG.width / 2;
        const startY = GAME_CONFIG.height / 2;

        // 创建玩家实体
        this.player = new Player(this, startX, startY);

        // 添加碰撞检测
        this.physics.add.collider(this.player, null, null, undefined, this);

        // 监听玩家死亡事件
        this.player.on('playerDeath', () => {
            this.onPlayerDeath();
        });
    }

    /**
     * 生成敌人
     */
    private spawnEnemies(): void {
        // 生成普通敌人
        for (let i = 0; i < GAME_CONFIG.level.enemyCount; i++) {
            this.spawnEnemy(EnemyType.COMMON);
        }

        // 生成精英敌人
        for (let i = 0; i < GAME_CONFIG.level.eliteCount; i++) {
            this.spawnEnemy(EnemyType.ELITE);
        }
    }

    /**
     * 生成单个敌人
     */
    private spawnEnemy(type: EnemyType): void {
        // 随机生成位置，远离玩家
        let x: number, y: number;
        let distance: number;
        let attempts = 0;

        do {
            x = Phaser.Math.Between(100, GAME_CONFIG.width - 100);
            y = Phaser.Math.Between(100, GAME_CONFIG.height - 100);
            distance = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
            attempts++;
        } while (distance < 300 && attempts < 100);

        // 创建敌人实体
        const enemy = new Enemy(this, x, y, type);
        this.enemies.push(enemy);

        // 添加碰撞检测
        this.physics.add.collider(this.player, enemy, this.handlePlayerEnemyCollision, undefined, this);
        this.physics.add.collider(enemy, enemy, undefined, undefined, this);
    }

    /**
     * 处理玩家与敌人碰撞
     */
    private handlePlayerEnemyCollision(
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ): void {
        // 碰撞时的逻辑可以在这里处理
        // 比如伤害判定
    }

    /**
     * 敌人被击败处理
     */
    private onEnemyDefeated(enemy: Enemy): void {
        // 从敌人列表中移除
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

        // 计算掉落
        const enemyType = enemy.getEnemyType();
        const template = getEnemyTemplate(enemyType);
        if (template) {
            const loot = rollLoot(template);
            for (const itemId of loot) {
                this.player.addItem(itemId);
            }

            // 增加经验值
            this.player.addExperience(template.experience);
        }

        // 检查是否需要重新生成敌人
        if (this.enemies.length < GAME_CONFIG.level.enemyCount) {
            this.time.delayedCall(GAME_CONFIG.level.enemyRespawnTime * 1000, () => {
                this.spawnEnemy(EnemyType.COMMON);
            });
        }

        // 检查是否击败了所有精英敌人
        const eliteEnemies = this.enemies.filter(e => e.getEnemyType() === EnemyType.ELITE);
        if (eliteEnemies.length === 0) {
            this.onAllElitesDefeated();
        }
    }

    /**
     * 所有精英敌人被击败
     */
    private onAllElitesDefeated(): void {
        // 显示传送门
        this.createPortal();
    }

    /**
     * 创建传送门
     */
    private createPortal(): void {
        const portal = this.add.image(GAME_CONFIG.width / 2, 100, 'tile_floor');
        portal.setTint(0x00ffff);
        portal.setScale(2);

        // 添加传送门动画
        this.tweens.add({
            targets: portal,
            scale: { from: 1, to: 2 },
            alpha: { from: 0.5, to: 1 },
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        // 添加碰撞检测
        portal.setInteractive();
        portal.on('pointerdown', () => {
            this.onPortalEnter();
        });
    }

    /**
     * 进入传送门
     */
    private onPortalEnter(): void {
        console.log('Entering next level...');
        // TODO: 进入下一关的逻辑
    }

    /**
     * 玩家死亡处理
     */
    private onPlayerDeath(): void {
        // 停止游戏
        this.physics.pause();

        // 显示游戏结束界面
        this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            800,
            400,
            0x000000,
            0.8
        );

        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'GAME OVER',
            {
                fontSize: '64px',
                fontStyle: 'bold',
                color: '#ff4444',
                fontFamily: 'Courier New, monospace'
            }
        );
        gameOverText.setOrigin(0.5);

        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            '按 R 键重新开始',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace'
            }
        );
        restartText.setOrigin(0.5);

        // 监听重新开始
        this.input.keyboard!.once('keydown-R', () => {
            this.scene.restart();
        });
    }

    /**
     * 更新场景
     */
    update(time: number, delta: number): void {
        // 更新时间
        this.timeElapsed += delta / 1000;

        // 检查时间是否耗尽
        if (this.timeElapsed >= this.levelTime) {
            this.onTimeExpired();
            return;
        }

        // 更新玩家
        this.player.update(time, delta);

        // 更新敌人
        for (const enemy of this.enemies) {
            enemy.update(time, delta);
        }

        // 更新摄像机跟随玩家
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // 发送时间更新事件到UI场景
        this.events.emit('timeUpdate', {
            elapsed: this.timeElapsed,
            remaining: this.levelTime - this.timeElapsed
        });
    }

    /**
     * 时间耗尽处理
     */
    private onTimeExpired(): void {
        // 时间耗尽，游戏结束
        this.player.takeDamage(9999);
    }
}
