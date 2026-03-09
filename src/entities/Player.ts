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

    // 临时属性提升
    private temporaryBoosts: Map<string, { value: number; endTime: number }> = new Map();

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
     * 创建技能特效 - 赛博朋克霓虹风格
     */
    private createSkillEffect(type: string, range: number): void {
        if (type === 'slash') {
            // 能量斩 - 青色霓虹弧光
            this.createNeonSlashEffect(range);
        } else if (type === 'spin') {
            // 旋风斩 - 品红霓虹漩涡
            this.createNeonSpinEffect(range);
        } else if (type === 'dash') {
            // 闪现突袭 - 黄色闪电残影
            this.createNeonDashEffect(range);
        }
    }

    /**
     * 创建霓虹斩击特效
     */
    private createNeonSlashEffect(range: number): void {
        // 主弧光
        const arc = this.scene.add.graphics();
        arc.lineStyle(4, 0x00ffff, 1);
        arc.beginPath();
        arc.arc(this.x, this.y, range, -Math.PI * 0.75, Math.PI * 0.25, false);
        arc.strokePath();

        // 外层光晕
        const glow = this.scene.add.graphics();
        glow.lineStyle(8, 0x00ffff, 0.3);
        glow.beginPath();
        glow.arc(this.x, this.y, range + 5, -Math.PI * 0.75, Math.PI * 0.25, false);
        glow.strokePath();

        // 能量粒子
        for (let i = 0; i < 8; i++) {
            const angle = -Math.PI * 0.75 + (Math.PI * i) / 7;
            const particle = this.scene.add.circle(
                this.x + Math.cos(angle) * range,
                this.y + Math.sin(angle) * range,
                3,
                0x00ffff,
                1
            );
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 2,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        // 淡出动画
        this.scene.tweens.add({
            targets: [arc, glow],
            alpha: 0,
            scale: 1.3,
            duration: 400,
            onComplete: () => {
                arc.destroy();
                glow.destroy();
            }
        });

        // 屏幕震动
        this.scene.cameras.main.shake(100, 0.01);
    }

    /**
     * 创建霓虹旋风特效
     */
    private createNeonSpinEffect(range: number): void {
        // 多层旋转光环
        const layers = [
            { radius: range * 0.6, color: 0xff00ff, alpha: 0.8, width: 3 },
            { radius: range * 0.8, color: 0xff44ff, alpha: 0.6, width: 4 },
            { radius: range, color: 0xff88ff, alpha: 0.4, width: 5 }
        ];

        layers.forEach((layer, index) => {
            const ring = this.scene.add.graphics();
            ring.lineStyle(layer.width, layer.color, layer.alpha);
            ring.strokeCircle(this.x, this.y, layer.radius);

            this.scene.tweens.add({
                targets: ring,
                rotation: Math.PI * 2 * (index % 2 === 0 ? 1 : -1),
                alpha: 0,
                scale: 1.5,
                duration: 500,
                onComplete: () => ring.destroy()
            });
        });

        // 中心爆发
        const burst = this.scene.add.graphics();
        burst.fillStyle(0xff00ff, 0.5);
        burst.fillCircle(this.x, this.y, 20);
        
        this.scene.tweens.add({
            targets: burst,
            alpha: 0,
            scale: 3,
            duration: 400,
            onComplete: () => burst.destroy()
        });

        // 能量线条
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const line = this.scene.add.graphics();
            line.lineStyle(2, 0xff00ff, 0.8);
            line.moveTo(this.x, this.y);
            line.lineTo(this.x + Math.cos(angle) * range, this.y + Math.sin(angle) * range);
            line.strokePath();

            this.scene.tweens.add({
                targets: line,
                alpha: 0,
                duration: 300,
                delay: i * 20,
                onComplete: () => line.destroy()
            });
        }

        // 屏幕震动
        this.scene.cameras.main.shake(150, 0.015);
    }

    /**
     * 创建霓虹闪现特效
     */
    private createNeonDashEffect(range: number): void {
        // 闪电残影
        const lightning = this.scene.add.graphics();
        lightning.lineStyle(3, 0xffff00, 1);

        // 绘制闪电形状
        const points: { x: number; y: number }[] = [];
        const segments = 8;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            points.push({
                x: this.x + offsetX + Math.sin(t * Math.PI * 4) * 5,
                y: this.y + offsetY - t * 30
            });
        }

        lightning.beginPath();
        lightning.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            lightning.lineTo(points[i].x, points[i].y);
        }
        lightning.strokePath();

        // 光晕
        const glow = this.scene.add.graphics();
        glow.fillStyle(0xffff00, 0.3);
        glow.fillCircle(this.x, this.y, range * 2);

        // 冲击波
        const wave = this.scene.add.graphics();
        wave.lineStyle(4, 0xffff00, 0.8);
        wave.strokeCircle(this.x, this.y, 10);

        this.scene.tweens.add({
            targets: wave,
            scale: 8,
            alpha: 0,
            duration: 500,
            onComplete: () => wave.destroy()
        });

        // 粒子爆发
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                4,
                0xffff00,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 60,
                y: this.y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        // 淡出
        this.scene.tweens.add({
            targets: [lightning, glow],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                lightning.destroy();
                glow.destroy();
            }
        });

        // 屏幕震动
        this.scene.cameras.main.shake(80, 0.02);
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
     * 获取属性（包含临时加成）
     */
    public getStats(): CombatStats {
        const now = this.scene.time.now;
        const result = { ...this.stats };

        // 应用临时加成
        this.temporaryBoosts.forEach((boost, key) => {
            if (now < boost.endTime) {
                switch (key) {
                    case 'attack':
                        result.attack += boost.value;
                        break;
                    case 'defense':
                        result.defense += boost.value;
                        break;
                    case 'speed':
                        result.moveSpeed *= (1 + boost.value);
                        break;
                    case 'crit':
                        result.critRate += boost.value;
                        break;
                }
            }
        });

        return result;
    }

    /**
     * 应用临时属性提升
     */
    public applyTemporaryBoost(type: string, value: number, duration: number): void {
        const endTime = this.scene.time.now + duration;
        this.temporaryBoosts.set(type, { value, endTime });

        // 显示提升效果
        this.showBoostEffect(type, value, duration);
    }

    /**
     * 显示提升效果
     */
    private showBoostEffect(type: string, value: number, duration: number): void {
        const colors: Record<string, number> = {
            attack: 0xff4444,
            defense: 0x4444ff,
            speed: 0xffff44,
            crit: 0xff44ff
        };

        const names: Record<string, string> = {
            attack: '攻击力',
            defense: '防御力',
            speed: '速度',
            crit: '暴击率'
        };

        const text = this.scene.add.text(this.x, this.y - 40, `${names[type]} ↑`, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${(colors[type] || 0xffffff).toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 70,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
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
