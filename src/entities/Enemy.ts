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
    private aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'retreat' | 'stunned' = 'idle';
    private target: Phaser.GameObjects.Sprite | null = null;
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
        // 更新冷却
        if (this.retreatCooldown > 0) {
            this.retreatCooldown -= delta;
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
                // 眩晕状态下不移动
                const body = this.body as Phaser.Physics.Arcade.Body;
                body.setVelocity(0, 0);
                break;
        }
    }

    /**
     * 空闲状态
     */
    private idle(time: number, delta: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);

        // 如果有目标，检查距离
        if (this.target) {
            const distance = Phaser.Math.Distance.Between(
                this.x, this.y,
                this.target.x, this.target.y
            );
            
            // 如果目标在追踪范围内，切换到追踪状态
            if (distance < this.chaseRange) {
                this.aiState = 'chase';
                return;
            }
        }

        // 随机进入巡逻状态
        this.patrolWaitTime -= delta;
        if (this.patrolWaitTime <= 0) {
            this.aiState = 'patrol';
            this.patrolTarget = new Phaser.Math.Vector2(
                this.x + Phaser.Math.Between(-200, 200),
                this.y + Phaser.Math.Between(-200, 200)
            );
            // 确保巡逻点在世界范围内
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

            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                direction.x * this.stats.moveSpeed * 0.5, // 巡逻时移动速度减半
                direction.y * this.stats.moveSpeed * 0.5
            );
        } else {
            this.aiState = 'idle';
        }
    }

    /**
     * 追击行为 - 增强版
     */
    private chase(time: number, delta: number): void {
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

        // 预测玩家移动位置
        let targetX = this.target.x;
        let targetY = this.target.y;

        // 如果目标有速度，预测其未来位置
        if ((this.target as any).body) {
            const targetBody = (this.target as any).body as Phaser.Physics.Arcade.Body;
            targetX += targetBody.velocity.x * this.predictionFactor;
            targetY += targetBody.velocity.y * this.predictionFactor;
        }

        // 计算移动方向
        const direction = new Phaser.Math.Vector2(
            targetX - this.x,
            targetY - this.y
        );
        direction.normalize();

        // 添加分离行为，避免敌人重叠
        const separation = this.calculateSeparation();
        direction.add(separation);
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

        // 如果距离太远，可能丢失目标
        if (distance > this.chaseRange * 1.5 && !this.isTargetInSight()) {
            this.aiState = 'idle';
            this.patrolWaitTime = 3000;
        }
    }

    /**
     * 计算分离向量 - 避免敌人重叠
     */
    private calculateSeparation(): Phaser.Math.Vector2 {
        const separation = new Phaser.Math.Vector2(0, 0);
        let neighborCount = 0;

        // 获取场景中所有敌人
        const enemies = (this.scene as any).enemies as Enemy[];
        if (!enemies) return separation;

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
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);

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
            onComplete: () => windup.destroy()
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

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(
            direction.x * this.stats.moveSpeed * 0.5,
            direction.y * this.stats.moveSpeed * 0.5
        );
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
