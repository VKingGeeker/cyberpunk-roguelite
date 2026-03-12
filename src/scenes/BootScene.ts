/**
 * 启动场景
 * 负责加载游戏资源和初始化
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';
import { ClassType } from '../core/Types';

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
        const title = this.add.text(width / 2, height / 2 - 80, '霓虹侠盗', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ff00ff',
            strokeThickness: 2
        });
        title.setOrigin(0.5);

        // 副标题
        const subtitle = this.add.text(width / 2, height / 2 - 30, '赛博朋克版', {
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
        const loadingText = this.add.text(width / 2, height / 2 + 100, '正在初始化系统...', {
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
                    loadingText.setText('系统就绪');
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

        // 创建职业专属玩家纹理
        this.createClassSpecificPlayerTextures();

        // 创建敌人纹理 - 机械改造体
        this.createCyberEnemyTexture('enemy_common_idle', 'common');
        this.createCyberEnemyTexture('enemy_common_attack', 'common');
        this.createCyberEnemyTexture('enemy_elite_idle', 'elite');
        this.createCyberEnemyTexture('enemy_elite_attack', 'elite');
        this.createCyberEnemyTexture('enemy_boss_idle', 'boss');
        this.createCyberEnemyTexture('enemy_boss_attack', 'boss');
        
        // 新敌人纹理
        this.createCyberEnemyTexture('enemy_ranged_idle', 'ranged');
        this.createCyberEnemyTexture('enemy_ranged_attack', 'ranged');
        this.createCyberEnemyTexture('enemy_summoner_idle', 'summoner');
        this.createCyberEnemyTexture('enemy_summoner_attack', 'summoner');
        this.createCyberEnemyTexture('enemy_splitter_idle', 'splitter');
        this.createCyberEnemyTexture('enemy_splitter_attack', 'splitter');
        
        // BOSS纹理
        this.createCyberEnemyTexture('enemy_boss_mech_beast_idle', 'boss_mech_beast');
        this.createCyberEnemyTexture('enemy_boss_mech_beast_attack', 'boss_mech_beast');
        this.createCyberEnemyTexture('enemy_boss_data_ghost_idle', 'boss_data_ghost');
        this.createCyberEnemyTexture('enemy_boss_data_ghost_attack', 'boss_data_ghost');
        this.createCyberEnemyTexture('enemy_boss_bio_tyrant_idle', 'boss_bio_tyrant');
        this.createCyberEnemyTexture('enemy_boss_bio_tyrant_attack', 'boss_bio_tyrant');

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

        // 创建时空碎片纹理
        this.createTimeFragmentTexture();

        // 创建全息幻影纹理
        this.createHologramTextures();

        // 创建UI元素纹理
        this.createUITextures();

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

        // 创建职业专属动画
        this.createClassSpecificAnimations();
    }

    /**
     * 创建职业专属玩家纹理
     */
    private createClassSpecificPlayerTextures(): void {
        const classes = [
            ClassType.STREET_SAMURAI,
            ClassType.DATA_HACKER,
            ClassType.BIO_ENGINEER,
            ClassType.SHADOW_ASSASSIN
        ];

        for (const classType of classes) {
            // 为每个职业创建所有动画帧
            for (let i = 0; i < 4; i++) {
                this.createClassPlayerTexture(classType, `player_${classType}_idle_${i}`, 'idle', i);
            }
            for (let i = 0; i < 4; i++) {
                this.createClassPlayerTexture(classType, `player_${classType}_run_${i}`, 'run', i);
            }
            for (let i = 0; i < 4; i++) {
                this.createClassPlayerTexture(classType, `player_${classType}_attack_${i}`, 'attack', i);
            }
        }
    }

    /**
     * 创建职业专属动画
     */
    private createClassSpecificAnimations(): void {
        const classes = [
            ClassType.STREET_SAMURAI,
            ClassType.DATA_HACKER,
            ClassType.BIO_ENGINEER,
            ClassType.SHADOW_ASSASSIN
        ];

        for (const classType of classes) {
            // Idle动画
            if (!this.anims.exists(`player_${classType}_idle_anim`)) {
                this.anims.create({
                    key: `player_${classType}_idle_anim`,
                    frames: [
                        { key: `player_${classType}_idle_0` },
                        { key: `player_${classType}_idle_1` },
                        { key: `player_${classType}_idle_2` },
                        { key: `player_${classType}_idle_3` }
                    ],
                    frameRate: 8,
                    repeat: -1
                });
            }

            // Run动画
            if (!this.anims.exists(`player_${classType}_run_anim`)) {
                this.anims.create({
                    key: `player_${classType}_run_anim`,
                    frames: [
                        { key: `player_${classType}_run_0` },
                        { key: `player_${classType}_run_1` },
                        { key: `player_${classType}_run_2` },
                        { key: `player_${classType}_run_3` }
                    ],
                    frameRate: 10,
                    repeat: -1
                });
            }

            // Attack动画
            if (!this.anims.exists(`player_${classType}_attack_anim`)) {
                this.anims.create({
                    key: `player_${classType}_attack_anim`,
                    frames: [
                        { key: `player_${classType}_attack_0` },
                        { key: `player_${classType}_attack_1` },
                        { key: `player_${classType}_attack_2` },
                        { key: `player_${classType}_attack_3` }
                    ],
                    frameRate: 12,
                    repeat: 0
                });
            }
        }
    }

    /**
     * 创建职业专属玩家纹理
     * @param classType 职业类型
     * @param key 纹理键名
     * @param animType 动画类型
     * @param frameIndex 帧索引
     */
    private createClassPlayerTexture(classType: ClassType, key: string, animType: string, frameIndex: number): void {
        const graphics = this.add.graphics();
        const size = 48;
        const center = size / 2;

        // 根据职业获取颜色配置
        const config = this.getClassVisualConfig(classType);

        const isRunning = animType === 'run';
        const isAttacking = animType === 'attack';

        // 动画偏移计算
        const runPhase = frameIndex;
        const legOffset = isRunning ? Math.sin(runPhase * Math.PI / 2) * 4 : 0;
        const armSwing = isRunning ? Math.sin(runPhase * Math.PI / 2) * 5 : 0;
        const bodyBob = isRunning ? Math.abs(Math.sin(runPhase * Math.PI / 2)) * 2 : 0;
        const attackLean = isAttacking ? Math.min(frameIndex * 2, 6) : 0;
        const capeWave = isRunning ? Math.sin(runPhase * Math.PI / 2) * 4 : 0;

        // ===== 外层发光晕圈 =====
        graphics.fillStyle(config.primaryColor, 0.2);
        graphics.fillCircle(center, center, 23);
        graphics.fillStyle(config.secondaryColor, 0.12);
        graphics.fillCircle(center, center, 19);

        // 角色投影
        graphics.fillStyle(0x000000, 0.6);
        graphics.fillEllipse(center, center + 23, 18, 7);

        // ===== 根据职业绘制不同外观 =====
        switch (classType) {
            case ClassType.STREET_SAMURAI:
                this.drawStreetSamurai(graphics, center, config, animType, frameIndex, 
                    { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave });
                break;
            case ClassType.DATA_HACKER:
                this.drawDataHacker(graphics, center, config, animType, frameIndex,
                    { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave });
                break;
            case ClassType.BIO_ENGINEER:
                this.drawBioEngineer(graphics, center, config, animType, frameIndex,
                    { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave });
                break;
            case ClassType.SHADOW_ASSASSIN:
                this.drawShadowAssassin(graphics, center, config, animType, frameIndex,
                    { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave });
                break;
        }

        // ===== 角色轮廓光晕 =====
        graphics.lineStyle(2, config.primaryColor, 0.35);
        graphics.strokeCircle(center, center, 21);

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 获取职业视觉配置
     */
    private getClassVisualConfig(classType: ClassType): {
        primaryColor: number;
        secondaryColor: number;
        accentColor: number;
        bodyColor: number;
        armorColor: number;
        eyeColor: number;
    } {
        switch (classType) {
            case ClassType.STREET_SAMURAI:
                return {
                    primaryColor: 0xff4444,      // 红色主色调
                    secondaryColor: 0xff8866,    // 橙红色副色调
                    accentColor: 0xffaa00,       // 金色点缀
                    bodyColor: 0xcc2222,         // 深红色身体
                    armorColor: 0x881111,        // 暗红色装甲
                    eyeColor: 0xff0000           // 血红色眼睛
                };
            case ClassType.DATA_HACKER:
                return {
                    primaryColor: 0x00ffff,      // 青色主色调
                    secondaryColor: 0x00ffaa,    // 蓝绿色副色调
                    accentColor: 0x00aaff,       // 蓝色点缀
                    bodyColor: 0x0088aa,         // 深青色身体
                    armorColor: 0x004466,        // 暗青色装甲
                    eyeColor: 0x00ffff           // 青色眼睛
                };
            case ClassType.BIO_ENGINEER:
                return {
                    primaryColor: 0xff8800,      // 橙色主色调
                    secondaryColor: 0xffaa44,    // 黄橙色副色调
                    accentColor: 0xffcc00,       // 金黄色点缀
                    bodyColor: 0x995500,         // 深橙色身体
                    armorColor: 0x663300,        // 暗橙色装甲
                    eyeColor: 0xffaa00           // 橙色眼睛
                };
            case ClassType.SHADOW_ASSASSIN:
                return {
                    primaryColor: 0xaa44ff,      // 紫色主色调
                    secondaryColor: 0xcc66ff,    // 浅紫色副色调
                    accentColor: 0xff44aa,       // 粉紫色点缀
                    bodyColor: 0x6622aa,         // 深紫色身体
                    armorColor: 0x441188,        // 暗紫色装甲
                    eyeColor: 0xff00ff           // 品红色眼睛
                };
            default:
                return {
                    primaryColor: 0x00ffff,
                    secondaryColor: 0xff00ff,
                    accentColor: 0xffffff,
                    bodyColor: 0xd0d0e0,
                    armorColor: 0xa0a0b0,
                    eyeColor: 0x00ffff
                };
        }
    }

    /**
     * 绘制街头武士 - 红色主色调，机械义眼，装甲肩甲
     */
    private drawStreetSamurai(
        graphics: Phaser.GameObjects.Graphics,
        center: number,
        config: any,
        animType: string,
        frameIndex: number,
        offsets: { runPhase: number; legOffset: number; armSwing: number; bodyBob: number; attackLean: number; capeWave: number }
    ): void {
        const { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave } = offsets;
        const isAttacking = animType === 'attack';

        // ===== 披风 - 深红色战斗披风 =====
        graphics.fillStyle(0x8b0a20, 1);
        graphics.fillTriangle(
            center - 4 - attackLean, center - 3 - bodyBob,
            center - 14 - attackLean - capeWave, center + 18 - bodyBob,
            center + 2 - attackLean, center + 10 - bodyBob
        );
        graphics.fillStyle(0xcc2244, 0.95);
        graphics.fillTriangle(
            center - 2 - attackLean, center - 1 - bodyBob,
            center - 10 - attackLean - capeWave, center + 14 - bodyBob,
            center + 4 - attackLean, center + 8 - bodyBob
        );
        // 披风边缘发光 - 红色霓虹线
        graphics.lineStyle(2.5, config.primaryColor, 0.9);
        graphics.lineBetween(center - 4 - attackLean, center - 3 - bodyBob, center - 14 - attackLean - capeWave, center + 18 - bodyBob);

        // ===== 身体 - 武士装甲 =====
        graphics.fillStyle(config.bodyColor, 1);
        graphics.fillRoundedRect(center - 8 - attackLean, center - 5 - bodyBob, 16, 20, 5);

        // ===== 装甲肩甲 - 特色设计 =====
        // 左肩甲 - 大型装甲板
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 16 - attackLean, center - 8 - bodyBob, 8, 12, 3);
        graphics.fillStyle(config.accentColor, 1);
        graphics.fillRect(center - 15 - attackLean, center - 6 - bodyBob, 6, 2);
        // 肩甲发光边缘
        graphics.lineStyle(2, config.primaryColor, 0.8);
        graphics.strokeRoundedRect(center - 16 - attackLean, center - 8 - bodyBob, 8, 12, 3);

        // 右肩甲
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center + 8 + attackLean, center - 8 - bodyBob, 8, 12, 3);
        graphics.fillStyle(config.accentColor, 1);
        graphics.fillRect(center + 9 + attackLean, center - 6 - bodyBob, 6, 2);
        graphics.lineStyle(2, config.primaryColor, 0.8);
        graphics.strokeRoundedRect(center + 8 + attackLean, center - 8 - bodyBob, 8, 12, 3);

        // 腰部束带
        graphics.fillStyle(0x1a1a2a, 1);
        graphics.fillRect(center - 8 - attackLean, center + 10 - bodyBob, 16, 4);
        graphics.fillStyle(config.accentColor, 1);
        graphics.fillCircle(center - attackLean, center + 12 - bodyBob, 3);

        // 胸部护甲
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 3 - bodyBob, 12, 10, 3);

        // 能量核心 - 红色发光
        graphics.fillStyle(config.primaryColor, 0.9);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 4);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 2);

        // ===== 手臂 =====
        const leftArmY = center - 2 - bodyBob + armSwing;
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 14 - attackLean, leftArmY, 5, 12, 2);
        graphics.lineStyle(2, config.primaryColor, 1);
        graphics.lineBetween(center - 11.5 - attackLean, leftArmY, center - 11.5 - attackLean, leftArmY + 10);
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(center - 11.5 - attackLean, leftArmY + 14, 3);

        const rightArmX = center + 9 + attackLean - (offsets.runPhase !== undefined ? armSwing : 0);
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(rightArmX, center - 2 - bodyBob, 5, 12, 2);
        graphics.lineStyle(2, config.primaryColor, 1);
        graphics.lineBetween(rightArmX + 2.5, center - 2 - bodyBob, rightArmX + 2.5, center + 10 - bodyBob);
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(rightArmX + 2.5, center + 12 - bodyBob, 3);

        // ===== 武器效果（攻击时）- 武士刀 =====
        if (isAttacking && frameIndex >= 1) {
            const weaponExtend = frameIndex * 3;
            const weaponY = center + 10 - bodyBob;
            const weaponEndX = rightArmX + 20 + weaponExtend;
            const weaponEndY = center - 8 - bodyBob;

            graphics.lineStyle(8, config.primaryColor, 0.25);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineStyle(5, config.primaryColor, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX - 3, weaponEndY + 2);

            graphics.fillStyle(0x2a2a3a, 1);
            graphics.fillRect(rightArmX - 1, weaponY - 3, 6, 6);
            graphics.fillStyle(config.primaryColor, 1);
            graphics.fillRect(rightArmX - 1, weaponY - 3, 6, 2);
        }

        // ===== 腿部 =====
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x1a1a2a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);

        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x1a1a2a, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);

        // ===== 头部 - 机械义眼特色 =====
        graphics.fillStyle(0xe0e0f0, 1);
        graphics.fillCircle(center - attackLean, center - 12 - bodyBob, 7);

        // 机械义眼框架
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 15 - bodyBob, 12, 8, 2);

        // 机械义眼 - 红色发光
        graphics.fillStyle(config.eyeColor, 1);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        // 义眼高光
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(center - 3 - attackLean, center - 13 - bodyBob, 1.2, 1);
        graphics.fillEllipse(center + 2 - attackLean, center - 13 - bodyBob, 1.2, 1);
        // 义眼光晕
        graphics.fillStyle(config.eyeColor, 0.3);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 5, 3);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 5, 3);

        // 头发/头巾 - 红色
        graphics.fillStyle(0x8b0a20, 1);
        graphics.fillRoundedRect(center - 5 - attackLean, center - 20 - bodyBob, 10, 6, 3);
        graphics.fillTriangle(
            center - 6 - attackLean, center - 15 - bodyBob,
            center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob,
            center - 2 - attackLean, center - 10 - bodyBob
        );
        graphics.lineStyle(1.5, config.primaryColor, 0.8);
        graphics.lineBetween(center - 6 - attackLean, center - 15 - bodyBob, center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob);

        // ===== 粒子效果 =====
        graphics.fillStyle(config.primaryColor, 0.8);
        graphics.fillCircle(center - 16 - attackLean, center - 6 - bodyBob, 2);
        graphics.fillCircle(center + 16 - attackLean, center - 2 - bodyBob, 1.5);
        graphics.fillStyle(config.accentColor, 0.8);
        graphics.fillCircle(center - 12 - attackLean, center + 6 - bodyBob, 1.5);
        graphics.fillCircle(center + 14 - attackLean, center + 8 - bodyBob, 2);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(center - attackLean, center - 22 - bodyBob, 1.5);
    }

    /**
     * 绘制数据黑客 - 蓝绿色主色调，AR护目镜，数据流纹路
     */
    private drawDataHacker(
        graphics: Phaser.GameObjects.Graphics,
        center: number,
        config: any,
        animType: string,
        frameIndex: number,
        offsets: { runPhase: number; legOffset: number; armSwing: number; bodyBob: number; attackLean: number; capeWave: number }
    ): void {
        const { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave } = offsets;
        const isAttacking = animType === 'attack';

        // ===== 披风 - 数据流披风 =====
        graphics.fillStyle(0x0a4a5a, 1);
        graphics.fillTriangle(
            center - 4 - attackLean, center - 3 - bodyBob,
            center - 14 - attackLean - capeWave, center + 18 - bodyBob,
            center + 2 - attackLean, center + 10 - bodyBob
        );
        graphics.fillStyle(0x00aacc, 0.95);
        graphics.fillTriangle(
            center - 2 - attackLean, center - 1 - bodyBob,
            center - 10 - attackLean - capeWave, center + 14 - bodyBob,
            center + 4 - attackLean, center + 8 - bodyBob
        );
        // 数据流纹路
        graphics.lineStyle(2, config.primaryColor, 0.9);
        graphics.lineBetween(center - 4 - attackLean, center - 3 - bodyBob, center - 14 - attackLean - capeWave, center + 18 - bodyBob);
        // 数据流粒子
        graphics.fillStyle(config.primaryColor, 1);
        graphics.fillCircle(center - 12 - attackLean - capeWave, center + 16 - bodyBob, 2);

        // ===== 身体 - 黑客紧身衣 =====
        graphics.fillStyle(config.bodyColor, 1);
        graphics.fillRoundedRect(center - 8 - attackLean, center - 5 - bodyBob, 16, 20, 5);

        // 数据流纹路 - 特色设计
        graphics.lineStyle(1.5, config.primaryColor, 0.7);
        // 胸部数据流
        graphics.moveTo(center - 6 - attackLean, center - 2 - bodyBob);
        graphics.lineTo(center + 6 - attackLean, center - 2 - bodyBob);
        graphics.moveTo(center - 4 - attackLean, center + 2 - bodyBob);
        graphics.lineTo(center + 4 - attackLean, center + 2 - bodyBob);
        graphics.strokePath();

        // 腰部束带
        graphics.fillStyle(0x1a2a3a, 1);
        graphics.fillRect(center - 8 - attackLean, center + 10 - bodyBob, 16, 4);
        graphics.fillStyle(config.primaryColor, 1);
        graphics.fillCircle(center - attackLean, center + 12 - bodyBob, 3);

        // 胸部护甲
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 3 - bodyBob, 12, 10, 3);

        // 能量核心 - 青色发光
        graphics.fillStyle(config.primaryColor, 0.9);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 4);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 2);

        // ===== 手臂 =====
        const leftArmY = center - 2 - bodyBob + armSwing;
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 14 - attackLean, leftArmY, 5, 12, 2);
        graphics.lineStyle(2, config.primaryColor, 1);
        graphics.lineBetween(center - 11.5 - attackLean, leftArmY, center - 11.5 - attackLean, leftArmY + 10);
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(center - 11.5 - attackLean, leftArmY + 14, 3);

        const rightArmX = center + 9 + attackLean - armSwing;
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(rightArmX, center - 2 - bodyBob, 5, 12, 2);
        graphics.lineStyle(2, config.primaryColor, 1);
        graphics.lineBetween(rightArmX + 2.5, center - 2 - bodyBob, rightArmX + 2.5, center + 10 - bodyBob);
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(rightArmX + 2.5, center + 12 - bodyBob, 3);

        // ===== 武器效果（攻击时）- 数据手套 =====
        if (isAttacking && frameIndex >= 1) {
            const weaponExtend = frameIndex * 3;
            const weaponY = center + 10 - bodyBob;
            const weaponEndX = rightArmX + 20 + weaponExtend;
            const weaponEndY = center - 8 - bodyBob;

            // 数据流攻击效果
            graphics.lineStyle(8, config.primaryColor, 0.25);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineStyle(5, config.primaryColor, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX - 3, weaponEndY + 2);

            // 数据粒子
            graphics.fillStyle(config.primaryColor, 1);
            graphics.fillCircle(weaponEndX, weaponEndY, 4);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(weaponEndX, weaponEndY, 2);
        }

        // ===== 腿部 =====
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x1a2a3a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);

        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x1a2a3a, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);

        // ===== 头部 - AR护目镜特色 =====
        graphics.fillStyle(0xe0e0f0, 1);
        graphics.fillCircle(center - attackLean, center - 12 - bodyBob, 7);

        // AR护目镜 - 大型护目镜
        graphics.fillStyle(0x1a1a2a, 1);
        graphics.fillRoundedRect(center - 8 - attackLean, center - 16 - bodyBob, 16, 8, 3);
        // 护目镜镜片
        graphics.fillStyle(config.primaryColor, 0.8);
        graphics.fillRoundedRect(center - 7 - attackLean, center - 15 - bodyBob, 14, 6, 2);
        // 护目镜高光
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillRect(center - 6 - attackLean, center - 14 - bodyBob, 4, 2);
        // 护目镜数据流显示
        graphics.lineStyle(1, config.secondaryColor, 0.9);
        graphics.moveTo(center - 4 - attackLean, center - 13 - bodyBob);
        graphics.lineTo(center + 4 - attackLean, center - 13 - bodyBob);
        graphics.strokePath();

        // 头发/头巾 - 青色
        graphics.fillStyle(0x0a4a5a, 1);
        graphics.fillRoundedRect(center - 5 - attackLean, center - 20 - bodyBob, 10, 6, 3);
        graphics.fillTriangle(
            center - 6 - attackLean, center - 15 - bodyBob,
            center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob,
            center - 2 - attackLean, center - 10 - bodyBob
        );
        graphics.lineStyle(1.5, config.primaryColor, 0.8);
        graphics.lineBetween(center - 6 - attackLean, center - 15 - bodyBob, center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob);

        // ===== 粒子效果 =====
        graphics.fillStyle(config.primaryColor, 0.8);
        graphics.fillCircle(center - 16 - attackLean, center - 6 - bodyBob, 2);
        graphics.fillCircle(center + 16 - attackLean, center - 2 - bodyBob, 1.5);
        graphics.fillStyle(config.secondaryColor, 0.8);
        graphics.fillCircle(center - 12 - attackLean, center + 6 - bodyBob, 1.5);
        graphics.fillCircle(center + 14 - attackLean, center + 8 - bodyBob, 2);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(center - attackLean, center - 22 - bodyBob, 1.5);
    }

    /**
     * 绘制生化改造者 - 橙色主色调，机械臂，工具腰带
     */
    private drawBioEngineer(
        graphics: Phaser.GameObjects.Graphics,
        center: number,
        config: any,
        animType: string,
        frameIndex: number,
        offsets: { runPhase: number; legOffset: number; armSwing: number; bodyBob: number; attackLean: number; capeWave: number }
    ): void {
        const { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave } = offsets;
        const isAttacking = animType === 'attack';

        // ===== 披风 - 工程师披风 =====
        graphics.fillStyle(0x5a3a0a, 1);
        graphics.fillTriangle(
            center - 4 - attackLean, center - 3 - bodyBob,
            center - 14 - attackLean - capeWave, center + 18 - bodyBob,
            center + 2 - attackLean, center + 10 - bodyBob
        );
        graphics.fillStyle(0xcc8844, 0.95);
        graphics.fillTriangle(
            center - 2 - attackLean, center - 1 - bodyBob,
            center - 10 - attackLean - capeWave, center + 14 - bodyBob,
            center + 4 - attackLean, center + 8 - bodyBob
        );
        graphics.lineStyle(2.5, config.primaryColor, 0.9);
        graphics.lineBetween(center - 4 - attackLean, center - 3 - bodyBob, center - 14 - attackLean - capeWave, center + 18 - bodyBob);

        // ===== 身体 - 重型装甲 =====
        graphics.fillStyle(config.bodyColor, 1);
        graphics.fillRoundedRect(center - 8 - attackLean, center - 5 - bodyBob, 16, 20, 5);

        // 工具腰带 - 特色设计
        graphics.fillStyle(0x2a1a0a, 1);
        graphics.fillRect(center - 10 - attackLean, center + 9 - bodyBob, 20, 6);
        // 腰带工具
        graphics.fillStyle(config.accentColor, 1);
        graphics.fillCircle(center - 6 - attackLean, center + 12 - bodyBob, 2);
        graphics.fillCircle(center - attackLean, center + 12 - bodyBob, 2);
        graphics.fillCircle(center + 6 - attackLean, center + 12 - bodyBob, 2);
        // 腰带扣
        graphics.fillStyle(config.primaryColor, 1);
        graphics.fillCircle(center - attackLean, center + 11 - bodyBob, 4);

        // 胸部护甲 - 厚重装甲
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 7 - attackLean, center - 4 - bodyBob, 14, 12, 3);

        // 能量核心 - 橙色发光
        graphics.fillStyle(config.primaryColor, 0.9);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 5);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 2.5);

        // ===== 机械臂 - 特色设计 =====
        const leftArmY = center - 2 - bodyBob + armSwing;
        // 机械臂结构
        graphics.fillStyle(0x4a3a2a, 1);
        graphics.fillRoundedRect(center - 16 - attackLean, leftArmY, 7, 14, 2);
        // 机械关节
        graphics.fillStyle(config.accentColor, 1);
        graphics.fillCircle(center - 12.5 - attackLean, leftArmY + 3, 2);
        graphics.fillCircle(center - 12.5 - attackLean, leftArmY + 10, 2);
        // 机械臂发光
        graphics.lineStyle(2, config.primaryColor, 1);
        graphics.lineBetween(center - 12.5 - attackLean, leftArmY, center - 12.5 - attackLean, leftArmY + 12);
        // 机械手
        graphics.fillStyle(0x3a2a1a, 1);
        graphics.fillCircle(center - 12.5 - attackLean, leftArmY + 16, 4);

        const rightArmX = center + 9 + attackLean - armSwing;
        // 右机械臂
        graphics.fillStyle(0x4a3a2a, 1);
        graphics.fillRoundedRect(rightArmX, center - 2 - bodyBob, 7, 14, 2);
        graphics.fillStyle(config.accentColor, 1);
        graphics.fillCircle(rightArmX + 3.5, center + 1 - bodyBob, 2);
        graphics.fillCircle(rightArmX + 3.5, center + 8 - bodyBob, 2);
        graphics.lineStyle(2, config.primaryColor, 1);
        graphics.lineBetween(rightArmX + 3.5, center - 2 - bodyBob, rightArmX + 3.5, center + 10 - bodyBob);
        graphics.fillStyle(0x3a2a1a, 1);
        graphics.fillCircle(rightArmX + 3.5, center + 14 - bodyBob, 4);

        // ===== 武器效果（攻击时）- 生化拳套 =====
        if (isAttacking && frameIndex >= 1) {
            const weaponExtend = frameIndex * 3;
            const weaponY = center + 10 - bodyBob;
            const weaponEndX = rightArmX + 20 + weaponExtend;
            const weaponEndY = center - 8 - bodyBob;

            graphics.lineStyle(8, config.primaryColor, 0.25);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineStyle(5, config.primaryColor, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX - 3, weaponEndY + 2);

            graphics.fillStyle(config.primaryColor, 1);
            graphics.fillCircle(weaponEndX, weaponEndY, 5);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(weaponEndX, weaponEndY, 2.5);
        }

        // ===== 腿部 =====
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x2a1a0a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);

        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x2a1a0a, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);

        // ===== 头部 =====
        graphics.fillStyle(0xe0e0f0, 1);
        graphics.fillCircle(center - attackLean, center - 12 - bodyBob, 7);

        // 面罩
        graphics.fillStyle(0x2a1a0a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 15 - bodyBob, 12, 8, 2);

        // 眼睛 - 橙色
        graphics.fillStyle(config.eyeColor, 1);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(center - 3 - attackLean, center - 13 - bodyBob, 1.2, 1);
        graphics.fillEllipse(center + 2 - attackLean, center - 13 - bodyBob, 1.2, 1);
        graphics.fillStyle(config.eyeColor, 0.3);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 5, 3);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 5, 3);

        // 头发/头巾 - 橙色
        graphics.fillStyle(0x5a3a0a, 1);
        graphics.fillRoundedRect(center - 5 - attackLean, center - 20 - bodyBob, 10, 6, 3);
        graphics.fillTriangle(
            center - 6 - attackLean, center - 15 - bodyBob,
            center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob,
            center - 2 - attackLean, center - 10 - bodyBob
        );
        graphics.lineStyle(1.5, config.primaryColor, 0.8);
        graphics.lineBetween(center - 6 - attackLean, center - 15 - bodyBob, center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob);

        // ===== 粒子效果 =====
        graphics.fillStyle(config.primaryColor, 0.8);
        graphics.fillCircle(center - 16 - attackLean, center - 6 - bodyBob, 2);
        graphics.fillCircle(center + 16 - attackLean, center - 2 - bodyBob, 1.5);
        graphics.fillStyle(config.accentColor, 0.8);
        graphics.fillCircle(center - 12 - attackLean, center + 6 - bodyBob, 1.5);
        graphics.fillCircle(center + 14 - attackLean, center + 8 - bodyBob, 2);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(center - attackLean, center - 22 - bodyBob, 1.5);
    }

    /**
     * 绘制暗影刺客 - 紫色主色调，生物纹身，光学迷彩
     */
    private drawShadowAssassin(
        graphics: Phaser.GameObjects.Graphics,
        center: number,
        config: any,
        animType: string,
        frameIndex: number,
        offsets: { runPhase: number; legOffset: number; armSwing: number; bodyBob: number; attackLean: number; capeWave: number }
    ): void {
        const { runPhase, legOffset, armSwing, bodyBob, attackLean, capeWave } = offsets;
        const isAttacking = animType === 'attack';

        // ===== 披风 - 暗影披风（半透明迷彩效果）=====
        graphics.fillStyle(0x3a1a4a, 0.8);
        graphics.fillTriangle(
            center - 4 - attackLean, center - 3 - bodyBob,
            center - 14 - attackLean - capeWave, center + 18 - bodyBob,
            center + 2 - attackLean, center + 10 - bodyBob
        );
        graphics.fillStyle(0x8844aa, 0.7);
        graphics.fillTriangle(
            center - 2 - attackLean, center - 1 - bodyBob,
            center - 10 - attackLean - capeWave, center + 14 - bodyBob,
            center + 4 - attackLean, center + 8 - bodyBob
        );
        // 光学迷彩效果 - 波纹
        graphics.lineStyle(2, config.primaryColor, 0.6);
        graphics.lineBetween(center - 4 - attackLean, center - 3 - bodyBob, center - 14 - attackLean - capeWave, center + 18 - bodyBob);

        // ===== 身体 - 刺客紧身衣 =====
        graphics.fillStyle(config.bodyColor, 1);
        graphics.fillRoundedRect(center - 8 - attackLean, center - 5 - bodyBob, 16, 20, 5);

        // 生物纹身 - 特色设计
        graphics.lineStyle(1.5, config.primaryColor, 0.8);
        // 胸部纹身
        graphics.moveTo(center - 5 - attackLean, center - 2 - bodyBob);
        graphics.lineTo(center - 2 - attackLean, center - 4 - bodyBob);
        graphics.lineTo(center + 2 - attackLean, center - 4 - bodyBob);
        graphics.lineTo(center + 5 - attackLean, center - 2 - bodyBob);
        graphics.strokePath();
        // 腹部纹身
        graphics.moveTo(center - 4 - attackLean, center + 4 - bodyBob);
        graphics.lineTo(center + 4 - attackLean, center + 4 - bodyBob);
        graphics.strokePath();

        // 腰部束带
        graphics.fillStyle(0x2a1a3a, 1);
        graphics.fillRect(center - 8 - attackLean, center + 10 - bodyBob, 16, 4);
        graphics.fillStyle(config.primaryColor, 1);
        graphics.fillCircle(center - attackLean, center + 12 - bodyBob, 3);

        // 胸部护甲
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 3 - bodyBob, 12, 10, 3);

        // 能量核心 - 紫色发光
        graphics.fillStyle(config.primaryColor, 0.9);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 4);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 2);

        // ===== 手臂 =====
        const leftArmY = center - 2 - bodyBob + armSwing;
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 14 - attackLean, leftArmY, 5, 12, 2);
        // 手臂纹身
        graphics.lineStyle(1.5, config.accentColor, 0.9);
        graphics.lineBetween(center - 11.5 - attackLean, leftArmY, center - 11.5 - attackLean, leftArmY + 10);
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(center - 11.5 - attackLean, leftArmY + 14, 3);

        const rightArmX = center + 9 + attackLean - armSwing;
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(rightArmX, center - 2 - bodyBob, 5, 12, 2);
        graphics.lineStyle(1.5, config.accentColor, 0.9);
        graphics.lineBetween(rightArmX + 2.5, center - 2 - bodyBob, rightArmX + 2.5, center + 10 - bodyBob);
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(rightArmX + 2.5, center + 12 - bodyBob, 3);

        // ===== 武器效果（攻击时）- 双匕首 =====
        if (isAttacking && frameIndex >= 1) {
            const weaponExtend = frameIndex * 3;
            const weaponY = center + 10 - bodyBob;
            const weaponEndX = rightArmX + 20 + weaponExtend;
            const weaponEndY = center - 8 - bodyBob;

            // 双匕首攻击效果
            graphics.lineStyle(8, config.primaryColor, 0.25);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineBetween(rightArmX + 5, weaponY - 2, weaponEndX + 2, weaponEndY - 2);
            graphics.lineStyle(5, config.primaryColor, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            graphics.lineBetween(rightArmX + 5, weaponY - 2, weaponEndX + 2, weaponEndY - 2);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX - 3, weaponEndY + 2);
            graphics.lineBetween(rightArmX + 5, weaponY - 2, weaponEndX - 1, weaponEndY);

            graphics.fillStyle(config.primaryColor, 1);
            graphics.fillCircle(weaponEndX, weaponEndY, 3);
            graphics.fillCircle(weaponEndX + 2, weaponEndY - 2, 3);
        }

        // ===== 腿部 =====
        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x2a1a3a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);

        graphics.fillStyle(config.armorColor, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x2a1a3a, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, config.primaryColor, 0.9);
        graphics.strokeRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);

        // ===== 头部 =====
        graphics.fillStyle(0xe0e0f0, 1);
        graphics.fillCircle(center - attackLean, center - 12 - bodyBob, 7);

        // 面罩
        graphics.fillStyle(0x1a0a2a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 15 - bodyBob, 12, 8, 2);

        // 眼睛 - 品红色
        graphics.fillStyle(config.eyeColor, 1);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(center - 3 - attackLean, center - 13 - bodyBob, 1.2, 1);
        graphics.fillEllipse(center + 2 - attackLean, center - 13 - bodyBob, 1.2, 1);
        graphics.fillStyle(config.eyeColor, 0.3);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 5, 3);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 5, 3);

        // 头发/头巾 - 紫色
        graphics.fillStyle(0x3a1a4a, 1);
        graphics.fillRoundedRect(center - 5 - attackLean, center - 20 - bodyBob, 10, 6, 3);
        graphics.fillTriangle(
            center - 6 - attackLean, center - 15 - bodyBob,
            center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob,
            center - 2 - attackLean, center - 10 - bodyBob
        );
        graphics.lineStyle(1.5, config.primaryColor, 0.8);
        graphics.lineBetween(center - 6 - attackLean, center - 15 - bodyBob, center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob);

        // ===== 粒子效果 =====
        graphics.fillStyle(config.primaryColor, 0.8);
        graphics.fillCircle(center - 16 - attackLean, center - 6 - bodyBob, 2);
        graphics.fillCircle(center + 16 - attackLean, center - 2 - bodyBob, 1.5);
        graphics.fillStyle(config.accentColor, 0.8);
        graphics.fillCircle(center - 12 - attackLean, center + 6 - bodyBob, 1.5);
        graphics.fillCircle(center + 14 - attackLean, center + 8 - bodyBob, 2);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(center - attackLean, center - 22 - bodyBob, 1.5);
    }

    /**
     * 创建赛博玩家纹理 - 霓虹忍者风格（高对比度全新设计）
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
        
        // 动画偏移计算
        const runPhase = frameIndex;
        const legOffset = isRunning ? Math.sin(runPhase * Math.PI / 2) * 4 : 0;
        const armSwing = isRunning ? Math.sin(runPhase * Math.PI / 2) * 5 : 0;
        const bodyBob = isRunning ? Math.abs(Math.sin(runPhase * Math.PI / 2)) * 2 : 0;
        const attackLean = isAttacking ? Math.min(frameIndex * 2, 6) : 0;
        const capeWave = isRunning ? Math.sin(runPhase * Math.PI / 2) * 4 : 0;

        // ===== 完全重新设计：霓虹忍者风格 =====
        
        // 外层发光晕圈 - 青色外晕（与暗背景形成强烈对比）
        graphics.fillStyle(0x00ffff, 0.2);
        graphics.fillCircle(center, center, 23);
        // 品红色内晕
        graphics.fillStyle(0xff00ff, 0.12);
        graphics.fillCircle(center, center, 19);
        
        // 角色投影 - 深色投影确保可见度
        graphics.fillStyle(0x000000, 0.6);
        graphics.fillEllipse(center, center + 23, 18, 7);

        // ===== 忍者披风 - 使用鲜明对比色 =====
        // 外层披风 - 深紫红色
        graphics.fillStyle(0x8b0a50, 1);
        graphics.fillTriangle(
            center - 4 - attackLean, center - 3 - bodyBob,
            center - 14 - attackLean - capeWave, center + 18 - bodyBob,
            center + 2 - attackLean, center + 10 - bodyBob
        );
        // 内层披风 - 银白色反光面（极高对比度）
        graphics.fillStyle(0xe8e8f0, 0.95);
        graphics.fillTriangle(
            center - 2 - attackLean, center - 1 - bodyBob,
            center - 10 - attackLean - capeWave, center + 14 - bodyBob,
            center + 4 - attackLean, center + 8 - bodyBob
        );
        // 披风边缘发光 - 品红色霓虹线
        graphics.lineStyle(2.5, 0xff00ff, 0.9);
        graphics.lineBetween(center - 4 - attackLean, center - 3 - bodyBob, center - 14 - attackLean - capeWave, center + 18 - bodyBob);
        // 披风下摆发光点
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillCircle(center - 12 - attackLean - capeWave, center + 16 - bodyBob, 2);

        // ===== 身体 - 忍者紧身服（银白色主调，极高对比） =====
        // 主体 - 银白色
        graphics.fillStyle(0xd0d0e0, 1);
        graphics.fillRoundedRect(center - 8 - attackLean, center - 5 - bodyBob, 16, 20, 5);
        
        // 腰部束带 - 黑色
        graphics.fillStyle(0x1a1a2a, 1);
        graphics.fillRect(center - 8 - attackLean, center + 10 - bodyBob, 16, 4);
        
        // 腰带扣 - 青色发光
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillCircle(center - attackLean, center + 12 - bodyBob, 3);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center - attackLean, center + 12 - bodyBob, 1.5);

        // 胸部护甲 - 浅灰色
        graphics.fillStyle(0xa0a0b0, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 3 - bodyBob, 12, 10, 3);
        
        // 能量核心 - 青色发光（胸口）
        graphics.fillStyle(0x00ffff, 0.9);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 4);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 2);
        // 核心光晕
        graphics.fillStyle(0x00ffff, 0.35);
        graphics.fillCircle(center - attackLean, center + 2 - bodyBob, 7);

        // ===== 手臂 - 忍者手臂装甲 =====
        // 左臂
        graphics.fillStyle(0xb0b0c0, 1);
        const leftArmY = center - 2 - bodyBob + armSwing;
        graphics.fillRoundedRect(center - 14 - attackLean, leftArmY, 5, 12, 2);
        // 手臂发光带
        graphics.lineStyle(2, 0x00ffff, 1);
        graphics.lineBetween(center - 11.5 - attackLean, leftArmY, center - 11.5 - attackLean, leftArmY + 10);
        // 手部 - 肤色
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(center - 11.5 - attackLean, leftArmY + 14, 3);
        
        // 右臂
        graphics.fillStyle(0xb0b0c0, 1);
        const rightArmX = center + 9 + attackLean - (isRunning ? armSwing : 0);
        graphics.fillRoundedRect(rightArmX, center - 2 - bodyBob, 5, 12, 2);
        graphics.lineStyle(2, 0x00ffff, 1);
        graphics.lineBetween(rightArmX + 2.5, center - 2 - bodyBob, rightArmX + 2.5, center + 10 - bodyBob);
        graphics.fillStyle(0xf0d0b8, 1);
        graphics.fillCircle(rightArmX + 2.5, center + 12 - bodyBob, 3);

        // ===== 武器效果（攻击时） - 忍者武士刀 =====
        if (isAttacking && frameIndex >= 1) {
            const weaponExtend = frameIndex * 3;
            const weaponY = center + 10 - bodyBob;
            const weaponEndX = rightArmX + 20 + weaponExtend;
            const weaponEndY = center - 8 - bodyBob;
            
            // 武器外发光 - 品红色
            graphics.lineStyle(8, 0xff00ff, 0.25);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            
            // 武器主体 - 青色
            graphics.lineStyle(5, 0x00ffff, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX, weaponEndY);
            
            // 武器核心 - 白色
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.lineBetween(rightArmX + 3, weaponY, weaponEndX - 3, weaponEndY + 2);
            
            // 剑柄
            graphics.fillStyle(0x2a2a3a, 1);
            graphics.fillRect(rightArmX - 1, weaponY - 3, 6, 6);
            graphics.fillStyle(0xff00ff, 1);
            graphics.fillRect(rightArmX - 1, weaponY - 3, 6, 2);
        }

        // ===== 腿部 - 忍者腿部装甲 =====
        // 左腿
        graphics.fillStyle(0xc0c0d0, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x1a1a2a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);
        // 腿部发光
        graphics.lineStyle(1.5, 0x00ffff, 0.9);
        graphics.strokeRoundedRect(center - 6 - attackLean + legOffset, center + 23 - bodyBob, 5, 4, 1);
        
        // 右腿
        graphics.fillStyle(0xc0c0d0, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 15 - bodyBob, 5, 9, 2);
        graphics.fillStyle(0x1a1a2a, 1);
        graphics.fillRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);
        graphics.lineStyle(1.5, 0x00ffff, 0.9);
        graphics.strokeRoundedRect(center + 1 - attackLean - legOffset, center + 23 - bodyBob, 5, 4, 1);

        // ===== 头部 - 忍者面罩风格 =====
        // 头部轮廓 - 银白色
        graphics.fillStyle(0xe0e0f0, 1);
        graphics.fillCircle(center - attackLean, center - 12 - bodyBob, 7);
        
        // 忍者面罩 - 黑色
        graphics.fillStyle(0x0a0a1a, 1);
        graphics.fillRoundedRect(center - 6 - attackLean, center - 15 - bodyBob, 12, 8, 2);
        
        // 眼睛区域 - 面罩开口（青色发光眼睛）
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 3, 2);
        // 眼睛高光
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(center - 3 - attackLean, center - 13 - bodyBob, 1.2, 1);
        graphics.fillEllipse(center + 2 - attackLean, center - 13 - bodyBob, 1.2, 1);
        // 眼睛光晕
        graphics.fillStyle(0x00ffff, 0.3);
        graphics.fillEllipse(center - 2.5 - attackLean, center - 12 - bodyBob, 5, 3);
        graphics.fillEllipse(center + 2.5 - attackLean, center - 12 - bodyBob, 5, 3);
        
        // 头发/头巾 - 紫红色
        graphics.fillStyle(0x6b0a40, 1);
        graphics.fillRoundedRect(center - 5 - attackLean, center - 20 - bodyBob, 10, 6, 3);
        // 头巾飘带
        graphics.fillTriangle(
            center - 6 - attackLean, center - 15 - bodyBob,
            center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob,
            center - 2 - attackLean, center - 10 - bodyBob
        );
        // 头巾发光边缘
        graphics.lineStyle(1.5, 0xff00ff, 0.8);
        graphics.lineBetween(center - 6 - attackLean, center - 15 - bodyBob, center - 12 - attackLean - capeWave * 0.5, center - 4 - bodyBob);

        // ===== 忍者在空中的粒子效果 =====
        graphics.fillStyle(0x00ffff, 0.8);
        graphics.fillCircle(center - 16 - attackLean, center - 6 - bodyBob, 2);
        graphics.fillCircle(center + 16 - attackLean, center - 2 - bodyBob, 1.5);
        graphics.fillStyle(0xff00ff, 0.8);
        graphics.fillCircle(center - 12 - attackLean, center + 6 - bodyBob, 1.5);
        graphics.fillCircle(center + 14 - attackLean, center + 8 - bodyBob, 2);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(center - attackLean, center - 22 - bodyBob, 1.5);

        // ===== 角色轮廓光晕 - 青色 =====
        graphics.lineStyle(2, 0x00ffff, 0.35);
        graphics.strokeCircle(center, center, 21);

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建赛博敌人纹理 - 完全重新设计，使用不同几何形状区分怪物类型
     * 设计理念：
     * - 普通敌人(COMMON): 六边形无人机 - 紧凑、简洁
     * - 精英敌人(ELITE): 菱形装甲 - 更大、更华丽
     * - 远程敌人(RANGED): 圆形炮台 - 悬浮形态
     * - 召唤师(SUMMONER): 五角星法阵 - 神秘效果
     * - 分裂体(SPLITTER): 不规则碎片 - 可分裂
     * - BOSS: 巨大多边形 - 各有特色
     */
    private createCyberEnemyTexture(key: string, type: 'common' | 'elite' | 'boss' | 'ranged' | 'summoner' | 'splitter' | 'boss_mech_beast' | 'boss_data_ghost' | 'boss_bio_tyrant'): void {
        const graphics = this.add.graphics();
        let size: number;
        let bodyColor: number;
        let neonColor: number;
        let eyeColor: number;
        let accentColor: number;

        // ===== 独特配色方案 =====
        switch (type) {
            case 'boss_mech_beast':
                size = 96;
                bodyColor = 0x2a0a0a;
                neonColor = 0xff4400;
                eyeColor = 0xff0000;
                accentColor = 0xffaa00;
                break;
            case 'boss_data_ghost':
                size = 88;
                bodyColor = 0x0a1a2a;
                neonColor = 0x00ffcc;
                eyeColor = 0x00ffff;
                accentColor = 0xaaffff;
                break;
            case 'boss_bio_tyrant':
                size = 92;
                bodyColor = 0x0a2a0a;
                neonColor = 0x44ff00;
                eyeColor = 0x00ff00;
                accentColor = 0xaaff00;
                break;
            case 'boss':
                size = 80;
                bodyColor = 0x3a0a1a;
                neonColor = 0xff0066;
                eyeColor = 0xff3333;
                accentColor = 0xff88aa;
                break;
            case 'elite':
                size = 60;
                bodyColor = 0x1a0a3a;
                neonColor = 0x9944ff;
                eyeColor = 0xcc66ff;
                accentColor = 0x6688ff;
                break;
            case 'ranged':
                size = 52;
                bodyColor = 0x0a1a2a;
                neonColor = 0x00ccff;
                eyeColor = 0x00aaff;
                accentColor = 0x88ddff;
                break;
            case 'summoner':
                size = 58;
                bodyColor = 0x2a0a2a;
                neonColor = 0xff00aa;
                eyeColor = 0xff66cc;
                accentColor = 0xcc44ff;
                break;
            case 'splitter':
                size = 48;
                bodyColor = 0x0a2a0a;
                neonColor = 0x00ff44;
                eyeColor = 0x44ff88;
                accentColor = 0x88ff88;
                break;
            default: // common
                size = 44;
                bodyColor = 0x2a1a0a;
                neonColor = 0xff8800;
                eyeColor = 0xffaa44;
                accentColor = 0xffcc66;
        }

        const center = size / 2;

        // ===== 外部光晕效果 =====
        graphics.fillStyle(neonColor, 0.2);
        graphics.fillCircle(center, center, size / 2 + 8);
        graphics.fillStyle(accentColor, 0.1);
        graphics.fillCircle(center, center, size / 2 + 4);

        // ===== 根据类型绘制独特几何形状 =====
        
        if (type === 'common') {
            // ===== 普通敌人: 六边形无人机 =====
            // 主体 - 六边形
            graphics.fillStyle(bodyColor, 1);
            this.drawHexagon(graphics, center, center, 18);
            
            // 内部六边形
            graphics.fillStyle(0x3a2a1a, 1);
            this.drawHexagon(graphics, center, center, 12);
            
            // 核心 - 圆形能量核心
            graphics.fillStyle(accentColor, 1);
            graphics.fillCircle(center, center, 6);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center, center, 3);
            
            // 眼睛 - 两个小圆点
            graphics.fillStyle(eyeColor, 1);
            graphics.fillCircle(center - 6, center - 4, 3);
            graphics.fillCircle(center + 6, center - 4, 3);
            graphics.fillStyle(0xffffff, 0.8);
            graphics.fillCircle(center - 7, center - 5, 1);
            graphics.fillCircle(center + 5, center - 5, 1);
            
            // 六边形边缘发光
            graphics.lineStyle(2.5, neonColor, 0.9);
            this.drawHexagonOutline(graphics, center, center, 18);
            
            // 6条短腿 - 向外辐射
            graphics.fillStyle(0x3a2a1a, 1);
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                const legStart = 16;
                const legEnd = 22;
                const legX1 = center + Math.cos(angle) * legStart;
                const legY1 = center + Math.sin(angle) * legStart;
                const legX2 = center + Math.cos(angle) * legEnd;
                const legY2 = center + Math.sin(angle) * legEnd;
                graphics.lineStyle(2, 0x3a2a1a, 1);
                graphics.lineBetween(legX1, legY1, legX2, legY2);
                // 腿尖发光点
                graphics.fillStyle(accentColor, 0.8);
                graphics.fillCircle(legX2, legY2, 1.5);
            }
            
            // 顶部天线
            graphics.fillStyle(0x3a2a1a, 1);
            graphics.fillCircle(center, center - 20, 3);
            graphics.fillStyle(neonColor, 1);
            graphics.fillCircle(center, center - 20, 1.5);
        }
        
        else if (type === 'elite') {
            // ===== 精英敌人: 菱形装甲体 =====
            // 主体 - 大菱形
            graphics.fillStyle(bodyColor, 1);
            this.drawDiamond(graphics, center, center, 24, 28);
            
            // 内部菱形
            graphics.fillStyle(0x2a1a4a, 1);
            this.drawDiamond(graphics, center, center, 16, 20);
            
            // 核心 - 菱形能量晶体
            graphics.fillStyle(neonColor, 1);
            this.drawDiamond(graphics, center, center, 8, 10);
            graphics.fillStyle(0xcc88ff, 1);
            this.drawDiamond(graphics, center, center, 4, 5);
            
            // 眼睛 - 复眼式三角形
            graphics.fillStyle(eyeColor, 1);
            graphics.fillTriangle(center - 10, center - 8, center - 4, center - 14, center + 2, center - 8);
            graphics.fillTriangle(center + 10, center - 8, center + 4, center - 14, center - 2, center - 8);
            
            // 边缘发光
            graphics.lineStyle(3, neonColor, 0.9);
            this.drawDiamondOutline(graphics, center, center, 24, 28);
            
            // 4条强壮机械腿
            graphics.fillStyle(0x2a1a4a, 1);
            const legPositions = [
                { x: -18, y: 10, angle: -0.5 },
                { x: 18, y: 10, angle: 0.5 },
                { x: -14, y: -10, angle: -0.7 },
                { x: 14, y: -10, angle: 0.7 }
            ];
            for (const leg of legPositions) {
                const legEndX = leg.x + Math.cos(leg.angle) * 16;
                const legEndY = leg.y + Math.sin(leg.angle) * 16;
                graphics.lineStyle(3, 0x2a1a4a, 1);
                graphics.lineBetween(center + leg.x, center + leg.y, center + legEndX, center + legEndY);
                // 关节发光
                graphics.fillStyle(accentColor, 0.9);
                graphics.fillCircle(center + leg.x + Math.cos(leg.angle) * 8, center + leg.y + Math.sin(leg.angle) * 8, 2);
            }
            
            // 肩部装甲
            graphics.fillStyle(0x3a2a5a, 1);
            graphics.fillCircle(center - 22, center - 8, 8);
            graphics.fillCircle(center + 22, center - 8, 8);
            graphics.lineStyle(2, neonColor, 0.7);
            graphics.strokeCircle(center - 22, center - 8, 8);
            graphics.strokeCircle(center + 22, center - 8, 8);
        }
        
        else if (type === 'ranged') {
            // ===== 远程敌人: 圆形炮台无人机 =====
            // 主体 - 圆形
            graphics.fillStyle(bodyColor, 1);
            graphics.fillCircle(center, center, 20);
            
            // 内圈
            graphics.fillStyle(0x1a2a3a, 1);
            graphics.fillCircle(center, center, 14);
            
            // 炮管 - 矩形
            graphics.fillStyle(0x2a3a4a, 1);
            graphics.fillRoundedRect(center - 3, center + 12, 6, 14, 2);
            // 炮口发光
            graphics.fillStyle(neonColor, 1);
            graphics.fillCircle(center, center + 26, 2);
            
            // 主眼 - 大型传感器
            graphics.fillStyle(eyeColor, 0.4);
            graphics.fillCircle(center, center - 2, 10);
            graphics.fillStyle(eyeColor, 1);
            graphics.fillCircle(center, center - 2, 7);
            graphics.fillStyle(0x001122, 1);
            graphics.fillCircle(center, center - 2, 4);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center - 2, center - 3, 1.5);
            
            // 边缘发光
            graphics.lineStyle(2.5, neonColor, 0.9);
            graphics.strokeCircle(center, center, 20);
            
            // 悬浮推进器 - 3个小球
            graphics.fillStyle(accentColor, 0.7);
            graphics.fillCircle(center - 14, center + 8, 4);
            graphics.fillCircle(center + 14, center + 8, 4);
            graphics.fillCircle(center, center + 14, 3);
            
            // 能量脉冲动画点
            graphics.fillStyle(neonColor, 0.8);
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                graphics.fillCircle(
                    center + Math.cos(angle) * 16,
                    center + Math.sin(angle) * 16,
                    2
                );
            }
        }
        
        else if (type === 'summoner') {
            // ===== 召唤师: 五角星法阵形态 =====
            // 主体 - 五边形
            graphics.fillStyle(bodyColor, 1);
            this.drawPentagon(graphics, center, center, 20);
            
            // 内部五边形
            graphics.fillStyle(0x3a1a3a, 1);
            this.drawPentagon(graphics, center, center, 14);
            
            // 召唤符文 - 同心圆
            graphics.lineStyle(2, neonColor, 0.8);
            graphics.strokeCircle(center, center, 12);
            graphics.lineStyle(1.5, neonColor, 0.6);
            graphics.strokeCircle(center, center, 7);
            
            // 眼睛 - 全息投影式
            graphics.fillStyle(eyeColor, 0.6);
            graphics.fillCircle(center - 6, center - 6, 5);
            graphics.fillCircle(center + 6, center - 6, 5);
            graphics.fillStyle(eyeColor, 1);
            graphics.fillCircle(center - 6, center - 6, 3);
            graphics.fillCircle(center + 6, center - 6, 3);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center - 7, center - 7, 1);
            graphics.fillCircle(center + 5, center - 7, 1);
            
            // 能量核心 - 旋转三角形
            graphics.fillStyle(neonColor, 0.9);
            const triPoints = [];
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
                triPoints.push({
                    x: center + Math.cos(angle) * 6,
                    y: center + Math.sin(angle) * 6
                });
            }
            graphics.fillTriangle(triPoints[0].x, triPoints[0].y, triPoints[1].x, triPoints[1].y, triPoints[2].x, triPoints[2].y);
            
            // 边缘发光
            graphics.lineStyle(2.5, neonColor, 0.9);
            this.drawPentagonOutline(graphics, center, center, 20);
            
            // 召唤触手 - 4条向外延伸
            graphics.lineStyle(2, neonColor, 0.7);
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI * 2 * i) / 4;
                graphics.lineBetween(
                    center + Math.cos(angle) * 18,
                    center + Math.sin(angle) * 18,
                    center + Math.cos(angle) * 26,
                    center + Math.sin(angle) * 26
                );
            }
            
            // 悬浮符文
            graphics.fillStyle(accentColor, 0.8);
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const runeX = center + Math.cos(angle) * 24;
                const runeY = center + Math.sin(angle) * 24;
                graphics.fillCircle(runeX, runeY, 2);
            }
        }
        
        else if (type === 'splitter') {
            // ===== 分裂体: 不规则碎片形态 =====
            // 主体 - 不规则四边形（像破碎的晶体）
            graphics.fillStyle(bodyColor, 1);
            graphics.beginPath();
            graphics.moveTo(center, center - 14);
            graphics.lineTo(center + 12, center - 4);
            graphics.lineTo(center + 10, center + 10);
            graphics.lineTo(center - 6, center + 14);
            graphics.lineTo(center - 14, center + 2);
            graphics.closePath();
            graphics.fillPath();
            
            // 分裂线 - 内部裂纹
            graphics.lineStyle(1.5, eyeColor, 0.8);
            graphics.lineBetween(center, center - 14, center + 2, center + 2);
            graphics.lineBetween(center + 10, center + 10, center - 6, center + 14);
            graphics.lineBetween(center - 14, center + 2, center + 12, center - 4);
            
            // 核心 - 圆形
            graphics.fillStyle(neonColor, 0.9);
            graphics.fillCircle(center, center, 6);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center, center, 3);
            
            // 眼睛 - 小碎片状
            graphics.fillStyle(eyeColor, 1);
            graphics.fillCircle(center - 5, center - 4, 2);
            graphics.fillCircle(center + 4, center - 3, 2);
            
            // 边缘发光 - 不规则
            graphics.lineStyle(2, neonColor, 0.8);
            graphics.beginPath();
            graphics.moveTo(center, center - 14);
            graphics.lineTo(center + 12, center - 4);
            graphics.lineTo(center + 10, center + 10);
            graphics.lineTo(center - 6, center + 14);
            graphics.lineTo(center - 14, center + 2);
            graphics.closePath();
            graphics.strokePath();
            
            // 悬浮的小碎片
            graphics.fillStyle(accentColor, 0.7);
            const fragments = [
                { x: -18, y: -8 },
                { x: 16, y: -6 },
                { x: -12, y: 14 },
                { x: 14, y: 12 }
            ];
            for (const frag of fragments) {
                graphics.fillCircle(center + frag.x, center + frag.y, 2);
            }
        }
        
        else if (type === 'boss') {
            // ===== BOSS: 巨大八边形首领 =====
            // 主体 - 八边形
            graphics.fillStyle(bodyColor, 1);
            this.drawOctagon(graphics, center, center, 30);
            
            // 内部八边形
            graphics.fillStyle(0x4a1a2a, 1);
            this.drawOctagon(graphics, center, center, 22);
            
            // 能量核心 - 大型菱形
            graphics.fillStyle(neonColor, 1);
            this.drawDiamond(graphics, center, center, 12, 14);
            graphics.fillStyle(0xff88aa, 1);
            this.drawDiamond(graphics, center, center, 6, 8);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center, center, 3);
            
            // 眼睛 - 巨大的愤怒之眼
            graphics.fillStyle(eyeColor, 0.5);
            graphics.fillEllipse(center - 10, center - 10, 12, 8);
            graphics.fillEllipse(center + 10, center - 10, 12, 8);
            graphics.fillStyle(eyeColor, 1);
            graphics.fillEllipse(center - 10, center - 10, 8, 5);
            graphics.fillEllipse(center + 10, center - 10, 8, 5);
            graphics.fillStyle(0x000000, 1);
            graphics.fillEllipse(center - 10, center - 10, 4, 3);
            graphics.fillEllipse(center + 10, center - 10, 4, 3);
            
            // 边缘发光
            graphics.lineStyle(4, neonColor, 0.9);
            this.drawOctagonOutline(graphics, center, center, 30);
            
            // 肩部尖刺
            graphics.fillStyle(0x5a2a3a, 1);
            for (let side = -1; side <= 1; side += 2) {
                for (let i = -1; i <= 1; i++) {
                    const spikeX = center + side * 28 + i * 6;
                    const spikeY = center - 16 + i * 8;
                    graphics.fillTriangle(
                        spikeX + side * 8, spikeY,
                        spikeX, spikeY - 6,
                        spikeX, spikeY + 6
                    );
                }
            }
            
            // 能量管道
            graphics.lineStyle(3, neonColor, 0.7);
            graphics.lineBetween(center, center - 14, center, center + 10);
            graphics.lineBetween(center - 18, center, center - 26, center);
            graphics.lineBetween(center + 18, center, center + 26, center);
        }
        
        else if (type === 'boss_mech_beast') {
            // ===== 机械巨兽 BOSS: 巨大狮子形态 =====
            // 主体 - 巨大的方形身体
            graphics.fillStyle(bodyColor, 1);
            graphics.fillRoundedRect(center - 36, center - 32, 72, 64, 12);
            
            // 装甲板
            graphics.fillStyle(0x3a1010, 1);
            graphics.fillRoundedRect(center - 32, center - 28, 64, 24, 8);
            graphics.fillRoundedRect(center - 28, center + 4, 56, 24, 6);
            
            // 头部 - 宽大
            graphics.fillStyle(0x4a1515, 1);
            graphics.fillRoundedRect(center - 28, center - 40, 56, 24, 6);
            
            // 眼睛 - 燃烧的血红
            graphics.fillStyle(eyeColor, 0.6);
            graphics.fillCircle(center - 12, center - 28, 10);
            graphics.fillCircle(center + 12, center - 28, 10);
            graphics.fillStyle(eyeColor, 1);
            graphics.fillCircle(center - 12, center - 28, 7);
            graphics.fillCircle(center + 12, center - 28, 7);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center - 14, center - 30, 2);
            graphics.fillCircle(center + 10, center - 30, 2);
            
            // 鼻口部
            graphics.fillStyle(0x5a2020, 1);
            graphics.fillRoundedRect(center - 10, center - 18, 20, 10, 4);
            
            // 能量核心 - 胸部
            graphics.fillStyle(neonColor, 1);
            graphics.fillCircle(center, center + 2, 14);
            graphics.fillStyle(0xffaa66, 1);
            graphics.fillCircle(center, center + 2, 8);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center - 2, center, 3);
            
            // 边缘发光
            graphics.lineStyle(4, neonColor, 0.9);
            graphics.strokeRoundedRect(center - 36, center - 32, 72, 64, 12);
            
            // 腿部 - 4条巨腿
            graphics.fillStyle(0x3a1010, 1);
            const legPositions = [
                { x: -24, y: 28 },
                { x: 24, y: 28 },
                { x: -18, y: 28 },
                { x: 18, y: 28 }
            ];
            for (const leg of legPositions) {
                graphics.fillRoundedRect(center + leg.x - 6, center + leg.y, 12, 16, 4);
                // 脚爪
                graphics.fillStyle(accentColor, 0.8);
                graphics.fillCircle(center + leg.x - 4, center + leg.y + 14, 4);
                graphics.fillCircle(center + leg.x + 4, center + leg.y + 14, 4);
                graphics.fillStyle(0x3a1010, 1);
            }
            
            // 尾巴
            graphics.lineStyle(4, bodyColor, 1);
            graphics.lineBetween(center + 32, center + 10, center + 44, center - 10);
            graphics.fillStyle(neonColor, 0.8);
            graphics.fillCircle(center + 44, center - 10, 4);
        }
        
        else if (type === 'boss_data_ghost') {
            // ===== 数据幽灵 BOSS: 半透明幽灵形态 =====
            // 主体 - 椭圆形
            graphics.fillStyle(bodyColor, 0.7);
            graphics.fillEllipse(center, center, 60, 50);
            
            // 幽灵光环 - 多重同心圆
            graphics.lineStyle(3, neonColor, 0.4);
            graphics.strokeCircle(center, center, 38);
            graphics.lineStyle(2, neonColor, 0.3);
            graphics.strokeCircle(center, center, 30);
            
            // 眼睛 - 数据流
            graphics.fillStyle(eyeColor, 0.8);
            graphics.fillEllipse(center - 14, center - 8, 12, 6);
            graphics.fillEllipse(center + 14, center - 8, 12, 6);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillEllipse(center - 14, center - 8, 6, 3);
            graphics.fillEllipse(center + 14, center - 8, 6, 3);
            
            // 核心 - 脉动
            graphics.fillStyle(accentColor, 0.5);
            graphics.fillCircle(center, center + 10, 10);
            graphics.fillStyle(0xffffff, 0.7);
            graphics.fillCircle(center, center + 10, 5);
            
            // 边缘发光
            graphics.lineStyle(3, neonColor, 0.6);
            graphics.strokeEllipse(center, center, 60, 50);
            
            // 数据粒子环绕
            graphics.fillStyle(neonColor, 0.7);
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const particleX = center + Math.cos(angle) * 32;
                const particleY = center + Math.sin(angle) * 26;
                graphics.fillCircle(particleX, particleY, 3);
            }
            
            // 下方飘带
            graphics.fillStyle(bodyColor, 0.5);
            graphics.fillRoundedRect(center - 20, center + 20, 8, 24, 4);
            graphics.fillRoundedRect(center - 6, center + 22, 6, 28, 3);
            graphics.fillRoundedRect(center + 8, center + 20, 8, 24, 4);
            graphics.fillRoundedRect(center + 18, center + 22, 6, 20, 3);
        }
        
        else if (type === 'boss_bio_tyrant') {
            // ===== 生化暴君 BOSS: 巨大生物形态 =====
            // 主体 - 圆润的椭圆形
            graphics.fillStyle(bodyColor, 1);
            graphics.fillEllipse(center, center, 68, 58);
            
            // 生物甲壳
            graphics.fillStyle(0x1a3a1a, 1);
            graphics.fillEllipse(center, center - 4, 54, 42);
            
            // 头部 - 向前突出
            graphics.fillStyle(0x2a4a2a, 1);
            graphics.fillEllipse(center, center - 28, 40, 24);
            
            // 眼睛 - 毒液之眼
            graphics.fillStyle(eyeColor, 0.6);
            graphics.fillCircle(center - 12, center - 24, 12);
            graphics.fillCircle(center + 12, center - 24, 12);
            graphics.fillStyle(eyeColor, 1);
            graphics.fillCircle(center - 12, center - 24, 8);
            graphics.fillCircle(center + 12, center - 24, 8);
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(center - 12, center - 24, 4);
            graphics.fillCircle(center + 12, center - 24, 4);
            
            // 毒液核心
            graphics.fillStyle(neonColor, 0.9);
            graphics.fillCircle(center, center + 4, 16);
            graphics.fillStyle(0x88ff00, 1);
            graphics.fillCircle(center, center + 4, 10);
            graphics.fillStyle(0xffffff, 0.8);
            graphics.fillCircle(center - 3, center + 2, 4);
            
            // 边缘发光
            graphics.lineStyle(4, neonColor, 0.8);
            graphics.strokeEllipse(center, center, 68, 58);
            
            // 触手/管状物
            graphics.lineStyle(5, neonColor, 0.6);
            graphics.lineBetween(center - 26, center - 8, center - 38, center - 16);
            graphics.lineBetween(center + 26, center - 8, center + 38, center - 16);
            
            // 毒液滴
            graphics.fillStyle(neonColor, 0.8);
            graphics.fillCircle(center - 40, center - 14, 4);
            graphics.fillCircle(center + 40, center - 14, 4);
            
            // 底部触须
            graphics.fillStyle(0x2a4a2a, 1);
            for (let i = 0; i < 3; i++) {
                const side = i === 1 ? 0 : (i === 0 ? -1 : 1);
                const offsetX = side * 20;
                graphics.fillRoundedRect(center + offsetX - 4, center + 24, 8, 18 + i * 4, 4);
            }
        }

        // 生成纹理
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }
    
    // ===== 几何形状辅助方法 =====
    
    /** 绘制六边形 */
    private drawHexagon(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
        graphics.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.fillPath();
    }
    
    /** 绘制六边形轮廓 */
    private drawHexagonOutline(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
        graphics.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.strokePath();
    }
    
    /** 绘制菱形 */
    private drawDiamond(graphics: Phaser.GameObjects.Graphics, x: number, y: number, halfWidth: number, halfHeight: number): void {
        graphics.beginPath();
        graphics.moveTo(x, y - halfHeight);      // 上
        graphics.lineTo(x + halfWidth, y);       // 右
        graphics.lineTo(x, y + halfHeight);      // 下
        graphics.lineTo(x - halfWidth, y);       // 左
        graphics.closePath();
        graphics.fillPath();
    }
    
    /** 绘制菱形轮廓 */
    private drawDiamondOutline(graphics: Phaser.GameObjects.Graphics, x: number, y: number, halfWidth: number, halfHeight: number): void {
        graphics.beginPath();
        graphics.moveTo(x, y - halfHeight);
        graphics.lineTo(x + halfWidth, y);
        graphics.lineTo(x, y + halfHeight);
        graphics.lineTo(x - halfWidth, y);
        graphics.closePath();
        graphics.strokePath();
    }
    
    /** 绘制五边形 */
    private drawPentagon(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
        graphics.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.fillPath();
    }
    
    /** 绘制五边形轮廓 */
    private drawPentagonOutline(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
        graphics.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.strokePath();
    }
    
    /** 绘制八边形 */
    private drawOctagon(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
        graphics.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.fillPath();
    }
    
    /** 绘制八边形轮廓 */
    private drawOctagonOutline(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
        graphics.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.strokePath();
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
            { key: 'weapon_dagger', color: 0x44ff44, type: 'dagger' },
            // 职业专属武器
            { key: 'weapon_katana', color: 0xff4488, type: 'katana' },
            { key: 'weapon_dataglove', color: 0x44ffff, type: 'data_glove' },
            { key: 'weapon_biofist', color: 0x88ff44, type: 'bio_fist' },
            { key: 'weapon_dualdagger', color: 0xaa44ff, type: 'dual_dagger' }
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
        } else if (type === 'katana') {
            // 武士刀 - 弧形长刀
            graphics.lineStyle(3, color, 1);
            graphics.beginPath();
            graphics.moveTo(center - 8, 38);
            // 使用 lineTo 替代 quadraticCurveTo（Phaser Graphics 不直接支持贝塞尔曲线）
            graphics.lineTo(center - 4, 20);
            graphics.lineTo(center + 4, 14);
            graphics.lineTo(center + 8, 12);
            graphics.strokePath();
            // 刀刃光泽
            graphics.lineStyle(1.5, 0xffffff, 0.7);
            graphics.beginPath();
            graphics.moveTo(center - 4, 32);
            graphics.lineTo(center - 2, 20);
            graphics.lineTo(center + 2, 16);
            graphics.lineTo(center + 4, 16);
            graphics.strokePath();
            // 刀柄
            graphics.fillStyle(0x2a2a3a, 1);
            graphics.fillRect(center - 10, 34, 8, 6);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center - 6, 37, 2);
        } else if (type === 'data_glove') {
            // 数据手套 - 手掌形状
            graphics.fillStyle(color, 0.8);
            graphics.fillEllipse(center, center, 20, 16);
            // 数据流
            graphics.lineStyle(2, 0xffffff, 0.9);
            graphics.moveTo(center - 6, center - 4);
            graphics.lineTo(center + 6, center - 4);
            graphics.moveTo(center - 4, center + 2);
            graphics.lineTo(center + 4, center + 2);
            graphics.strokePath();
            // 数据粒子
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center - 8, center - 8, 2);
            graphics.fillCircle(center + 8, center - 8, 2);
            graphics.fillCircle(center, center + 8, 2);
        } else if (type === 'bio_fist') {
            // 生化拳套 - 拳头形状
            graphics.fillStyle(color, 0.9);
            graphics.fillRoundedRect(center - 12, center - 10, 24, 20, 4);
            // 生化纹路
            graphics.lineStyle(2, 0xffffff, 0.8);
            graphics.moveTo(center - 8, center - 4);
            graphics.lineTo(center + 8, center - 4);
            graphics.moveTo(center - 6, center + 2);
            graphics.lineTo(center + 6, center + 2);
            graphics.strokePath();
            // 能量核心
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center, 4);
        } else if (type === 'dual_dagger') {
            // 双匕首 - 两把交叉的匕首
            graphics.lineStyle(2.5, color, 1);
            // 左匕首
            graphics.moveTo(center - 10, 36);
            graphics.lineTo(center - 2, 12);
            // 右匕首
            graphics.moveTo(center + 10, 36);
            graphics.lineTo(center + 2, 12);
            graphics.strokePath();
            // 护手
            graphics.lineStyle(1.5, color, 1);
            graphics.moveTo(center - 12, 32);
            graphics.lineTo(center - 6, 32);
            graphics.moveTo(center + 6, 32);
            graphics.lineTo(center + 12, 32);
            graphics.strokePath();
            // 刀尖
            graphics.fillStyle(color, 0.9);
            graphics.fillCircle(center - 2, 12, 2);
            graphics.fillCircle(center + 2, 12, 2);
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
            // 霓虹斩击 - 全新设计，流畅的斩击轨迹
            const startAngle = -Math.PI * 0.6;
            const endAngle = Math.PI * 0.1;
            
            // 外层能量环 - 蓄力效果
            graphics.lineStyle(2, 0x00ffff, 0.25);
            graphics.beginPath();
            graphics.arc(center, center, 22, startAngle, endAngle, false);
            graphics.strokePath();
            
            // 主斩击轨迹 - 多层渐变效果
            // 第一层：青色
            graphics.lineStyle(5, 0x00ffff, 0.9);
            graphics.beginPath();
            graphics.arc(center, center, 16, startAngle, endAngle, false);
            graphics.strokePath();
            
            // 第二层：紫色渐变
            graphics.lineStyle(4, 0xff66ff, 0.85);
            graphics.beginPath();
            graphics.arc(center, center, 13, startAngle + 0.1, endAngle - 0.05, false);
            graphics.strokePath();
            
            // 第三层：白色核心
            graphics.lineStyle(3, 0xffffff, 1);
            graphics.beginPath();
            graphics.arc(center, center, 10, startAngle + 0.15, endAngle - 0.1, false);
            graphics.strokePath();
            
            // 轨迹末端的能量爆发点
            const endX = center + Math.cos(endAngle) * 16;
            const endY = center + Math.sin(endAngle) * 16;
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(endX, endY, 4);
            graphics.fillStyle(0xff66ff, 0.8);
            graphics.fillCircle(endX, endY, 2.5);
            
            // 起点能量聚集
            const startX = center + Math.cos(startAngle) * 16;
            const startY = center + Math.sin(startAngle) * 16;
            graphics.fillStyle(0x00ffff, 1);
            graphics.fillCircle(startX, startY, 3);
            
            // 中心能量核心 - 蓄力点
            graphics.fillStyle(0xffffff, 0.95);
            graphics.fillCircle(center, center, 5);
            graphics.fillStyle(0x00ffff, 1);
            graphics.fillCircle(center, center, 3);
            
            // 能量粒子轨迹
            graphics.fillStyle(0x00ffff, 0.8);
            graphics.fillCircle(center - 8, center - 8, 2.5);
            graphics.fillStyle(0xff66ff, 0.8);
            graphics.fillCircle(center + 2, center - 10, 2);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center + 10, center + 4, 2.5);
            
            // 轨迹拖尾线
            graphics.lineStyle(1.5, 0x00ffff, 0.5);
            graphics.moveTo(center, center);
            graphics.lineTo(startX, startY);
            graphics.moveTo(center, center);
            graphics.lineTo(endX, endY);
            graphics.strokePath();
            
            // 冲击波纹
            graphics.lineStyle(1.5, 0xff66ff, 0.4);
            graphics.beginPath();
            graphics.arc(center, center, 8, startAngle, endAngle, false);
            graphics.strokePath();
            
            // 能量涟漪
            graphics.lineStyle(1, 0xffffff, 0.3);
            graphics.strokeCircle(center, center, 6);
        } else if (name === '等离子漩涡') {
            // 等离子漩涡 - 增强版旋转能量
            // 外层能量环
            graphics.lineStyle(2, color, 0.5);
            graphics.strokeCircle(center, center, 20);
            
            // 主旋转环
            graphics.strokeCircle(center, center, 12);
            graphics.lineStyle(2, color, 0.7);
            graphics.strokeCircle(center, center, 7);
            
            // 核心能量
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 4);
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center, center, 2);
            
            // 旋转线条 - 更密集
            graphics.lineStyle(2.5, color, 0.9);
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6;
                graphics.moveTo(center + Math.cos(angle) * 5, center + Math.sin(angle) * 5);
                graphics.lineTo(center + Math.cos(angle) * 18, center + Math.sin(angle) * 18);
            }
            graphics.strokePath();
            
            // 内部能量粒子
            graphics.fillStyle(color, 0.8);
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
                graphics.fillCircle(
                    center + Math.cos(angle) * 10,
                    center + Math.sin(angle) * 10,
                    1.5
                );
            }
        } else if (name === '连锁闪电') {
            // 连锁闪电 - 增强版闪电链
            // 主闪电
            graphics.lineStyle(3.5, color, 1);
            graphics.moveTo(center - 14, center);
            graphics.lineTo(center - 5, center - 8);
            graphics.lineTo(center + 3, center + 5);
            graphics.lineTo(center + 14, center - 3);
            graphics.strokePath();
            
            // 外发光
            graphics.lineStyle(6, color, 0.3);
            graphics.moveTo(center - 14, center);
            graphics.lineTo(center - 5, center - 8);
            graphics.lineTo(center + 3, center + 5);
            graphics.lineTo(center + 14, center - 3);
            graphics.strokePath();
            
            // 分支闪电
            graphics.lineStyle(2, color, 0.7);
            graphics.moveTo(center - 5, center - 8);
            graphics.lineTo(center - 10, center - 14);
            graphics.moveTo(center + 3, center + 5);
            graphics.lineTo(center + 8, center + 12);
            graphics.strokePath();
            
            // 电击点
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center - 14, center, 3);
            graphics.fillCircle(center + 14, center - 3, 3);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center - 5, center - 8, 2);
            graphics.fillCircle(center + 3, center + 5, 2);
            
            // 电弧粒子
            graphics.fillStyle(color, 0.6);
            graphics.fillCircle(center - 8, center - 4, 1.5);
            graphics.fillCircle(center + 6, center + 1, 1.5);
            graphics.fillCircle(center + 10, center - 1, 1.5);
        } else if (name === '激光射线') {
            // 激光射线 - 增强版激光束
            // 外发光
            graphics.lineStyle(8, color, 0.3);
            graphics.moveTo(center - 16, center);
            graphics.lineTo(center + 16, center);
            graphics.strokePath();
            
            // 主激光
            graphics.lineStyle(4, color, 1);
            graphics.moveTo(center - 14, center);
            graphics.lineTo(center + 14, center);
            graphics.strokePath();
            
            // 核心光束
            graphics.lineStyle(2, 0xffffff, 0.9);
            graphics.moveTo(center - 12, center);
            graphics.lineTo(center + 12, center);
            graphics.strokePath();
            
            // 端点爆发
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center - 14, center, 5);
            graphics.fillCircle(center + 14, center, 5);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center - 14, center, 3);
            graphics.fillCircle(center + 14, center, 3);
            
            // 能量波动
            graphics.lineStyle(1.5, color, 0.5);
            graphics.strokeCircle(center - 8, center, 4);
            graphics.strokeCircle(center + 8, center, 4);
        } else if (name === '纳米护盾') {
            // 纳米护盾 - 增强版护盾形状
            // 外层能量环
            graphics.lineStyle(2, color, 0.4);
            graphics.strokeCircle(center, center, 22);
            
            // 护盾主体
            graphics.fillStyle(color, 0.85);
            graphics.beginPath();
            graphics.moveTo(center, center - 14);
            graphics.lineTo(center + 12, center - 7);
            graphics.lineTo(center + 12, center + 5);
            graphics.lineTo(center, center + 14);
            graphics.lineTo(center - 12, center + 5);
            graphics.lineTo(center - 12, center - 7);
            graphics.closePath();
            graphics.fillPath();
            
            // 护盾边框
            graphics.lineStyle(2.5, 0xffffff, 0.7);
            graphics.beginPath();
            graphics.moveTo(center, center - 14);
            graphics.lineTo(center + 12, center - 7);
            graphics.lineTo(center + 12, center + 5);
            graphics.lineTo(center, center + 14);
            graphics.lineTo(center - 12, center + 5);
            graphics.lineTo(center - 12, center - 7);
            graphics.closePath();
            graphics.strokePath();
            
            // 中心十字
            graphics.lineStyle(2.5, 0xffffff, 0.95);
            graphics.moveTo(center, center - 7);
            graphics.lineTo(center, center + 7);
            graphics.moveTo(center - 7, center);
            graphics.lineTo(center + 7, center);
            graphics.strokePath();
            
            // 能量点
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center - 14, 2);
            graphics.fillCircle(center + 12, center - 7, 2);
            graphics.fillCircle(center + 12, center + 5, 2);
            graphics.fillCircle(center, center + 14, 2);
            graphics.fillCircle(center - 12, center + 5, 2);
            graphics.fillCircle(center - 12, center - 7, 2);
        } else if (name === 'EMP冲击') {
            // EMP冲击 - 增强版冲击波纹
            // 外层波纹
            graphics.lineStyle(1.5, color, 0.3);
            graphics.strokeCircle(center, center, 22);
            
            // 冲击波纹
            graphics.lineStyle(3, color, 1);
            graphics.strokeCircle(center, center, 12);
            graphics.lineStyle(2.5, color, 0.75);
            graphics.strokeCircle(center, center, 16);
            graphics.lineStyle(2, color, 0.5);
            graphics.strokeCircle(center, center, 20);
            
            // 中心核心
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 5);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center, 3);
            
            // 电磁脉冲线
            graphics.lineStyle(2, color, 0.8);
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                graphics.moveTo(center + Math.cos(angle) * 6, center + Math.sin(angle) * 6);
                graphics.lineTo(center + Math.cos(angle) * 10, center + Math.sin(angle) * 10);
            }
            graphics.strokePath();
            
            // 电弧粒子
            graphics.fillStyle(color, 0.7);
            graphics.fillCircle(center + 14, center, 2);
            graphics.fillCircle(center - 14, center, 2);
            graphics.fillCircle(center, center + 14, 2);
            graphics.fillCircle(center, center - 14, 2);
        } else if (name === '超频驱动') {
            // 超频驱动 - 增强版速度箭头
            // 外层能量环
            graphics.lineStyle(1.5, color, 0.4);
            graphics.strokeCircle(center, center, 22);
            
            // 主箭头
            graphics.lineStyle(3.5, color, 1);
            graphics.moveTo(center - 12, center);
            graphics.lineTo(center + 12, center);
            graphics.lineTo(center + 5, center - 7);
            graphics.moveTo(center + 12, center);
            graphics.lineTo(center + 5, center + 7);
            graphics.strokePath();
            
            // 箭头发光
            graphics.lineStyle(6, color, 0.3);
            graphics.moveTo(center - 12, center);
            graphics.lineTo(center + 12, center);
            graphics.strokePath();
            
            // 速度线
            graphics.lineStyle(2.5, color, 0.6);
            graphics.moveTo(center - 10, center - 7);
            graphics.lineTo(center - 3, center - 7);
            graphics.moveTo(center - 10, center + 7);
            graphics.lineTo(center - 3, center + 7);
            graphics.strokePath();
            
            // 能量尾迹
            graphics.lineStyle(2, color, 0.5);
            graphics.moveTo(center - 14, center - 4);
            graphics.lineTo(center - 8, center - 4);
            graphics.moveTo(center - 14, center + 4);
            graphics.lineTo(center - 8, center + 4);
            graphics.strokePath();
            
            // 能量点
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center + 12, center, 3);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center - 8, center - 7, 2);
            graphics.fillCircle(center - 8, center + 7, 2);
        } else if (name === '全息幻影') {
            // 全息幻影 - 增强版全息效果
            // 主体幻影
            graphics.fillStyle(color, 0.7);
            graphics.fillCircle(center - 6, center, 10);
            
            // 次级幻影
            graphics.fillStyle(color, 0.4);
            graphics.fillCircle(center + 8, center, 7);
            
            // 外层全息环
            graphics.lineStyle(2, color, 0.5);
            graphics.strokeCircle(center - 6, center, 14);
            graphics.lineStyle(1.5, color, 0.3);
            graphics.strokeCircle(center + 8, center, 10);
            
            // 连接线
            graphics.lineStyle(2, color, 0.6);
            graphics.moveTo(center - 6, center);
            graphics.lineTo(center + 8, center);
            graphics.strokePath();
            
            // 全息扫描线
            graphics.lineStyle(1.5, color, 0.4);
            graphics.moveTo(center - 16, center - 5);
            graphics.lineTo(center + 14, center - 5);
            graphics.moveTo(center - 16, center + 5);
            graphics.lineTo(center + 14, center + 5);
            graphics.strokePath();
            
            // 核心能量点
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center - 6, center, 4);
            graphics.fillCircle(center + 8, center, 3);
            
            // 干扰粒子
            graphics.fillStyle(color, 0.6);
            graphics.fillCircle(center - 14, center - 8, 2);
            graphics.fillCircle(center + 14, center + 8, 2);
            graphics.fillCircle(center - 10, center + 10, 1.5);
            graphics.fillCircle(center + 12, center - 10, 1.5);
        } else if (name === '等离子球') {
            // 等离子球 - 增强版能量球体
            // 外层能量环
            graphics.lineStyle(2, color, 0.5);
            graphics.strokeCircle(center, center, 18);
            
            // 主能量球
            graphics.fillStyle(color, 0.9);
            graphics.fillCircle(center, center, 12);
            
            // 内层能量
            graphics.fillStyle(0xffffff, 0.7);
            graphics.fillCircle(center - 4, center - 4, 5);
            
            // 核心亮点
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center - 3, center - 3, 3);
            
            // 能量脉冲
            graphics.lineStyle(1.5, color, 0.6);
            graphics.strokeCircle(center, center, 15);
            
            // 能量粒子
            graphics.fillStyle(color, 0.7);
            graphics.fillCircle(center + 14, center, 2);
            graphics.fillCircle(center - 14, center, 2);
            graphics.fillCircle(center, center + 14, 2);
            graphics.fillCircle(center, center - 14, 2);
            
            // 能量尾迹
            graphics.lineStyle(1.5, color, 0.5);
            graphics.moveTo(center - 10, center - 10);
            graphics.lineTo(center - 16, center - 16);
            graphics.moveTo(center + 10, center + 10);
            graphics.lineTo(center + 16, center + 16);
            graphics.strokePath();
        } else if (name === '能量新星') {
            // 能量新星 - 增强版爆发光芒
            // 外层光环
            graphics.lineStyle(1.5, color, 0.4);
            graphics.strokeCircle(center, center, 22);
            
            // 爆发光芒
            graphics.lineStyle(3, color, 1);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                graphics.moveTo(center, center);
                graphics.lineTo(center + Math.cos(angle) * 16, center + Math.sin(angle) * 16);
            }
            graphics.strokePath();
            
            // 内层光芒
            graphics.lineStyle(2, color, 0.7);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
                graphics.moveTo(center, center);
                graphics.lineTo(center + Math.cos(angle) * 10, center + Math.sin(angle) * 10);
            }
            graphics.strokePath();
            
            // 核心能量
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 6);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center, 4);
            
            // 能量粒子
            graphics.fillStyle(color, 0.8);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                graphics.fillCircle(
                    center + Math.cos(angle) * 18,
                    center + Math.sin(angle) * 18,
                    2
                );
            }
        } else if (name === '音爆冲击') {
            // 音爆冲击 - 增强版冲击波
            // 外层波纹
            graphics.lineStyle(1.5, color, 0.4);
            graphics.strokeCircle(center, center, 22);
            
            // 冲击波
            graphics.lineStyle(3.5, color, 1);
            graphics.strokeCircle(center, center, 10);
            graphics.lineStyle(2.5, color, 0.75);
            graphics.strokeCircle(center, center, 14);
            graphics.lineStyle(1.5, color, 0.5);
            graphics.strokeCircle(center, center, 18);
            
            // 中心爆发
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 4);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center, 2.5);
            
            // 冲击粒子
            graphics.fillStyle(color, 0.8);
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                graphics.fillCircle(
                    center + Math.cos(angle) * 12,
                    center + Math.sin(angle) * 12,
                    2
                );
            }
        } else if (name === '烈焰波') {
            // 烈焰波 - 增强版火焰
            // 外层火焰
            graphics.fillStyle(color, 0.9);
            graphics.beginPath();
            graphics.moveTo(center, center - 14);
            graphics.lineTo(center + 10, center + 10);
            graphics.lineTo(center, center + 3);
            graphics.lineTo(center - 10, center + 10);
            graphics.closePath();
            graphics.fillPath();
            
            // 内焰
            graphics.fillStyle(0xffaa00, 0.9);
            graphics.beginPath();
            graphics.moveTo(center, center - 8);
            graphics.lineTo(center + 6, center + 5);
            graphics.lineTo(center - 6, center + 5);
            graphics.closePath();
            graphics.fillPath();
            
            // 核心火焰
            graphics.fillStyle(0xffff00, 0.95);
            graphics.beginPath();
            graphics.moveTo(center, center - 5);
            graphics.lineTo(center + 3, center + 2);
            graphics.lineTo(center - 3, center + 2);
            graphics.closePath();
            graphics.fillPath();
            
            // 火焰边框
            graphics.lineStyle(2, 0xffffff, 0.5);
            graphics.beginPath();
            graphics.moveTo(center, center - 14);
            graphics.lineTo(center + 10, center + 10);
            graphics.lineTo(center, center + 3);
            graphics.lineTo(center - 10, center + 10);
            graphics.closePath();
            graphics.strokePath();
            
            // 火焰粒子
            graphics.fillStyle(color, 0.7);
            graphics.fillCircle(center - 8, center - 6, 2);
            graphics.fillCircle(center + 8, center - 6, 2);
            graphics.fillStyle(0xffaa00, 0.8);
            graphics.fillCircle(center - 6, center + 8, 1.5);
            graphics.fillCircle(center + 6, center + 8, 1.5);
        } else if (name === '虚空裂缝') {
            // 虚空裂缝 - 增强版空间裂缝效果
            // 外层扭曲光环
            graphics.lineStyle(3, color, 0.6);
            graphics.strokeCircle(center, center, 20);
            graphics.lineStyle(2, color, 0.3);
            graphics.strokeCircle(center, center, 24);
            
            // 裂缝主体 - 扭曲的多边形
            graphics.fillStyle(color, 0.85);
            graphics.beginPath();
            const sides = 6;
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
                const radius = 10 + Math.sin(i * 2) * 3;
                const px = center + Math.cos(angle) * radius;
                const py = center + Math.sin(angle) * radius;
                if (i === 0) graphics.moveTo(px, py);
                else graphics.lineTo(px, py);
            }
            graphics.closePath();
            graphics.fillPath();
            
            // 裂缝边缘发光
            graphics.lineStyle(2, 0xffffff, 0.5);
            graphics.beginPath();
            for (let i = 0; i < sides; i++) {
                const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
                const radius = 10 + Math.sin(i * 2) * 3;
                const px = center + Math.cos(angle) * radius;
                const py = center + Math.sin(angle) * radius;
                if (i === 0) graphics.moveTo(px, py);
                else graphics.lineTo(px, py);
            }
            graphics.closePath();
            graphics.strokePath();
            
            // 内部能量漩涡
            graphics.lineStyle(1.5, 0xaa44ff, 0.8);
            graphics.strokeCircle(center, center, 5);
            graphics.strokeCircle(center, center, 3);
            
            // 核心能量点
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(center, center, 3);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 2);
            
            // 虚空粒子装饰
            graphics.fillStyle(color, 0.6);
            graphics.fillCircle(center - 15, center - 12, 2);
            graphics.fillCircle(center + 16, center + 10, 2);
            graphics.fillCircle(center - 12, center + 14, 1.5);
            graphics.fillCircle(center + 14, center - 14, 1.5);
            
            // 裂缝延伸线
            graphics.lineStyle(1.5, color, 0.7);
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
                graphics.moveTo(
                    center + Math.cos(angle) * 12,
                    center + Math.sin(angle) * 12
                );
                graphics.lineTo(
                    center + Math.cos(angle) * 20,
                    center + Math.sin(angle) * 20
                );
            }
            graphics.strokePath();
        } else if (name === '时间扭曲') {
            // 时间扭曲 - 增强版时钟
            // 外层时间环
            graphics.lineStyle(2, color, 0.5);
            graphics.strokeCircle(center, center, 22);
            
            // 时钟主体
            graphics.lineStyle(3, color, 1);
            graphics.strokeCircle(center, center, 14);
            
            // 时针
            graphics.lineStyle(3.5, color, 1);
            graphics.moveTo(center, center);
            graphics.lineTo(center + 7, center - 7);
            graphics.moveTo(center, center);
            graphics.lineTo(center - 5, center + 5);
            graphics.strokePath();
            
            // 时间刻度
            graphics.lineStyle(2, color, 0.8);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
                const innerR = 11;
                const outerR = 14;
                graphics.moveTo(
                    center + Math.cos(angle) * innerR,
                    center + Math.sin(angle) * innerR
                );
                graphics.lineTo(
                    center + Math.cos(angle) * outerR,
                    center + Math.sin(angle) * outerR
                );
            }
            graphics.strokePath();
            
            // 中心点
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 3);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center, 1.5);
            
            // 时间粒子
            graphics.fillStyle(color, 0.6);
            graphics.fillCircle(center + 12, center - 3, 2.5);
            graphics.fillCircle(center - 12, center + 3, 2.5);
            graphics.fillStyle(0xffffff, 0.5);
            graphics.fillCircle(center + 10, center + 8, 1.5);
            graphics.fillCircle(center - 10, center - 8, 1.5);
        } else if (name === '纳米虫群') {
            // 纳米虫群 - 增强版多个小点
            // 外层能量环
            graphics.lineStyle(1.5, color, 0.4);
            graphics.strokeCircle(center, center, 22);
            
            // 纳米虫群 - 更密集更明显
            graphics.fillStyle(color, 0.9);
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
                const dist = 6 + Math.random() * 12;
                const size = 1.5 + Math.random() * 1.5;
                graphics.fillCircle(
                    center + Math.cos(angle) * dist,
                    center + Math.sin(angle) * dist,
                    size
                );
            }
            
            // 核心虫群
            graphics.fillStyle(0xffffff, 0.8);
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                graphics.fillCircle(
                    center + Math.cos(angle) * 4,
                    center + Math.sin(angle) * 4,
                    1.5
                );
            }
            
            // 中心点
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 2);
            
            // 连接线
            graphics.lineStyle(1, color, 0.3);
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                graphics.moveTo(center, center);
                graphics.lineTo(
                    center + Math.cos(angle) * 10,
                    center + Math.sin(angle) * 10
                );
            }
            graphics.strokePath();
        } else if (name === '能量汲取') {
            // 能量汲取 - 增强版吸取符号
            // 外层能量环
            graphics.lineStyle(2, color, 0.4);
            graphics.strokeCircle(center, center, 22);
            
            // 主能量球
            graphics.fillStyle(color, 0.9);
            graphics.fillCircle(center, center, 12);
            
            // 内部漩涡
            graphics.lineStyle(2.5, 0xffffff, 0.9);
            graphics.beginPath();
            for (let i = 0; i < 3; i++) {
                const r = 3 + i * 3;
                graphics.arc(center, center, r, 0, Math.PI * 1.5);
            }
            graphics.strokePath();
            
            // 核心能量
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center, 4);
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 2);
            
            // 吸取箭头
            graphics.lineStyle(2, color, 0.8);
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
                graphics.moveTo(
                    center + Math.cos(angle) * 16,
                    center + Math.sin(angle) * 16
                );
                graphics.lineTo(
                    center + Math.cos(angle) * 20,
                    center + Math.sin(angle) * 20
                );
                graphics.lineTo(
                    center + Math.cos(angle - 0.3) * 17,
                    center + Math.sin(angle - 0.3) * 17
                );
                graphics.moveTo(
                    center + Math.cos(angle) * 20,
                    center + Math.sin(angle) * 20
                );
                graphics.lineTo(
                    center + Math.cos(angle + 0.3) * 17,
                    center + Math.sin(angle + 0.3) * 17
                );
            }
            graphics.strokePath();
            
            // 能量粒子
            graphics.fillStyle(color, 0.7);
            graphics.fillCircle(center + 16, center, 2);
            graphics.fillCircle(center - 16, center, 2);
            graphics.fillCircle(center, center + 16, 2);
            graphics.fillCircle(center, center - 16, 2);
        } else if (name === '冰霜碎片') {
            // 冰霜碎片 - 增强版冰晶
            // 外层冰霜环
            graphics.lineStyle(1.5, color, 0.4);
            graphics.strokeCircle(center, center, 22);
            
            // 冰晶主枝
            graphics.lineStyle(3, color, 1);
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                graphics.moveTo(center, center);
                graphics.lineTo(center + Math.cos(angle) * 14, center + Math.sin(angle) * 14);
            }
            graphics.strokePath();
            
            // 冰晶分支
            graphics.lineStyle(2, color, 0.7);
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const midX = center + Math.cos(angle) * 8;
                const midY = center + Math.sin(angle) * 8;
                graphics.moveTo(midX, midY);
                graphics.lineTo(midX + Math.cos(angle + 0.5) * 5, midY + Math.sin(angle + 0.5) * 5);
                graphics.moveTo(midX, midY);
                graphics.lineTo(midX + Math.cos(angle - 0.5) * 5, midY + Math.sin(angle - 0.5) * 5);
            }
            graphics.strokePath();
            
            // 中心核心
            graphics.fillStyle(color, 1);
            graphics.fillCircle(center, center, 5);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(center, center, 3);
            
            // 冰霜粒子
            graphics.fillStyle(color, 0.7);
            graphics.fillCircle(center + 16, center, 2);
            graphics.fillCircle(center - 16, center, 2);
            graphics.fillCircle(center, center + 16, 2);
            graphics.fillCircle(center, center - 16, 2);
            graphics.fillStyle(0xffffff, 0.6);
            graphics.fillCircle(center + 12, center + 12, 1.5);
            graphics.fillCircle(center - 12, center - 12, 1.5);
            graphics.fillCircle(center + 12, center - 12, 1.5);
            graphics.fillCircle(center - 12, center + 12, 1.5);
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
     * 创建时空碎片纹理
     */
    private createTimeFragmentTexture(): void {
        const graphics = this.add.graphics();
        const size = 32;
        const center = size / 2;

        // 外层光晕
        graphics.fillStyle(0x00ffff, 0.15);
        graphics.fillCircle(center, center, 14);

        // 内层光晕
        graphics.fillStyle(0x00ffff, 0.25);
        graphics.fillCircle(center, center, 10);

        // 核心 - 菱形晶体
        graphics.fillStyle(0x00ffff, 0.9);
        graphics.beginPath();
        graphics.moveTo(center, center - 8);
        graphics.lineTo(center + 6, center);
        graphics.lineTo(center, center + 8);
        graphics.lineTo(center - 6, center);
        graphics.closePath();
        graphics.fillPath();

        // 内部高光
        graphics.fillStyle(0xffffff, 0.8);
        graphics.beginPath();
        graphics.moveTo(center, center - 5);
        graphics.lineTo(center + 3, center);
        graphics.lineTo(center, center + 2);
        graphics.lineTo(center - 3, center);
        graphics.closePath();
        graphics.fillPath();

        // 边框
        graphics.lineStyle(2, 0x00ffff, 1);
        graphics.beginPath();
        graphics.moveTo(center, center - 8);
        graphics.lineTo(center + 6, center);
        graphics.lineTo(center, center + 8);
        graphics.lineTo(center - 6, center);
        graphics.closePath();
        graphics.strokePath();

        // 时针装饰（代表时间）
        graphics.lineStyle(1.5, 0xff00ff, 0.8);
        graphics.lineBetween(center, center, center + 4, center - 3);
        graphics.lineBetween(center, center, center + 2, center + 3);

        // 中心点
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(center, center, 1.5);

        // 周围粒子
        graphics.fillStyle(0x00ffff, 0.6);
        graphics.fillCircle(center - 10, center - 5, 1.5);
        graphics.fillCircle(center + 10, center + 5, 1.5);
        graphics.fillStyle(0xff00ff, 0.6);
        graphics.fillCircle(center + 8, center - 8, 1.5);
        graphics.fillCircle(center - 8, center + 8, 1.5);

        graphics.generateTexture('time_fragment', size, size);
        graphics.destroy();
    }

    /**
     * 创建全息幻影纹理
     */
    private createHologramTextures(): void {
        // 创建全息幻影主体纹理
        this.createHologramTexture('hologram_body', 0x00ffff);
        
        // 创建全息幻影光环纹理
        this.createHologramAuraTexture('hologram_aura', 0x00ffff);
    }

    /**
     * 创建全息幻影主体纹理
     */
    private createHologramTexture(key: string, color: number): void {
        const graphics = this.add.graphics();
        const size = 48;
        const center = size / 2;

        // 外发光
        graphics.fillStyle(color, 0.15);
        graphics.fillCircle(center, center, 20);

        // 主体轮廓 - 半透明人形
        graphics.fillStyle(color, 0.4);
        
        // 身体
        graphics.fillRoundedRect(center - 7, center - 4, 14, 18, 4);
        
        // 头部
        graphics.fillCircle(center, center - 11, 6);
        
        // 手臂
        graphics.fillStyle(color, 0.35);
        graphics.fillRoundedRect(center - 12, center - 2, 4, 10, 2);
        graphics.fillRoundedRect(center + 8, center - 2, 4, 10, 2);
        
        // 腿部
        graphics.fillRoundedRect(center - 5, center + 14, 4, 7, 2);
        graphics.fillRoundedRect(center + 1, center + 14, 4, 7, 2);

        // 霓虹能量线
        graphics.lineStyle(1.5, color, 0.9);
        graphics.lineBetween(center, center - 4, center, center + 10);
        
        // 能量节点
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(center, center + 3, 2);

        // 数据流效果 - 垂直线条
        graphics.lineStyle(1, color, 0.3);
        for (let i = 0; i < 3; i++) {
            const offsetX = (i - 1) * 8;
            graphics.lineBetween(center + offsetX, center - 18, center + offsetX, center + 22);
        }

        // 周围粒子
        graphics.fillStyle(color, 0.5);
        graphics.fillCircle(center - 15, center - 5, 2);
        graphics.fillCircle(center + 15, center - 3, 2);
        graphics.fillCircle(center - 12, center + 10, 1.5);
        graphics.fillCircle(center + 12, center + 8, 1.5);

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建全息幻影光环纹理
     */
    private createHologramAuraTexture(key: string, color: number): void {
        const graphics = this.add.graphics();
        const size = 96;
        const center = size / 2;

        // 外层光环
        graphics.lineStyle(2, color, 0.4);
        graphics.strokeCircle(center, center, 40);

        // 中层光环
        graphics.lineStyle(1.5, color, 0.5);
        graphics.strokeCircle(center, center, 32);

        // 内层光环
        graphics.lineStyle(1, color, 0.6);
        graphics.strokeCircle(center, center, 24);

        // 光环上的数据点
        graphics.fillStyle(color, 0.7);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = center + Math.cos(angle) * 36;
            const y = center + Math.sin(angle) * 36;
            graphics.fillCircle(x, y, 2);
        }

        // 放射线
        graphics.lineStyle(1, color, 0.3);
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const innerRadius = 24;
            const outerRadius = 44;
            graphics.lineBetween(
                center + Math.cos(angle) * innerRadius,
                center + Math.sin(angle) * innerRadius,
                center + Math.cos(angle) * outerRadius,
                center + Math.sin(angle) * outerRadius
            );
        }

        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    /**
     * 创建UI元素纹理
     */
    private createUITextures(): void {
        // 创建暂停按钮纹理
        this.createPauseButtonTexture();
    }

    /**
     * 创建暂停按钮纹理 - 赛博朋克风格图形化按钮
     */
    private createPauseButtonTexture(): void {
        const graphics = this.add.graphics();
        const size = 64;
        const center = size / 2;

        // 外层发光环
        graphics.fillStyle(0xffaa00, 0.15);
        graphics.fillCircle(center, center, 28);

        // 按钮背景
        graphics.fillStyle(0x0a0a1a, 0.95);
        graphics.fillCircle(center, center, 24);

        // 霓虹边框
        graphics.lineStyle(3, 0xffaa00, 1);
        graphics.strokeCircle(center, center, 24);

        // 内层装饰环
        graphics.lineStyle(1.5, 0xffaa00, 0.5);
        graphics.strokeCircle(center, center, 20);

        // 暂停图标 - 两条粗竖线（赛博朋克风格）
        const barWidth = 5;
        const barHeight = 18;
        const gap = 6;
        
        // 左竖条外发光
        graphics.fillStyle(0xffaa00, 0.4);
        graphics.fillRoundedRect(center - gap - barWidth - 2, center - barHeight / 2 - 2, barWidth + 4, barHeight + 4, 2);
        
        // 左竖条
        graphics.fillStyle(0xffaa00, 1);
        graphics.fillRoundedRect(center - gap - barWidth, center - barHeight / 2, barWidth, barHeight, 1);
        
        // 左竖条高光
        graphics.fillStyle(0xffffff, 0.7);
        graphics.fillRoundedRect(center - gap - barWidth + 1, center - barHeight / 2 + 1, 2, barHeight - 2, 0.5);

        // 右竖条外发光
        graphics.fillStyle(0xffaa00, 0.4);
        graphics.fillRoundedRect(center + gap - 2, center - barHeight / 2 - 2, barWidth + 4, barHeight + 4, 2);
        
        // 右竖条
        graphics.fillStyle(0xffaa00, 1);
        graphics.fillRoundedRect(center + gap, center - barHeight / 2, barWidth, barHeight, 1);
        
        // 右竖条高光
        graphics.fillStyle(0xffffff, 0.7);
        graphics.fillRoundedRect(center + gap + 1, center - barHeight / 2 + 1, 2, barHeight - 2, 0.5);

        // 装饰性电路线条
        graphics.lineStyle(1, 0xffaa00, 0.6);
        // 左上角电路
        graphics.moveTo(center - 20, center - 16);
        graphics.lineTo(center - 24, center - 20);
        // 右上角电路
        graphics.moveTo(center + 20, center - 16);
        graphics.lineTo(center + 24, center - 20);
        // 左下角电路
        graphics.moveTo(center - 20, center + 16);
        graphics.lineTo(center - 24, center + 20);
        // 右下角电路
        graphics.moveTo(center + 20, center + 16);
        graphics.lineTo(center + 24, center + 20);
        graphics.strokePath();

        // 角落能量点
        graphics.fillStyle(0xffaa00, 0.8);
        graphics.fillCircle(center - 24, center - 20, 2);
        graphics.fillCircle(center + 24, center - 20, 2);
        graphics.fillCircle(center - 24, center + 20, 2);
        graphics.fillCircle(center + 24, center + 20, 2);

        graphics.generateTexture('pause_button', size, size);
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
