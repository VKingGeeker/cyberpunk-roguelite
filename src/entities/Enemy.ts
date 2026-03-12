/**
 * 敌人实体类
 * 处理敌人的AI、移动、攻击、掉落
 */

import Phaser from 'phaser';
import { CombatStats, CombatState, EnemyType, EnemyRarity, ENEMY_RARITY_APPEARANCE, ENEMY_TYPE_APPEARANCE, ENEMY_LEVEL_INDICATOR } from '../core/Types';
import { getEnemyTemplate, calculateEnemyStats } from '../data/Enemies';
import { CombatSystem } from '../systems/CombatSystem';
import { GAME_CONFIG } from '../core/Config';

export default class Enemy extends Phaser.GameObjects.Sprite {
    public readonly id: string;  // 敌人唯一ID
    public readonly isEnemy: boolean = true;  // 类型标识，用于快速识别敌人
    private stats!: CombatStats;
    private combatState!: CombatState;
    private enemyType: EnemyType;
    private enemyRarity: EnemyRarity = EnemyRarity.COMMON;  // 敌人稀有度
    private enemyLevel: number = 1;  // 敌人等级
    private aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'retreat' | 'stunned' = 'idle';
    private target: Phaser.GameObjects.Sprite | null = null;
    private hologramTarget: Phaser.GameObjects.Container | null = null; // 全息幻影目标
    private chaseRange: number = 800; // 追踪范围
    private attackRange: number = 60; // 攻击范围
    private attackCooldown: number = 1000; // 攻击冷却（毫秒）
    private lastAttackTime: number = 0; // 上次攻击时间
    private patrolTarget: Phaser.Math.Vector2 | null = null; // 巡逻目标点
    private patrolWaitTime: number = 0; // 巡逻等待时间
    private retreatCooldown: number = 0; // 撤退冷却
    private predictionFactor: number = 0.3; // 预测因子（0-1）
    private separationDistance: number = 40; // 敌人间隔距离
    private attackWindupTime: number = 200; // 攻击前摇时间
    private isWindup: boolean = false; // 是否在攻击前摇中
    
    // 特殊敌人属性
    private preferredDistance: number = 0; // 远程敌人保持距离
    private summonCount: number = 0; // 召唤数量
    private summonType: EnemyType | null = null; // 召唤类型
    private splitCount: number = 0; // 分裂数量
    private splitType: EnemyType | null = null; // 分裂类型
    private lastSummonTime: number = 0; // 上次召唤时间
    private summonCooldown: number = 5000; // 召唤冷却（毫秒）
    private projectileSpeed: number = 400; // 弹幕速度
    private isBoss: boolean = false; // 是否为BOSS
    private bossAbilityCooldown: number = 0; // BOSS技能冷却
    
    // 外观系统
    private glowGraphics: Phaser.GameObjects.Graphics | null = null;  // 发光效果
    private auraGraphics: Phaser.GameObjects.Graphics | null = null;  // 光环效果
    private levelIndicator: Phaser.GameObjects.Text | null = null;    // 等级指示器
    private rarityAura: Phaser.GameObjects.Graphics | null = null;    // 稀有度光环
    private rarityAuraUpdateCallback: (() => void) | null = null;    // 稀有度光环更新回调
    private rarityAuraTween: Phaser.Tweens.Tween | null = null;      // 稀有度光环旋转动画
    private particleTimer: Phaser.Time.TimerEvent | null = null;      // 粒子特效计时器
    private levelIndicatorUpdateCallback: (() => void) | null = null; // 等级指示器更新回调

    constructor(scene: Phaser.Scene, x: number, y: number, enemyType: EnemyType, level: number = 1, rarity?: EnemyRarity) {
        // 使用临时占位图，实际开发中替换为资源图
        const textureKey = `enemy_${enemyType}_idle`;
        super(scene, x, y, textureKey);

        // 生成唯一ID
        this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 设置敌人类型
        this.enemyType = enemyType;
        
        // 设置敌人等级
        this.enemyLevel = level;
        
        // 设置敌人稀有度（如果没有指定，则根据类型自动确定）
        this.enemyRarity = rarity ?? this.determineRarity();

        // 初始化敌人属性
        this.initializeStats();

        // 添加刚体
        const body = this.getBody();
        if (body) {
            body.setCollideWorldBounds(false); // 允许敌人从边界外进入
            body.setSize(32, 32);
        }

        // 设置颜色区分不同类型敌人 - 使用新的外观系统
        this.setupEnemyAppearance();

        // 默认进入追踪状态
        this.aiState = 'chase';

        // 监听全息幻影事件
        scene.events.on('hologram-created', this.onHologramCreated, this);
        scene.events.on('hologram-destroyed', this.onHologramDestroyed, this);
    }
    
    /**
     * 根据敌人类型确定稀有度
     */
    private determineRarity(): EnemyRarity {
        // BOSS类型固定为传说
        if (this.isBossType(this.enemyType)) {
            return EnemyRarity.LEGENDARY;
        }
        
        // 根据敌人类型确定基础稀有度
        switch (this.enemyType) {
            case EnemyType.ELITE:
                return EnemyRarity.ELITE;
            case EnemyType.SUMMONER:
            case EnemyType.RANGED:
            case EnemyType.SPLITTER:
                // 特殊敌人有概率提升稀有度
                const rand = Math.random();
                if (rand < 0.1) return EnemyRarity.RARE;
                if (rand < 0.3) return EnemyRarity.ELITE;
                return EnemyRarity.COMMON;
            default:
                // 普通敌人小概率提升稀有度
                if (Math.random() < 0.05) return EnemyRarity.ELITE;
                return EnemyRarity.COMMON;
        }
    }

    /**
     * 初始化敌人属性
     */
    private initializeStats(): void {
        const template = getEnemyTemplate(this.enemyType);
        if (!template) {
            console.error(`Enemy template not found for type: ${this.enemyType}`);
            return;
        }

        // 使用等级计算属性
        const stats = calculateEnemyStats(template, this.enemyLevel);

        // 根据稀有度增加属性
        const rarityMultiplier = this.getRarityMultiplier();

        this.stats = {
            hp: Math.floor(stats.hp * rarityMultiplier),
            maxHp: Math.floor(stats.hp * rarityMultiplier),
            attack: Math.floor(stats.attack * rarityMultiplier),
            defense: Math.floor(stats.defense * rarityMultiplier),
            attackSpeed: stats.attackSpeed,
            critRate: stats.critRate + this.getRarityCritBonus(),
            critDamage: stats.critDamage,
            moveSpeed: stats.moveSpeed
        };

        this.combatState = {
            isAttacking: false,
            isStunned: false,
            lastAttackTime: 0,
            comboCount: 0,
            lastComboTime: 0
        };
        
        // 加载特殊属性
        if (template.attackRange) {
            this.attackRange = template.attackRange;
        }
        if (template.preferredDistance) {
            this.preferredDistance = template.preferredDistance;
        }
        if (template.summonCount) {
            this.summonCount = template.summonCount;
        }
        if (template.summonType) {
            this.summonType = template.summonType;
        }
        if (template.splitCount) {
            this.splitCount = template.splitCount;
        }
        if (template.splitType) {
            this.splitType = template.splitType;
        }
        
        // 判断是否为BOSS
        this.isBoss = this.isBossType(this.enemyType);
    }
    
    /**
     * 获取稀有度属性倍率
     */
    private getRarityMultiplier(): number {
        switch (this.enemyRarity) {
            case EnemyRarity.COMMON: return 1.0;
            case EnemyRarity.ELITE: return 1.5;
            case EnemyRarity.RARE: return 2.0;
            case EnemyRarity.LEGENDARY: return 3.0;
            default: return 1.0;
        }
    }
    
    /**
     * 获取稀有度暴击率加成
     */
    private getRarityCritBonus(): number {
        switch (this.enemyRarity) {
            case EnemyRarity.COMMON: return 0;
            case EnemyRarity.ELITE: return 0.05;
            case EnemyRarity.RARE: return 0.1;
            case EnemyRarity.LEGENDARY: return 0.2;
            default: return 0;
        }
    }
    
    /**
     * 判断是否为BOSS类型
     */
    private isBossType(type: EnemyType): boolean {
        return type === EnemyType.BOSS || 
               type === EnemyType.BOSS_MECH_BEAST ||
               type === EnemyType.BOSS_DATA_GHOST ||
               type === EnemyType.BOSS_BIO_TYRANT;
    }

    private getBody(): Phaser.Physics.Arcade.Body | null {
        return this.body as Phaser.Physics.Arcade.Body;
    }

    /**
     * 设置敌人外观 - 赛博朋克风格多样化系统
     */
    private setupEnemyAppearance(): void {
        // 清理旧的外观效果
        this.cleanupAppearance();
        
        // 获取类型外观配置
        const typeConfig = ENEMY_TYPE_APPEARANCE[this.enemyType];
        if (!typeConfig) {
            console.warn(`No appearance config for enemy type: ${this.enemyType}`);
            return;
        }
        
        // 获取稀有度外观配置
        const rarityConfig = ENEMY_RARITY_APPEARANCE[this.enemyRarity];
        
        // 计算等级缩放
        const levelScaleBonus = (this.enemyLevel - 1) * ENEMY_LEVEL_INDICATOR.scalePerLevel;
        const finalScale = typeConfig.scale * (1 + levelScaleBonus);
        
        // 应用基础缩放和透明度
        this.setScale(finalScale);
        this.setAlpha(typeConfig.alpha);
        
        // 混合类型颜色和稀有度颜色
        const blendedColor = this.blendColors(typeConfig.glowColor, rarityConfig.color, 0.7);
        
        // 创建发光效果
        this.createNeonGlow(blendedColor, rarityConfig.glowIntensity);
        
        // 创建稀有度光环（精英及以上）
        if (this.enemyRarity !== EnemyRarity.COMMON) {
            this.createRarityAura(rarityConfig.color);
        }
        
        // 创建类型特效光环
        if (typeConfig.hasAura && typeConfig.auraColor) {
            this.createTypeAura(typeConfig.auraColor);
        }
        
        // 创建等级指示器
        this.createLevelIndicator();
        
        // 创建粒子特效
        if (typeConfig.particleEffect) {
            this.createParticleEffect(typeConfig.particleEffect, blendedColor);
        }
    }
    
    /**
     * 混合两个颜色
     */
    private blendColors(color1: number, color2: number, ratio: number): number {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;
        
        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;
        
        const r = Math.round(r1 * ratio + r2 * (1 - ratio));
        const g = Math.round(g1 * ratio + g2 * (1 - ratio));
        const b = Math.round(b1 * ratio + b2 * (1 - ratio));
        
        return (r << 16) | (g << 8) | b;
    }
    
    /**
     * 清理外观效果
     */
    private cleanupAppearance(): void {
        if (this.glowGraphics) {
            // 停止发光效果的tween动画
            this.scene?.tweens.killTweensOf(this.glowGraphics);
            this.glowGraphics.destroy();
            this.glowGraphics = null;
        }
        if (this.auraGraphics) {
            // 停止类型光环的tween动画
            this.scene?.tweens.killTweensOf(this.auraGraphics);
            this.auraGraphics.destroy();
            this.auraGraphics = null;
        }
        if (this.levelIndicator) {
            // 移除等级指示器的update事件监听器
            if (this.levelIndicatorUpdateCallback && this.scene) {
                this.scene.events.off('update', this.levelIndicatorUpdateCallback);
                this.levelIndicatorUpdateCallback = null;
            }
            this.levelIndicator.destroy();
            this.levelIndicator = null;
        }
        if (this.rarityAura) {
            // 移除更新事件监听器
            if (this.rarityAuraUpdateCallback && this.scene) {
                this.scene.events.off('update', this.rarityAuraUpdateCallback);
                this.rarityAuraUpdateCallback = null;
            }
            // 停止稀有度光环的tween动画
            if (this.rarityAuraTween && this.rarityAuraTween.isPlaying()) {
                this.rarityAuraTween.stop();
                this.rarityAuraTween = null;
            }
            this.scene?.tweens.killTweensOf(this.rarityAura);
            this.rarityAura.destroy();
            this.rarityAura = null;
        }
        if (this.particleTimer) {
            this.particleTimer.destroy();
            this.particleTimer = null;
        }
    }

    /**
     * 创建霓虹发光效果 - 增强版
     */
    private createNeonGlow(color: number, intensity: number): void {
        // 发光效果
        this.glowGraphics = this.scene.add.graphics();
        
        // 外层光晕
        this.glowGraphics.fillStyle(color, intensity * 0.3);
        this.glowGraphics.fillCircle(0, 0, 35);
        
        // 内层光晕
        this.glowGraphics.fillStyle(color, intensity * 0.5);
        this.glowGraphics.fillCircle(0, 0, 25);
        
        // 核心光点
        this.glowGraphics.fillStyle(0xffffff, intensity * 0.8);
        this.glowGraphics.fillCircle(0, 0, 8);
        
        this.glowGraphics.x = this.x;
        this.glowGraphics.y = this.y;
        this.glowGraphics.setDepth(this.depth - 1);
        this.setData('glow', this.glowGraphics);

        // 发光脉冲动画
        this.scene.tweens.add({
            targets: this.glowGraphics,
            alpha: { from: intensity * 0.8, to: intensity * 1.2 },
            scaleX: { from: 1, to: 1.1 },
            scaleY: { from: 1, to: 1.1 },
            duration: 800 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    /**
     * 创建稀有度光环
     */
    private createRarityAura(color: number): void {
        this.rarityAura = this.scene.add.graphics();
        
        // 绘制旋转光环
        const drawAura = () => {
            if (!this.rarityAura || !this.active) return;
            
            this.rarityAura.clear();
            
            // 外圈
            this.rarityAura.lineStyle(2, color, 0.6);
            this.rarityAura.strokeCircle(0, 0, 40);
            
            // 内圈
            this.rarityAura.lineStyle(1, color, 0.4);
            this.rarityAura.strokeCircle(0, 0, 30);
            
            // 角落装饰
            const corners = 4;
            for (let i = 0; i < corners; i++) {
                const angle = (Math.PI * 2 * i / corners) + (Date.now() / 1000);
                const x = Math.cos(angle) * 35;
                const y = Math.sin(angle) * 35;
                this.rarityAura.fillStyle(color, 0.8);
                this.rarityAura.fillCircle(x, y, 3);
            }
            
            this.rarityAura.x = this.x;
            this.rarityAura.y = this.y;
            this.rarityAura.setDepth(this.depth - 2);
        };
        
        // 保存回调引用
        this.rarityAuraUpdateCallback = drawAura;
        
        // 持续更新光环位置
        this.scene.events.on('update', drawAura);
        
        // 旋转动画
        this.rarityAuraTween = this.scene.tweens.add({
            targets: this.rarityAura,
            angle: 360,
            duration: 3000,
            repeat: -1
        });
    }
    
    /**
     * 创建类型特效光环
     */
    private createTypeAura(color: number): void {
        this.auraGraphics = this.scene.add.graphics();
        
        // 绘制地面光环
        this.auraGraphics.fillStyle(color, 0.15);
        this.auraGraphics.fillCircle(0, 0, 50);
        
        this.auraGraphics.lineStyle(1, color, 0.3);
        this.auraGraphics.strokeCircle(0, 0, 50);
        
        this.auraGraphics.x = this.x;
        this.auraGraphics.y = this.y;
        this.auraGraphics.setDepth(this.depth - 3);
        
        // 光环呼吸动画
        this.scene.tweens.add({
            targets: this.auraGraphics,
            scaleX: { from: 1, to: 1.2 },
            scaleY: { from: 1, to: 1.2 },
            alpha: { from: 0.5, to: 0.8 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    /**
     * 创建等级指示器
     */
    private createLevelIndicator(): void {
        // 只有等级超过阈值才显示
        if (this.enemyLevel < ENEMY_LEVEL_INDICATOR.showLevelThreshold) {
            return;
        }
        
        // 获取等级对应的颜色
        let badgeColor = 0x808080;
        const levelColors = ENEMY_LEVEL_INDICATOR.levelBadgeColors;
        const levels = Object.keys(levelColors).map(Number).sort((a, b) => b - a);
        
        for (const level of levels) {
            if (this.enemyLevel >= level) {
                badgeColor = levelColors[level as keyof typeof levelColors];
                break;
            }
        }
        
        // 创建等级文本
        this.levelIndicator = this.scene.add.text(0, -40, `Lv.${this.enemyLevel}`, {
            fontSize: '12px',
            fontStyle: 'bold',
            color: `#${badgeColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.levelIndicator.setOrigin(0.5);
        this.levelIndicator.setDepth(this.depth + 1);
        
        // 更新位置
        this.levelIndicatorUpdateCallback = () => {
            if (this.levelIndicator && this.active) {
                this.levelIndicator.setPosition(this.x, this.y - 40 * this.scaleY);
            }
        };
        this.scene.events.on('update', this.levelIndicatorUpdateCallback);
    }
    
    /**
     * 创建粒子特效
     */
    private createParticleEffect(effectType: string, color: number): void {
        this.particleTimer = this.scene.time.addEvent({
            delay: 200,
            callback: () => {
                if (!this.active) return;
                
                switch (effectType) {
                    case 'electric':
                        this.createElectricParticle(color);
                        break;
                    case 'summon':
                        this.createSummonParticle(color);
                        break;
                    case 'split':
                        this.createSplitParticle(color);
                        break;
                    case 'boss':
                        this.createBossParticle(color);
                        break;
                    case 'mech':
                        this.createMechParticle(color);
                        break;
                    case 'ghost':
                        this.createGhostParticle(color);
                        break;
                    case 'bio':
                        this.createBioParticle(color);
                        break;
                }
            },
            loop: true
        });
    }
    
    /**
     * 电流粒子特效
     */
    private createElectricParticle(color: number): void {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 15;
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        const particle = this.scene.add.circle(x, y, 2, color, 1);
        particle.setDepth(this.depth + 2);
        
        this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => {
                if (particle && particle.active) {
                    particle.destroy();
                }
            }
        });
    }
    
    /**
     * 召唤粒子特效
     */
    private createSummonParticle(color: number): void {
        const particle = this.scene.add.circle(this.x, this.y, 3, color, 0.8);
        particle.setDepth(this.depth + 2);
        
        this.scene.tweens.add({
            targets: particle,
            y: this.y - 30,
            alpha: 0,
            scale: 0.5,
            duration: 500,
            onComplete: () => {
                if (particle && particle.active) {
                    particle.destroy();
                }
            }
        });
    }
    
    /**
     * 分裂粒子特效
     */
    private createSplitParticle(color: number): void {
        const count = 2;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = this.scene.add.circle(this.x, this.y, 2, color, 0.6);
            particle.setDepth(this.depth + 2);
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 30,
                y: this.y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    if (particle && particle.active) {
                        particle.destroy();
                    }
                }
            });
        }
    }
    
    /**
     * BOSS粒子特效
     */
    private createBossParticle(color: number): void {
        const angle = Math.random() * Math.PI * 2;
        const particle = this.scene.add.circle(
            this.x + Math.cos(angle) * 40,
            this.y + Math.sin(angle) * 40,
            3, color, 0.7
        );
        particle.setDepth(this.depth + 2);
        
        this.scene.tweens.add({
            targets: particle,
            x: this.x,
            y: this.y,
            alpha: 0,
            scale: 2,
            duration: 600,
            onComplete: () => {
                if (particle && particle.active) {
                    particle.destroy();
                }
            }
        });
    }
    
    /**
     * 机械粒子特效
     */
    private createMechParticle(color: number): void {
        // 火花效果
        const spark = this.scene.add.rectangle(
            this.x + Phaser.Math.Between(-20, 20),
            this.y + Phaser.Math.Between(-20, 20),
            4, 4, color, 1
        );
        spark.setDepth(this.depth + 2);
        
        this.scene.tweens.add({
            targets: spark,
            y: spark.y - 20,
            alpha: 0,
            angle: 90,
            duration: 200,
            onComplete: () => {
                if (spark && spark.active) {
                    spark.destroy();
                }
            }
        });
    }
    
    /**
     * 幽灵粒子特效
     */
    private createGhostParticle(color: number): void {
        const particle = this.scene.add.circle(
            this.x + Phaser.Math.Between(-15, 15),
            this.y + Phaser.Math.Between(-15, 15),
            4, color, 0.3
        );
        particle.setDepth(this.depth + 2);
        
        this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 2,
            duration: 800,
            onComplete: () => {
                if (particle && particle.active) {
                    particle.destroy();
                }
            }
        });
    }
    
    /**
     * 生化粒子特效
     */
    private createBioParticle(color: number): void {
        const bubble = this.scene.add.circle(
            this.x + Phaser.Math.Between(-25, 25),
            this.y + Phaser.Math.Between(-25, 25),
            3, color, 0.5
        );
        bubble.setDepth(this.depth + 2);
        
        this.scene.tweens.add({
            targets: bubble,
            y: bubble.y - 40,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: () => {
                if (bubble && bubble.active) {
                    bubble.destroy();
                }
            }
        });
    }

    /**
     * 设置追踪目标
     */
    public setTarget(target: Phaser.GameObjects.Sprite): void {
        this.target = target;
        this.aiState = 'chase';
    }

    /**
     * 更新敌人状态
     */
    update(time: number, delta: number): void {
        if (this.combatState.isStunned || !this.stats) return;

        // 检查是否在世界范围内，如果太远则销毁
        this.checkBounds();

        // 更新AI
        this.updateAI(time, delta);
        
        // 更新外观元素位置
        this.updateAppearancePosition();
    }
    
    /**
     * 更新外观元素位置
     */
    private updateAppearancePosition(): void {
        // 更新发光效果位置
        if (this.glowGraphics) {
            this.glowGraphics.x = this.x;
            this.glowGraphics.y = this.y;
        }
        
        // 更新光环位置
        if (this.auraGraphics) {
            this.auraGraphics.x = this.x;
            this.auraGraphics.y = this.y;
        }
        
        // 稀有度光环在 createRarityAura 中已经通过事件更新
    }

    /**
     * 检查是否超出世界边界太远
     */
    private checkBounds(): void {
        const margin = 200;
        if (this.x < -margin || this.x > GAME_CONFIG.worldWidth + margin ||
            this.y < -margin || this.y > GAME_CONFIG.worldHeight + margin) {
            // 敌人超出边界太远，触发回收事件
            if (this.scene) {
                this.scene.events.emit('enemyOutOfBounds', this);
            }
        }
    }

    /**
     * 更新AI行为
     */
    private updateAI(time: number, delta: number): void {
        // 更新冷却
        if (this.retreatCooldown > 0) {
            this.retreatCooldown -= delta;
        }
        if (this.bossAbilityCooldown > 0) {
            this.bossAbilityCooldown -= delta;
        }

        // 特殊敌人行为处理
        if (this.enemyType === EnemyType.RANGED) {
            this.updateRangedAI(time, delta);
            return;
        }
        
        if (this.enemyType === EnemyType.SUMMONER) {
            this.updateSummonerAI(time, delta);
            return;
        }

        switch (this.aiState) {
            case 'idle':
                this.idle(time, delta);
                break;
            case 'patrol':
                this.patrol(time, delta);
                break;
            case 'chase':
                this.chase(time, delta);
                break;
            case 'attack':
                this.attack(time, delta);
                break;
            case 'retreat':
                this.retreat(delta);
                break;
            case 'stunned':
                const stunnedBody = this.getBody();
                if (stunnedBody) stunnedBody.setVelocity(0, 0);
                break;
        }
        
        // BOSS特殊技能
        if (this.isBoss && this.bossAbilityCooldown <= 0) {
            this.useBossAbility(time);
        }
    }

    /**
     * 空闲状态
     */
    private idle(time: number, delta: number): void {
        const body = this.getBody();
        if (body) body.setVelocity(0, 0);

        if (this.target) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );
            
            if (distance < this.chaseRange) {
                this.aiState = 'chase';
                return;
            }
        }

        this.patrolWaitTime -= delta;
        if (this.patrolWaitTime <= 0) {
            this.aiState = 'patrol';
            this.patrolTarget = new Phaser.Math.Vector2(
                this.x + Phaser.Math.Between(-200, 200),
                this.y + Phaser.Math.Between(-200, 200)
            );
            this.patrolTarget.x = Phaser.Math.Clamp(this.patrolTarget.x, 100, GAME_CONFIG.worldWidth - 100);
            this.patrolTarget.y = Phaser.Math.Clamp(this.patrolTarget.y, 100, GAME_CONFIG.worldHeight - 100);
        }
    }

    /**
     * 巡逻行为
     */
    private patrol(time: number, delta: number): void {
        // 如果有目标，检查是否需要追踪
        if (this.target) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );
            
            if (distance < this.chaseRange) {
                this.aiState = 'chase';
                return;
            }
        }

        // 向巡逻点移动
        if (this.patrolTarget) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.patrolTarget.x, this.patrolTarget.y
            );

            if (distance < 20) {
                // 到达巡逻点，返回空闲状态
                this.aiState = 'idle';
                this.patrolWaitTime = Phaser.Math.Between(2000, 5000);
                this.patrolTarget = null;
                return;
            }

            // 移动向巡逻点
            const direction = new Phaser.Math.Vector2(
                this.patrolTarget.x - this.x,
                this.patrolTarget.y - this.y
            );
            direction.normalize();

            const patrolBody = this.getBody();
            if (patrolBody) {
                patrolBody.setVelocity(
                    direction.x * this.stats.moveSpeed * 0.5,
                    direction.y * this.stats.moveSpeed * 0.5
                );
            }
        } else {
            this.aiState = 'idle';
        }
    }

    /**
     * 追击行为 - 增强版
     */
    private chase(time: number, delta: number): void {
        if (this.hologramTarget && this.isHologramValid()) {
            this.chaseHologram(time, delta);
            return;
        }

        if (!this.target) {
            this.aiState = 'idle';
            return;
        }

        const body = this.getBody();
        if (!body) {
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        if (distance < this.attackRange) {
            this.aiState = 'attack';
            return;
        }

        let targetX = this.target.x;
        let targetY = this.target.y;

        if ((this.target as any).body) {
            const targetBody = (this.target as any).body as Phaser.Physics.Arcade.Body;
            targetX += targetBody.velocity.x * this.predictionFactor;
            targetY += targetBody.velocity.y * this.predictionFactor;
        }

        const direction = new Phaser.Math.Vector2(
            targetX - this.x,
            targetY - this.y
        );
        direction.normalize();

        const separation = this.calculateSeparation();
        direction.add(separation);
        direction.normalize();

        body.setVelocity(
            direction.x * this.stats.moveSpeed,
            direction.y * this.stats.moveSpeed
        );

        if (direction.x < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }

        if (distance > this.chaseRange * 1.5 && !this.isTargetInSight()) {
            this.aiState = 'idle';
            this.patrolWaitTime = 3000;
        }
    }

    /**
     * 追击全息幻影
     */
    private chaseHologram(time: number, delta: number): void {
        if (!this.hologramTarget) {
            this.hologramTarget = null;
            return;
        }

        const hologram = this.hologramTarget as any;
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            hologram.x, hologram.y
        );

        // 检查攻击范围
        if (distance < this.attackRange) {
            this.aiState = 'attack';
            return;
        }

        // 计算移动方向
        const direction = new Phaser.Math.Vector2(
            hologram.x - this.x,
            hologram.y - this.y
        );
        direction.normalize();

        const separation = this.calculateSeparation();
        direction.add(separation);
        direction.normalize();

        const holoBody = this.getBody();
        if (holoBody) {
            holoBody.setVelocity(
                direction.x * this.stats.moveSpeed,
                direction.y * this.stats.moveSpeed
            );
        }

        if (direction.x < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }
    }

    /**
     * 检查全息幻影是否有效
     */
    private isHologramValid(): boolean {
        if (!this.hologramTarget) return false;
        
        const hologram = this.hologramTarget as any;
        
        // 检查幻影是否激活
        if (hologram.getIsActive && !hologram.getIsActive()) {
            return false;
        }
        
        // 检查距离是否在仇恨范围内
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            hologram.x, hologram.y
        );
        
        const tauntRange = hologram.getTauntRange ? hologram.getTauntRange() : 300;
        return distance <= tauntRange;
    }

    /**
     * 全息幻影创建事件
     */
    private onHologramCreated(hologram: Phaser.GameObjects.Container): void {
        // 检查距离是否在仇恨吸引范围内
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            hologram.x, hologram.y
        );
        
        const tauntRange = (hologram as any).getTauntRange ? (hologram as any).getTauntRange() : 300;
        
        if (distance <= tauntRange) {
            this.hologramTarget = hologram;
            this.aiState = 'chase';
        }
    }

    /**
     * 全息幻影销毁事件
     */
    private onHologramDestroyed(hologram: Phaser.GameObjects.Container): void {
        if (this.hologramTarget === hologram) {
            this.hologramTarget = null;
            // 切换回玩家目标
            if (this.target) {
                this.aiState = 'chase';
            }
        }
    }

    /**
     * 计算分离向量 - 避免敌人重叠
     */
    private calculateSeparation(): Phaser.Math.Vector2 {
        const separation = new Phaser.Math.Vector2(0, 0);

        // 安全检查：确保场景存在且已初始化
        if (!this.scene || !this.scene.game) {
            return separation;
        }

        // 获取场景中所有敌人
        const gameScene = this.scene.scene.get('GameScene') as Phaser.Scene;
        if (!gameScene || !(gameScene as any).enemies) {
            return separation;
        }

        const enemies = (gameScene as any).enemies as Enemy[];
        if (!enemies || !Array.isArray(enemies)) {
            return separation;
        }

        let neighborCount = 0;

        for (const other of enemies) {
            if (other === this || !other.active) continue;

            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                other.x, other.y
            );

            if (distance < this.separationDistance && distance > 0) {
                // 计算远离方向
                const away = new Phaser.Math.Vector2(
                    this.x - other.x,
                    this.y - other.y
                );
                away.normalize();
                away.scale(1 - distance / this.separationDistance); // 距离越近，推力越大
                separation.add(away);
                neighborCount++;
            }
        }

        if (neighborCount > 0) {
            separation.scale(1 / neighborCount);
        }

        return separation;
    }

    /**
     * 检查目标是否在视野内
     */
    private isTargetInSight(): boolean {
        if (!this.target) return false;
        
        // 可以添加更复杂的视野检测，如射线检测
        // MVP阶段简单返回true
        return true;
    }

    /**
     * 攻击行为 - 增强版
     */
    private attack(time: number, delta: number): void {
        // 优先攻击全息幻影
        if (this.hologramTarget && this.isHologramValid()) {
            this.attackHologram(time, delta);
            return;
        }

        if (!this.target) {
            this.aiState = 'idle';
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        // 检查是否超出攻击范围
        if (distance > this.attackRange * 1.5) {
            this.aiState = 'chase';
            this.isWindup = false;
            return;
        }

        // 停止移动
        const body = this.getBody();
        if (body) body.setVelocity(0, 0);

        // 面向目标
        if (this.target.x < this.x) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }

        // 检查攻击冷却
        if (!CombatSystem.canAttack(this.combatState.lastAttackTime, this.stats.attackSpeed, time)) {
            return;
        }

        // 攻击前摇
        if (!this.isWindup) {
            this.isWindup = true;
            this.showWindupEffect();
            
            this.scene.time.delayedCall(this.attackWindupTime, () => {
                if (this.aiState === 'attack' && this.active) {
                    this.performAttack(time);
                }
                this.isWindup = false;
            });
        }
    }

    /**
     * 攻击全息幻影
     */
    private attackHologram(time: number, delta: number): void {
        if (!this.hologramTarget) {
            this.hologramTarget = null;
            this.aiState = 'chase';
            return;
        }

        const hologram = this.hologramTarget as any;
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            hologram.x, hologram.y
        );

        // 检查是否超出攻击范围
        if (distance > this.attackRange * 1.5) {
            this.aiState = 'chase';
            this.isWindup = false;
            return;
        }

        // 停止移动
        const body = this.getBody();
        if (body) body.setVelocity(0, 0);

        // 面向目标
        if (hologram.x < this.x) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }

        // 检查攻击冷却
        if (!CombatSystem.canAttack(this.combatState.lastAttackTime, this.stats.attackSpeed, time)) {
            return;
        }

        // 攻击前摇
        if (!this.isWindup) {
            this.isWindup = true;
            this.showWindupEffect();
            
            this.scene.time.delayedCall(this.attackWindupTime, () => {
                if (this.aiState === 'attack' && this.active && this.hologramTarget) {
                    this.performAttackOnHologram(time);
                }
                this.isWindup = false;
            });
        }
    }

    /**
     * 执行攻击全息幻影
     */
    private performAttackOnHologram(time: number): void {
        this.combatState.lastAttackTime = time;
        this.combatState.isAttacking = true;

        // 播放攻击动画
        this.setTint(0xffffff);

        // 计算伤害
        const damage = this.stats.attack;

        // 对全息幻影造成伤害
        const hologram = this.hologramTarget as any;
        if (hologram.takeDamage) {
            hologram.takeDamage(damage);
        }

        // 显示攻击特效
        this.createAttackEffectOnHologram();

        // 攻击动画结束后恢复
        this.scene.time.delayedCall(300, () => {
            if (this.active) {
                this.combatState.isAttacking = false;
                this.setupEnemyAppearance();
                
                // 攻击后进入短暂撤退状态
                if (Math.random() < 0.3) {
                    this.aiState = 'retreat';
                    this.retreatCooldown = 500;
                }
            }
        });
    }

    /**
     * 创建攻击全息幻影特效
     */
    private createAttackEffectOnHologram(): void {
        if (!this.hologramTarget) return;

        const hologram = this.hologramTarget as any;
        
        // 创建攻击线
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0x00ffff, 0.8);
        graphics.beginPath();
        graphics.moveTo(this.x, this.y);
        graphics.lineTo(hologram.x, hologram.y);
        graphics.strokePath();
        graphics.setDepth(50);

        // 延迟销毁
        this.scene.time.delayedCall(100, () => {
            if (graphics && graphics.active) {
                graphics.destroy();
            }
        });
    }

    /**
     * 显示攻击前摇特效
     */
    private showWindupEffect(): void {
        // 显示攻击蓄力特效
        const windup = this.scene.add.circle(this.x, this.y, 5, 0xff0000, 0.5);
        
        this.scene.tweens.add({
            targets: windup,
            scale: 3,
            alpha: 0,
            duration: this.attackWindupTime,
            onComplete: () => {
                if (windup && windup.active) {
                    windup.destroy();
                }
            }
        });
    }

    /**
     * 撤退行为 - 攻击后短暂后退
     */
    private retreat(delta: number): void {
        if (!this.target || this.retreatCooldown <= 0) {
            this.aiState = 'chase';
            return;
        }

        // 向远离目标的方向移动
        const direction = new Phaser.Math.Vector2(
            this.x - this.target.x,
            this.y - this.target.y
        );
        direction.normalize();

        const body = this.getBody();
        if (body) {
            body.setVelocity(
                direction.x * this.stats.moveSpeed * 0.5,
                direction.y * this.stats.moveSpeed * 0.5
            );
        }
    }

    /**
     * 执行攻击
     */
    private performAttack(time: number): void {
        this.combatState.lastAttackTime = time;
        this.combatState.isAttacking = true;

        // 播放攻击动画（使用颜色闪烁）
        this.setTint(0xffffff);

        // 计算伤害
        const damageResult = CombatSystem.calculateDamage(
            this.stats,
            (this.target as any).getStats ? (this.target as any).getStats() : {}
        );
        const damage = damageResult.damage;

        // 对目标造成伤害
        if ((this.target as any).takeDamage) {
            (this.target as any).takeDamage(damage);
        }

        // 显示攻击特效
        this.createAttackEffect();

        // 攻击动画结束后恢复
        this.scene.time.delayedCall(300, () => {
            if (this.active) {
                this.combatState.isAttacking = false;
                this.setupEnemyAppearance(); // 恢复原有颜色
                
                // 攻击后进入短暂撤退状态（给玩家喘息空间）
                if (Math.random() < 0.3) { // 30%概率撤退
                    this.aiState = 'retreat';
                    this.retreatCooldown = 500; // 撤退500ms
                }
            }
        });
    }

    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        if (!this.stats) return;

        this.stats.hp -= damage;
        this.stats.hp = Math.max(this.stats.hp, 0);

        // 播放受伤特效
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.setupEnemyAppearance();
        });

        // 显示伤害数字
        this.showDamageNumber(damage, false);

        // 检查死亡
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    // ========== 特殊敌人AI方法 ==========
    
    /**
     * 远程敌人AI - 保持距离并射击
     */
    private updateRangedAI(time: number, delta: number): void {
        if (!this.target) {
            this.aiState = 'idle';
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        // 计算移动方向
        const direction = new Phaser.Math.Vector2(
            this.target.x - this.x,
            this.target.y - this.y
        );
        direction.normalize();

        // 保持理想距离
        if (distance < this.preferredDistance - 50) {
            // 太近了，后退
            const body = this.getBody();
            if (body) {
                body.setVelocity(
                    -direction.x * this.stats.moveSpeed,
                    -direction.y * this.stats.moveSpeed
                );
            }
        } else if (distance > this.preferredDistance + 50) {
            // 太远了，靠近
            const body = this.getBody();
            if (body) {
                body.setVelocity(
                    direction.x * this.stats.moveSpeed,
                    direction.y * this.stats.moveSpeed
                );
            }
        } else {
            // 在理想距离内，停止移动并射击
            const body = this.getBody();
            if (body) body.setVelocity(0, 0);
        }

        // 面向目标
        if (direction.x < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }

        // 远程攻击
        if (distance <= this.attackRange && distance >= this.preferredDistance - 100) {
            this.rangedAttack(time);
        }
    }

    /**
     * 远程攻击 - 发射弹幕
     */
    private rangedAttack(time: number): void {
        if (!this.target) return;

        // 检查攻击冷却
        if (!CombatSystem.canAttack(this.combatState.lastAttackTime, this.stats.attackSpeed, time)) {
            return;
        }

        this.combatState.lastAttackTime = time;
        this.combatState.isAttacking = true;

        // 创建弹幕
        this.createProjectile();

        // 攻击动画
        this.setTint(0xffffff);
        this.scene.time.delayedCall(200, () => {
            if (this.active) {
                this.combatState.isAttacking = false;
                this.setupEnemyAppearance();
            }
        });
    }

    /**
     * 创建弹幕
     */
    private createProjectile(): void {
        if (!this.target) return;

        const projectile = this.scene.add.circle(this.x, this.y, 6, 0x00ffff, 1);
        projectile.setDepth(50);

        // 计算方向
        const direction = new Phaser.Math.Vector2(
            this.target.x - this.x,
            this.target.y - this.y
        );
        direction.normalize();

        // 添加物理
        this.scene.physics.add.existing(projectile);
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(
            direction.x * this.projectileSpeed,
            direction.y * this.projectileSpeed
        );

        // 添加拖尾效果
        this.scene.tweens.add({
            targets: projectile,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: -1
        });

        // 碰撞检测
        this.scene.physics.add.overlap(projectile, this.target, () => {
            if ((this.target as any).takeDamage) {
                (this.target as any).takeDamage(this.stats.attack);
            }
            if (projectile && projectile.active) {
                projectile.destroy();
            }
        });

        // 超时销毁
        this.scene.time.delayedCall(3000, () => {
            if (projectile && projectile.active) {
                projectile.destroy();
            }
        });
    }

    /**
     * 召唤型敌人AI
     */
    private updateSummonerAI(time: number, delta: number): void {
        if (!this.target) {
            this.aiState = 'idle';
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        // 保持中等距离
        const idealDistance = 250;
        const direction = new Phaser.Math.Vector2(
            this.target.x - this.x,
            this.target.y - this.y
        );
        direction.normalize();

        if (distance < idealDistance - 50) {
            // 太近了，后退
            const body = this.getBody();
            if (body) {
                body.setVelocity(
                    -direction.x * this.stats.moveSpeed,
                    -direction.y * this.stats.moveSpeed
                );
            }
        } else if (distance > idealDistance + 100) {
            // 太远了，靠近
            const body = this.getBody();
            if (body) {
                body.setVelocity(
                    direction.x * this.stats.moveSpeed,
                    direction.y * this.stats.moveSpeed
                );
            }
        } else {
            // 在理想距离内，停止移动
            const body = this.getBody();
            if (body) body.setVelocity(0, 0);
        }

        // 面向目标
        if (direction.x < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }

        // 召唤小怪
        if (time - this.lastSummonTime >= this.summonCooldown) {
            this.summonMinions();
            this.lastSummonTime = time;
        }
    }

    /**
     * 召唤小怪
     */
    private summonMinions(): void {
        if (!this.summonType || this.summonCount <= 0) return;

        // 发射召唤事件
        this.scene.events.emit('enemy-summon', {
            summoner: this,
            type: this.summonType,
            count: this.summonCount,
            x: this.x,
            y: this.y
        });

        // 召唤特效
        for (let i = 0; i < this.summonCount; i++) {
            const angle = (Math.PI * 2 * i) / this.summonCount;
            const spawnX = this.x + Math.cos(angle) * 60;
            const spawnY = this.y + Math.sin(angle) * 60;

            // 召唤光环
            const ring = this.scene.add.circle(spawnX, spawnY, 20, 0xff00ff, 0.3);
            this.scene.tweens.add({
                targets: ring,
                scale: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    if (ring && ring.active) {
                        ring.destroy();
                    }
                }
            });
        }

        // 召唤者闪烁效果
        this.setTint(0xff00ff);
        this.scene.time.delayedCall(300, () => {
            if (this.active) {
                this.setupEnemyAppearance();
            }
        });
    }

    /**
     * BOSS特殊技能
     */
    private useBossAbility(time: number): void {
        switch (this.enemyType) {
            case EnemyType.BOSS_MECH_BEAST:
                this.mechBeastCharge();
                this.bossAbilityCooldown = 4000;
                break;
            case EnemyType.BOSS_DATA_GHOST:
                this.dataGhostBlink();
                this.bossAbilityCooldown = 3000;
                break;
            case EnemyType.BOSS_BIO_TYRANT:
                this.bioTyrantPoison();
                this.bossAbilityCooldown = 5000;
                break;
        }
    }

    /**
     * 机械巨兽 - 冲锋攻击
     */
    private mechBeastCharge(): void {
        if (!this.target) return;

        // 冲锋预警
        const warningLine = this.scene.add.graphics();
        warningLine.lineStyle(4, 0xff3300, 0.5);
        warningLine.beginPath();
        warningLine.moveTo(this.x, this.y);
        warningLine.lineTo(this.target.x, this.target.y);
        warningLine.strokePath();

        // 冲锋
        this.scene.time.delayedCall(500, () => {
            if (!this.active || !this.target) {
                if (warningLine && warningLine.active) {
                    warningLine.destroy();
                }
                return;
            }

            const direction = new Phaser.Math.Vector2(
                this.target.x - this.x,
                this.target.y - this.y
            );
            direction.normalize();

            const body = this.getBody();
            if (body) {
                body.setVelocity(
                    direction.x * this.stats.moveSpeed * 3,
                    direction.y * this.stats.moveSpeed * 3
                );
            }

            // 冲锋伤害
            this.scene.time.delayedCall(300, () => {
                if (this.active && this.target) {
                    const distance = Phaser.Math.Distance.Between(
                        this.x, this.y,
                        this.target.x, this.target.y
                    );
                    if (distance < 100) {
                        if ((this.target as any).takeDamage) {
                            (this.target as any).takeDamage(this.stats.attack * 1.5);
                        }
                    }
                }
                if (warningLine && warningLine.active) {
                    warningLine.destroy();
                }
            });
        });
    }

    /**
     * 数据幽灵 - 瞬移
     */
    private dataGhostBlink(): void {
        if (!this.target) return;

        // 隐身效果
        this.setAlpha(0.2);

        // 随机瞬移到玩家周围
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const newX = this.target.x + Math.cos(angle) * distance;
        const newY = this.target.y + Math.sin(angle) * distance;

        // 确保在世界范围内
        const clampedX = Phaser.Math.Clamp(newX, 50, GAME_CONFIG.worldWidth - 50);
        const clampedY = Phaser.Math.Clamp(newY, 50, GAME_CONFIG.worldHeight - 50);

        // 瞬移特效
        const oldX = this.x;
        const oldY = this.y;

        // 原位置残影
        const afterimage = this.scene.add.sprite(oldX, oldY, this.texture);
        afterimage.setScale(this.scaleX, this.scaleY);
        afterimage.setAlpha(0.5);
        afterimage.setTint(0x00ffaa);
        this.scene.tweens.add({
            targets: afterimage,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                if (afterimage && afterimage.active) {
                    afterimage.destroy();
                }
            }
        });

        // 瞬移
        this.scene.time.delayedCall(200, () => {
            if (this.active) {
                this.setPosition(clampedX, clampedY);
                this.setAlpha(0.85);

                // 新位置特效
                const ring = this.scene.add.circle(clampedX, clampedY, 30, 0x00ffaa, 0.3);
                this.scene.tweens.add({
                    targets: ring,
                    scale: 2,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => {
                        if (ring && ring.active) {
                            ring.destroy();
                        }
                    }
                });
            }
        });
    }

    /**
     * 生化暴君 - 毒气喷射
     */
    private bioTyrantPoison(): void {
        // 创建毒气区域
        const poisonRadius = 150;
        const poison = this.scene.add.circle(this.x, this.y, poisonRadius, 0x66ff00, 0.3);
        poison.setDepth(40);

        // 毒气动画
        this.scene.tweens.add({
            targets: poison,
            alpha: 0.1,
            scale: 1.2,
            duration: 2000,
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                if (poison && poison.active) {
                    poison.destroy();
                }
            }
        });

        // 持续伤害检测
        const damageInterval = this.scene.time.addEvent({
            delay: 500,
            callback: () => {
                if (!this.active || !this.target) return;

                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y,
                    this.target.x, this.target.y
                );

                if (distance < poisonRadius) {
                    if ((this.target as any).takeDamage) {
                        (this.target as any).takeDamage(this.stats.attack * 0.3);
                    }
                }
            },
            repeat: 3
        });

        // 召唤分裂体
        if (this.summonType && this.summonCount > 0) {
            this.scene.time.delayedCall(1000, () => {
                if (this.active) {
                    this.summonMinions();
                }
            });
        }
    }

    /**
     * 死亡 - 赛博朋克爆炸效果
     */
    private die(): void {
        // 清理外观效果
        this.cleanupAppearance();

        // 分裂型敌人死亡时分裂
        if (this.enemyType === EnemyType.SPLITTER && this.splitCount > 0 && this.splitType) {
            this.splitOnDeath();
        }

        // 创建死亡爆炸效果
        this.createDeathExplosion();

        // 禁用物理体
        const body = this.getBody();
        if (body) {
            body.enable = false;
        }

        // 播放死亡动画
        this.scene.tweens.add({
            targets: this,
            scale: 0,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // 触发敌人被击败事件（在动画完成后触发）
                // 这样可以确保对象池正确回收敌人
                if (this.scene) {
                    this.scene.events.emit('enemyDefeated', this);
                }
            }
        });
    }

    /**
     * 分裂型敌人死亡分裂
     */
    private splitOnDeath(): void {
        if (!this.splitType || this.splitCount <= 0 || !this.scene) return;

        // 保存当前位置
        const splitX = this.x;
        const splitY = this.y;

        // 发射分裂事件
        this.scene.events.emit('enemy-split', {
            parent: this,
            type: this.splitType,
            count: this.splitCount,
            x: splitX,
            y: splitY
        });

        // 分裂特效
        for (let i = 0; i < this.splitCount; i++) {
            const angle = (Math.PI * 2 * i) / this.splitCount;
            const spawnX = splitX + Math.cos(angle) * 40;
            const spawnY = splitY + Math.sin(angle) * 40;

            // 分裂光环
            const ring = this.scene.add.circle(spawnX, spawnY, 15, 0x00ff00, 0.5);
            this.scene.tweens.add({
                targets: ring,
                scale: 2,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    if (ring && ring.active) {
                        ring.destroy();
                    }
                }
            });
        }
    }

    /**
     * 创建死亡爆炸效果
     */
    private createDeathExplosion(): void {
        // 检查场景是否有效
        if (!this.scene) return;
        
        // 保存当前位置，防止敌人对象被销毁后位置信息丢失
        const explosionX = this.x;
        const explosionY = this.y;
        
        // 确定颜色
        let color: number;
        switch (this.enemyType) {
            case EnemyType.COMMON:
                color = 0xff6600;
                break;
            case EnemyType.ELITE:
                color = 0x6600ff;
                break;
            case EnemyType.RANGED:
                color = 0x00ffff;
                break;
            case EnemyType.SUMMONER:
                color = 0xff00ff;
                break;
            case EnemyType.SPLITTER:
                color = 0x00ff00;
                break;
            case EnemyType.BOSS:
                color = 0xff0066;
                break;
            case EnemyType.BOSS_MECH_BEAST:
                color = 0xff3300;
                break;
            case EnemyType.BOSS_DATA_GHOST:
                color = 0x00ffaa;
                break;
            case EnemyType.BOSS_BIO_TYRANT:
                color = 0x66ff00;
                break;
            default:
                color = 0xff6600;
        }

        // 检查同一位置是否已有过多死亡特效，避免过度堆积
        const deathEffects = this.scene.data.get('deathEffects') || [];
        const MAX_DEATH_EFFECTS_PER_AREA = 8; // 单个区域最大死亡特效数
        const AREA_CHECK_RADIUS = 100; // 区域检查半径
        
        // 统计附近区域的死亡特效数量
        let nearbyEffectCount = 0;
        for (const effect of deathEffects) {
            if (effect && effect.active) {
                const dist = Phaser.Math.Distance.Between(effect.x, effect.y, explosionX, explosionY);
                if (dist < AREA_CHECK_RADIUS) {
                    nearbyEffectCount++;
                }
            }
        }
        
        // 如果该区域特效过多，跳过部分视觉效果，只保留核心爆炸
        const skipParticles = nearbyEffectCount >= MAX_DEATH_EFFECTS_PER_AREA;
        
        if (nearbyEffectCount >= MAX_DEATH_EFFECTS_PER_AREA * 2) {
            // 极度堆积时完全跳过特效
            return;
        }
        
        // 跟踪这个特效对象
        const effectTracker = { x: explosionX, y: explosionY, active: true };
        deathEffects.push(effectTracker);
        this.scene.data.set('deathEffects', deathEffects);
        
        // 清理过期特效（5秒后自动标记为不活跃）
        this.scene.time.delayedCall(5000, () => {
            effectTracker.active = false;
            // 移除无效引用
            const effects = this.scene.data.get('deathEffects') || [];
            const index = effects.indexOf(effectTracker);
            if (index > -1) {
                effects.splice(index, 1);
                this.scene.data.set('deathEffects', effects);
            }
        });

        // 爆炸光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, color, 1);
        ring.strokeCircle(0, 0, 10);
        ring.x = explosionX;
        ring.y = explosionY;

        this.scene.tweens.add({
            targets: ring,
            scale: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                if (ring && ring.active) {
                    ring.destroy();
                }
            }
        });

        // 粒子爆炸 - 数量根据区域密度调整
        const particleCount = skipParticles ? 4 : 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const particle = this.scene.add.circle(
                explosionX,
                explosionY,
                4,
                color,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: explosionX + Math.cos(angle) * 50,
                y: explosionY + Math.sin(angle) * 50,
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => {
                    if (particle && particle.active) {
                        particle.destroy();
                    }
                }
            });
        }

        // 闪光
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.8);
        flash.fillCircle(0, 0, 20);
        flash.x = explosionX;
        flash.y = explosionY;

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => {
                if (flash && flash.active) {
                    flash.destroy();
                }
            }
        });
    }

    /**
     * 获取属性
     */
    public getStats(): CombatStats {
        return { ...this.stats };
    }

    /**
     * 获取敌人类型
     */
    public getEnemyType(): EnemyType {
        return this.enemyType;
    }
    
    /**
     * 获取敌人稀有度
     */
    public getEnemyRarity(): EnemyRarity {
        return this.enemyRarity;
    }
    
    /**
     * 获取敌人等级
     */
    public getEnemyLevel(): number {
        return this.enemyLevel;
    }

    /**
     * 获取当前AI状态
     */
    public getState(): string {
        return this.aiState;
    }

    /**
     * 显示伤害数字
     */
    private showDamageNumber(damage: number, isCrit: boolean): void {
        const text = this.scene.add.text(this.x, this.y - 20, damage.toString(), {
            fontSize: isCrit ? '28px' : '20px',
            fontStyle: 'bold',
            color: isCrit ? '#ffff00' : '#ffffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setScrollFactor(1);
        text.setDepth(100);

        // 动画效果
        this.scene.tweens.add({
            targets: text,
            y: this.y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                if (text && text.active) {
                    text.destroy();
                }
            }
        });
    }

    /**
     * 创建攻击特效
     */
    private createAttackEffect(): void {
        if (!this.target) return;

        // 创建简单的攻击线
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0xff4444, 0.8);
        graphics.beginPath();
        graphics.moveTo(this.x, this.y);
        graphics.lineTo(this.target.x, this.target.y);
        graphics.strokePath();
        graphics.setDepth(50);

        // 延迟销毁
        this.scene.time.delayedCall(100, () => {
            if (graphics && graphics.active) {
                graphics.destroy();
            }
        });
    }

    /**
     * 眩晕
     */
    public stun(duration: number): void {
        this.combatState.isStunned = true;
        this.aiState = 'stunned';

        this.scene.time.delayedCall(duration, () => {
            this.combatState.isStunned = false;
            this.aiState = 'chase';
        });
    }

    /**
     * 重置敌人状态（用于对象池）
     */
    public reset(x: number, y: number, enemyType: EnemyType, level: number = 1, rarity?: EnemyRarity): void {
        // 安全检查：确保场景引用存在
        if (!this.scene) {
            console.error('[Enemy.reset] 场景引用丢失，无法重置敌人');
            return;
        }
        
        // 清理旧的外观效果（在设置外观之前）
        this.cleanupAppearance();
        
        // 设置新位置
        this.setPosition(x, y);
        
        // 更新敌人类型
        this.enemyType = enemyType;
        
        // 更新敌人等级
        this.enemyLevel = level;
        
        // 更新敌人稀有度
        this.enemyRarity = rarity ?? this.determineRarity();
        
        // 重新初始化属性
        this.initializeStats();
        
        // 重置AI状态
        this.aiState = 'chase';
        this.isWindup = false;
        this.retreatCooldown = 0;
        this.target = null;
        this.hologramTarget = null; // 清除全息幻影目标
        this.lastAttackTime = 0; // 重置攻击冷却
        this.patrolTarget = null; // 清除巡逻目标
        this.patrolWaitTime = 0; // 重置巡逻等待时间
        
        // 重置战斗状态
        this.combatState.isAttacking = false;
        this.combatState.isStunned = false;
        this.combatState.lastAttackTime = 0;
        this.combatState.comboCount = 0;
        this.combatState.lastComboTime = 0;
        
        // 重置视觉属性
        this.setScale(1);
        this.setAlpha(1);
        this.clearTint();
        
        // 重新设置外观
        this.setupEnemyAppearance();
        
        // 启用敌人
        this.setActive(true);
        this.setVisible(true);
        const body = this.getBody();
        if (body) {
            body.enable = true;
            body.setVelocity(0, 0);
        }
    }

    /**
     * 销毁敌人
     */
    public destroy(): void {
        // 清理外观效果
        this.cleanupAppearance();
        
        // 移除事件监听器
        if (this.scene) {
            this.scene.events.off('hologram-created', this.onHologramCreated, this);
            this.scene.events.off('hologram-destroyed', this.onHologramDestroyed, this);
        }
        
        super.destroy();
    }
}
