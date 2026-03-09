/**
 * 敌人实体类
 * 处理敌人的AI、移动、攻击、掉落
 */

import Phaser from 'phaser';
import { CombatStats, CombatState, EnemyType } from '../core/Types';
import { getEnemyTemplate, calculateEnemyStats, rollLoot } from '../data/Enemies';
import { CombatSystem } from '../systems/CombatSystem';
import { GAME_CONFIG } from '../core/Config';

export default class Enemy extends Phaser.GameObjects.Sprite {
    private stats: CombatStats;
    private combatState: CombatState;
    private enemyType: EnemyType;
    private aiState: 'patrol' | 'chase' | 'attack' | 'stunned' = 'patrol';
    private patrolTarget: Phaser.Math.Vector2;
    private target: any = null; // 目标玩家

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
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);

        // 设置巡逻目标
        this.patrolTarget = new Phaser.Math.Vector2(x, y);

        // 设置颜色区分不同类型敌人
        this.setupEnemyAppearance();
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
     * 设置敌人外观
     */
    private setupEnemyAppearance(): void {
        switch (this.enemyType) {
            case EnemyType.COMMON:
                this.setTint(0x666666); // 灰色
                break;
            case EnemyType.ELITE:
                this.setTint(0x4444ff); // 蓝色
                break;
            case EnemyType.BOSS:
                this.setTint(0xff4444); // 红色
                break;
        }
    }

    /**
     * 更新敌人状态
     */
    update(time: number, delta: number): void {
        if (this.combatState.isStunned) return;

        // 更新AI
        this.updateAI(time, delta);

        // 更新动画（如果需要）
    }

    /**
     * 更新AI行为
     */
    private updateAI(time: number, delta: number): void {
        // 寻找玩家目标
        this.findTarget();

        if (!this.target) {
            this.aiState = 'patrol';
        }

        switch (this.aiState) {
            case 'patrol':
                this.patrol(delta);
                break;
            case 'chase':
                this.chase(delta);
                break;
            case 'attack':
                this.attack(time, delta);
                break;
        }
    }

    /**
     * 寻找目标
     */
    private findTarget(): void {
        // 在场景中查找玩家
        const player = this.scene.children.list.find(
            (child: any) => child.constructor.name === 'Player'
        ) as any;

        if (player) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
            if (distance < 300) {
                this.target = player;
            } else {
                this.target = null;
            }
        }
    }

    /**
     * 巡逻行为
     */
    private patrol(delta: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // 检查是否到达巡逻点
        const distanceToTarget = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.patrolTarget.x, this.patrolTarget.y
        );

        if (distanceToTarget < 20) {
            // 随机选择新的巡逻点
            this.patrolTarget.setTo(
                Phaser.Math.Between(100, GAME_CONFIG.width - 100),
                Phaser.Math.Between(100, GAME_CONFIG.height - 100)
            );
        } else {
            // 移动向巡逻点
            const direction = new Phaser.Math.Vector2(
                this.patrolTarget.x - this.x,
                this.patrolTarget.y - this.y
            );
            direction.normalize().scale(this.stats.moveSpeed * 0.5);
            body.setVelocity(direction.x, direction.y);
        }
    }

    /**
     * 追击行为
     */
    private chase(delta: number): void {
        if (!this.target) {
            this.aiState = 'patrol';
            return;
        }

        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        // 检查攻击范围
        if (distance < GAME_CONFIG.combat.baseAttackRange) {
            this.aiState = 'attack';
            return;
        }

        // 检查是否超出追击范围
        if (distance > 400) {
            this.target = null;
            this.aiState = 'patrol';
            return;
        }

        // 移动向目标
        const direction = new Phaser.Math.Vector2(
            this.target.x - this.x,
            this.target.y - this.y
        );
        direction.normalize().scale(this.stats.moveSpeed);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(direction.x, direction.y);
    }

    /**
     * 攻击行为
     */
    private attack(time: number, delta: number): void {
        if (!this.target) {
            this.aiState = 'patrol';
            return;
        }

        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        // 检查是否超出攻击范围
        if (distance > GAME_CONFIG.combat.baseAttackRange) {
            this.aiState = 'chase';
            return;
        }

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

        // 播放攻击动画（使用占位图）
        this.setTint(0xffffff);

        // 计算伤害
        const damageResult = CombatSystem.calculateDamage(this.stats, this.target.getStats());
        const damage = damageResult.damage;

        // 对目标造成伤害
        this.target.takeDamage(damage);

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
        this.stats.hp -= damage;
        this.stats.hp = Math.max(this.stats.hp, 0);

        // 播放受伤特效
        this.setTint(0xffffff);
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
     * 死亡
     */
    private die(): void {
        // 触发敌人被击败事件
        this.scene.events.emit('enemyDefeated', this);

        // 播放死亡动画
        this.scene.tweens.add({
            targets: this,
            scale: { from: 1, to: 0 },
            alpha: { from: 1, to: 0 },
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
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
     * 显示伤害数字
     */
    private showDamageNumber(damage: number, isCrit: boolean): void {
        const text = this.scene.add.text(this.x, this.y, damage.toString(), {
            fontSize: isCrit ? '28px' : '20px',
            fontStyle: 'bold',
            color: isCrit ? '#ffff00' : '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        text.setOrigin(0.5);

        // 动画效果
        this.scene.tweens.add({
            targets: text,
            y: this.y - 30,
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
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, 0xff4444, 0.8);
        graphics.arc(
            this.x,
            this.y,
            30,
            0,
            Phaser.Math.PI2,
            false
        );
        graphics.strokePath();

        this.scene.time.delayedCall(200, () => {
            graphics.destroy();
        });
    }
}
