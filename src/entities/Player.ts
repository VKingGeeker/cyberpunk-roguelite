/**
 * 玩家实体类
 * 处理玩家的移动、攻击、技能、背包
 */

import Phaser from 'phaser';
import { CombatStats, CombatState } from '../core/Types';
import { GAME_CONFIG } from '../core/Config';
import { InventorySystem } from '../systems/InventorySystem';
import { SkillSystem } from '../systems/SkillSystem';
import { CombatSystem } from '../systems/CombatSystem';

export default class Player extends Phaser.GameObjects.Sprite {
    private stats: CombatStats;
    private combatState: CombatState;
    private inventory: InventorySystem;
    private skillSystem: SkillSystem;

    // 玩家数据
    private level: number = 1;
    private experience: number = 0;
    private maxExperience: number = 100;
    private skillPoints: number = 0;
    private killCount: number = 0;

    // 临时状态
    private tempShield: number = 0;
    private speedBoostTimer: number = 0;
    private speedBoostMultiplier: number = 1.0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // 使用临时占位图，实际开发中替换为资源图
        super(scene, x, y, 'player_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 初始化玩家属性
        this.initializeStats();

        // 初始化系统
        this.inventory = new InventorySystem();
        this.skillSystem = new SkillSystem();

        // 装备初始技能
        this.skillSystem.equipSkill('skill_slash', 0);
        this.skillSystem.equipSkill('skill_spin', 1);
        this.skillSystem.equipSkill('skill_dash', 2);

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);

        // 启用事件系统
        this.setupEventListeners();
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
            mana: GAME_CONFIG.player.baseMana,
            maxMana: GAME_CONFIG.player.baseMana,
            manaRegenPerSecond: GAME_CONFIG.player.manaRegenPerSecond
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
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 可以在这里添加玩家相关的事件监听
    }

    /**
     * 更新玩家状态
     */
    update(time: number, delta: number): void {
        if (this.combatState.isStunned) return;

        // 移动控制
        this.handleMovement(delta);

        // 攻击控制
        this.handleAttack(time, delta);

        // 技能控制
        this.handleSkills(time);

        // 状态更新
        this.updateStatus(delta);

        // 法力值恢复
        this.regenerateMana(delta);
    }

    /**
     * 处理移动
     */
    private handleMovement(delta: number): void {
        const cursors = this.scene.input.keyboard!.createCursorKeys();
        const velocity = new Phaser.Math.Vector2(0, 0);

        if (cursors.left.isDown) velocity.x = -1;
        if (cursors.right.isDown) velocity.x = 1;
        if (cursors.up.isDown) velocity.y = -1;
        if (cursors.down.isDown) velocity.y = 1;

        // 应用速度加成
        const effectiveSpeed = this.stats.moveSpeed * this.speedBoostMultiplier;

        velocity.normalize().scale(effectiveSpeed);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(velocity.x, velocity.y);
    }

    /**
     * 处理攻击
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
     * 执行攻击
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

        // 播放攻击动画（使用占位图）
        this.setTint(0xffffff);

        // 计算攻击范围
        const attackRange = GAME_CONFIG.combat.baseAttackRange;

        // 检测攻击范围内的敌人
        const enemies = this.scene.children.list.filter(
            (child: any) => child.constructor.name === 'Enemy'
        ) as any[];

        const comboBonus = CombatSystem.calculateComboBonus(this.combatState.comboCount);

        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < attackRange) {
                // 计算伤害
                const damageResult = CombatSystem.calculateDamage(this.stats, enemy.getStats());
                const finalDamage = Math.floor(damageResult.damage * comboBonus);

                // 对敌人造成伤害
                enemy.takeDamage(finalDamage);

                // 显示伤害数字
                this.showDamageNumber(enemy.x, enemy.y, finalDamage, damageResult.isCrit);
            }
        }

        // 攻击动画结束后恢复
        this.scene.time.delayedCall(200, () => {
            this.combatState.isAttacking = false;
            this.clearTint();
        });
    }

    /**
     * 处理技能释放
     */
    private handleSkills(time: number): void {
        const keys = this.scene.input.keyboard!;
        const skillKeys = [
            { key: keys.addKey(Phaser.Input.Keyboard.KeyCodes.ONE), index: 0 },
            { key: keys.addKey(Phaser.Input.Keyboard.KeyCodes.TWO), index: 1 },
            { key: keys.addKey(Phaser.Input.Keyboard.KeyCodes.THREE), index: 2 }
        ];

        for (const { key, index } of skillKeys) {
            if (key.isDown && keys.checkDown(key as any, 250)) {
                this.useSkill(index, time);
            }
        }
    }

    /**
     * 使用技能
     */
    public useSkill(slotIndex: number, time?: number): boolean {
        if (!time) {
            time = this.scene.time.now;
        }

        const skill = this.skillSystem.useSkill(slotIndex, time);
        if (!skill) return false;

        // 检查法力值
        if (this.stats.mana! < skill.manaCost) {
            console.log('Not enough mana');
            return false;
        }

        // 消耗法力值
        this.stats.mana! -= skill.manaCost;

        // 执行技能效果
        this.executeSkillEffect(skill);

        // 触发技能使用事件
        this.scene.events.emit('skillUsed', {
            skillIndex: slotIndex,
            cooldown: skill.cooldown
        });

        return true;
    }

    /**
     * 执行技能效果
     */
    private executeSkillEffect(skill: any): void {
        const enemies = this.scene.children.list.filter(
            (child: any) => child.constructor.name === 'Enemy'
        ) as any[];

        switch (skill.id) {
            case 'skill_slash':
                this.executeSlashSkill(skill, enemies);
                break;
            case 'skill_spin':
                this.executeSpinSkill(skill, enemies);
                break;
            case 'skill_dash':
                this.executeDashSkill(skill, enemies);
                break;
            case 'skill_heal':
                this.executeHealSkill(skill);
                break;
            case 'skill_shield':
                this.executeShieldSkill(skill);
                break;
        }
    }

    /**
     * 横扫斩技能
     */
    private executeSlashSkill(skill: any, enemies: any[]): void {
        // 创建攻击范围
        const attackAngle = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.scene.input.activePointer.x + this.scene.cameras.main.scrollX,
            this.scene.input.activePointer.y + this.scene.cameras.main.scrollY
        );

        for (const enemy of enemies) {
            const enemyAngle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
            const angleDiff = Math.abs(enemyAngle - attackAngle);

            // 扇形范围检测（60度）
            if (angleDiff < Math.PI / 6) {
                const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                if (distance < skill.effect.range) {
                    const damageResult = CombatSystem.calculateSkillDamage(
                        this.stats,
                        enemy.getStats(),
                        skill.effect.damage
                    );
                    enemy.takeDamage(damageResult.damage);
                    this.showDamageNumber(enemy.x, enemy.y, damageResult.damage, damageResult.isCrit);
                }
            }
        }

        // 播放特效
        this.createSlashEffect(attackAngle);
    }

    /**
     * 旋风斩技能
     */
    private executeSpinSkill(skill: any, enemies: any[]): void {
        const duration = skill.effect.duration * 1000;
        const interval = 200; // 每200毫秒造成一次伤害
        let elapsed = 0;

        const timer = this.scene.time.addEvent({
            delay: interval,
            callback: () => {
                elapsed += interval;

                for (const enemy of enemies) {
                    const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                    if (distance < 100) {
                        const damageResult = CombatSystem.calculateSkillDamage(
                            this.stats,
                            enemy.getStats(),
                            skill.effect.damage
                        );
                        enemy.takeDamage(damageResult.damage);
                        this.showDamageNumber(enemy.x, enemy.y, damageResult.damage, damageResult.isCrit);
                    }
                }

                if (elapsed >= duration) {
                    timer.remove();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * 闪现突袭技能
     */
    private executeDashSkill(skill: any, enemies: any[]): void {
        // 寻找最近的敌人
        let nearestEnemy: any = null;
        let nearestDistance = Infinity;

        for (const enemy of enemies) {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < nearestDistance && distance < 400) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }

        if (nearestEnemy) {
            // 瞬移到敌人身后
            const angle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
            const targetX = nearestEnemy.x - Math.cos(angle) * 50;
            const targetY = nearestEnemy.y - Math.sin(angle) * 50;

            this.x = targetX;
            this.y = targetY;

            // 造成伤害
            const damageResult = CombatSystem.calculateSkillDamage(
                this.stats,
                nearestEnemy.getStats(),
                skill.effect.damage
            );
            nearestEnemy.takeDamage(damageResult.damage);
            this.showDamageNumber(nearestEnemy.x, nearestEnemy.y, damageResult.damage, damageResult.isCrit);

            // 播放特效
            this.createDashEffect(this.x, this.y);
        }
    }

    /**
     * 治疗技能
     */
    private executeHealSkill(skill: any): void {
        const healAmount = CombatSystem.calculateHealAmount(this.stats.maxHp, skill.effect.healValue);
        this.heal(healAmount);
        this.showHealEffect();
    }

    /**
     * 护盾技能
     */
    private executeShieldSkill(skill: any): void {
        this.tempShield = skill.effect.shieldValue;
        this.showShieldEffect();
    }

    /**
     * 更新状态
     */
    private updateStatus(delta: number): void {
        // 更新速度加成
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= delta;
            if (this.speedBoostTimer <= 0) {
                this.speedBoostMultiplier = 1.0;
            }
        }

        // 临时护盾自然衰减
        if (this.tempShield > 0) {
            // 护盾持续期间保持不变，受伤时扣除
        }
    }

    /**
     * 法力值恢复
     */
    private regenerateMana(delta: number): void {
        if (this.stats.mana! < this.stats.maxMana!) {
            this.stats.mana! += this.stats.manaRegenPerSecond! * (delta / 1000);
            this.stats.mana = Math.min(this.stats.mana, this.stats.maxMana);

            // 触发UI更新
            this.scene.events.emit('updateMana', this.stats.mana, this.stats.maxMana);
        }
    }

    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        // 先扣除护盾
        let remainingDamage = damage;
        if (this.tempShield > 0) {
            if (this.tempShield >= remainingDamage) {
                this.tempShield -= remainingDamage;
                remainingDamage = 0;
            } else {
                remainingDamage -= this.tempShield;
                this.tempShield = 0;
            }
        }

        // 扣除生命值
        this.stats.hp -= remainingDamage;
        this.stats.hp = Math.max(this.stats.hp, 0);

        // 更新UI
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);

        // 播放受伤特效
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // 检查死亡
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    /**
     * 治疗
     */
    private heal(amount: number): void {
        this.stats.hp += amount;
        this.stats.hp = Math.min(this.stats.hp, this.stats.maxHp);

        // 更新UI
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
    }

    /**
     * 死亡
     */
    private die(): void {
        // 触发死亡事件
        this.emit('playerDeath');
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

        // 检查升级
        while (this.experience >= this.maxExperience) {
            this.experience -= this.maxExperience;
            this.levelUp();
        }

        // 更新UI
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

        // 更新UI
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
        this.scene.events.emit('updateExperience', this.experience, this.maxExperience, this.level);

        // 播放升级特效
        this.createLevelUpEffect();
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
            fontSize: isCrit ? '32px' : '24px',
            fontStyle: 'bold',
            color: isCrit ? '#ffff00' : '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        text.setOrigin(0.5);

        // 动画效果
        this.scene.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    /**
     * 显示治疗特效
     */
    private showHealEffect(): void {
        const circle = this.scene.add.circle(this.x, this.y, 30, 0x44ff44, 0.5);
        this.scene.tweens.add({
            targets: circle,
            scale: 2,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                circle.destroy();
            }
        });
    }

    /**
     * 显示护盾特效
     */
    private showShieldEffect(): void {
        const shield = this.scene.add.circle(this.x, this.y, 25, 0x4444ff, 0.3);
        this.scene.tweens.add({
            targets: shield,
            alpha: 0.6,
            duration: 300,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 创建横扫斩特效
     */
    private createSlashEffect(angle: number): void {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, 0x00ffff, 0.8);
        
        // 计算旋转后的坐标
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const len = 150;
        
        // 绘制扇形效果
        graphics.beginPath();
        graphics.moveTo(this.x, this.y);
        graphics.lineTo(this.x + len * cos - (-30) * sin, this.y + len * sin + (-30) * cos);
        graphics.lineTo(this.x + len * cos - (30) * sin, this.y + len * sin + (30) * cos);
        graphics.closePath();
        graphics.strokePath();

        this.scene.time.delayedCall(200, () => {
            graphics.destroy();
        });
    }

    /**
     * 创建闪现特效
     */
    private createDashEffect(x: number, y: number): void {
        const circle = this.scene.add.circle(x, y, 20, 0x8800ff, 0.6);
        this.scene.tweens.add({
            targets: circle,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                circle.destroy();
            }
        });
    }

    /**
     * 创建升级特效
     */
    private createLevelUpEffect(): void {
        const text = this.scene.add.text(this.x, this.y - 50, 'LEVEL UP!', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffaa00',
            fontFamily: 'Courier New, monospace'
        });
        text.setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                text.destroy();
            }
        });
    }
}
