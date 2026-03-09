/**
 * 玩家实体类
 * 处理玩家的移动、攻击、被动技能、背包
 */

import Phaser from 'phaser';
import { CombatStats, CombatState, Skill } from '../core/Types';
import { GAME_CONFIG } from '../core/Config';
import { InventorySystem } from '../systems/InventorySystem';
import { CombatSystem } from '../systems/CombatSystem';
import { getSkillById, getSkillColor, SKILL_UPGRADE_DATA } from '../data/Skills';

export default class Player extends Phaser.GameObjects.Sprite {
    private stats!: CombatStats;
    private combatState!: CombatState;
    private inventory!: InventorySystem;

    // 玩家数据
    private level: number = 1;
    private experience: number = 0;
    private maxExperience: number = 100;
    private killCount: number = 0;
    private isDead: boolean = false;
    private invincibleTime: number = 0;

    // 技能系统
    private ownedSkills: Map<string, { skill: Skill; cooldownEndTime: number }> = new Map();

    // 临时属性提升
    private temporaryBoosts: Map<string, { value: number; endTime: number }> = new Map();

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player_idle');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 初始化玩家属性
        this.initializeStats();

        // 初始化系统
        this.inventory = new InventorySystem();

        // 初始技能（1级时获得第一个技能）
        this.grantRandomSkill();

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);

        // 监听技能选择事件
        scene.events.on('skillSelected', this.onSkillSelected, this);
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
     * 随机获得一个技能
     */
    private grantRandomSkill(): void {
        const availableSkills = ['skill_neon_slash', 'skill_plasma_spin', 'skill_chain_lightning', 
                                  'skill_laser_beam', 'skill_nanobot_shield', 'skill_emp_burst',
                                  'skill_overdrive', 'skill_hologram'];
        const randomSkillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        this.learnSkill(randomSkillId);
    }

    /**
     * 学习技能
     */
    public learnSkill(skillId: string): void {
        const skillData = getSkillById(skillId);
        if (!skillData) return;

        const skill: Skill = { ...skillData, level: 1, lastUsedTime: 0 };
        this.ownedSkills.set(skillId, { skill, cooldownEndTime: 0 });
        
        // 显示学习提示
        this.showSkillLearnedText(skill.name, getSkillColor(skillId));
        
        // 发射技能学习事件
        this.scene.events.emit('skill-changed');
    }

    /**
     * 升级技能
     */
    public upgradeSkill(skillId: string): void {
        const owned = this.ownedSkills.get(skillId);
        if (!owned) return;

        const maxLevel = owned.skill.maxLevel || 5;
        if (owned.skill.level >= maxLevel) return;

        owned.skill.level++;
        
        // 显示升级提示
        this.showSkillUpgradedText(owned.skill.name, owned.skill.level, getSkillColor(skillId));
        
        // 发射技能升级事件
        this.scene.events.emit('skill-changed');
    }

    /**
     * 技能选择回调
     */
    private onSkillSelected(skillId: string, isNew: boolean): void {
        if (isNew) {
            this.learnSkill(skillId);
        } else {
            this.upgradeSkill(skillId);
        }
    }

    /**
     * 显示学习技能文字
     */
    private showSkillLearnedText(skillName: string, color: number): void {
        const text = this.scene.add.text(this.x, this.y - 60, `习得新技能: ${skillName}`, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 显示升级技能文字
     */
    private showSkillUpgradedText(skillName: string, level: number, color: number): void {
        const text = this.scene.add.text(this.x, this.y - 60, `${skillName} → Lv.${level}`, {
            fontSize: '18px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 更新玩家状态
     */
    update(time: number, delta: number): void {
        if (this.combatState.isStunned || this.isDead) return;

        // 更新无敌时间
        if (this.invincibleTime > 0) {
            this.invincibleTime -= delta;
            this.setAlpha(Math.sin(time * 0.02) * 0.3 + 0.7);
            if (this.invincibleTime <= 0) {
                this.invincibleTime = 0;
                this.setAlpha(1);
            }
        }

        // 移动控制
        this.handleMovement(delta);

        // 攻击控制
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

        const attackRange = 60;
        const enemies = this.getNearbyEnemies(attackRange);
        const comboBonus = CombatSystem.calculateComboBonus(this.combatState.comboCount);

        for (const enemy of enemies) {
            const damageResult = CombatSystem.calculateDamage(this.stats, enemy.getStats());
            const finalDamage = Math.floor(damageResult.damage * comboBonus);
            enemy.takeDamage(finalDamage);
            this.showDamageNumber(enemy.x, enemy.y, finalDamage, damageResult.isCrit);
        }

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
        const enemies = this.getNearbyEnemies(300);
        
        // 遍历所有已学技能
        this.ownedSkills.forEach((data, skillId) => {
            const { skill, cooldownEndTime } = data;
            
            // 检查冷却
            if (time < cooldownEndTime) return;
            
            // 检查是否有敌人在范围内
            if (enemies.length === 0) return;

            // 触发技能
            this.triggerSkill(skillId, skill, enemies, time);
        });
    }

    /**
     * 触发技能
     */
    private triggerSkill(skillId: string, skill: Skill, enemies: any[], time: number): void {
        // 计算冷却时间（根据等级减少）
        const upgradeData = SKILL_UPGRADE_DATA[skillId];
        let cooldownReduction = 0;
        if (upgradeData && skill.level > 1) {
            for (let i = 0; i < skill.level - 1; i++) {
                cooldownReduction += upgradeData[i].cooldownReduction;
            }
        }
        const finalCooldown = Math.max(0.5, skill.cooldown - cooldownReduction);
        
        // 设置冷却结束时间
        const owned = this.ownedSkills.get(skillId);
        if (owned) {
            owned.cooldownEndTime = time + finalCooldown * 1000;
        }

        // 根据技能类型触发效果
        switch (skillId) {
            case 'skill_neon_slash':
                this.triggerNeonSlash(skill, enemies);
                break;
            case 'skill_plasma_spin':
                this.triggerPlasmaSpin(skill, enemies);
                break;
            case 'skill_chain_lightning':
                this.triggerChainLightning(skill, enemies);
                break;
            case 'skill_laser_beam':
                this.triggerLaserBeam(skill, enemies);
                break;
            case 'skill_nanobot_shield':
                this.triggerNanobotShield(skill);
                break;
            case 'skill_emp_burst':
                this.triggerEmpBurst(skill, enemies);
                break;
            case 'skill_overdrive':
                this.triggerOverdrive(skill);
                break;
            case 'skill_hologram':
                this.triggerHologram(skill);
                break;
        }
    }

    /**
     * 霓虹斩击
     */
    private triggerNeonSlash(skill: Skill, enemies: any[]): void {
        const baseRange = skill.effect.range || 100;
        const range = this.getUpgradedRange(skill, baseRange);
        const baseDamage = skill.effect.damage || 1.5;
        const damage = this.getUpgradedDamage(skill, baseDamage);

        const nearbyEnemies = enemies.filter(e => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
            return dist < range;
        });

        for (const enemy of nearbyEnemies) {
            const damageResult = CombatSystem.calculateSkillDamage(this.stats, enemy.getStats(), damage);
            enemy.takeDamage(Math.floor(damageResult.damage));
            this.showDamageNumber(enemy.x, enemy.y, Math.floor(damageResult.damage), damageResult.isCrit);
        }

        this.createNeonSlashEffect(range);
    }

    /**
     * 等离子漩涡
     */
    private triggerPlasmaSpin(skill: Skill, enemies: any[]): void {
        const baseRange = skill.effect.range || 120;
        const range = this.getUpgradedRange(skill, baseRange);
        const baseDamage = skill.effect.damage || 2.0;
        const damage = this.getUpgradedDamage(skill, baseDamage);

        for (const enemy of enemies) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < range) {
                const damageResult = CombatSystem.calculateSkillDamage(this.stats, enemy.getStats(), damage);
                enemy.takeDamage(Math.floor(damageResult.damage));
                this.showDamageNumber(enemy.x, enemy.y, Math.floor(damageResult.damage), damageResult.isCrit);
            }
        }

        this.createPlasmaSpinEffect(range);
    }

    /**
     * 连锁闪电
     */
    private triggerChainLightning(skill: Skill, enemies: any[]): void {
        const chains = skill.effect.chains || 3;
        const baseDamage = skill.effect.damage || 1.2;
        const damage = this.getUpgradedDamage(skill, baseDamage);

        // 找最近的敌人开始连锁
        let targets = [...enemies].sort((a, b) => {
            const distA = Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y);
            const distB = Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y);
            return distA - distB;
        }).slice(0, chains);

        let lastX = this.x, lastY = this.y;
        const chainPositions: { x: number; y: number }[] = [{ x: this.x, y: this.y }];

        for (const enemy of targets) {
            const damageResult = CombatSystem.calculateSkillDamage(this.stats, enemy.getStats(), damage);
            enemy.takeDamage(Math.floor(damageResult.damage));
            this.showDamageNumber(enemy.x, enemy.y, Math.floor(damageResult.damage), damageResult.isCrit);
            chainPositions.push({ x: enemy.x, y: enemy.y });
            lastX = enemy.x;
            lastY = enemy.y;
        }

        this.createChainLightningEffect(chainPositions);
    }

    /**
     * 激光射线
     */
    private triggerLaserBeam(skill: Skill, enemies: any[]): void {
        const baseRange = skill.effect.range || 300;
        const range = this.getUpgradedRange(skill, baseRange);
        const baseDamage = skill.effect.damage || 1.8;
        const damage = this.getUpgradedDamage(skill, baseDamage);

        // 找最近的敌人作为目标方向
        const nearestEnemy = enemies.reduce((nearest, enemy) => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (!nearest || dist < nearest.dist) {
                return { enemy, dist };
            }
            return nearest;
        }, null as { enemy: any; dist: number } | null);

        if (!nearestEnemy) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.enemy.x, nearestEnemy.enemy.y);

        // 对直线上所有敌人造成伤害
        for (const enemy of enemies) {
            const enemyAngle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle));
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);

            if (dist < range && angleDiff < 0.3) {
                const damageResult = CombatSystem.calculateSkillDamage(this.stats, enemy.getStats(), damage);
                enemy.takeDamage(Math.floor(damageResult.damage));
                this.showDamageNumber(enemy.x, enemy.y, Math.floor(damageResult.damage), damageResult.isCrit);
            }
        }

        this.createLaserBeamEffect(angle, range);
    }

    /**
     * 纳米护盾
     */
    private triggerNanobotShield(skill: Skill): void {
        const healValue = (skill.effect.healValue || 10) * skill.level;
        this.heal(healValue);
        this.invincibleTime = (skill.effect.duration || 5) * 1000;
        this.createShieldEffect();
    }

    /**
     * EMP冲击波
     */
    private triggerEmpBurst(skill: Skill, enemies: any[]): void {
        const range = this.getUpgradedRange(skill, skill.effect.range || 150);
        const stunDuration = (skill.effect.stunDuration || 2) * 1000;
        const baseDamage = skill.effect.damage || 0.5;
        const damage = this.getUpgradedDamage(skill, baseDamage);

        for (const enemy of enemies) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < range) {
                const damageResult = CombatSystem.calculateSkillDamage(this.stats, enemy.getStats(), damage);
                enemy.takeDamage(Math.floor(damageResult.damage));
                if (enemy.stun) enemy.stun(stunDuration);
            }
        }

        this.createEmpBurstEffect(range);
    }

    /**
     * 超频驱动
     */
    private triggerOverdrive(skill: Skill): void {
        const speedBoost = (skill.effect.speedBoost || 0.5) * skill.level;
        const duration = (skill.effect.duration || 5) * 1000;
        this.applyTemporaryBoost('speed', speedBoost, duration);
        this.createOverdriveEffect();
    }

    /**
     * 全息幻影
     */
    private triggerHologram(skill: Skill): void {
        const duration = (skill.effect.duration || 4) * 1000;
        this.createHologramEffect(duration);
    }

    /**
     * 获取升级后的伤害
     */
    private getUpgradedRange(skill: Skill, baseRange: number): number {
        const upgradeData = SKILL_UPGRADE_DATA[skill.id];
        if (!upgradeData || skill.level <= 1) return baseRange;
        
        let rangeBonus = 0;
        for (let i = 0; i < skill.level - 1; i++) {
            rangeBonus += upgradeData[i].rangeBonus;
        }
        return baseRange + rangeBonus;
    }

    /**
     * 获取升级后的伤害
     */
    private getUpgradedDamage(skill: Skill, baseDamage: number): number {
        const upgradeData = SKILL_UPGRADE_DATA[skill.id];
        if (!upgradeData || skill.level <= 1) return baseDamage;
        
        let damageBonus = 0;
        for (let i = 0; i < skill.level - 1; i++) {
            damageBonus += upgradeData[i].damageBonus;
        }
        return baseDamage + damageBonus;
    }

    // ========== 技能特效 ==========

    /**
     * 霓虹斩击特效 - 炫酷版
     */
    private createNeonSlashEffect(range: number): void {
        // 多重弧光
        for (let i = 0; i < 3; i++) {
            const delay = i * 50;
            this.scene.time.delayedCall(delay, () => {
                const arc = this.scene.add.graphics();
                arc.lineStyle(4 - i, 0x00ffff, 1 - i * 0.2);
                arc.beginPath();
                arc.arc(this.x, this.y, range - i * 10, -Math.PI * 0.6, Math.PI * 0.1, false);
                arc.strokePath();

                this.scene.tweens.add({
                    targets: arc,
                    alpha: 0,
                    scale: 1.5 + i * 0.3,
                    duration: 400 - i * 50,
                    onComplete: () => arc.destroy()
                });
            });
        }

        // 能量粒子爆发
        for (let i = 0; i < 20; i++) {
            const angle = -Math.PI * 0.6 + (Math.PI * 0.7 * i) / 19;
            const particle = this.scene.add.circle(
                this.x + Math.cos(angle) * range * 0.5,
                this.y + Math.sin(angle) * range * 0.5,
                Phaser.Math.Between(2, 5),
                0x00ffff,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * range * 1.2,
                y: this.y + Math.sin(angle) * range * 1.2,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(200, 400),
                onComplete: () => particle.destroy()
            });
        }

        // 屏幕震动 + 闪光
        this.scene.cameras.main.shake(150, 0.02);
        this.scene.cameras.main.flash(100, 0, 255, 255, false, undefined, this.scene);
    }

    /**
     * 等离子漩涡特效 - 炫酷版
     */
    private createPlasmaSpinEffect(range: number): void {
        // 多层旋转光环
        const layers = [
            { radius: range * 0.5, color: 0xff00ff, alpha: 0.9, width: 4 },
            { radius: range * 0.7, color: 0xff44ff, alpha: 0.7, width: 5 },
            { radius: range * 0.9, color: 0xff88ff, alpha: 0.5, width: 6 },
            { radius: range * 1.1, color: 0xffaaff, alpha: 0.3, width: 7 }
        ];

        layers.forEach((layer, index) => {
            const ring = this.scene.add.graphics();
            ring.lineStyle(layer.width, layer.color, layer.alpha);
            ring.strokeCircle(this.x, this.y, layer.radius);
            ring.setDepth(50);

            this.scene.tweens.add({
                targets: ring,
                rotation: Math.PI * 4 * (index % 2 === 0 ? 1 : -1),
                alpha: 0,
                scale: 1.8,
                duration: 600,
                onComplete: () => ring.destroy()
            });
        });

        // 中心爆发
        const burst = this.scene.add.graphics();
        burst.fillStyle(0xff00ff, 0.8);
        burst.fillCircle(this.x, this.y, 30);
        
        this.scene.tweens.add({
            targets: burst,
            alpha: 0,
            scale: 5,
            duration: 500,
            onComplete: () => burst.destroy()
        });

        // 能量线条向外扩散
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const line = this.scene.add.graphics();
            line.lineStyle(3, 0xff00ff, 0.9);
            line.moveTo(this.x, this.y);
            line.lineTo(this.x + Math.cos(angle) * 20, this.y + Math.sin(angle) * 20);
            line.strokePath();

            this.scene.tweens.add({
                targets: line,
                scaleX: range / 10,
                scaleY: range / 10,
                alpha: 0,
                duration: 400,
                delay: i * 10,
                onComplete: () => line.destroy()
            });
        }

        // 粒子风暴
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const distance = Phaser.Math.Between(20, range);
            const particle = this.scene.add.circle(
                this.x + Math.cos(angle) * distance,
                this.y + Math.sin(angle) * distance,
                Phaser.Math.Between(2, 6),
                Phaser.Math.Between(0, 1) === 0 ? 0xff00ff : 0x00ffff,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.x,
                y: this.y,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(300, 600),
                delay: Phaser.Math.Between(0, 100),
                onComplete: () => particle.destroy()
            });
        }

        this.scene.cameras.main.shake(200, 0.03);
    }

    /**
     * 连锁闪电特效 - 炫酷版
     */
    private createChainLightningEffect(positions: { x: number; y: number }[]): void {
        // 绘制闪电路径
        for (let i = 0; i < positions.length - 1; i++) {
            const startX = positions[i].x;
            const startY = positions[i].y;
            const endX = positions[i + 1].x;
            const endY = positions[i + 1].y;

            // 主闪电
            const lightning = this.scene.add.graphics();
            lightning.lineStyle(4, 0xffff00, 1);
            
            // 绘制锯齿状闪电
            const segments = 10;
            lightning.moveTo(startX, startY);
            
            for (let j = 1; j < segments; j++) {
                const t = j / segments;
                const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 30;
                const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 30;
                lightning.lineTo(x, y);
            }
            lightning.lineTo(endX, endY);
            lightning.strokePath();

            // 外发光
            const glow = this.scene.add.graphics();
            glow.lineStyle(8, 0xffff00, 0.3);
            glow.moveTo(startX, startY);
            for (let j = 1; j < segments; j++) {
                const t = j / segments;
                const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 30;
                const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 30;
                glow.lineTo(x, y);
            }
            glow.lineTo(endX, endY);
            glow.strokePath();

            // 击中点爆发
            const burst = this.scene.add.graphics();
            burst.fillStyle(0xffffff, 1);
            burst.fillCircle(endX, endY, 15);
            
            this.scene.tweens.add({
                targets: burst,
                alpha: 0,
                scale: 3,
                duration: 200,
                onComplete: () => burst.destroy()
            });

            this.scene.tweens.add({
                targets: [lightning, glow],
                alpha: 0,
                duration: 300,
                delay: i * 100,
                onComplete: () => {
                    lightning.destroy();
                    glow.destroy();
                }
            });
        }

        // 闪光效果
        this.scene.cameras.main.flash(100, 255, 255, 0, false, undefined, this.scene);
    }

    /**
     * 激光射线特效 - 炫酷版
     */
    private createLaserBeamEffect(angle: number, range: number): void {
        const endX = this.x + Math.cos(angle) * range;
        const endY = this.y + Math.sin(angle) * range;

        // 主激光
        const laser = this.scene.add.graphics();
        laser.lineStyle(6, 0xff4400, 1);
        laser.moveTo(this.x, this.y);
        laser.lineTo(endX, endY);
        laser.strokePath();

        // 外发光
        const glow1 = this.scene.add.graphics();
        glow1.lineStyle(12, 0xff4400, 0.4);
        glow1.moveTo(this.x, this.y);
        glow1.lineTo(endX, endY);
        glow1.strokePath();

        const glow2 = this.scene.add.graphics();
        glow2.lineStyle(20, 0xff6600, 0.2);
        glow2.moveTo(this.x, this.y);
        glow2.lineTo(endX, endY);
        glow2.strokePath();

        // 起点爆发
        const startBurst = this.scene.add.graphics();
        startBurst.fillStyle(0xffffff, 1);
        startBurst.fillCircle(this.x, this.y, 20);
        
        this.scene.tweens.add({
            targets: startBurst,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => startBurst.destroy()
        });

        // 终点爆发
        const endBurst = this.scene.add.graphics();
        endBurst.fillStyle(0xff4400, 1);
        endBurst.fillCircle(endX, endY, 25);
        
        this.scene.tweens.add({
            targets: endBurst,
            alpha: 0,
            scale: 3,
            duration: 300,
            onComplete: () => endBurst.destroy()
        });

        // 激光拖尾粒子
        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const px = this.x + (endX - this.x) * t;
            const py = this.y + (endY - this.y) * t;
            
            const particle = this.scene.add.circle(
                px + (Math.random() - 0.5) * 20,
                py + (Math.random() - 0.5) * 20,
                Phaser.Math.Between(3, 8),
                0xff6600,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 30,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(200, 400),
                delay: i * 10,
                onComplete: () => particle.destroy()
            });
        }

        this.scene.tweens.add({
            targets: [laser, glow1, glow2],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                laser.destroy();
                glow1.destroy();
                glow2.destroy();
            }
        });

        this.scene.cameras.main.shake(100, 0.02);
    }

    /**
     * 护盾特效
     */
    private createShieldEffect(): void {
        const shield = this.scene.add.graphics();
        shield.lineStyle(4, 0x44ff44, 1);
        shield.strokeCircle(this.x, this.y, 40);
        shield.fillStyle(0x44ff44, 0.2);
        shield.fillCircle(this.x, this.y, 40);

        this.scene.tweens.add({
            targets: shield,
            alpha: 0.5,
            scale: 1.2,
            duration: 300,
            yoyo: true,
            repeat: 2,
            onComplete: () => shield.destroy()
        });
    }

    /**
     * EMP冲击波特效
     */
    private createEmpBurstEffect(range: number): void {
        // EMP波纹
        for (let i = 0; i < 3; i++) {
            const wave = this.scene.add.graphics();
            wave.lineStyle(4 - i, 0x4488ff, 1 - i * 0.2);
            wave.strokeCircle(this.x, this.y, 10);

            this.scene.tweens.add({
                targets: wave,
                scale: range / 10,
                alpha: 0,
                duration: 500,
                delay: i * 100,
                onComplete: () => wave.destroy()
            });
        }

        // 电磁粒子
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                5,
                0x4488ff,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * range,
                y: this.y + Math.sin(angle) * range,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        this.scene.cameras.main.flash(150, 68, 136, 255, false, undefined, this.scene);
    }

    /**
     * 超频驱动特效
     */
    private createOverdriveEffect(): void {
        // 速度线
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const line = this.scene.add.graphics();
            line.lineStyle(2, 0xff8800, 0.8);
            line.moveTo(this.x, this.y);
            line.lineTo(this.x - Math.cos(angle) * 50, this.y - Math.sin(angle) * 50);
            line.strokePath();

            this.scene.tweens.add({
                targets: line,
                alpha: 0,
                duration: 300,
                delay: i * 30,
                onComplete: () => line.destroy()
            });
        }
    }

    /**
     * 全息幻影特效
     */
    private createHologramEffect(duration: number): void {
        const hologram = this.scene.add.image(this.x, this.y, 'player_idle');
        hologram.setAlpha(0.5);
        hologram.setTint(0x00ffff);
        hologram.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
            targets: hologram,
            alpha: 0.2,
            duration: 500,
            yoyo: true,
            repeat: Math.floor(duration / 1000)
        });

        this.scene.time.delayedCall(duration, () => {
            this.scene.tweens.add({
                targets: hologram,
                alpha: 0,
                duration: 300,
                onComplete: () => hologram.destroy()
            });
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
     * 显示伤害数字
     */
    private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
        const text = this.scene.add.text(x, y - 20, damage.toString(), {
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
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    /**
     * 更新UI
     */
    private updateUI(): void {
        // 更新血量UI
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
        this.scene.events.emit('updateExperience', this.experience, this.maxExperience, this.level);
    }

    // ========== 公共方法 ==========

    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        if (this.invincibleTime > 0) return;

        const actualDamage = Math.max(1, damage - this.stats.defense * 0.5);
        this.stats.hp -= actualDamage;
        this.stats.hp = Math.max(0, this.stats.hp);

        // 受伤特效
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        // 更新UI
        this.updateUI();

        // 检查死亡
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    /**
     * 治疗
     */
    public heal(amount: number): void {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
        this.updateUI();

        // 治疗特效
        const text = this.scene.add.text(this.x, this.y - 30, `+${amount}`, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#44ff44',
            fontFamily: 'Courier New, monospace'
        });
        text.setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 死亡
     */
    private die(): void {
        if (this.isDead) return;
        this.isDead = true;

        this.emit('playerDeath');
    }

    /**
     * 添加经验值
     */
    public addExperience(amount: number): void {
        this.experience += amount;

        // 检查升级
        while (this.experience >= this.maxExperience) {
            this.experience -= this.maxExperience;
            this.levelUp();
        }

        this.updateUI();
    }

    /**
     * 升级
     */
    private levelUp(): void {
        this.level++;
        this.maxExperience = Math.floor(this.maxExperience * 1.5);

        // 属性提升
        this.stats.maxHp += 10;
        this.stats.hp = this.stats.maxHp;
        this.stats.attack += 2;
        this.stats.defense += 1;

        // 显示升级特效
        this.showLevelUpEffect();

        // 打开技能选择界面
        this.scene.scene.launch('SkillSelectScene', {
            currentSkills: this.getSkillLevels(),
            callback: (skillId: string, isNew: boolean) => {
                this.onSkillSelected(skillId, isNew);
            }
        });
    }

    /**
     * 显示升级特效
     */
    private showLevelUpEffect(): void {
        // 升级光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(4, 0xffff00, 1);
        ring.strokeCircle(this.x, this.y, 20);

        this.scene.tweens.add({
            targets: ring,
            scale: 5,
            alpha: 0,
            duration: 800,
            onComplete: () => ring.destroy()
        });

        // 升级文字
        const text = this.scene.add.text(this.x, this.y - 50, `LEVEL UP! Lv.${this.level}`, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // 粒子爆发
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const particle = this.scene.add.circle(
                this.x,
                this.y,
                4,
                Phaser.Math.Between(0, 1) === 0 ? 0xffff00 : 0xff8800,
                1
            );

            this.scene.tweens.add({
                targets: particle,
                x: this.x + Math.cos(angle) * 80,
                y: this.y + Math.sin(angle) * 80,
                alpha: 0,
                scale: 0,
                duration: 600,
                delay: i * 20,
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * 获取技能等级映射
     */
    public getSkillLevels(): Map<string, number> {
        const levels = new Map<string, number>();
        this.ownedSkills.forEach((data, skillId) => {
            levels.set(skillId, data.skill.level);
        });
        return levels;
    }

    /**
     * 添加物品
     */
    public addItem(itemId: string): void {
        this.inventory.addItem(itemId);
    }

    /**
     * 增加击杀数
     */
    public addKill(): void {
        this.killCount++;
        this.scene.events.emit('updateKillCount', this.killCount);
    }

    /**
     * 获取属性（包含临时加成）
     */
    public getStats(): CombatStats {
        const now = this.scene.time.now;
        const result = { ...this.stats };

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
     * 获取击杀数
     */
    public getKillCount(): number {
        return this.killCount;
    }

    /**
     * 获取等级
     */
    public getLevel(): number {
        return this.level;
    }

    /**
     * 是否死亡
     */
    public getIsDead(): boolean {
        return this.isDead;
    }

    /**
     * 获取已学技能列表
     */
    public getOwnedSkills(): Map<string, { skill: Skill; cooldownEndTime: number }> {
        return this.ownedSkills;
    }
}
