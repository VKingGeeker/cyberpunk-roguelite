/**
 * 全息幻影实体类
 * 用于吸引敌人仇恨，保护玩家
 */

import Phaser from 'phaser';

export default class Hologram extends Phaser.GameObjects.Container {
    private hologramBody: Phaser.GameObjects.Sprite;
    private aura: Phaser.GameObjects.Sprite;
    private tauntRange: number = 300; // 仇恨吸引范围
    private duration: number; // 持续时间（毫秒）
    private createdAt: number; // 创建时间
    private isActive: boolean = true;
    private health: number = 100; // 幻影生命值
    private maxHealth: number = 100;
    private damageReduction: number = 0.5; // 伤害减免50%

    constructor(scene: Phaser.Scene, x: number, y: number, duration: number) {
        super(scene);
        
        // 设置位置
        this.setPosition(x, y);
        
        this.duration = duration * 1000; // 转换为毫秒
        this.createdAt = scene.time.now;
        
        // 创建光环（底层）
        this.aura = scene.add.sprite(0, 0, 'hologram_aura');
        this.aura.setAlpha(0.6);
        this.aura.setBlendMode(Phaser.BlendModes.ADD);
        this.add(this.aura);
        
        // 创建主体
        this.hologramBody = scene.add.sprite(0, 0, 'hologram_body');
        this.hologramBody.setAlpha(0.7);
        this.hologramBody.setBlendMode(Phaser.BlendModes.ADD);
        this.add(this.hologramBody);
        
        // 添加到场景
        scene.add.existing(this);
        
        // 设置深度
        this.setDepth(50);
        
        // 添加物理体
        scene.physics.add.existing(this);
        const physicsBody = this.body as Phaser.Physics.Arcade.Body;
        physicsBody.setSize(32, 32);
        physicsBody.setOffset(-16, -16);
        
        // 播放动画效果
        this.playSpawnAnimation();
        this.playIdleAnimation();
        
        // 发射创建事件，通知敌人
        scene.events.emit('hologram-created', this);
        
        // 设置自动销毁定时器
        scene.time.delayedCall(this.duration, () => {
            this.destroyHologram();
        });
    }
    
    /**
     * 播放生成动画
     */
    private playSpawnAnimation(): void {
        this.setScale(0);
        this.setAlpha(0);
        
        this.scene.tweens.add({
            targets: this,
            scale: 1,
            alpha: 0.8,
            duration: 300,
            ease: 'Back.easeOut'
        });
        
        // 生成特效
        const spawnEffect = this.scene.add.graphics();
        spawnEffect.fillStyle(0x00ffff, 0.5);
        spawnEffect.fillCircle(this.x, this.y, 10);
        
        this.scene.tweens.add({
            targets: spawnEffect,
            scale: 4,
            alpha: 0,
            duration: 500,
            onComplete: () => spawnEffect.destroy()
        });
    }
    
    /**
     * 播放待机动画
     */
    private playIdleAnimation(): void {
        // 主体浮动
        this.scene.tweens.add({
            targets: this.hologramBody,
            y: -3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 光环旋转
        this.scene.tweens.add({
            targets: this.aura,
            angle: 360,
            duration: 8000,
            repeat: -1
        });
        
        // 光环脉冲
        this.scene.tweens.add({
            targets: this.aura,
            scale: 1.1,
            alpha: 0.8,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 整体闪烁
        this.scene.tweens.add({
            targets: this,
            alpha: 0.6,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        if (!this.isActive) return;
        
        // 应用伤害减免
        const actualDamage = Math.floor(damage * (1 - this.damageReduction));
        this.health -= actualDamage;
        this.health = Math.max(0, this.health);
        
        // 受伤特效
        this.playDamageEffect();
        
        // 检查是否被摧毁
        if (this.health <= 0) {
            this.destroyHologram();
        }
    }
    
    /**
     * 播放受伤特效
     */
    private playDamageEffect(): void {
        // 闪烁红色
        this.hologramBody.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            if (this.hologramBody && this.hologramBody.active) {
                this.hologramBody.clearTint();
            }
        });
        
        // 显示伤害数字
        const damageText = this.scene.add.text(this.x, this.y - 30, `${Math.floor(this.health)}/${this.maxHealth}`, {
            fontSize: '14px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        damageText.setOrigin(0.5);
        damageText.setDepth(100);
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => damageText.destroy()
        });
    }
    
    /**
     * 销毁全息幻影
     */
    public destroyHologram(): void {
        if (!this.isActive) return;
        this.isActive = false;
        
        // 发射销毁事件，通知敌人切换目标
        this.scene.events.emit('hologram-destroyed', this);
        
        // 播放销毁动画
        this.scene.tweens.add({
            targets: this,
            scale: 0,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // 销毁特效
        const destroyEffect = this.scene.add.graphics();
        destroyEffect.fillStyle(0x00ffff, 0.5);
        destroyEffect.fillCircle(this.x, this.y, 20);
        
        this.scene.tweens.add({
            targets: destroyEffect,
            scale: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => destroyEffect.destroy()
        });
        
        // 粒子爆炸
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                3,
                0x00ffff,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 40,
                y: this.y + Math.sin(angle) * 40,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    /**
     * 获取仇恨吸引范围
     */
    public getTauntRange(): number {
        return this.tauntRange;
    }
    
    /**
     * 设置仇恨吸引范围
     */
    public setTauntRange(range: number): void {
        this.tauntRange = range;
    }
    
    /**
     * 是否激活
     */
    public getIsActive(): boolean {
        return this.isActive;
    }
    
    /**
     * 获取生命值
     */
    public getHealth(): number {
        return this.health;
    }
    
    /**
     * 获取最大生命值
     */
    public getMaxHealth(): number {
        return this.maxHealth;
    }
    
    /**
     * 获取剩余时间（毫秒）
     */
    public getRemainingTime(): number {
        const elapsed = this.scene.time.now - this.createdAt;
        return Math.max(0, this.duration - elapsed);
    }
    
    /**
     * 更新全息幻影状态
     */
    public update(time: number, delta: number): void {
        if (!this.isActive) return;
        
        // 可以在这里添加更多行为，比如移动、闪烁等
    }
}
