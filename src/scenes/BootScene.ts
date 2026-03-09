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
        // 创建赛博朋克风格加载界面
        this.createCyberpunkLoadingScreen();
    }

    /**
     * 创建赛博朋克风格加载界面
     */
    private createCyberpunkLoadingScreen(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 1);
        bg.fillRect(0, 0, width, height);

        // 网格背景
        bg.lineStyle(1, 0x00ffff, 0.1);
        for (let x = 0; x < width; x += 40) {
            bg.moveTo(x, 0);
            bg.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            bg.moveTo(0, y);
            bg.lineTo(width, y);
        }
        bg.strokePath();

        // 标题
        const title = this.add.text(width / 2, height / 2 - 80, 'NEON ROGUE', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ff00ff',
            strokeThickness: 2
        });
        title.setOrigin(0.5);

        // 副标题
        const subtitle = this.add.text(width / 2, height / 2 - 30, 'CYBERPUNK EDITION', {
            fontSize: '16px',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace'
        });
        subtitle.setOrigin(0.5);

        // 进度条背景
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1a1a2e, 1);
        barBg.fillRect(width / 2 - 200, height / 2 + 50, 400, 20);
        barBg.lineStyle(2, 0x00ffff, 1);
        barBg.strokeRect(width / 2 - 200, height / 2 + 50, 400, 20);

        // 进度条
        const bar = this.add.graphics();
        
        // 加载提示
        const loadingText = this.add.text(width / 2, height / 2 + 100, 'INITIALIZING SYSTEMS...', {
            fontSize: '14px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        loadingText.setOrigin(0.5);

        // 模拟加载进度
        let progress = 0;
        const timer = this.time.addEvent({
            delay: 50,
            callback: () => {
                progress += 0.1;
                bar.clear();
                
                // 渐变色进度条
                const gradientColors = [0x00ffff, 0xff00ff, 0xffff00];
                const colorIndex = Math.floor(progress * gradientColors.length) % gradientColors.length;
                bar.fillStyle(gradientColors[colorIndex], 1);
                bar.fillRect(width / 2 - 198, height / 2 + 52, 396 * Math.min(progress, 1), 16);
                
                if (progress >= 1) {
                    timer.destroy();
                    loadingText.setText('SYSTEM READY');
                }
            },
            loop: true
        });

        // 扫描线效果
        const scanline = this.add.graphics();
        scanline.fillStyle(0x00ffff, 0.05);
        scanline.fillRect(0, 0, width, 2);
        
        this.tweens.add({
            targets: scanline,
            y: height,
            duration: 2000,
            repeat: -1
        });
    }

    /**
     * 创建完成后执行
     */
    create(): void {
        // 创建赛博朋克风格纹理
        this.createCyberpunkTextures();

        // 初始化游戏数据
        this.initializeGameData();

        // 切换到主菜单场景
        this.scene.start('MenuScene');
    }

    /**
     * 创建赛博朋克风格纹理
     */
    private createCyberpunkTextures(): void {
        // 创建玩家纹理 - 赛博改造人
        this.createCyberPlayerTexture('player_idle');
        this.createCyberPlayerTexture('player_run');
        this.createCyberPlayerTexture('player_attack');

        // 创建敌人纹理 - 机械改造体
        this.createCyberEnemyTexture('enemy_common_idle', 'common');
        this.createCyberEnemyTexture('enemy_common_attack', 'common');
        this.createCyberEnemyTexture('enemy_elite_idle', 'elite');
        this.createCyberEnemyTexture('enemy_elite_attack', 'elite');
        this.createCyberEnemyTexture('enemy_boss_idle', 'boss');
        this.createCyberEnemyTexture('enemy_boss_attack', 'boss');

        // 创建地图纹理
        this.createCyberTileTexture('tile_floor', 0x0a0a1a);
        this.createCyberTileTexture('tile_wall', 0x1a0a2e);

        // 创建武器图标 - 霓虹风格
        this.createCyberWeaponIcons();
        
        // 创建物品图标
        this.createCyberItemIcons();

        // 创建技能图标 - 全息风格
        this.createCyberSkillIcons();

        // 创建升级道具纹理 - 数据芯片风格
        this.createCyberPowerUpTextures();
    }

    /**
     * 创建赛博玩家纹理
     */
    private createCyberPlayerTexture(key: string): void {
        const graphics = this.add.graphics();
        const size = 48;
        const center = size / 2;

        // 外发光
        graphics.fillStyle(0x00ffff, 0.1);
        graphics.fillCircle(center, center, 20);

        // 身体 - 深色机械装甲
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillRoundedRect(center - 8, center - 6, 16, 18, 3);

        // 装甲细节 - 金属质感
        graphics.fillStyle(0x2a2a3e, 1);
        graphics.fillRect(center - 6, center - 4, 12, 4);
        graphics.fillRect(center - 6, center + 2, 12, 4);

        // 霓虹电路线条
        graphics.lineStyle(1, 0x00ffff, 1);
        // 左臂电路
        graphics.moveTo(center - 8, center - 2);
        graphics.lineTo(center - 12, center - 2);
        graphics.lineTo(center - 12, center + 6);
        // 右臂电路
        graphics.moveTo(center + 8, center - 2);
        graphics.lineTo(center + 12, center - 2);
        graphics.lineTo(center + 12, center + 6);
        graphics.strokePath();

        // 电子眼 - 发光
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillCircle(center - 3, center - 10, 2);
        graphics.fillCircle(center + 3, center - 10, 2);

        // 眼睛光晕
        graphics.fillStyle(0x00ffff, 0.3);
        graphics.fillCircle(center - 3, center - 10, 4);
        graphics.fillCircle(center + 3, center - 10, 4);

        // 头部 - 赛博头盔
        graphics.fillStyle(0x2a2a3e, 1);
        graphics.fillRoundedRect(center - 6, center - 14, 12, 10, 2);

        // 头盔装饰线
        graphics.lineStyle(1, 0xff00ff, 0.8);
        graphics.moveTo(center - 6, center - 10);
        graphics.lineTo(center + 6, center - 10);
        graphics.strokePath();

        // 腿部
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillRect(center - 6, center + 12, 4, 8);
        graphics.fillRect(center + 2, center + 12, 4, 8);

        // 腿部霓虹
        graphics.lineStyle(1, 0x00ffff, 0.8);
        graphics.moveTo(center - 4, center + 14);
        graphics.lineTo(center - 4, center + 18);
        graphics.moveTo(center + 4, center + 14);
        graphics.lineTo(center + 4, center + 18);
        graphics.strokePath();

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建赛博敌人纹理
     */
    private createCyberEnemyTexture(key: string, type: 'common' | 'elite' | 'boss'): void {
        const graphics = this.add.graphics();
        let size: number;
        let bodyColor: number;
        let neonColor: number;
        let eyeColor: number;

        switch (type) {
            case 'boss':
                size = 64;
                bodyColor = 0x2a0a1e;
                neonColor = 0xff0066;
                eyeColor = 0xff0000;
                break;
            case 'elite':
                size = 48;
                bodyColor = 0x0a1a2e;
                neonColor = 0x6600ff;
                eyeColor = 0xff00ff;
                break;
            default:
                size = 40;
                bodyColor = 0x1a1a2e;
                neonColor = 0xff6600;
                eyeColor = 0xff6600;
        }

        const center = size / 2;

        // 外发光
        graphics.fillStyle(neonColor, 0.1);
        graphics.fillCircle(center, center, size / 2 - 4);

        // 主体 - 机械改造体
        graphics.fillStyle(bodyColor, 1);
        if (type === 'boss') {
            // Boss - 大型机甲
            graphics.fillRoundedRect(center - 24, center - 20, 48, 40, 6);
            // 装甲板
            graphics.fillStyle(0x3a1a2e, 1);
            graphics.fillRoundedRect(center - 20, center - 16, 40, 12, 3);
            graphics.fillRoundedRect(center - 20, center + 4, 40, 12, 3);
        } else if (type === 'elite') {
            // Elite - 改造战士
            graphics.fillRoundedRect(center - 14, center - 12, 28, 24, 4);
            graphics.fillStyle(0x1a2a3e, 1);
            graphics.fillRoundedRect(center - 10, center - 8, 20, 8, 2);
        } else {
            // Common - 小型机器人
            graphics.fillRoundedRect(center - 10, center - 10, 20, 20, 3);
        }

        // 霓虹电路
        graphics.lineStyle(type === 'boss' ? 2 : 1, neonColor, 1);
        if (type === 'boss') {
            // Boss 电路
            graphics.moveTo(center - 24, center);
            graphics.lineTo(center - 30, center);
            graphics.moveTo(center + 24, center);
            graphics.lineTo(center + 30, center);
            graphics.moveTo(center, center - 20);
            graphics.lineTo(center, center - 26);
        } else if (type === 'elite') {
            graphics.moveTo(center - 14, center - 4);
            graphics.lineTo(center - 18, center - 4);
            graphics.moveTo(center + 14, center - 4);
            graphics.lineTo(center + 18, center - 4);
        } else {
            graphics.moveTo(center - 10, center);
            graphics.lineTo(center - 14, center);
            graphics.moveTo(center + 10, center);
            graphics.lineTo(center + 14, center);
        }
        graphics.strokePath();

        // 电子眼
        const eyeSize = type === 'boss' ? 4 : type === 'elite' ? 3 : 2;
        const eyeY = type === 'boss' ? center - 10 : type === 'elite' ? center - 4 : center - 3;
        
        graphics.fillStyle(eyeColor, 1);
        graphics.fillCircle(center - (type === 'boss' ? 10 : type === 'elite' ? 6 : 4), eyeY, eyeSize);
        graphics.fillCircle(center + (type === 'boss' ? 10 : type === 'elite' ? 6 : 4), eyeY, eyeSize);

        // 眼睛光晕
        graphics.fillStyle(eyeColor, 0.3);
        graphics.fillCircle(center - (type === 'boss' ? 10 : type === 'elite' ? 6 : 4), eyeY, eyeSize + 2);
        graphics.fillCircle(center + (type === 'boss' ? 10 : type === 'elite' ? 6 : 4), eyeY, eyeSize + 2);

        // 危险标记 (Boss专属)
        if (type === 'boss') {
            graphics.lineStyle(2, 0xff0000, 0.8);
            graphics.strokeTriangle(center, center + 24, center - 8, center + 16, center + 8, center + 16);
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建赛博瓦片纹理
     */
    private createCyberTileTexture(key: string, baseColor: number): void {
        const graphics = this.add.graphics();
        const tileSize = GAME_CONFIG.tileSize;

        // 基础颜色
        graphics.fillStyle(baseColor, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);

        // 霓虹边框
        graphics.lineStyle(1, 0x00ffff, 0.2);
        graphics.strokeRect(0, 0, tileSize, tileSize);

        // 随机电路纹理
        if (Math.random() < 0.3) {
            graphics.lineStyle(1, 0xff00ff, 0.1);
            const startX = Phaser.Math.Between(0, tileSize);
            const startY = Phaser.Math.Between(0, tileSize);
            graphics.moveTo(startX, startY);
            graphics.lineTo(Phaser.Math.Between(0, tileSize), Phaser.Math.Between(0, tileSize));
            graphics.strokePath();
        }

        graphics.generateTexture(key, tileSize, tileSize);
        graphics.destroy();
    }

    /**
     * 创建赛博武器图标
     */
    private createCyberWeaponIcons(): void {
        const weapons = [
            { key: 'icon_vibroblade', color: 0x00ffff, name: 'blade' },
            { key: 'icon_heatkatana', color: 0xff6600, name: 'katana' },
            { key: 'icon_highfreqblade', color: 0xff00ff, name: 'freq' },
            { key: 'icon_thunderaxe', color: 0xffff00, name: 'axe' }
        ];

        for (const weapon of weapons) {
            this.createCyberWeaponIcon(weapon.key, weapon.color, weapon.name);
        }
    }

    /**
     * 创建单个赛博武器图标
     */
    private createCyberWeaponIcon(key: string, color: number, type: string): void {
        const graphics = this.add.graphics();
        const size = 48;
        const center = size / 2;

        // 外发光
        graphics.fillStyle(color, 0.15);
        graphics.fillCircle(center, center, 20);

        // 武器图标背景
        graphics.fillStyle(0x1a1a2e, 1);
        graphics.fillRoundedRect(6, 6, 36, 36, 4);

        // 霓虹边框
        graphics.lineStyle(2, color, 1);
        graphics.strokeRoundedRect(6, 6, 36, 36, 4);

        // 武器图形
        graphics.lineStyle(3, color, 1);
        graphics.fillStyle(color, 0.8);

        if (type === 'blade') {
            // 震动刀
            graphics.moveTo(center, 12);
            graphics.lineTo(center, 36);
            graphics.strokePath();
            graphics.lineStyle(1, 0xffffff, 0.5);
            graphics.moveTo(center - 4, 16);
            graphics.lineTo(center + 4, 16);
            graphics.moveTo(center - 4, 20);
            graphics.lineTo(center + 4, 20);
            graphics.strokePath();
        } else if (type === 'katana') {
            // 热能刀 - 使用折线代替曲线
            graphics.moveTo(center - 8, 36);
            graphics.lineTo(center - 4, 20);
            graphics.lineTo(center, 14);
            graphics.lineTo(center + 4, 20);
            graphics.lineTo(center + 8, 36);
            graphics.strokePath();
        } else if (type === 'freq') {
            // 高频刀
            for (let i = 0; i < 3; i++) {
                graphics.moveTo(center - 8 + i * 8, 14);
                graphics.lineTo(center - 8 + i * 8, 34);
            }
            graphics.strokePath();
        } else if (type === 'axe') {
            // 雷霆斧
            graphics.moveTo(center, 12);
            graphics.lineTo(center, 36);
            graphics.moveTo(center, 20);
            graphics.lineTo(center + 12, 24);
            graphics.lineTo(center, 28);
            graphics.strokePath();
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建赛博物品图标
     */
    private createCyberItemIcons(): void {
        const items = [
            { key: 'icon_jacket', color: 0x888888, type: 'armor' },
            { key: 'icon_kevlar', color: 0x4488ff, type: 'armor' },
            { key: 'icon_nanobot', color: 0x44ff44, type: 'heal' },
            { key: 'icon_battery', color: 0xffff44, type: 'energy' },
            { key: 'icon_teleport', color: 0xff44ff, type: 'tech' },
            { key: 'icon_shield', color: 0x4444ff, type: 'shield' }
        ];

        for (const item of items) {
            this.createCyberItemIcon(item.key, item.color, item.type);
        }
    }

    /**
     * 创建单个赛博物品图标
     */
    private createCyberItemIcon(key: string, color: number, type: string): void {
        const graphics = this.add.graphics();
        const size = 48;
        const center = size / 2;

        // 外发光
        graphics.fillStyle(color, 0.1);
        graphics.fillCircle(center, center, 18);

        // 物品背景
        graphics.fillStyle(0x0a0a1a, 1);
        graphics.fillRoundedRect(8, 8, 32, 32, 3);

        // 霓虹边框
        graphics.lineStyle(2, color, 0.8);
        graphics.strokeRoundedRect(8, 8, 32, 32, 3);

        // 物品图形
        graphics.fillStyle(color, 0.9);
        graphics.lineStyle(2, color, 1);

        if (type === 'armor') {
            // 护甲
            graphics.fillRoundedRect(center - 10, center - 8, 20, 18, 2);
            graphics.lineStyle(1, 0xffffff, 0.3);
            graphics.moveTo(center - 6, center - 4);
            graphics.lineTo(center + 6, center - 4);
            graphics.moveTo(center - 6, center);
            graphics.lineTo(center + 6, center);
            graphics.strokePath();
        } else if (type === 'heal') {
            // 纳米机器人 - 十字
            graphics.fillRect(center - 2, center - 8, 4, 16);
            graphics.fillRect(center - 8, center - 2, 16, 4);
        } else if (type === 'energy') {
            // 电池
            graphics.fillRect(center - 8, center - 6, 16, 12);
            graphics.fillStyle(0x1a1a2e, 1);
            graphics.fillRect(center + 8, center - 3, 3, 6);
            graphics.fillStyle(0x00ff00, 0.8);
            graphics.fillRect(center - 6, center - 4, 10, 8);
        } else if (type === 'tech') {
            // 传送器
            graphics.strokeCircle(center, center, 10);
            graphics.lineStyle(1, color, 0.5);
            graphics.strokeCircle(center, center, 6);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 3);
        } else if (type === 'shield') {
            // 护盾
            graphics.beginPath();
            graphics.moveTo(center, center - 10);
            graphics.lineTo(center + 10, center - 5);
            graphics.lineTo(center + 10, center + 5);
            graphics.lineTo(center, center + 12);
            graphics.lineTo(center - 10, center + 5);
            graphics.lineTo(center - 10, center - 5);
            graphics.closePath();
            graphics.fillPath();
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建赛博技能图标
     */
    private createCyberSkillIcons(): void {
        const skills = [
            { key: 'icon_slash', color: 0x00ffff, name: '能量斩' },
            { key: 'icon_spin', color: 0xff00ff, name: '旋风斩' },
            { key: 'icon_dash', color: 0xffff00, name: '闪现突袭' },
            { key: 'icon_heal', color: 0x44ff44, name: '纳米修复' }
        ];

        for (const skill of skills) {
            this.createCyberSkillIcon(skill.key, skill.color, skill.name);
        }
    }

    /**
     * 创建单个赛博技能图标
     */
    private createCyberSkillIcon(key: string, color: number, name: string): void {
        const graphics = this.add.graphics();
        const size = 56;
        const center = size / 2;

        // 外层光晕
        graphics.fillStyle(color, 0.08);
        graphics.fillCircle(center, center, 26);

        // 全息背景
        graphics.fillStyle(0x0a0a1a, 0.9);
        graphics.fillCircle(center, center, 22);

        // 霓虹边框 - 双层
        graphics.lineStyle(2, color, 1);
        graphics.strokeCircle(center, center, 22);
        graphics.lineStyle(1, color, 0.5);
        graphics.strokeCircle(center, center, 26);

        // 技能图标
        graphics.lineStyle(3, color, 1);
        graphics.fillStyle(color, 0.8);

        if (name === '能量斩') {
            // 斩击线条
            graphics.moveTo(center - 10, center + 10);
            graphics.lineTo(center + 10, center - 10);
            graphics.strokePath();
            // 能量波动
            graphics.lineStyle(1, 0xffffff, 0.5);
            graphics.moveTo(center - 6, center + 6);
            graphics.lineTo(center + 6, center - 6);
            graphics.strokePath();
        } else if (name === '旋风斩') {
            // 旋转能量
            graphics.strokeCircle(center, center, 10);
            graphics.lineStyle(2, color, 0.6);
            graphics.strokeCircle(center, center, 6);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 3);
        } else if (name === '闪现突袭') {
            // 闪电箭头
            graphics.moveTo(center + 12, center);
            graphics.lineTo(center - 8, center);
            graphics.lineTo(center - 4, center - 6);
            graphics.moveTo(center - 8, center);
            graphics.lineTo(center - 4, center + 6);
            graphics.strokePath();
            // 残影
            graphics.lineStyle(2, color, 0.4);
            graphics.moveTo(center + 6, center - 4);
            graphics.lineTo(center + 2, center);
            graphics.lineTo(center + 6, center + 4);
            graphics.strokePath();
        } else if (name === '纳米修复') {
            // 纳米修复 - 数据流十字
            graphics.fillRect(center - 2, center - 10, 4, 20);
            graphics.fillRect(center - 10, center - 2, 20, 4);
            // 数据点
            graphics.fillStyle(0xffffff, 0.8);
            graphics.fillCircle(center - 6, center - 6, 2);
            graphics.fillCircle(center + 6, center + 6, 2);
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建赛博升级道具纹理
     */
    private createCyberPowerUpTextures(): void {
        const typeStyles: Record<string, { color: number; symbol: string }> = {
            health: { color: 0x44ff44, symbol: 'cross' },
            attack: { color: 0xff4466, symbol: 'blade' },
            defense: { color: 0x4488ff, symbol: 'shield' },
            speed: { color: 0xffff44, symbol: 'arrow' },
            crit: { color: 0xff44ff, symbol: 'star' },
            exp: { color: 0x44ffff, symbol: 'diamond' }
        };

        const rarityStyles: Record<string, { borderColor: number; glowIntensity: number }> = {
            common: { borderColor: 0x666688, glowIntensity: 0.2 },
            rare: { borderColor: 0x4488ff, glowIntensity: 0.4 },
            epic: { borderColor: 0xaa44ff, glowIntensity: 0.6 },
            legendary: { borderColor: 0xffaa00, glowIntensity: 0.8 }
        };

        for (const [type, style] of Object.entries(typeStyles)) {
            for (const [rarity, rarityStyle] of Object.entries(rarityStyles)) {
                this.createCyberPowerUpTexture(
                    `powerup_${type}_${rarity}`,
                    style.color,
                    rarityStyle.borderColor,
                    style.symbol,
                    rarityStyle.glowIntensity
                );
            }
        }
    }

    /**
     * 创建单个赛博升级道具纹理
     */
    private createCyberPowerUpTexture(
        key: string,
        innerColor: number,
        borderColor: number,
        symbol: string,
        glowIntensity: number
    ): void {
        const graphics = this.add.graphics();
        const size = 32;
        const center = size / 2;

        // 外层光晕 - 数据芯片风格
        graphics.fillStyle(borderColor, glowIntensity * 0.3);
        graphics.fillRoundedRect(center - 14, center - 14, 28, 28, 4);

        // 芯片主体
        graphics.fillStyle(0x0a0a1a, 1);
        graphics.fillRoundedRect(center - 12, center - 12, 24, 24, 3);

        // 霓虹边框
        graphics.lineStyle(2, borderColor, 1);
        graphics.strokeRoundedRect(center - 12, center - 12, 24, 24, 3);

        // 内部发光区
        graphics.fillStyle(innerColor, 0.3);
        graphics.fillRoundedRect(center - 8, center - 8, 16, 16, 2);

        // 符号
        graphics.lineStyle(2, innerColor, 1);
        graphics.fillStyle(innerColor, 0.9);

        if (symbol === 'cross') {
            graphics.fillRect(center - 1, center - 6, 2, 12);
            graphics.fillRect(center - 6, center - 1, 12, 2);
        } else if (symbol === 'blade') {
            graphics.moveTo(center - 5, center + 5);
            graphics.lineTo(center + 5, center - 5);
            graphics.moveTo(center - 2, center - 2);
            graphics.lineTo(center - 5, center + 1);
            graphics.strokePath();
        } else if (symbol === 'shield') {
            graphics.beginPath();
            graphics.moveTo(center, center - 6);
            graphics.lineTo(center + 6, center - 3);
            graphics.lineTo(center + 6, center + 2);
            graphics.lineTo(center, center + 6);
            graphics.lineTo(center - 6, center + 2);
            graphics.lineTo(center - 6, center - 3);
            graphics.closePath();
            graphics.fillPath();
        } else if (symbol === 'arrow') {
            graphics.moveTo(center - 6, center);
            graphics.lineTo(center + 6, center);
            graphics.moveTo(center + 2, center - 4);
            graphics.lineTo(center + 6, center);
            graphics.lineTo(center + 2, center + 4);
            graphics.strokePath();
        } else if (symbol === 'star') {
            // 五角星
            const points: { x: number; y: number }[] = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI / 5) - Math.PI / 2;
                const radius = i % 2 === 0 ? 6 : 3;
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
        } else if (symbol === 'diamond') {
            graphics.beginPath();
            graphics.moveTo(center, center - 6);
            graphics.lineTo(center + 6, center);
            graphics.lineTo(center, center + 6);
            graphics.lineTo(center - 6, center);
            graphics.closePath();
            graphics.fillPath();
        }

        // 电路装饰
        graphics.lineStyle(1, innerColor, 0.5);
        graphics.moveTo(center - 12, center - 6);
        graphics.lineTo(center - 10, center - 6);
        graphics.moveTo(center - 12, center + 6);
        graphics.lineTo(center - 10, center + 6);
        graphics.moveTo(center + 10, center - 6);
        graphics.lineTo(center + 12, center - 6);
        graphics.moveTo(center + 10, center + 6);
        graphics.lineTo(center + 12, center + 6);
        graphics.strokePath();

        graphics.generateTexture(key, size, size);
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
