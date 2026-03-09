/**
 * 玩家实体类
 * 处理玩家的移动、攻击、被动技能、背包
 */

import Phaser from 'phaser';
import { CombatStats, CombatState } from '../core/Types';
import { GAME_CONFIG } from '../core/Config';
import { InventorySystem } from '../systems/InventorySystem';
import { SkillSystem } from '../systems/SkillSystem';
import { CombatSystem } from '../systems/CombatSystem';

export default class Player extends Phaser.GameObjects.Sprite {
    private stats!: CombatStats;
    private combatState!: CombatState;
    private inventory!: InventorySystem;
    private skillSystem!: SkillSystem;

    // 玩家数据
    private level: number = 1;
    private experience: number = 0;
    private maxExperience: number = 100;
    private skillPoints: number = 0;
    private killCount: number = 0;
    private isDead: boolean = false;
    private invincibleTime: number = 0; // 无敌时间（毫秒）

    // 被动技能冷却
    private passiveSkillCooldowns: Map<string, number> = new Map();

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 初始化玩家属性
        this.initializeStats();

        // 初始化系统
        this.inventory = new InventorySystem();
        this.skillSystem = new SkillSystem();

        // 装备初始被动技能
        this.skillSystem.equipSkill('skill_slash', 0);
        this.skillSystem.equipSkill('skill_spin', 1);
        this.skillSystem.equipSkill('skill_dash', 2);

        // 初始化被动技能冷却
        this.passiveSkillCooldowns.set('skill_slash', 0);
        this.passiveSkillCooldowns.set('skill_spin', 0);
        this.passiveSkillCooldowns.set('skill_dash', 0);

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);
    }

    /**
     * 初始化玩家属性
     */
    private initializeStats(): void {
        this.stats = {
            hp: GAME_CONFIG.player.baseHp,
            maxHp: GAME_CONFIG.player.baseHp,
            attack: GAME_CONFIG.player.baseAttack,
            defense: GAME_CONFIG.player.baseDefense,
            attackSpeed: 1.0,
            critRate: GAME_CONFIG.player.baseCritRate,
            critDamage: GAME_CONFIG.player.baseCritDamage,
            moveSpeed: GAME_CONFIG.player.baseMoveSpeed,
            mana: 0,
            maxMana: 0,
            manaRegenPerSecond: 0
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
     * 更新玩家状态
     */
    update(time: number, delta: number): void {
        if (this.combatState.isStunned || this.isDead) return;

        // 更新无敌时间
        if (this.invincibleTime > 0) {
            this.invincibleTime -= delta;
            // 无敌时闪烁效果
            this.setAlpha(Math.sin(time * 0.02) * 0.3 + 0.7);
            if (this.invincibleTime <= 0) {
                this.invincibleTime = 0;
                this.setAlpha(1);
            }
        }

        // 移动控制
        this.handleMovement(delta);

        // 攻击控制（鼠标点击）
        this.handleAttack(time, delta);

        // 被动技能自动触发
        this.handlePassiveSkills(time);

        // 更新 UI
        this.updateUI();
    }

    /**
     * 处理移动
     */
    private handleMovement(delta: number): void {
        const cursors = this.scene.input.keyboard!.createCursorKeys();
        const keyW = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        const keyA = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        const keyS = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        const keyD = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        const velocity = new Phaser.Math.Vector2(0, 0);

        if (cursors.left.isDown || keyA.isDown) velocity.x = -1;
        if (cursors.right.isDown || keyD.isDown) velocity.x = 1;
        if (cursors.up.isDown || keyW.isDown) velocity.y = -1;
        if (cursors.down.isDown || keyS.isDown) velocity.y = 1;

        velocity.normalize().scale(this.stats.moveSpeed);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(velocity.x, velocity.y);

        // 根据移动方向翻转
        if (velocity.x < 0) {
            this.setFlipX(true);
        } else if (velocity.x > 0) {
            this.setFlipX(false);
        }
    }

    /**
     * 处理普通攻击
     */
    private handleAttack(time: number, delta: number): void {
        if (!this.scene.input.activePointer.isDown) return;
        if (this.combatState.isAttacking) return;

        // 检查攻击冷却
        if (!CombatSystem.canAttack(this.combatState.lastAttackTime, this.stats.attackSpeed, time)) {
            return;
        }

        this.performAttack(time);
    }

    /**
     * 执行普通攻击
     */
    private performAttack(time: number): void {
        this.combatState.lastAttackTime = time;
        this.combatState.isAttacking = true;

        // 检查连击
        if (!CombatSystem.isComboTimeout(this.combatState.lastComboTime, time)) {
            this.combatState.comboCount++;
        } else {
            this.combatState.comboCount = 1;
        }
        this.combatState.lastComboTime = time;

        // 攻击范围
        const attackRange = 60;

        // 获取附近敌人
        const enemies = this.getNearbyEnemies(attackRange);
        const comboBonus = CombatSystem.calculateComboBonus(this.combatState.comboCount);

        for (const enemy of enemies) {
            const damageResult = CombatSystem.calculateDamage(this.stats, enemy.getStats());
            const finalDamage = Math.floor(damageResult.damage * comboBonus);
            enemy.takeDamage(finalDamage);
            this.showDamageNumber(enemy.x, enemy.y, finalDamage, damageResult.isCrit);
        }

        // 攻击动画
        this.setTint(0xffffff);
        this.scene.time.delayedCall(150, () => {
            this.combatState.isAttacking = false;
            this.clearTint();
        });
    }

    /**
     * 处理被动技能自动触发
     */
    private handlePassiveSkills(time: number): void {
        const enemies = this.getNearbyEnemies(200);
        if (enemies.length === 0) return;

        // 横扫斩 - 对前方敌人造成伤害
        this.tryTriggerPassiveSkill('skill_slash', time, 2000, () => {
            this.triggerSlashSkill(enemies);
        });

        // 旋风斩 - 对周围敌人造成范围伤害
        this.tryTriggerPassiveSkill('skill_spin', time, 5000, () => {
            this.triggerSpinSkill();
        });

        // 闪现突袭 - 瞬移到最近敌人身后
        this.tryTriggerPassiveSkill('skill_dash', time, 8000, () => {
            this.triggerDashSkill(enemies);
        });
    }

    /**
     * 尝试触发被动技能
     */
    private tryTriggerPassiveSkill(skillId: string, time: number, cooldown: number, action: () => void): void {
        const lastUsed = this.passiveSkillCooldowns.get(skillId) || 0;
        if (time - lastUsed >= cooldown) {
            this.passiveSkillCooldowns.set(skillId, time);
            action();
        }
    }

    /**
     * 触发横扫斩技能
     */
    private triggerSlashSkill(enemies: any[]): void {
        const range = 100;
        const nearbyEnemies = enemies.filter(e => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
            return dist < range;
        });

        if (nearbyEnemies.length === 0) return;

        // 对每个敌人造成伤害
        for (const enemy of nearbyEnemies) {
            const damageResult = CombatSystem.calculateSkillDamage(this.stats, enemy.getStats(), 1.5);
            enemy.takeDamage(Math.floor(damageResult.damage));
            this.showDamageNumber(enemy.x, enemy.y, Math.floor(damageResult.damage), damageResult.isCrit);
        }

        // 显示特效
        this.createSkillEffect('slash', range);
    }

    /**
     * 触发旋风斩技能
     */
    private triggerSpinSkill(): void {
        const range = 120;
        const enemies = this.getNearbyEnemies(range);

        for (const enemy of enemies) {
            const damageResult = CombatSystem.calculateSkillDamage(this.stats, enemy.getStats(), 2.0);
            enemy.takeDamage(Math.floor(damageResult.damage));
            this.showDamageNumber(enemy.x, enemy.y, Math.floor(damageResult.damage), damageResult.isCrit);
        }

        // 显示特效
        this.createSkillEffect('spin', range);
    }

    /**
     * 触发闪现突袭技能
     */
    private triggerDashSkill(enemies: any[]): void {
        // 找到最近的敌人
        let nearestEnemy: any = null;
        let nearestDistance = Infinity;

        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < nearestDistance && distance > 150 && distance < 400) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }

        if (!nearestEnemy) return;

        // 瞬移到敌人位置（保持更远距离）
        const angle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
        this.x = nearestEnemy.x - Math.cos(angle) * 60; // 改为60像素距离
        this.y = nearestEnemy.y - Math.sin(angle) * 60;

        // 给玩家短暂无敌时间（1秒）
        this.invincibleTime = 1000;

        // 造成伤害
        const damageResult = CombatSystem.calculateSkillDamage(this.stats, nearestEnemy.getStats(), 3.0);
        nearestEnemy.takeDamage(Math.floor(damageResult.damage));
        this.showDamageNumber(nearestEnemy.x, nearestEnemy.y, Math.floor(damageResult.damage), damageResult.isCrit);

        // 眩晕敌人
        if (nearestEnemy.stun) {
            nearestEnemy.stun(500);
        }

        // 显示特效
        this.createSkillEffect('dash', 50);
    }

    /**
     * 创建技能特效
     */
    private createSkillEffect(type: string, range: number): void {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, 0x00ffff, 0.8);

        if (type === 'slash') {
            graphics.strokeCircle(this.x, this.y, range);
        } else if (type === 'spin') {
            graphics.strokeCircle(this.x, this.y, range);
        } else if (type === 'dash') {
            graphics.fillStyle(0x00ffff, 0.3);
            graphics.fillCircle(this.x, this.y, range);
        }

        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => graphics.destroy()
        });
    }

    /**
     * 获取附近敌人
     */
    private getNearbyEnemies(range: number): any[] {
        return this.scene.children.list.filter((child: any) => {
            if (child.constructor.name !== 'Enemy') return false;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
            return dist < range;
        }) as any[];
    }

    /**
     * 更新 UI
     */
    private updateUI(): void {
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
    }

    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        if (this.isDead) return;

        // 无敌时间内不受伤害
        if (this.invincibleTime > 0) {
            return;
        }

        // 计算实际伤害
        const actualDamage = Math.max(1, damage - this.stats.defense);
        this.stats.hp -= actualDamage;
        this.stats.hp = Math.max(this.stats.hp, 0);

        // 更新UI
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);

        // 播放受伤特效
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // 显示伤害数字
        this.showDamageNumber(this.x, this.y - 30, actualDamage, false);

        // 检查死亡
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    /**
     * 治疗
     */
    public heal(amount: number): void {
        this.stats.hp = Math.min(this.stats.hp + amount, this.stats.maxHp);
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
    }

    /**
     * 死亡
     */
    private die(): void {
        if (this.isDead) return;
        this.isDead = true;

        // 停止移动
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);

        // 触发死亡事件
        this.emit('playerDeath');
    }

    /**
     * 重置玩家状态
     */
    public reset(): void {
        this.isDead = false;
        this.invincibleTime = 0;
        this.setAlpha(1);
        this.initializeStats();
        this.killCount = 0;
        this.experience = 0;
        this.level = 1;
        this.passiveSkillCooldowns.set('skill_slash', 0);
        this.passiveSkillCooldowns.set('skill_spin', 0);
        this.passiveSkillCooldowns.set('skill_dash', 0);
    }

    /**
     * 添加物品到背包
     */
    public addItem(itemId: string, quantity: number = 1): boolean {
        return this.inventory.addItem(itemId, quantity);
    }

    /**
     * 增加经验值
     */
    public addExperience(amount: number): void {
        this.experience += amount;

        while (this.experience >= this.maxExperience) {
            this.experience -= this.maxExperience;
            this.levelUp();
        }

        this.scene.events.emit('updateExperience', this.experience, this.maxExperience, this.level);
    }

    /**
     * 升级
     */
    private levelUp(): void {
        this.level++;
        this.skillPoints++;
        this.maxExperience = Math.floor(this.maxExperience * 1.2);

        // 提升属性
        this.stats.maxHp += 10;
        this.stats.hp = this.stats.maxHp;
        this.stats.attack += 2;
        this.stats.defense += 1;

        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
        this.scene.events.emit('updateExperience', this.experience, this.maxExperience, this.level);
    }

    /**
     * 获取属性
     */
    public getStats(): CombatStats {
        return { ...this.stats };
    }

    /**
     * 获取背包系统
     */
    public getInventory(): InventorySystem {
        return this.inventory;
    }

    /**
     * 获取技能系统
     */
    public getSkillSystem(): SkillSystem {
        return this.skillSystem;
    }

    /**
     * 获取等级
     */
    public getLevel(): number {
        return this.level;
    }

    /**
     * 获取技能点
     */
    public getSkillPoints(): number {
        return this.skillPoints;
    }

    /**
     * 获取击杀数
     */
    public getKillCount(): number {
        return this.killCount;
    }

    /**
     * 增加击杀数
     */
    public addKill(): void {
        this.killCount++;
    }

    /**
     * 显示伤害数字
     */
    private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
        const text = this.scene.add.text(x, y, damage.toString(), {
            fontSize: isCrit ? '28px' : '20px',
            fontStyle: 'bold',
            color: isCrit ? '#ffff00' : '#ffffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.scene.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    /**
     * 检查是否已死亡
     */
    public getIsDead(): boolean {
        return this.isDead;
    }
}
