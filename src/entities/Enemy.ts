/**
 * 敌人实体类
 * 处理敌人的AI、移动、攻击、掉落
 */

import Phaser from 'phaser';
import { CombatStats, CombatState, EnemyType } from '../core/Types';
import { getEnemyTemplate, calculateEnemyStats } from '../data/Enemies';
import { CombatSystem } from '../systems/CombatSystem';
import { GAME_CONFIG } from '../core/Config';

export default class Enemy extends Phaser.GameObjects.Sprite {
    private stats!: CombatStats;
    private combatState!: CombatState;
    private enemyType: EnemyType;
    private aiState: 'idle' | 'chase' | 'attack' | 'stunned' = 'idle';
    private target: Phaser.GameObjects.Sprite | null = null;
    private chaseRange: number = 800; // 追踪范围
    private attackRange: number = 60; // 攻击范围

    constructor(scene: Phaser.Scene, x: number, y: number, enemyType: EnemyType) {
        // 使用临时占位图，实际开发中替换为资源图
        const textureKey = `enemy_${enemyType}_idle`;
        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 设置敌人类型
        this.enemyType = enemyType;

        // 初始化敌人属性
        this.initializeStats();

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(false); // 允许敌人从边界外进入
        body.setSize(32, 32);

        // 设置颜色区分不同类型敌人
        this.setupEnemyAppearance();

        // 默认进入追踪状态
        this.aiState = 'chase';
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

        const stats = calculateEnemyStats(template, 1); // MVP阶段固定为1级

        this.stats = {
            hp: stats.hp,
            maxHp: stats.hp,
            attack: stats.attack,
            defense: stats.defense,
            attackSpeed: stats.attackSpeed,
            critRate: stats.critRate,
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
    }

    /**
     * 设置敌人外观 - 赛博朋克风格
     */
    private setupEnemyAppearance(): void {
        // 根据类型设置不同颜色和大小
        switch (this.enemyType) {
            case EnemyType.COMMON:
                this.setScale(0.9);
                this.createNeonGlow(0xff6600);
                break;
            case EnemyType.ELITE:
                this.setScale(1.1);
                this.createNeonGlow(0x6600ff);
                break;
            case EnemyType.BOSS:
                this.setScale(1.4);
                this.createNeonGlow(0xff0066);
                break;
        }
    }

    /**
     * 创建霓虹发光效果
     */
    private createNeonGlow(color: number): void {
        // 发光效果
        const glow = this.scene.add.graphics();
        glow.fillStyle(color, 0.1);
        glow.fillCircle(0, 0, 30);
        glow.x = this.x;
        glow.y = this.y;
        this.setData('glow', glow);

        // 发光脉冲动画
        this.scene.tweens.add({
            targets: glow,
            alpha: { from: 0.1, to: 0.2 },
            duration: 800,
            yoyo: true,
            repeat: -1
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
    }

    /**
     * 检查是否超出世界边界太远
     */
    private checkBounds(): void {
        const margin = 200;
        if (this.x < -margin || this.x > GAME_CONFIG.worldWidth + margin ||
            this.y < -margin || this.y > GAME_CONFIG.worldHeight + margin) {
            // 敌人超出边界太远，销毁它
            this.destroy();
        }
    }

    /**
     * 更新AI行为
     */
    private updateAI(time: number, delta: number): void {
        switch (this.aiState) {
            case 'idle':
                this.idle();
                break;
            case 'chase':
                this.chase(delta);
                break;
            case 'attack':
                this.attack(time, delta);
                break;
            case 'stunned':
                // 眩晕状态下不移动
                const body = this.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(0, 0);
                break;
        }
    }

    /**
     * 空闲状态
     */
    private idle(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);

        // 如果有目标，切换到追踪状态
        if (this.target) {
            this.aiState = 'chase';
        }
    }

    /**
     * 追击行为
     */
    private chase(delta: number): void {
        if (!this.target) {
            this.aiState = 'idle';
            return;
        }

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.target.x, this.target.y
        );

        // 检查攻击范围
        if (distance < this.attackRange) {
            this.aiState = 'attack';
            return;
        }

        // 持续追踪目标，不设置追踪范围限制
        // 移动向目标
        const direction = new Phaser.Math.Vector2(
            this.target.x - this.x,
            this.target.y - this.y
        );
        direction.normalize();

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(
            direction.x * this.stats.moveSpeed,
            direction.y * this.stats.moveSpeed
        );

        // 面向目标
        if (direction.x < 0) {
            this.setFlipX(true);
        } else {
            this.setFlipX(false);
        }
    }

    /**
     * 攻击行为
     */
    private attack(time: number, delta: number): void {
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
            return;
        }

        // 停止移动
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);

        // 检查攻击冷却
        if (!CombatSystem.canAttack(this.combatState.lastAttackTime, this.stats.attackSpeed, time)) {
            return;
        }

        // 执行攻击
        this.performAttack(time);
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
            this.combatState.isAttacking = false;
            this.setupEnemyAppearance(); // 恢复原有颜色
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

    /**
     * 死亡 - 赛博朋克爆炸效果
     */
    private die(): void {
        // 销毁发光效果
        const glow = this.getData('glow') as Phaser.GameObjects.Graphics;
        if (glow) {
            glow.destroy();
        }

        // 触发敌人被击败事件
        this.scene.events.emit('enemyDefeated', this);

        // 创建死亡爆炸效果
        this.createDeathExplosion();

        // 播放死亡动画
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
    }

    /**
     * 创建死亡爆炸效果
     */
    private createDeathExplosion(): void {
        // 确定颜色
        let color: number;
        switch (this.enemyType) {
            case EnemyType.COMMON:
                color = 0xff6600;
                break;
            case EnemyType.ELITE:
                color = 0x6600ff;
                break;
            case EnemyType.BOSS:
                color = 0xff0066;
                break;
            default:
                color = 0xff6600;
        }

        // 爆炸光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, color, 1);
        ring.strokeCircle(0, 0, 10);
        ring.x = this.x;
        ring.y = this.y;

        this.scene.tweens.add({
            targets: ring,
            scale: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => ring.destroy()
        });

        // 粒子爆炸
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                4,
                color,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 50,
                y: this.y + Math.sin(angle) * 50,
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // 闪光
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.8);
        flash.fillCircle(0, 0, 20);
        flash.x = this.x;
        flash.y = this.y;

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => flash.destroy()
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
                text.destroy();
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
            graphics.destroy();
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
}
