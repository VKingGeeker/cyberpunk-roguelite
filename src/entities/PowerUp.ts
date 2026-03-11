/**
 * 升级道具实体类
 * 地图中生成的可拾取道具
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';

export enum PowerUpType {
    HEALTH = 'health',           // 生命恢复
    ATTACK_BOOST = 'attack',     // 攻击力提升
    DEFENSE_BOOST = 'defense',   // 防御力提升
    SPEED_BOOST = 'speed',       // 移动速度提升
    CRIT_BOOST = 'crit',         // 暴击率提升
    EXPERIENCE = 'experience'    // 经验值
}

export enum PowerUpRarity {
    COMMON = 'common',      // 普通 - 白色
    RARE = 'rare',          // 稀有 - 蓝色
    EPIC = 'epic',          // 史诗 - 紫色
    LEGENDARY = 'legendary' // 传说 - 橙色
}

interface PowerUpConfig {
    type: PowerUpType;
    rarity: PowerUpRarity;
    value: number;
    duration?: number; // 临时效果持续时间（毫秒），0表示永久
    color: number;
    name: string;
    description: string;
}

export default class PowerUp extends Phaser.GameObjects.Sprite {
    private config: PowerUpConfig;
    private pulseTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType, rarity: PowerUpRarity) {
        // 使用正确的纹理名称格式: powerup_${type}_${rarity}
        // 注意：经验球类型在纹理中使用 'exp' 而不是 'experience'
        const textureType = type === PowerUpType.EXPERIENCE ? 'exp' : type;
        const textureKey = `powerup_${textureType}_${rarity}`;
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 设置道具配置
        this.config = this.createConfig(type, rarity);

        // 设置外观
        this.setupAppearance();

        // 添加悬浮动画
        this.addFloatAnimation();

        // 添加脉冲效果
        this.addPulseEffect();
    }

    /**
     * 创建道具配置
     */
    private createConfig(type: PowerUpType, rarity: PowerUpRarity): PowerUpConfig {
        const rarityMultiplier = {
            [PowerUpRarity.COMMON]: 1,
            [PowerUpRarity.RARE]: 1.5,
            [PowerUpRarity.EPIC]: 2,
            [PowerUpRarity.LEGENDARY]: 3
        };

        const mult = rarityMultiplier[rarity];

        const configs: Record<PowerUpType, PowerUpConfig> = {
            [PowerUpType.HEALTH]: {
                type: PowerUpType.HEALTH,
                rarity,
                value: Math.floor(20 * mult),
                color: 0x44ff44,
                name: '生命恢复',
                description: `恢复 ${Math.floor(20 * mult)} 点生命值`
            },
            [PowerUpType.ATTACK_BOOST]: {
                type: PowerUpType.ATTACK_BOOST,
                rarity,
                value: Math.floor(2 * mult),
                duration: 10000, // 10秒
                color: 0xff4444,
                name: '攻击力提升',
                description: `攻击力 +${Math.floor(2 * mult)} (10秒)`
            },
            [PowerUpType.DEFENSE_BOOST]: {
                type: PowerUpType.DEFENSE_BOOST,
                rarity,
                value: Math.floor(1 * mult),
                duration: 15000, // 15秒
                color: 0x4444ff,
                name: '防御力提升',
                description: `防御力 +${Math.floor(1 * mult)} (15秒)`
            },
            [PowerUpType.SPEED_BOOST]: {
                type: PowerUpType.SPEED_BOOST,
                rarity,
                value: 0.2 * mult,
                duration: 20000, // 20秒
                color: 0xffff44,
                name: '速度提升',
                description: `移动速度 +${Math.floor(20 * mult)}% (20秒)`
            },
            [PowerUpType.CRIT_BOOST]: {
                type: PowerUpType.CRIT_BOOST,
                rarity,
                value: 0.05 * mult,
                duration: 30000, // 30秒
                color: 0xff44ff,
                name: '暴击率提升',
                description: `暴击率 +${Math.floor(5 * mult)}% (30秒)`
            },
            [PowerUpType.EXPERIENCE]: {
                type: PowerUpType.EXPERIENCE,
                rarity,
                value: Math.floor(25 * mult),
                color: 0xffaa00,
                name: '经验球',
                description: `获得 ${Math.floor(25 * mult)} 点经验值`
            }
        };

        return configs[type];
    }

    /**
     * 设置外观
     */
    private setupAppearance(): void {
        // 根据稀有度设置大小
        const scale = {
            [PowerUpRarity.COMMON]: 0.7,
            [PowerUpRarity.RARE]: 0.9,
            [PowerUpRarity.EPIC]: 1.1,
            [PowerUpRarity.LEGENDARY]: 1.3
        };

        this.setScale(scale[this.config.rarity]);

        // 设置物理体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(24, 24);
        body.setOffset(4, 4);

        // 添加发光效果
        this.createGlowEffect();
    }

    /**
     * 创建发光效果
     */
    private createGlowEffect(): void {
        // 外发光
        const glow = this.scene.add.graphics();
        glow.fillStyle(this.config.color, 0.15);
        glow.fillCircle(0, 0, 20);
        glow.x = this.x;
        glow.y = this.y;

        // 保存引用以便后续销毁
        this.setData('glow', glow);

        // 发光脉冲动画
        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.15, to: 0.3 },
            scale: { from: 1, to: 1.2 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 添加悬浮动画
     */
    private addFloatAnimation(): void {
        this.scene.tweens.add({
            targets: this,
            y: this.y - 5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 添加脉冲效果
     */
    private addPulseEffect(): void {
        this.pulseTween = this.scene.tweens.add({
            targets: this,
            scale: this.scale * 1.1,
            alpha: { from: 1, to: 0.7 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * 获取道具配置
     */
    public getConfig(): PowerUpConfig {
        return this.config;
    }

    /**
     * 获取道具类型
     */
    public getType(): PowerUpType {
        return this.config.type;
    }

    /**
     * 获取稀有度
     */
    public getRarity(): PowerUpRarity {
        return this.config.rarity;
    }

    /**
     * 应用效果到玩家
     */
    public applyTo(player: any): void {
        const config = this.config;

        switch (config.type) {
            case PowerUpType.HEALTH:
                player.heal(config.value);
                break;
            case PowerUpType.ATTACK_BOOST:
                player.applyTemporaryBoost('attack', config.value, config.duration || 10000);
                break;
            case PowerUpType.DEFENSE_BOOST:
                player.applyTemporaryBoost('defense', config.value, config.duration || 15000);
                break;
            case PowerUpType.SPEED_BOOST:
                player.applyTemporaryBoost('speed', config.value, config.duration || 20000);
                break;
            case PowerUpType.CRIT_BOOST:
                player.applyTemporaryBoost('crit', config.value, config.duration || 30000);
                break;
            case PowerUpType.EXPERIENCE:
                player.addExperience(config.value);
                break;
        }

        // 显示拾取提示
        this.showPickupText(player, config);
    }

    /**
     * 显示拾取提示文字
     */
    private showPickupText(player: any, config: PowerUpConfig): void {
        const text = this.scene.add.text(this.x, this.y - 20, config.name, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: `#${config.color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    /**
     * 销毁道具
     */
    public collect(): void {
        // 安全检查场景是否存在
        if (!this.scene) return;

        // 立即禁用物理体，防止再次触发碰撞
        try {
            const body = this.body as Phaser.Physics.Arcade.Body;
            if (body && body.enable) {
                body.enable = false;
            }
        } catch (e) {
            // 忽略已销毁的物理体
        }

        if (this.pulseTween) {
            try {
                this.pulseTween.stop();
            } catch (e) {
                // 忽略动画停止错误
            }
        }

        // 销毁发光效果
        try {
            const glow = this.getData('glow') as Phaser.GameObjects.Graphics;
            if (glow) {
                glow.destroy();
            }
        } catch (e) {
            // 忽略销毁错误
        }

        try {
            // 创建拾取粒子效果
            this.createCollectParticles();

            // 拾取动画
            this.scene.tweens.add({
                targets: this,
                scale: 0,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => this.destroy()
            });
        } catch (e) {
            // 如果动画添加失败，直接销毁
            this.destroy();
        }
    }

    /**
     * 创建拾取粒子效果
     */
    private createCollectParticles(): void {
        if (!this.scene) return;
        
        try {
            const colors = [this.config.color, 0xffffff];
            
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const particle = this.scene.add.circle(
                    this.x,
                    this.y,
                    3,
                    colors[i % colors.length],
                    1
                );

                this.scene.tweens.add({
                    targets: particle,
                    x: this.x + Math.cos(angle) * 30,
                    y: this.y + Math.sin(angle) * 30,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            }
        } catch (e) {
            // 忽略粒子效果创建错误
        }
    }
}
