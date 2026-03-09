/**
 * 启动场景
 * 负责加载游戏资源和初始化
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    /**
     * 预加载资源
     */
    preload(): void {
        // 创建加载进度条
        this.createLoadingBar();
    }

    /**
     * 创建加载进度条
     */
    private createLoadingBar(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建进度条背景
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a2e, 1);
        barBg.fillRect(width / 2 - 200, height / 2 + 50, 400, 20);

        // 创建进度条
        const bar = this.add.graphics();
        bar.fillStyle(0x00ffff, 1);
        bar.fillRect(width / 2 - 198, height / 2 + 52, 0, 16);

        // 模拟加载进度
        let progress = 0;
        const timer = this.time.addEvent({
            delay: 50,
            callback: () => {
                progress += 0.1;
                bar.clear();
                bar.fillStyle(0x00ffff, 1);
                bar.fillRect(width / 2 - 198, height / 2 + 52, 396 * Math.min(progress, 1), 16);
                
                if (progress >= 1) {
                    timer.destroy();
                }
            },
            loop: true
        });
    }

    /**
     * 创建完成后执行
     */
    create(): void {
        // 创建占位纹理
        this.createPlaceholderTextures();

        // 初始化游戏数据
        this.initializeGameData();

        // 切换到主菜单场景
        this.scene.start('MenuScene');
    }

    /**
     * 创建占位纹理
     */
    private createPlaceholderTextures(): void {
        // 创建玩家纹理
        this.createPlayerTexture('player_idle', 0x00ff00);
        this.createPlayerTexture('player_run', 0x00ff00);
        this.createPlayerTexture('player_attack', 0x00ff00);

        // 创建敌人纹理
        this.createEnemyTexture('enemy_common_idle', 0x888888);
        this.createEnemyTexture('enemy_common_attack', 0x888888);
        this.createEnemyTexture('enemy_elite_idle', 0x4444ff);
        this.createEnemyTexture('enemy_elite_attack', 0x4444ff);
        this.createEnemyTexture('enemy_boss_idle', 0xff4444);
        this.createEnemyTexture('enemy_boss_attack', 0xff4444);

        // 创建地图纹理
        this.createTileTexture('tile_floor', 0x1a1a2e);
        this.createTileTexture('tile_wall', 0x333344);

        // 创建物品图标
        this.createIconTexture('icon_vibroblade', 0x888888);
        this.createIconTexture('icon_heatkatana', 0x4488ff);
        this.createIconTexture('icon_highfreqblade', 0xaa44ff);
        this.createIconTexture('icon_thunderaxe', 0xff8800);
        this.createIconTexture('icon_jacket', 0x888888);
        this.createIconTexture('icon_kevlar', 0x4488ff);
        this.createIconTexture('icon_nanobot', 0x44ff44);
        this.createIconTexture('icon_battery', 0xffff44);
        this.createIconTexture('icon_teleport', 0xff44ff);
        this.createIconTexture('icon_shield', 0x4444ff);

        // 创建技能图标
        this.createSkillIconTexture('icon_slash', 0xff4444);
        this.createSkillIconTexture('icon_spin', 0xff8800);
        this.createSkillIconTexture('icon_dash', 0x44ff44);
        this.createSkillIconTexture('icon_heal', 0x44ff44);

        // 创建升级道具纹理
        this.createPowerUpTextures();
    }

    /**
     * 创建升级道具纹理
     */
    private createPowerUpTextures(): void {
        // 根据道具类型和稀有度生成不同颜色和样式的纹理
        const typeColors: Record<string, number> = {
            health: 0x44ff44,    // 绿色 - 生命
            attack: 0xff4444,    // 红色 - 攻击
            defense: 0x4488ff,   // 蓝色 - 防御
            speed: 0xffff44,     // 黄色 - 速度
            crit: 0xff44ff,      // 紫色 - 暴击
            exp: 0x44ffff        // 青色 - 经验
        };

        const rarityBorders: Record<string, number> = {
            common: 0x888888,    // 灰色边框
            rare: 0x4488ff,      // 蓝色边框
            epic: 0xaa44ff,      // 紫色边框
            legendary: 0xffaa00  // 金色边框
        };

        // 为每种类型和稀有度组合创建纹理
        for (const [type, color] of Object.entries(typeColors)) {
            for (const [rarity, borderColor] of Object.entries(rarityBorders)) {
                this.createPowerUpTexture(`powerup_${type}_${rarity}`, color, borderColor);
            }
        }
    }

    /**
     * 创建单个升级道具纹理
     */
    private createPowerUpTexture(key: string, innerColor: number, borderColor: number): void {
        const graphics = this.add.graphics();
        const size = 24;
        const center = size / 2;

        // 外圈光晕
        graphics.fillStyle(borderColor, 0.3);
        graphics.fillCircle(center, center, 11);

        // 主体圆形
        graphics.fillStyle(innerColor, 1);
        graphics.fillCircle(center, center, 8);

        // 边框
        graphics.lineStyle(2, borderColor, 1);
        graphics.strokeCircle(center, center, 11);

        // 内部符号
        graphics.lineStyle(2, 0xffffff, 0.8);
        if (key.includes('health')) {
            // 十字符号
            graphics.moveTo(center, center - 4);
            graphics.lineTo(center, center + 4);
            graphics.moveTo(center - 4, center);
            graphics.lineTo(center + 4, center);
            graphics.strokePath();
        } else if (key.includes('attack')) {
            // 剑符号
            graphics.moveTo(center - 4, center + 4);
            graphics.lineTo(center + 4, center - 4);
            graphics.moveTo(center - 2, center - 2);
            graphics.lineTo(center - 4, center);
            graphics.strokePath();
        } else if (key.includes('defense')) {
            // 盾牌符号
            graphics.strokeCircle(center, center, 4);
        } else if (key.includes('speed')) {
            // 箭头符号
            graphics.moveTo(center - 4, center);
            graphics.lineTo(center + 4, center);
            graphics.moveTo(center + 1, center - 3);
            graphics.lineTo(center + 4, center);
            graphics.lineTo(center + 1, center + 3);
            graphics.strokePath();
        } else if (key.includes('crit')) {
            // 星星符号（手动绘制五角星）
            graphics.fillStyle(0xffffff, 0.8);
            const points: { x: number; y: number }[] = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI / 5) - Math.PI / 2;
                const radius = i % 2 === 0 ? 5 : 2;
                points.push({
                    x: center + radius * Math.cos(angle),
                    y: center + radius * Math.sin(angle)
                });
            }
            graphics.beginPath();
            graphics.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                graphics.lineTo(points[i].x, points[i].y);
            }
            graphics.closePath();
            graphics.fillPath();
        } else if (key.includes('exp')) {
            // 钻石符号
            graphics.fillStyle(0xffffff, 0.8);
            graphics.beginPath();
            graphics.moveTo(center, center - 4);
            graphics.lineTo(center + 4, center);
            graphics.lineTo(center, center + 4);
            graphics.lineTo(center - 4, center);
            graphics.closePath();
            graphics.fillPath();
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建玩家纹理
     */
    private createPlayerTexture(key: string, color: number): void {
        const graphics = this.add.graphics();
        
        // 绘制玩家形状（简单的人形）
        graphics.fillStyle(color, 1);
        graphics.fillCircle(16, 10, 8); // 头
        graphics.fillRect(12, 18, 8, 14); // 身体
        graphics.fillRect(8, 20, 4, 10); // 左腿
        graphics.fillRect(20, 20, 4, 10); // 右腿
        graphics.fillRect(6, 22, 6, 3); // 左臂
        graphics.fillRect(20, 22, 6, 3); // 右臂
        
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    /**
     * 创建敌人纹理
     */
    private createEnemyTexture(key: string, color: number): void {
        const graphics = this.add.graphics();
        
        // 绘制敌人形状（简单的怪物形状）
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(4, 4, 24, 24, 4);
        
        // 眼睛
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(12, 12, 3);
        graphics.fillCircle(20, 12, 3);
        
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    /**
     * 创建瓦片纹理
     */
    private createTileTexture(key: string, color: number): void {
        const graphics = this.add.graphics();
        const tileSize = GAME_CONFIG.tileSize;
        
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);
        graphics.lineStyle(1, 0x222233, 0.5);
        graphics.strokeRect(0, 0, tileSize, tileSize);
        
        graphics.generateTexture(key, tileSize, tileSize);
        graphics.destroy();
    }

    /**
     * 创建物品图标纹理
     */
    private createIconTexture(key: string, color: number): void {
        const graphics = this.add.graphics();
        
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(4, 4, 40, 40, 4);
        graphics.lineStyle(2, 0xffffff, 0.5);
        graphics.strokeRoundedRect(4, 4, 40, 40, 4);
        
        graphics.generateTexture(key, 48, 48);
        graphics.destroy();
    }

    /**
     * 创建技能图标纹理
     */
    private createSkillIconTexture(key: string, color: number): void {
        const graphics = this.add.graphics();
        
        graphics.fillStyle(color, 1);
        graphics.fillCircle(24, 24, 20);
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokeCircle(24, 24, 20);
        
        // 添加技能符号
        graphics.lineStyle(2, 0xffffff, 1);
        if (key.includes('slash')) {
            graphics.moveTo(12, 12);
            graphics.lineTo(36, 36);
            graphics.strokePath();
        } else if (key.includes('spin')) {
            graphics.strokeCircle(24, 24, 12);
        } else if (key.includes('dash')) {
            graphics.moveTo(10, 24);
            graphics.lineTo(38, 24);
            graphics.moveTo(30, 16);
            graphics.lineTo(38, 24);
            graphics.lineTo(30, 32);
            graphics.strokePath();
        } else if (key.includes('heal')) {
            graphics.moveTo(24, 12);
            graphics.lineTo(24, 36);
            graphics.moveTo(12, 24);
            graphics.lineTo(36, 24);
            graphics.strokePath();
        }
        
        graphics.generateTexture(key, 48, 48);
        graphics.destroy();
    }

    /**
     * 初始化游戏数据
     */
    private initializeGameData(): void {
        // 这里可以初始化全局游戏数据
        // 比如从本地存储加载存档
    }
}
