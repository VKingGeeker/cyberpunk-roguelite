/**
 * 无人机实体类
 * 数据黑客职业的专属召唤物
 * 自动环绕玩家飞行，自动攻击附近敌人
 */

import Phaser from 'phaser';
import { CombatStats } from '../core/Types';

export default class Drone extends Phaser.GameObjects.Container {
    // 无人机属性
    private droneBody: Phaser.GameObjects.Sprite;
    private dataStream: Phaser.GameObjects.Graphics;
    private glowAura: Phaser.GameObjects.Graphics;

    // 基础属性
    private hp: number;
    private maxHp: number;
    private attack: number;
    private attackRange: number = 250; // 攻击范围
    private attackCooldown: number = 1500; // 攻击冷却（毫秒）
    private lastAttackTime: number = 0;

    // 飞行属性
    private orbitRadius: number = 80; // 环绕半径
    private orbitSpeed: number = 0.002; // 环绕速度
    private orbitAngle: number = 0; // 当前角度
    private targetEnemy: any = null; // 当前攻击目标

    // 状态
    private isActive: boolean = true;
    private owner: Phaser.GameObjects.Sprite; // 所属玩家
    private createdAt: number;
    private duration: number; // 持续时间（毫秒），0表示永久

    // 视觉效果
    private dataParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        owner: Phaser.GameObjects.Sprite,
        stats: {
            hp: number;
            attack: number;
            duration?: number; // 持续时间（秒）
        }
    ) {
        super(scene);
        
        // 设置位置
        this.setPosition(x, y);
        
        this.owner = owner;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.attack = stats.attack;
        this.duration = stats.duration ? stats.duration * 1000 : 0;
        this.createdAt = scene.time.now;

        // 创建无人机主体
        this.createDroneBody();

        // 创建数据流光效
        this.createDataStreamEffect();

        // 创建光环
        this.createGlowAura();

        // 添加到场景
        scene.add.existing(this);

        // 设置深度
        this.setDepth(60);

        // 添加物理体
        scene.physics.add.existing(this);
        const physicsBody = this.body as Phaser.Physics.Arcade.Body;
        physicsBody.setSize(24, 24);
        physicsBody.setOffset(-12, -12);

        // 播放生成动画
        this.playSpawnAnimation();

        // 发射创建事件
        scene.events.emit('drone-spawned', this);

        // 设置自动销毁定时器（如果有持续时间）
        if (this.duration > 0) {
            scene.time.delayedCall(this.duration, () => {
                this.destroyDrone();
            });
        }

        console.log('[Drone] 无人机已创建');
    }

    /**
     * 创建无人机主体
     */
    private createDroneBody(): void {
        // 创建无人机核心（使用图形绘制）
        const graphics = this.scene.add.graphics();

        // 绘制无人机主体 - 六边形设计
        const size = 12;
        graphics.fillStyle(0x00ffff, 1);
        graphics.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            if (i === 0) {
                graphics.moveTo(px, py);
            } else {
                graphics.lineTo(px, py);
            }
        }
        graphics.closePath();
        graphics.fillPath();

        // 绘制中心核心
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(0, 0, 4);

        // 绘制外环
        graphics.lineStyle(2, 0x00ffff, 0.8);
        graphics.strokeCircle(0, 0, size + 3);

        // 生成纹理
        graphics.generateTexture('drone_body', 40, 40);
        graphics.destroy();

        // 创建精灵
        this.droneBody = this.scene.add.sprite(0, 0, 'drone_body');
        this.add(this.droneBody);
    }

    /**
     * 创建数据流光效
     */
    private createDataStreamEffect(): void {
        this.dataStream = this.scene.add.graphics();
        this.add(this.dataStream);

        // 创建粒子效果（数据流）
        this.createDataParticles();
    }

    /**
     * 创建数据粒子效果
     */
    private createDataParticles(): void {
        // 创建粒子纹理
        const particleGraphics = this.scene.add.graphics();
        particleGraphics.fillStyle(0x00ffff, 1);
        particleGraphics.fillCircle(2, 2, 2);
        particleGraphics.generateTexture('drone_particle', 4, 4);
        particleGraphics.destroy();

        // 创建粒子发射器
        this.dataParticles = this.scene.add.particles(0, 0, 'drone_particle', {
            speed: { min: 20, max: 40 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            frequency: 100,
            blendMode: Phaser.BlendModes.ADD,
            tint: [0x00ffff, 0x00ff88, 0x0088ff]
        });

        this.add(this.dataParticles);
    }

    /**
     * 创建光环效果
     */
    private createGlowAura(): void {
        this.glowAura = this.scene.add.graphics();
        this.add(this.glowAura);

        // 绘制光环
        this.updateGlowAura();
    }

    /**
     * 更新光环效果
     */
    private updateGlowAura(): void {
        this.glowAura.clear();

        // 外层光环
        this.glowAura.lineStyle(1, 0x00ffff, 0.3);
        this.glowAura.strokeCircle(0, 0, 20);

        // 内层光环
        this.glowAura.lineStyle(2, 0x00ffff, 0.5);
        this.glowAura.strokeCircle(0, 0, 15);
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
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });

        // 生成特效
        const spawnEffect = this.scene.add.graphics();
        spawnEffect.fillStyle(0x00ffff, 0.6);
        spawnEffect.fillCircle(this.x, this.y, 15);

        this.scene.tweens.add({
            targets: spawnEffect,
            scale: 3,
            alpha: 0,
            duration: 600,
            onComplete: () => spawnEffect.destroy()
        });
    }

    /**
     * 更新无人机状态
     */
    public update(time: number, delta: number): void {
        if (!this.isActive || !this.owner) return;

        // 环绕玩家飞行
        this.updateOrbitMovement(time, delta);

        // 自动攻击敌人
        this.updateAutoAttack(time, delta);

        // 更新视觉效果
        this.updateVisualEffects(time);
    }

    /**
     * 更新环绕飞行
     */
    private updateOrbitMovement(time: number, delta: number): void {
        // 更新角度
        this.orbitAngle += this.orbitSpeed * delta;

        // 计算目标位置
        const targetX = this.owner.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        const targetY = this.owner.y + Math.sin(this.orbitAngle) * this.orbitRadius;

        // 平滑移动
        const lerpFactor = 0.1;
        this.x = Phaser.Math.Linear(this.x, targetX, lerpFactor);
        this.y = Phaser.Math.Linear(this.y, targetY, lerpFactor);

        // 旋转无人机主体
        if (this.droneBody) {
            this.droneBody.rotation += 0.02;
        }
    }

    /**
     * 更新自动攻击
     */
    private updateAutoAttack(time: number, delta: number): void {
        // 检查攻击冷却
        if (time - this.lastAttackTime < this.attackCooldown) return;

        // 寻找最近的敌人
        const nearestEnemy = this.findNearestEnemy();

        if (nearestEnemy) {
            // 攻击敌人
            this.attackEnemy(nearestEnemy, time);
        }
    }

    /**
     * 寻找最近的敌人
     */
    private findNearestEnemy(): any | null {
        if (!this.scene) return null;

        // 获取所有敌人
        const enemies = this.scene.children.list.filter((child: any) => {
            if (child.isEnemy !== true) return false;
            if (!child.active) return false;

            const dist = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
            return dist < this.attackRange;
        }) as any[];

        if (enemies.length === 0) return null;

        // 找到最近的敌人
        return enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null)?.enemy;
    }

    /**
     * 攻击敌人
     */
    private attackEnemy(enemy: any, time: number): void {
        this.lastAttackTime = time;
        this.targetEnemy = enemy;

        // 播放攻击动画
        this.playAttackAnimation(enemy);

        // 发射数据弹
        this.fireDataProjectile(enemy);

        // 对敌人造成伤害
        if (enemy.takeDamage) {
            enemy.takeDamage(this.attack);
        }

        // 显示伤害数字
        this.showDamageNumber(enemy.x, enemy.y, this.attack, false);
    }

    /**
     * 播放攻击动画
     */
    private playAttackAnimation(enemy: any): void {
        // 闪烁效果
        if (this.droneBody) {
            this.droneBody.setTint(0xffffff);
            this.scene.time.delayedCall(100, () => {
                if (this.droneBody && this.droneBody.active) {
                    this.droneBody.clearTint();
                }
            });
        }
    }

    /**
     * 发射数据弹
     */
    private fireDataProjectile(enemy: any): void {
        // 创建数据弹
        const projectile = this.scene.add.graphics();
        projectile.fillStyle(0x00ffff, 1);
        projectile.fillCircle(0, 0, 4);
        projectile.lineStyle(2, 0x00ffff, 0.8);
        projectile.strokeCircle(0, 0, 6);
        projectile.x = this.x;
        projectile.y = this.y;
        projectile.setDepth(55);

        // 计算方向
        const angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);

        // 飞行动画
        this.scene.tweens.add({
            targets: projectile,
            x: enemy.x,
            y: enemy.y,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                // 命中特效
                this.createHitEffect(enemy.x, enemy.y);
                projectile.destroy();
            }
        });

        // 拖尾效果
        const trail = this.scene.add.graphics();
        trail.lineStyle(2, 0x00ffff, 0.6);
        trail.beginPath();
        trail.moveTo(this.x, this.y);
        trail.lineTo(enemy.x, enemy.y);
        trail.strokePath();
        trail.setDepth(54);

        this.scene.tweens.add({
            targets: trail,
            alpha: 0,
            duration: 200,
            onComplete: () => trail.destroy()
        });
    }

    /**
     * 创建命中特效
     */
    private createHitEffect(x: number, y: number): void {
        // 爆炸光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0x00ffff, 0.8);
        ring.strokeCircle(0, 0, 5);
        ring.x = x;
        ring.y = y;
        ring.setDepth(56);

        this.scene.tweens.add({
            targets: ring,
            scale: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => ring.destroy()
        });

        // 粒子爆炸
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const particle = this.scene.add.circle(x, y, 2, 0x00ffff, 1);
            particle.setDepth(56);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 20,
                y: y + Math.sin(angle) * 20,
                alpha: 0,
                scale: 0,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * 显示伤害数字
     */
    private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
        const text = this.scene.add.text(x, y - 20, damage.toString(), {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.scene.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    /**
     * 更新视觉效果
     */
    private updateVisualEffects(time: number): void {
        // 更新数据流
        this.updateDataStream(time);

        // 更新光环脉冲
        const pulseScale = 1 + Math.sin(time * 0.005) * 0.1;
        if (this.glowAura) {
            this.glowAura.setScale(pulseScale);
        }
    }

    /**
     * 更新数据流效果
     */
    private updateDataStream(time: number): void {
        if (!this.dataStream) return;

        this.dataStream.clear();

        // 绘制连接到玩家的数据流
        if (this.owner) {
            this.dataStream.lineStyle(1, 0x00ffff, 0.3);
            this.dataStream.beginPath();
            this.dataStream.moveTo(0, 0);

            // 波浪形数据流
            const steps = 10;
            const dx = (this.owner.x - this.x) / steps;
            const dy = (this.owner.y - this.y) / steps;

            for (let i = 1; i <= steps; i++) {
                const px = dx * i;
                const py = dy * i;
                const wave = Math.sin(time * 0.01 + i * 0.5) * 3;
                this.dataStream.lineTo(px, py + wave);
            }

            this.dataStream.strokePath();
        }
    }

    /**
     * 命令攻击特定目标
     */
    public commandAttack(target: any): void {
        if (!this.isActive || !target) return;

        // 设置目标并立即攻击
        this.targetEnemy = target;
        this.attackEnemy(target, this.scene.time.now);
    }

    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        if (!this.isActive) return;

        this.hp -= damage;
        this.hp = Math.max(0, this.hp);

        // 播放受伤特效
        this.playDamageEffect();

        // 检查是否被摧毁
        if (this.hp <= 0) {
            this.destroyDrone();
        }
    }

    /**
     * 播放受伤特效
     */
    private playDamageEffect(): void {
        // 闪烁红色
        if (this.droneBody) {
            this.droneBody.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => {
                if (this.droneBody && this.droneBody.active) {
                    this.droneBody.clearTint();
                }
            });
        }

        // 显示生命值
        const hpText = this.scene.add.text(this.x, this.y - 30, `${this.hp}/${this.maxHp}`, {
            fontSize: '12px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        hpText.setOrigin(0.5);
        hpText.setDepth(100);

        this.scene.tweens.add({
            targets: hpText,
            y: hpText.y - 20,
            alpha: 0,
            duration: 600,
            onComplete: () => hpText.destroy()
        });
    }

    /**
     * 销毁无人机
     */
    public destroyDrone(): void {
        if (!this.isActive) return;
        this.isActive = false;

        // 发射销毁事件
        this.scene.events.emit('drone-destroyed', this);

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
        destroyEffect.fillStyle(0x00ffff, 0.6);
        destroyEffect.fillCircle(this.x, this.y, 15);

        this.scene.tweens.add({
            targets: destroyEffect,
            scale: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => destroyEffect.destroy()
        });

        // 粒子爆炸
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const particle = this.scene.add.circle(this.x, this.y, 3, 0x00ffff, 1);
            particle.setDepth(61);

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

        console.log('[Drone] 无人机已销毁');
    }

    /**
     * 获取当前生命值
     */
    public getHp(): number {
        return this.hp;
    }

    /**
     * 获取最大生命值
     */
    public getMaxHp(): number {
        return this.maxHp;
    }

    /**
     * 获取攻击力
     */
    public getAttack(): number {
        return this.attack;
    }

    /**
     * 是否激活
     */
    public getIsActive(): boolean {
        return this.isActive;
    }

    /**
     * 获取所属玩家
     */
    public getOwner(): Phaser.GameObjects.Sprite {
        return this.owner;
    }

    /**
     * 获取剩余时间（毫秒）
     */
    public getRemainingTime(): number {
        if (this.duration === 0) return -1; // 永久
        const elapsed = this.scene.time.now - this.createdAt;
        return Math.max(0, this.duration - elapsed);
    }

    /**
     * 升级无人机属性
     */
    public upgradeStats(stats: { hp?: number; attack?: number; attackCooldown?: number }): void {
        if (stats.hp) {
            this.maxHp += stats.hp;
            this.hp = Math.min(this.hp + stats.hp, this.maxHp);
        }
        if (stats.attack) {
            this.attack += stats.attack;
        }
        if (stats.attackCooldown) {
            this.attackCooldown = Math.max(500, this.attackCooldown - stats.attackCooldown);
        }

        // 升级特效
        const upgradeEffect = this.scene.add.graphics();
        upgradeEffect.fillStyle(0x00ffff, 0.4);
        upgradeEffect.fillCircle(this.x, this.y, 20);

        this.scene.tweens.add({
            targets: upgradeEffect,
            scale: 2,
            alpha: 0,
            duration: 400,
            onComplete: () => upgradeEffect.destroy()
        });

        console.log('[Drone] 无人机已升级');
    }

    /**
     * 修复无人机
     */
    public repair(amount: number): void {
        this.hp = Math.min(this.maxHp, this.hp + amount);

        // 修复特效
        const repairText = this.scene.add.text(this.x, this.y - 30, `+${amount}`, {
            fontSize: '14px',
            color: '#00ff00',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        repairText.setOrigin(0.5);
        repairText.setDepth(100);

        this.scene.tweens.add({
            targets: repairText,
            y: repairText.y - 20,
            alpha: 0,
            duration: 600,
            onComplete: () => repairText.destroy()
        });
    }

    /**
     * 清理资源
     */
    public cleanup(): void {
        // 停止粒子发射器
        if (this.dataParticles) {
            this.dataParticles.stop();
        }
    }

    /**
     * 销毁
     */
    public destroy(): void {
        this.cleanup();
        super.destroy();
    }
}
