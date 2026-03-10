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
        // 创建玩家纹理 - 赛博战士（带动画帧）
        // Idle帧
        for (let i = 0; i < 4; i++) {
            this.createCyberPlayerTexture(`player_idle_${i}`, 'idle', i);
        }
        // Run帧
        for (let i = 0; i < 4; i++) {
            this.createCyberPlayerTexture(`player_run_${i}`, 'run', i);
        }
        // Attack帧
        for (let i = 0; i < 4; i++) {
            this.createCyberPlayerTexture(`player_attack_${i}`, 'attack', i);
        }

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

        // 创建玩家动画
        this.createPlayerAnimations();
    }

    /**
     * 创建玩家动画
     */
    private createPlayerAnimations(): void {
        // Idle动画
        if (!this.anims.exists('player_idle_anim')) {
            this.anims.create({
                key: 'player_idle_anim',
                frames: [
                    { key: 'player_idle_0' },
                    { key: 'player_idle_1' },
                    { key: 'player_idle_2' },
                    { key: 'player_idle_3' }
                ],
                frameRate: 8,
                repeat: -1
            });
        }

        // Run动画
        if (!this.anims.exists('player_run_anim')) {
            this.anims.create({
                key: 'player_run_anim',
                frames: [
                    { key: 'player_run_0' },
                    { key: 'player_run_1' },
                    { key: 'player_run_2' },
                    { key: 'player_run_3' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }

        // Attack动画
        if (!this.anims.exists('player_attack_anim')) {
            this.anims.create({
                key: 'player_attack_anim',
                frames: [
                    { key: 'player_attack_0' },
                    { key: 'player_attack_1' },
                    { key: 'player_attack_2' },
                    { key: 'player_attack_3' }
                ],
                frameRate: 12,
                repeat: 0
            });
        }
    }

    /**
     * 创建赛博玩家纹理 - 灵动的赛博朋克女战士
     * @param key 纹理键名
     * @param animType 动画类型: 'idle' | 'run' | 'attack'
     * @param frameIndex 帧索引 0-3
     */
    private createCyberPlayerTexture(key: string, animType: string = 'idle', frameIndex: number = 0): void {
        const graphics = this.add.graphics();
        const size = 48;
        const center = size / 2;

        const isRunning = animType === 'run';
        const isAttacking = animType === 'attack';
        
        // 动画偏移
        const runPhase = frameIndex;
        const legOffset = isRunning ? Math.sin(runPhase * Math.PI / 2) * 3 : 0;
        const armOffset = isRunning ? Math.sin(runPhase * Math.PI / 2 + Math.PI) * 2 : 0;
        const bodyBob = isRunning ? Math.abs(Math.sin(runPhase * Math.PI / 2)) * 1 : 0;
        const attackLean = isAttacking ? Math.min(frameIndex * 2, 5) : 0;
        const capeWave = isRunning ? Math.sin(runPhase * Math.PI / 2) * 3 : 0;

        // 角色阴影
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillEllipse(center, center + 22, 14, 5);

        // 动态披风
        graphics.fillStyle(0x1a0a2e, 0.85);
        graphics.fillTriangle(
            center - 6 - attackLean, center - 2 - bodyBob,
            center - 12 - attackLean - capeWave, center + 15 - bodyBob,
            center - 2 - attackLean, center + 8 - bodyBob
        );
        graphics.fillStyle(0xff00ff, 0.25);
        graphics.fillTriangle(
            center - 8 - attackLean, center - bodyBob,
            center - 14 - attackLean - capeWave, center + 12 - bodyBob,
            center - 4 - attackLean, center + 5 - bodyBob
        );

        // 身体 - 修身战斗服
        graphics.fillStyle(0x1a0a2e, 1);
        graphics.fillRoundedRect(center - 7 - attackLean, center - 4 - bodyBob, 14, 18, 4);
        graphics.fillStyle(0x2a1a3e, 1);
        graphics.fillRoundedRect(center - 5 - attackLean, center - 2 - bodyBob, 10, 7, 2);
        
        // 霓虹能量线
        graphics.lineStyle(1, 0x00ffff, 0.9);
        graphics.lineBetween(center - attackLean, center - bodyBob, center - attackLean, center + 10 - bodyBob);
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillCircle(center - attackLean, center + 4 - bodyBob, 2.5);
        graphics.fillStyle(0xffffff, 0.8);
        graphics.fillCircle(center - attackLean, center + 4 - bodyBob, 1.2);

        // 手臂
        graphics.fillStyle(0x2a1a3e, 1);
        const leftArmY = center - 1 - bodyBob + armOffset;
        graphics.fillRoundedRect(center - 12 - attackLean, leftArmY, 4, 11, 2);
        graphics.fillStyle(0xf0d0c0, 1);
        graphics.fillCircle(center - 10 - attackLean, leftArmY + 13, 2.5);
        
        graphics.fillStyle(0x2a1a3e, 1);
        const rightArmX = center + 8 + attackLean + (isRunning ? armOffset : 0);
        graphics.fillRoundedRect(rightArmX, center - 1 - bodyBob, 4, 11, 2);
        graphics.fillStyle(0xf0d0c0, 1);
        graphics.fillCircle(rightArmX + 2, center + 11 - bodyBob, 2.5);
        
        // 武器效果（攻击时）
        if (isAttacking && frameIndex >= 1) {
            graphics.lineStyle(3, 0xff00ff, 0.85);
            graphics.lineBetween(rightArmX + 4, center + 10 - bodyBob, rightArmX + 18 + frameIndex * 2, center - 5 - bodyBob);
            graphics.lineStyle(1, 0xffffff, 0.7);
            graphics.lineBetween(rightArmX + 4, center + 10 - bodyBob, rightArmX + 15 + frameIndex * 2, center - 3 - bodyBob);
        }

        // 腿部
        graphics.fillStyle(0x1a0a2e, 1);
        graphics.fillRoundedRect(center - 5 - attackLean + legOffset, center + 14 - bodyBob, 4, 7, 2);
        graphics.fillStyle(0x3a2a4e, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 20 - bodyBob, 6, 4, 1);
        
        graphics.fillStyle(0x1a0a2e, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 14 - bodyBob, 4, 7, 2);
        graphics.fillStyle(0x3a2a4e, 1);
        graphics.fillRoundedRect(center - attackLean - legOffset, center + 20 - bodyBob, 6, 4, 1);
        
        graphics.lineStyle(1, 0x00ffff, 0.6);
        graphics.strokeRoundedRect(center - 6 - attackLean + legOffset, center + 20 - bodyBob, 6, 4, 1);
        graphics.strokeRoundedRect(center - attackLean - legOffset, center + 20 - bodyBob, 6, 4, 1);

        // 头部
        graphics.fillStyle(0xf0d0c0, 1);
        graphics.fillCircle(center - attackLean, center - 11 - bodyBob, 6);

        // 头发
        graphics.fillStyle(0x1a0a2e, 1);
        graphics.fillRoundedRect(center - 5 - attackLean, center - 18 - bodyBob, 10, 7, 3);
        graphics.fillTriangle(
            center - 7 - attackLean - capeWave * 0.3, center - 12 - bodyBob,
            center - 11 - attackLean - capeWave, center + 1 - bodyBob,
            center - 1 - attackLean, center - 7 - bodyBob
        );
        graphics.fillTriangle(
            center + 3 - attackLean, center - 14 - bodyBob,
            center + 9 - attackLean, center - 7 - bodyBob,
            center + 5 - attackLean, center - 10 - bodyBob
        );
        graphics.fillStyle(0xff00ff, 0.7);
        graphics.fillTriangle(
            center - 9 - attackLean - capeWave, center - 4 - bodyBob,
            center - 11 - attackLean - capeWave, center + 1 - bodyBob,
            center - 7 - attackLean - capeWave * 0.5, center - 1 - bodyBob
        );

        // 面部
        graphics.lineStyle(0.8, 0x1a0a2e, 1);
        graphics.lineBetween(center - 4 - attackLean, center - 13 - bodyBob, center - 2 - attackLean, center - 14 - bodyBob);
        graphics.lineBetween(center + 2 - attackLean, center - 14 - bodyBob, center + 4 - attackLean, center - 13 - bodyBob);
        
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillCircle(center - 2 - attackLean, center - 11 - bodyBob, 1.3);
        graphics.fillCircle(center + 2 - attackLean, center - 11 - bodyBob, 1.3);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center - 2 - attackLean, center - 12 - bodyBob, 0.6);
        graphics.fillCircle(center + 2 - attackLean, center - 12 - bodyBob, 0.6);
        
        graphics.lineStyle(0.5, 0x00ffff, 0.4);
        graphics.strokeCircle(center - 2 - attackLean, center - 11 - bodyBob, 2.2);
        graphics.strokeCircle(center + 2 - attackLean, center - 11 - bodyBob, 2.2);
        
        graphics.fillStyle(0xe0c0b0, 1);
        graphics.fillCircle(center - attackLean, center - 9 - bodyBob, 0.7);
        
        graphics.lineStyle(0.8, 0xcc6688, 0.85);
        graphics.lineBetween(center - 1.5 - attackLean, center - 7 - bodyBob, center + 1.5 - attackLean, center - 7 - bodyBob);

        // 赛博改造
        graphics.fillStyle(0x00ffff, 0.6);
        graphics.fillRect(center + 5 - attackLean, center - 9 - bodyBob, 1.5, 3);
        graphics.fillStyle(0x2a2a3e, 1);
        graphics.fillCircle(center - 7 - attackLean, center - 10 - bodyBob, 1.8);
        graphics.fillStyle(0xff00ff, 0.7);
        graphics.fillCircle(center - 7 - attackLean, center - 10 - bodyBob, 0.9);

        // 漂浮粒子
        graphics.fillStyle(0x00ffff, 0.35);
        graphics.fillCircle(center - 14 - attackLean, center - 4 - bodyBob, 1.3);
        graphics.fillCircle(center + 14 - attackLean, center - bodyBob, 1.3);
        graphics.fillStyle(0xff00ff, 0.35);
        graphics.fillCircle(center - 11 - attackLean, center + 7 - bodyBob, 1.3);
        graphics.fillCircle(center + 11 - attackLean, center + 10 - bodyBob, 1.3);

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
            { key: 'weapon_sword', color: 0x00ffff, type: 'sword' },
            { key: 'weapon_blade', color: 0xff00ff, type: 'blade' },
            { key: 'weapon_staff', color: 0xffff00, type: 'staff' },
            { key: 'weapon_hammer', color: 0xff6600, type: 'hammer' },
            { key: 'weapon_dagger', color: 0x44ff44, type: 'dagger' }
        ];

        for (const weapon of weapons) {
            this.createCyberWeaponIcon(weapon.key, weapon.color, weapon.type);
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

        if (type === 'sword') {
            // 长剑 - 垂直剑身
            graphics.moveTo(center, 10);
            graphics.lineTo(center, 36);
            graphics.strokePath();
            // 护手
            graphics.lineStyle(2, color, 1);
            graphics.moveTo(center - 8, 32);
            graphics.lineTo(center + 8, 32);
            graphics.strokePath();
            // 剑尖
            graphics.fillStyle(color, 1);
            graphics.fillTriangle(center, 10, center - 3, 14, center + 3, 14);
        } else if (type === 'blade') {
            // 刀刃 - 弧形刀身
            graphics.moveTo(center - 6, 36);
            graphics.lineTo(center - 4, 28);
            graphics.lineTo(center, 14);
            graphics.lineTo(center + 4, 28);
            graphics.lineTo(center + 6, 36);
            graphics.strokePath();
            // 刀刃光泽
            graphics.lineStyle(1, 0xffffff, 0.6);
            graphics.moveTo(center, 16);
            graphics.lineTo(center, 30);
            graphics.strokePath();
        } else if (type === 'staff') {
            // 法杖 - 长杖
            graphics.lineStyle(3, color, 1);
            graphics.moveTo(center, 12);
            graphics.lineTo(center, 38);
            graphics.strokePath();
            // 顶端能量球
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, 12, 5);
            // 能量光环
            graphics.lineStyle(1, color, 0.5);
            graphics.strokeCircle(center, 12, 8);
        } else if (type === 'hammer') {
            // 重锤 - 锤头 + 锤柄
            graphics.lineStyle(3, color, 1);
            graphics.moveTo(center, 18);
            graphics.lineTo(center, 38);
            graphics.strokePath();
            // 锤头
            graphics.fillStyle(color, 1);
            graphics.fillRect(center - 10, 10, 20, 12);
            // 锤头装饰
            graphics.lineStyle(1, 0xffffff, 0.5);
            graphics.moveTo(center - 8, 16);
            graphics.lineTo(center + 8, 16);
            graphics.strokePath();
        } else if (type === 'dagger') {
            // 匕首 - 短剑身
            graphics.moveTo(center, 14);
            graphics.lineTo(center, 34);
            graphics.strokePath();
            // 护手
            graphics.lineStyle(2, color, 1);
            graphics.moveTo(center - 6, 30);
            graphics.lineTo(center + 6, 30);
            graphics.strokePath();
            // 双刃效果
            graphics.fillStyle(color, 0.8);
            graphics.fillTriangle(center, 14, center - 4, 24, center + 4, 24);
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
            { key: 'icon_slash', color: 0x00ffff, name: '霓虹斩击' },
            { key: 'icon_spin', color: 0xff00ff, name: '等离子漩涡' },
            { key: 'icon_lightning', color: 0xffff00, name: '连锁闪电' },
            { key: 'icon_laser', color: 0xff4400, name: '激光射线' },
            { key: 'icon_shield', color: 0x44ff44, name: '纳米护盾' },
            { key: 'icon_emp', color: 0x4488ff, name: 'EMP冲击' },
            { key: 'icon_overdrive', color: 0xff8800, name: '超频驱动' },
            { key: 'icon_hologram', color: 0xaa44ff, name: '全息幻影' },
            // 新增技能图标
            { key: 'icon_orb', color: 0xff66ff, name: '等离子球' },
            { key: 'icon_nova', color: 0xffaa00, name: '能量新星' },
            { key: 'icon_sonic', color: 0x00aaff, name: '音爆冲击' },
            { key: 'icon_flame', color: 0xff4400, name: '烈焰波' },
            { key: 'icon_void', color: 0x8800ff, name: '虚空裂缝' },
            { key: 'icon_time', color: 0x00ffaa, name: '时间扭曲' },
            { key: 'icon_nanite', color: 0x88ff00, name: '纳米虫群' },
            { key: 'icon_drain', color: 0xff0066, name: '能量汲取' },
            { key: 'icon_ice', color: 0x88ffff, name: '冰霜碎片' }
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

        if (name === '霓虹斩击') {
            // 斩击弧线
            graphics.beginPath();
            graphics.arc(center, center, 12, -Math.PI * 0.6, Math.PI * 0.1, false);
            graphics.strokePath();
            // 能量点
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center - 8, center - 8, 3);
            graphics.fillCircle(center + 10, center + 5, 2);
        } else if (name === '等离子漩涡') {
            // 旋转能量
            graphics.strokeCircle(center, center, 10);
            graphics.lineStyle(2, color, 0.6);
            graphics.strokeCircle(center, center, 6);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 3);
            // 旋转线条
            graphics.lineStyle(2, color, 0.8);
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                graphics.moveTo(center + Math.cos(angle) * 6, center + Math.sin(angle) * 6);
                graphics.lineTo(center + Math.cos(angle) * 14, center + Math.sin(angle) * 14);
            }
            graphics.strokePath();
        } else if (name === '连锁闪电') {
            // 闪电链
            graphics.moveTo(center - 12, center);
            graphics.lineTo(center - 4, center - 6);
            graphics.lineTo(center + 2, center + 4);
            graphics.lineTo(center + 12, center - 2);
            graphics.strokePath();
            // 分支
            graphics.lineStyle(2, color, 0.6);
            graphics.moveTo(center - 4, center - 6);
            graphics.lineTo(center - 8, center - 12);
            graphics.moveTo(center + 2, center + 4);
            graphics.lineTo(center + 6, center + 10);
            graphics.strokePath();
        } else if (name === '激光射线') {
            // 激光束
            graphics.moveTo(center - 14, center);
            graphics.lineTo(center + 14, center);
            graphics.strokePath();
            // 光晕
            graphics.fillStyle(color, 0.5);
            graphics.fillRect(center - 12, center - 3, 24, 6);
            // 端点
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center - 12, center, 4);
            graphics.fillCircle(center + 12, center, 4);
        } else if (name === '纳米护盾') {
            // 护盾形状
            graphics.beginPath();
            graphics.moveTo(center, center - 12);
            graphics.lineTo(center + 10, center - 6);
            graphics.lineTo(center + 10, center + 4);
            graphics.lineTo(center, center + 12);
            graphics.lineTo(center - 10, center + 4);
            graphics.lineTo(center - 10, center - 6);
            graphics.closePath();
            graphics.fillPath();
            // 中心十字
            graphics.lineStyle(2, 0xffffff, 0.8);
            graphics.moveTo(center, center - 6);
            graphics.lineTo(center, center + 6);
            graphics.moveTo(center - 6, center);
            graphics.lineTo(center + 6, center);
            graphics.strokePath();
        } else if (name === 'EMP冲击') {
            // 冲击波纹
            graphics.strokeCircle(center, center, 10);
            graphics.lineStyle(2, color, 0.6);
            graphics.strokeCircle(center, center, 14);
            graphics.lineStyle(1, color, 0.3);
            graphics.strokeCircle(center, center, 18);
            // 中心
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 4);
        } else if (name === '超频驱动') {
            // 速度箭头
            graphics.moveTo(center - 10, center);
            graphics.lineTo(center + 10, center);
            graphics.lineTo(center + 4, center - 6);
            graphics.moveTo(center + 10, center);
            graphics.lineTo(center + 4, center + 6);
            graphics.strokePath();
            // 速度线
            graphics.lineStyle(2, color, 0.5);
            graphics.moveTo(center - 8, center - 6);
            graphics.lineTo(center - 2, center - 6);
            graphics.moveTo(center - 8, center + 6);
            graphics.lineTo(center - 2, center + 6);
            graphics.strokePath();
        } else if (name === '全息幻影') {
            // 主体
            graphics.fillStyle(color, 0.6);
            graphics.fillCircle(center - 5, center, 8);
            graphics.fillStyle(color, 0.3);
            graphics.fillCircle(center + 7, center, 6);
            // 连接线
            graphics.lineStyle(1, color, 0.5);
            graphics.moveTo(center - 5, center);
            graphics.lineTo(center + 7, center);
            graphics.strokePath();
        } else if (name === '等离子球') {
            // 等离子球 - 能量球体
            graphics.fillStyle(color, 0.8);
            graphics.fillCircle(center, center, 10);
            graphics.fillStyle(0xffffff, 0.6);
            graphics.fillCircle(center - 3, center - 3, 4);
            // 外环
            graphics.lineStyle(2, color, 0.5);
            graphics.strokeCircle(center, center, 13);
        } else if (name === '能量新星') {
            // 能量新星 - 爆发光芒
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                graphics.moveTo(center, center);
                graphics.lineTo(center + Math.cos(angle) * 14, center + Math.sin(angle) * 14);
            }
            graphics.strokePath();
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 5);
        } else if (name === '音爆冲击') {
            // 音爆冲击 - 冲击波
            graphics.lineStyle(3, color, 1);
            graphics.strokeCircle(center, center, 8);
            graphics.lineStyle(2, color, 0.7);
            graphics.strokeCircle(center, center, 12);
            graphics.lineStyle(1, color, 0.4);
            graphics.strokeCircle(center, center, 16);
        } else if (name === '烈焰波') {
            // 烈焰波 - 火焰
            graphics.fillStyle(color, 1);
            graphics.beginPath();
            graphics.moveTo(center, center - 12);
            graphics.lineTo(center + 8, center + 8);
            graphics.lineTo(center, center + 2);
            graphics.lineTo(center - 8, center + 8);
            graphics.closePath();
            graphics.fillPath();
            // 内焰
            graphics.fillStyle(0xffff00, 0.8);
            graphics.beginPath();
            graphics.moveTo(center, center - 6);
            graphics.lineTo(center + 4, center + 4);
            graphics.lineTo(center - 4, center + 4);
            graphics.closePath();
            graphics.fillPath();
        } else if (name === '虚空裂缝') {
            // 虚空裂缝 - 空间裂缝
            graphics.fillStyle(color, 0.8);
            graphics.beginPath();
            graphics.moveTo(center - 10, center - 8);
            graphics.lineTo(center + 12, center - 4);
            graphics.lineTo(center + 8, center + 8);
            graphics.lineTo(center - 12, center + 4);
            graphics.closePath();
            graphics.fillPath();
            // 内部能量
            graphics.fillStyle(0xffffff, 0.5);
            graphics.fillCircle(center, center, 4);
        } else if (name === '时间扭曲') {
            // 时间扭曲 - 时钟
            graphics.strokeCircle(center, center, 12);
            // 时针
            graphics.lineStyle(3, color, 1);
            graphics.moveTo(center, center);
            graphics.lineTo(center + 6, center - 6);
            graphics.moveTo(center, center);
            graphics.lineTo(center - 4, center + 4);
            graphics.strokePath();
            // 时间粒子
            graphics.fillStyle(color, 0.5);
            graphics.fillCircle(center + 10, center - 2, 2);
            graphics.fillCircle(center - 10, center + 2, 2);
        } else if (name === '纳米虫群') {
            // 纳米虫群 - 多个小点
            for (let i = 0; i < 12; i++) {
                const x = center + (Math.random() - 0.5) * 24;
                const y = center + (Math.random() - 0.5) * 24;
                graphics.fillStyle(color, 0.8);
                graphics.fillCircle(x, y, 2);
            }
        } else if (name === '能量汲取') {
            // 能量汲取 - 吸取符号
            graphics.fillStyle(color, 0.8);
            graphics.fillCircle(center, center, 10);
            // 内部漩涡
            graphics.lineStyle(2, 0xffffff, 0.8);
            graphics.beginPath();
            for (let i = 0; i < 3; i++) {
                const r = 3 + i * 3;
                graphics.arc(center, center, r, 0, Math.PI * 1.5);
            }
            graphics.strokePath();
        } else if (name === '冰霜碎片') {
            // 冰霜碎片 - 冰晶
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                graphics.moveTo(center, center);
                graphics.lineTo(center + Math.cos(angle) * 12, center + Math.sin(angle) * 12);
            }
            graphics.strokePath();
            // 中心
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 4);
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
