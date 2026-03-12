/**
 * 玩家实体类
 * 处理玩家的移动、攻击、被动技能、背包
 */

import Phaser from 'phaser';
import { CombatStats, CombatState, Skill, Weapon, SoundType, ClassType, Armor, SkillTreeState, Profession } from '../core/Types';
import { GAME_CONFIG, getAttributeOptionById } from '../core/Config';
import { InventorySystem } from '../systems/InventorySystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { ClassAbilitySystem, ClassAbilityContext } from '../systems/ClassAbilitySystem';
import { getSkillColor } from '../data/Skills';
import { getStarterWeapon, getWeaponById, getRandomWeapon } from '../data/Weapons';
import { getArmorById, getStarterArmorSet } from '../data/Armors';
import { getClassById, ClassData, ClassStatsBonus } from '../data/Classes';
import { SkillManager } from '../managers/SkillManager';
import { WeaponManager } from '../managers/WeaponManager';
import { EffectManager } from '../managers/EffectManager';
import Hologram from './Hologram';
import Drone from './Drone';

export default class Player extends Phaser.GameObjects.Sprite {
    private stats!: CombatStats;
    private combatState!: CombatState;
    private inventory!: InventorySystem;
    private skillManager!: SkillManager;
    private weaponManager!: WeaponManager;
    private effectManager!: EffectManager;
    private equipmentSystem!: EquipmentSystem;
    private classAbilitySystem!: ClassAbilitySystem; // 职业能力系统

    // 玩家数据
    private level: number = 1;
    private experience: number = 0;
    private maxExperience: number = 100;
    private killCount: number = 0;
    private isDead: boolean = false;
    private invincibleTime: number = 0;
    private testInvincible: boolean = false; // 测试用无敌状态
    private shieldPoints: number = 0;  // 护盾值
    private maxShieldPoints: number = 0;  // 最大护盾值
    private lastHealTime: number = 0; // 上次治疗时间（用于生化改造者）
    private shieldEffectContainer: Phaser.GameObjects.Container | null = null; // 护盾特效容器

    // 职业系统
    private classId: ClassType = ClassType.BIO_ENGINEER;  // 默认职业
    private classData: ClassData | null = null;  // 职业数据
    private profession: Profession = Profession.WARRIOR;  // 默认战士职业
    
    // 职业类型访问器
    public get classType(): ClassType {
        return this.classId;
    }
    
    // 技能树状态
    private skillTreeState: SkillTreeState = {
        unlockedNodes: new Map<string, number>(),
        availablePoints: 0,
        totalPointsEarned: 0
    };

    // 临时属性提升
    private temporaryBoosts: Map<string, { value: number; endTime: number }> = new Map();
    
    // 永久属性加成（来自属性选择）
    private permanentAttributeBoosts: Map<string, number[]> = new Map();

    // 教程追踪
    private tutorialMoveNotified: boolean = false;
    private tutorialAttackNotified: boolean = false;

    // 玩家朝向和状态
    public facing: number = 1;  // 1 = 右, -1 = 左
    private currentState: string = 'idle';  // 当前动画状态

    constructor(scene: Phaser.Scene, x: number, y: number, selectedClass?: ClassType) {
        super(scene, x, y, 'player_idle_0');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 设置职业
        if (selectedClass) {
            this.classId = selectedClass;
        }
        this.classData = getClassById(this.classId);

        // 初始化玩家属性（应用职业加成）
        this.initializeStats();

        // 初始化系统
        this.inventory = new InventorySystem();
        this.skillManager = new SkillManager(scene);
        this.weaponManager = new WeaponManager(scene);
        this.effectManager = new EffectManager(scene);
        this.equipmentSystem = new EquipmentSystem();
        
        // 初始化职业能力系统
        this.classAbilitySystem = new ClassAbilitySystem(scene, this.classId);
        
        // 设置技能管理器的职业能力系统
        this.skillManager.setClassAbilitySystem(this.classAbilitySystem);

        // 应用职业初始属性加成
        this.applyClassStatsBonus();

        // 授予职业初始专属武器
        if (this.classData && this.classData.startingWeapon) {
            const startingWeapon = getWeaponById(this.classData.startingWeapon);
            if (startingWeapon) {
                this.weaponManager.equipWeapon(startingWeapon, 0);
                console.log(`[Player] 装备职业专属武器: ${startingWeapon.name}`);
            } else {
                // 如果找不到专属武器，使用基础武器
                this.weaponManager.equipWeapon(getStarterWeapon(), 0);
            }
        } else {
            this.weaponManager.equipWeapon(getStarterWeapon(), 0);
        }

        // 应用武器属性
        this.applyWeaponStats();

        // 授予职业初始技能
        if (this.classData && this.classData.startingSkill) {
            this.skillManager.learnSkill(this.classData.startingSkill);
        }

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);

        // 播放职业专属待机动画
        this.playClassAnimation('idle');

        // 监听技能选择事件
        scene.events.on('skillSelected', this.onSkillSelected, this);

        // 监听技能效果事件
        scene.events.on('skill-shield-activated', this.onShieldActivated, this);
        scene.events.on('skill-overdrive-activated', this.onOverdriveActivated, this);
        scene.events.on('skill-hologram-activated', this.onHologramActivated, this);
        scene.events.on('skill-nanite-swarm-activated', this.onNaniteSwarmActivated, this);
        scene.events.on('skill-drone-activated', this.onDroneActivated, this);

        // 监听护盾事件
        scene.events.on('shield-damaged', this.onShieldDamaged, this);
        scene.events.on('shield-broken', this.onShieldBroken, this);

        // 监听武器切换按键
        scene.input.keyboard!.on('keydown-ONE', () => this.switchWeapon(0), this);
        scene.input.keyboard!.on('keydown-TWO', () => this.switchWeapon(1), this);
        scene.input.keyboard!.on('keydown-THREE', () => this.switchWeapon(2), this);
        scene.input.keyboard!.on('keydown-Q', () => this.switchToNextWeapon(), this);

        console.log(`[Player] 职业已设置: ${this.classData?.name || '未知'}`);
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
     * 应用职业属性加成
     */
    private applyClassStatsBonus(): void {
        if (!this.classData) return;

        const bonus = this.classData.stats;

        // 应用生命值加成
        if (bonus.maxHp) {
            this.stats.maxHp += bonus.maxHp;
            this.stats.hp = this.stats.maxHp;
        }
        if (bonus.maxHpPercent) {
            const hpIncrease = Math.floor(this.stats.maxHp * bonus.maxHpPercent);
            this.stats.maxHp += hpIncrease;
            this.stats.hp = this.stats.maxHp;
        }

        // 应用攻击力加成
        if (bonus.attack) {
            this.stats.attack += bonus.attack;
        }
        if (bonus.attackPercent) {
            const attackIncrease = Math.floor(this.stats.attack * bonus.attackPercent);
            this.stats.attack += attackIncrease;
        }

        // 应用防御力加成
        if (bonus.defense) {
            this.stats.defense += bonus.defense;
        }
        if (bonus.defensePercent) {
            const defenseIncrease = Math.floor(this.stats.defense * bonus.defensePercent);
            this.stats.defense += defenseIncrease;
        }

        // 应用移动速度加成
        if (bonus.moveSpeed) {
            this.stats.moveSpeed += bonus.moveSpeed;
        }
        if (bonus.moveSpeedPercent) {
            const speedIncrease = Math.floor(this.stats.moveSpeed * bonus.moveSpeedPercent);
            this.stats.moveSpeed += speedIncrease;
        }

        // 应用暴击率加成
        if (bonus.critRate) {
            this.stats.critRate += bonus.critRate;
        }

        // 应用暴击伤害加成
        if (bonus.critDamage) {
            this.stats.critDamage += bonus.critDamage;
        }

        // 应用攻击速度加成
        if (bonus.attackSpeed) {
            this.stats.attackSpeed *= (1 + bonus.attackSpeed);
        }

        // 应用法力值加成
        if (bonus.maxMana) {
            this.stats.maxMana = (this.stats.maxMana || 0) + bonus.maxMana;
            this.stats.mana = this.stats.maxMana;
        }
        if (bonus.manaRegen) {
            this.stats.manaRegenPerSecond = (this.stats.manaRegenPerSecond || 0) + bonus.manaRegen;
        }

        console.log(`[Player] 应用职业属性加成: ${this.classData.name}`);
    }

    /**
     * 获取职业成长率
     * 不同职业有不同的属性成长率
     */
    private getClassGrowthRates(): { hp: number; attack: number; defense: number; critRate: number; critDamage: number } {
        const baseGrowth = {
            hp: 10,
            attack: 2,
            defense: 1,
            critRate: 0,
            critDamage: 0
        };

        if (!this.classData) return baseGrowth;

        // 根据职业类型返回不同的成长率
        switch (this.classType) {
            case ClassType.STREET_SAMURAI:
                // 街头武士：高攻击成长，低生命成长
                return {
                    hp: 8,           // 较低生命成长
                    attack: 3,       // 高攻击成长
                    defense: 0.8,    // 较低防御成长
                    critRate: 0.005, // 暴击率成长
                    critDamage: 0.02 // 暴击伤害成长
                };

            case ClassType.DATA_HACKER:
                // 数据黑客：平衡成长，技能伤害加成
                return {
                    hp: 10,          // 标准生命成长
                    attack: 1.5,     // 较低攻击成长
                    defense: 0.8,    // 较低防御成长
                    critRate: 0.003, // 暴击率成长
                    critDamage: 0.01 // 暴击伤害成长
                };

            case ClassType.BIO_ENGINEER:
                // 生化改造者：高生命和防御成长，低攻击成长
                return {
                    hp: 15,          // 高生命成长
                    attack: 1.2,     // 低攻击成长
                    defense: 1.5,    // 高防御成长
                    critRate: 0,     // 无暴击成长
                    critDamage: 0    // 无暴击伤害成长
                };

            case ClassType.SHADOW_ASSASSIN:
                // 暗影刺客：低生命成长，高暴击和攻击成长
                return {
                    hp: 7,           // 很低生命成长
                    attack: 2.5,     // 较高攻击成长
                    defense: 0.6,    // 很低防御成长
                    critRate: 0.008, // 高暴击率成长
                    critDamage: 0.03 // 高暴击伤害成长
                };

            default:
                return baseGrowth;
        }
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
        this.skillManager.learnSkill(skillId);
        
        // 发射技能学习事件
        this.scene.events.emit('skill-changed');
    }

    /**
     * 升级技能
     */
    public upgradeSkill(skillId: string): void {
        this.skillManager.upgradeSkill(skillId);
        
        // 发射技能升级事件
        this.scene.events.emit('skill-changed');
    }

    /**
     * 技能选择回调
     */
    private onSkillSelected(skillId: string, isNew: boolean, replaceTargetId?: string): void {
        if (isNew) {
            if (replaceTargetId) {
                // 替换技能
                this.replaceSkill(replaceTargetId, skillId);
            } else {
                this.learnSkill(skillId);
            }
        } else {
            this.upgradeSkill(skillId);
        }
    }

    /**
     * 替换技能
     */
    public replaceSkill(oldSkillId: string, newSkillId: string): void {
        this.skillManager.replaceSkill(oldSkillId, newSkillId);
        
        // 发射技能变更事件
        this.scene.events.emit('skill-changed');
    }

    /**
     * 护盾技能激活
     * 生成纳米护盾：抵挡下一次攻击并回复生命值
     * 护盾持续时间内，护盾值吸收伤害
     * 生化改造者护盾效果提升50%
     */
    private onShieldActivated(data: { healValue: number; duration: number }): void {
        // 如果已有护盾特效，先销毁旧的
        this.clearShieldEffect();

        // 治疗玩家
        this.heal(Math.floor(this.stats.maxHp * data.healValue / 100));

        // 计算护盾值（生化改造者护盾效果提升50%）
        const shieldBonus = this.classAbilitySystem.getShieldEffectBonus();
        const baseShieldPercent = 0.3;
        const finalShieldPercent = baseShieldPercent * (1 + shieldBonus);
        
        this.maxShieldPoints = Math.floor(this.stats.maxHp * finalShieldPercent);
        this.shieldPoints = this.maxShieldPoints;

        // 设置护盾持续时间（无敌时间）
        this.invincibleTime = data.duration * 1000;
        
        // 播放护盾音效
        this.scene.events.emit('play-sound', SoundType.PLAYER_SHIELD);

        // 创建护盾特效并保存引用
        this.shieldEffectContainer = this.effectManager.createShieldEffect(this.x, this.y);

        // 通知UI显示护盾激活
        this.scene.events.emit('shield-activated', {
            shieldPoints: this.shieldPoints,
            maxShieldPoints: this.maxShieldPoints,
            duration: data.duration
        });
    }

    /**
     * 清理护盾特效
     */
    private clearShieldEffect(): void {
        if (this.shieldEffectContainer && this.shieldEffectContainer.active) {
            // 淡出并销毁护盾特效
            this.scene.tweens.add({
                targets: this.shieldEffectContainer,
                alpha: 0,
                scale: 1.2,
                duration: 200,
                onComplete: () => {
                    if (this.shieldEffectContainer && this.shieldEffectContainer.active) {
                        this.shieldEffectContainer.destroy();
                    }
                    this.shieldEffectContainer = null;
                }
            });
        } else {
            this.shieldEffectContainer = null;
        }
    }

    /**
     * 获取当前护盾值
     */
    public getShieldPoints(): number {
        return this.shieldPoints;
    }

    /**
     * 获取最大护盾值
     */
    public getMaxShieldPoints(): number {
        return this.maxShieldPoints;
    }

    /**
     * 是否有护盾
     */
    public hasShield(): boolean {
        return this.shieldPoints > 0;
    }

    /**
     * 护盾受损事件处理
     */
    private onShieldDamaged(data: { shieldPoints: number; maxShieldPoints: number }): void {
        this.effectManager.createShieldDamageEffect(this.x, this.y, data.shieldPoints, data.maxShieldPoints);
    }

    /**
     * 护盾破碎事件处理
     */
    private onShieldBroken(): void {
        this.effectManager.createShieldBreakEffect(this.x, this.y);
        // 护盾破碎，清理特效
        this.clearShieldEffect();
    }

    /**
     * 超频驱动技能激活
     */
    private onOverdriveActivated(data: { speedBoost: number; duration: number }): void {
        // 应用临时速度提升
        this.applyTemporaryBoost('speed', data.speedBoost, data.duration * 1000);
    }

    /**
     * 全息幻影技能激活
     */
    private onHologramActivated(data: { x: number; y: number; duration: number }): void {
        // 创建真正的全息幻影实体
        const hologram = new Hologram(this.scene, data.x, data.y, data.duration);
        
        // 发射全息幻影创建事件，让 GameScene 管理
        this.scene.events.emit('hologram-spawned', hologram);
    }

    /**
     * 纳米虫群技能激活
     * 每秒恢复生命值并对附近敌人造成持续伤害
     */
    private onNaniteSwarmActivated(data: { healValue: number; damage: number; duration: number }): void {
        const tickInterval = 1000; // 每秒触发一次
        let tickCount = 0;
        const maxTicks = data.duration;

        // 创建持续效果定时器
        const naniteTimer = this.scene.time.addEvent({
            delay: tickInterval,
            callback: () => {
                tickCount++;

                // 治疗玩家（每秒恢复 healValue% 的生命值）
                const healAmount = Math.floor(this.stats.maxHp * data.healValue / 100);
                this.heal(healAmount);

                // 对附近敌人造成伤害（每秒造成 attack * damage% 的伤害）
                const damageRange = 150; // 纳米虫群攻击范围
                const enemies = this.getNearbyEnemies(damageRange);
                const damage = Math.floor(this.stats.attack * data.damage);

                enemies.forEach(enemy => {
                    if (enemy.takeDamage) {
                        enemy.takeDamage(damage);
                    }
                });

                // 持续时间结束
                if (tickCount >= maxTicks) {
                    naniteTimer.destroy();
                }
            },
            repeat: maxTicks - 1
        });
    }

    /**
     * 无人机技能激活
     * 召唤一架无人机环绕玩家飞行，自动攻击敌人
     */
    private onDroneActivated(data: { x: number; y: number; duration: number; attack: number }): void {
        // 创建无人机实体
        const drone = new Drone(this.scene, data.x, data.y, this, {
            hp: 50, // 无人机生命值
            attack: data.attack,
            duration: data.duration
        });

        // 发射无人机创建事件，让 GameScene 管理
        this.scene.events.emit('drone-spawned', drone);
    }

    /**
     * 更新玩家状态
     */
    update(time: number, delta: number): void {
        if (this.combatState.isStunned || this.isDead) return;

        // 更新无敌时间
        if (this.invincibleTime > 0) {
            this.invincibleTime -= delta;
            // 护盾激活时的闪烁效果
            if (this.shieldPoints > 0) {
                this.setAlpha(Math.sin(time * 0.015) * 0.2 + 0.8);
            } else {
                this.setAlpha(Math.sin(time * 0.02) * 0.3 + 0.7);
            }
            if (this.invincibleTime <= 0) {
                this.invincibleTime = 0;
                this.shieldPoints = 0;
                this.maxShieldPoints = 0;
                this.setAlpha(1);
                // 护盾时间到期，清理特效
                this.clearShieldEffect();
            }
        }

        // 更新护盾特效位置（跟随玩家）
        if (this.shieldEffectContainer && this.shieldEffectContainer.active) {
            this.shieldEffectContainer.setPosition(this.x, this.y);
        }

        // 生化改造者自动治疗（每秒）
        const healPerSecond = this.classAbilitySystem.getHealPerSecond(this.stats.maxHp);
        if (healPerSecond > 0 && time - this.lastHealTime >= 1000) {
            this.lastHealTime = time;
            if (this.stats.hp < this.stats.maxHp) {
                this.heal(healPerSecond);
            }
        }

        // 移动控制
        this.handleMovement(delta);

        // 攻击控制
        this.handleAttack(time, delta);

        // 被动技能自动触发
        this.handlePassiveSkills(time);

        // 更新职业能力系统（无人机召唤等）
        this.updateClassAbilities(time);

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

        // 动画状态切换
        const isMoving = velocity.x !== 0 || velocity.y !== 0;
        
        // 通知教程系统玩家移动
        if (isMoving && !this.tutorialMoveNotified) {
            this.tutorialMoveNotified = true;
            this.scene.events.emit('tutorial-action', 'WASD');
        }
        
        if (isMoving && !this.combatState.isAttacking) {
            this.playClassAnimation('run');
        } else if (!this.combatState.isAttacking) {
            this.playClassAnimation('idle');
        }
    }

    /**
     * 播放职业专属动画
     */
    private playClassAnimation(animType: 'idle' | 'run' | 'attack'): void {
        const animKey = `player_${this.classId}_${animType}_anim`;
        
        // 检查职业专属动画是否存在
        if (this.anims.exists(animKey)) {
            if (this.anims.currentAnim?.key !== animKey) {
                // 攻击动画不循环，其他动画循环
                this.play(animKey, animType !== 'attack');
            }
        } else {
            // 回退到默认动画
            const defaultAnimKey = `player_${animType}_anim`;
            if (this.anims.currentAnim?.key !== defaultAnimKey) {
                this.play(defaultAnimKey, animType !== 'attack');
            }
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
     * 应用职业特性加成
     */
    private performAttack(time: number): void {
        this.combatState.lastAttackTime = time;
        this.combatState.isAttacking = true;
        
        // 通知教程系统玩家攻击
        if (!this.tutorialAttackNotified) {
            this.tutorialAttackNotified = true;
            this.scene.events.emit('tutorial-action', 'attack');
        }

        // 播放攻击音效
        this.scene.events.emit('play-sound', SoundType.PLAYER_ATTACK);

        // 播放职业专属攻击动画
        this.playClassAnimation('attack');
        
        // 攻击动画结束后恢复
        this.once('animationcomplete', () => {
            this.combatState.isAttacking = false;
            this.playClassAnimation('idle');
        });

        // 使用武器攻击范围
        const attackRange = this.getCurrentWeapon() ? this.getCurrentWeapon().range : 60;
        const enemies = this.getNearbyEnemies(attackRange);
        const comboBonus = CombatSystem.calculateComboBonus(this.combatState.comboCount);

        // 获取职业能力加成
        const lowHpBonus = this.classAbilitySystem.getLowHpAttackBonus(this.stats.hp, this.stats.maxHp);
        const meleeBonus = this.classAbilitySystem.getMeleeDamageBonus();
        const weapon = this.getCurrentWeapon();
        const isMeleeWeapon = weapon && ['sword', 'blade', 'dagger', 'katana', 'hammer', 'bio_fist', 'dual_dagger'].includes(weapon.type);

        for (const enemy of enemies) {
            let damageResult = CombatSystem.calculateDamage(this.stats, enemy.getStats());
            let finalDamage = Math.floor(damageResult.damage * comboBonus);

            // 应用近战伤害加成（街头武士）
            if (isMeleeWeapon && meleeBonus > 0) {
                finalDamage = Math.floor(finalDamage * (1 + meleeBonus));
            }

            // 应用低生命值攻击加成（街头武士）
            if (lowHpBonus > 0) {
                finalDamage = Math.floor(finalDamage * (1 + lowHpBonus));
            }

            // 应用背刺伤害加成（暗影刺客）
            if (enemy.facing !== undefined) {
                const backstabBonus = this.classAbilitySystem.calculateBackstabBonus(
                    this.x, this.y, enemy.x, enemy.y, enemy.facing
                );
                if (backstabBonus > 0) {
                    finalDamage = Math.floor(finalDamage * (1 + backstabBonus));
                    this.showBackstabEffect(enemy.x, enemy.y);
                }
            }

            enemy.takeDamage(finalDamage);
            this.showDamageNumber(enemy.x, enemy.y, finalDamage, damageResult.isCrit);
            
            // 播放敌人受击音效
            this.scene.events.emit('play-sound', SoundType.ENEMY_HIT);
        }

        // 攻击特效
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });
    }

    /**
     * 显示背刺特效
     */
    private showBackstabEffect(x: number, y: number): void {
        const text = this.scene.add.text(x, y - 30, 'BACKSTAB!', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 处理被动技能自动触发
     */
    private handlePassiveSkills(time: number): void {
        const enemies = this.getNearbyEnemies(300);
        this.skillManager.handlePassiveSkills(time, this.x, this.y, this.getStats(), enemies);
    }

    /**
     * 更新职业能力系统
     * 处理职业特殊被动效果（如无人机召唤等）
     */
    private updateClassAbilities(time: number): void {
        const enemies = this.getNearbyEnemies(300);
        
        const context = {
            scene: this.scene,
            playerX: this.x,
            playerY: this.y,
            playerStats: this.getStats(),
            playerHp: this.stats.hp,
            playerMaxHp: this.stats.maxHp,
            enemies: enemies,
            lastAttackTime: this.combatState.lastAttackTime,
            currentTime: this.scene.time.now
        };
        
        this.classAbilitySystem.update(context);
    }

    /**
     * 获取附近敌人
     */
    private getNearbyEnemies(range: number): any[] {
        return this.scene.children.list.filter((child: any) => {
            // 使用 isEnemy 属性检查，更可靠
            if (child.isEnemy !== true) return false;
            if (!child.active) return false;  // 确保敌人处于激活状态
            const dist = Phaser.Math.Distance.Between(this.x, this.y, child.x, child.y);
            return dist < range;
        }) as any[];
    }

    /**
     * 显示伤害数字
     */
    private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
        this.effectManager.showDamageNumber(x, y, damage, isCrit);
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
     * 护盾机制：护盾存在时，伤害优先由护盾吸收
     * 职业能力：暗影刺客可闪避，生化改造者有伤害减免
     */
    public takeDamage(damage: number): void {
        // 测试用无敌状态
        if (this.testInvincible) {
            return;
        }

        // 暗影刺客闪避检查
        if (this.classAbilitySystem.checkDodge()) {
            // 闪避成功
            this.showDodgeEffect();
            this.scene.events.emit('play-sound', SoundType.PLAYER_SHIELD);
            console.log('[Player] 暗影刺客闪避成功！');
            return;
        }

        // 生化改造者伤害减免
        const damageReduction = this.classAbilitySystem.getDamageReduction();
        let actualDamage = damage * (1 - damageReduction);
        
        // 计算防御减伤
        actualDamage = Math.max(1, actualDamage - this.stats.defense * 0.5);

        // 如果有护盾值，先由护盾吸收
        if (this.shieldPoints > 0) {
            // 护盾吸收伤害
            const shieldDamage = Math.min(this.shieldPoints, actualDamage);
            this.shieldPoints -= shieldDamage;

            // 剩余伤害由生命值承担
            const remainingDamage = actualDamage - shieldDamage;
            if (remainingDamage > 0) {
                this.stats.hp -= remainingDamage;
                this.stats.hp = Math.max(0, this.stats.hp);

                // 受伤特效
                this.setTint(0xff0000);
                this.scene.time.delayedCall(100, () => this.clearTint());
                
                // 播放受伤音效
                this.scene.events.emit('play-sound', SoundType.PLAYER_HURT);
            }

            // 显示护盾受损特效
            this.scene.events.emit('shield-damaged', {
                shieldPoints: this.shieldPoints,
                maxShieldPoints: this.maxShieldPoints
            });

            // 如果护盾耗尽
            if (this.shieldPoints <= 0) {
                this.shieldPoints = 0;
                this.scene.events.emit('shield-broken');
            }

            // 更新UI
            this.updateUI();

            // 检查死亡
            if (this.stats.hp <= 0) {
                this.die();
            }
            return;
        }

        // 无敌时间（技能持续期间），不受伤
        if (this.invincibleTime > 0) return;

        this.stats.hp -= actualDamage;
        this.stats.hp = Math.max(0, this.stats.hp);

        // 受伤特效
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());
        
        // 播放受伤音效
        this.scene.events.emit('play-sound', SoundType.PLAYER_HURT);

        // 更新UI
        this.updateUI();

        // 检查死亡
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    /**
     * 显示闪避特效
     */
    private showDodgeEffect(): void {
        // 显示"DODGE"文字
        const text = this.scene.add.text(this.x, this.y - 40, 'DODGE!', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#aa44ff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 80,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });

        // 闪避特效
        this.setAlpha(0.3);
        this.scene.time.delayedCall(200, () => {
            this.setAlpha(1);
        });
    }

    /**
     * 治疗
     */
    public heal(amount: number): void {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
        this.updateUI();
        
        // 播放治疗音效
        this.scene.events.emit('play-sound', SoundType.PLAYER_HEAL);

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
        
        // 播放死亡音效
        this.scene.events.emit('play-sound', SoundType.PLAYER_DIE);

        // 玩家死亡，清理护盾特效
        this.clearShieldEffect();

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

        // 获取职业成长率
        const growthRates = this.getClassGrowthRates();

        // 根据职业成长率提升属性
        this.stats.maxHp += Math.floor(growthRates.hp);
        this.stats.hp = this.stats.maxHp;
        this.stats.attack += Math.floor(growthRates.attack);
        this.stats.defense += Math.floor(growthRates.defense);
        
        // 暴击率和暴击伤害成长
        if (growthRates.critRate > 0) {
            this.stats.critRate = Math.min(0.8, this.stats.critRate + growthRates.critRate);
        }
        if (growthRates.critDamage > 0) {
            this.stats.critDamage += growthRates.critDamage;
        }
        
        // 播放升级音效
        this.scene.events.emit('play-sound', SoundType.PLAYER_LEVEL_UP);

        // 显示升级特效
        this.showLevelUpEffect();

        // 打开技能选择界面
        this.scene.scene.launch('SkillSelectScene', {
            currentSkills: this.getSkillLevels(),
            currentAttributeBoosts: this.permanentAttributeBoosts,
            callback: (skillId: string, isNew: boolean, replaceTargetId?: string) => {
                this.onSkillSelected(skillId, isNew, replaceTargetId);
            },
            attributeCallback: (attributeId: string, value: number, isPercentage: boolean) => {
                this.applyAttributeBoost(attributeId, value, isPercentage);
            }
        });
    }

    /**
     * 显示升级特效
     */
    private showLevelUpEffect(): void {
        this.effectManager.showLevelUpEffect(this.x, this.y, this.level);
    }

    /**
     * 获取技能等级映射
     */
    public getSkillLevels(): Map<string, number> {
        return this.skillManager.getSkillLevels();
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

        // 应用永久属性加成
        this.applyPermanentBoosts(result);

        // 应用临时属性加成
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
     * 获取当前状态
     */
    public getState(): string {
        return this.currentState;
    }

    /**
     * 设置当前动画状态
     */
    public setCurrentState(state: string): void {
        this.currentState = state;
    }

    /**
     * 应用永久属性加成
     */
    private applyPermanentBoosts(stats: CombatStats): void {
        this.permanentAttributeBoosts.forEach((values, type) => {
            const totalValue = values.reduce((sum, v) => sum + v, 0);
            
            switch (type) {
                case 'attack':
                    stats.attack += totalValue;
                    break;
                case 'defense':
                    stats.defense += totalValue;
                    break;
                case 'maxHp':
                    stats.maxHp += totalValue;
                    // 如果当前生命值低于最大值，也相应提升
                    if (stats.hp < stats.maxHp) {
                        stats.hp = Math.min(stats.hp + totalValue, stats.maxHp);
                    }
                    break;
                case 'moveSpeed':
                    stats.moveSpeed += totalValue;
                    break;
                case 'attackSpeed':
                    stats.attackSpeed += totalValue;
                    break;
                case 'critRate':
                    stats.critRate += totalValue;
                    break;
                case 'critDamage':
                    stats.critDamage += totalValue;
                    break;
                case 'skillRange':
                case 'skillCooldown':
                case 'bulletCount':
                    // 这些属性需要特殊处理，存储在额外属性中
                    break;
            }
        });
    }

    /**
     * 应用属性选项加成
     */
    public applyAttributeBoost(attributeId: string, value: number, isPercentage: boolean): void {
        const attrOption = getAttributeOptionById(attributeId);
        
        if (!attrOption) {
            console.warn(`[Player] 未找到属性选项: ${attributeId}`);
            return;
        }

        const type = attrOption.type;
        
        // 检查是否达到最大叠加次数
        if (!this.permanentAttributeBoosts.has(type)) {
            this.permanentAttributeBoosts.set(type, []);
        }
        
        const currentStacks = this.permanentAttributeBoosts.get(type)!;
        if (currentStacks.length >= attrOption.maxStack) {
            console.log(`[Player] 属性 ${type} 已达到最大叠加次数`);
            return;
        }

        // 计算实际加成值
        let actualValue = value;
        if (isPercentage) {
            // 百分比加成需要基于基础属性计算
            actualValue = this.calculatePercentageBoost(type, value);
        }

        // 添加到永久加成
        currentStacks.push(actualValue);
        
        // 更新当前属性
        this.updateStatsWithBoost(type, actualValue);
        
        // 显示属性提升效果
        this.showAttributeBoostEffect(type, actualValue, isPercentage);
        
        console.log(`[Player] 应用属性加成: ${type} +${actualValue} (百分比: ${isPercentage})`);
    }

    /**
     * 计算百分比加成的实际值
     */
    private calculatePercentageBoost(type: string, percentage: number): number {
        switch (type) {
            case 'attack':
                return Math.floor(this.stats.attack * percentage);
            case 'defense':
                return Math.floor(this.stats.defense * percentage);
            case 'maxHp':
                return Math.floor(this.stats.maxHp * percentage);
            case 'moveSpeed':
                return Math.floor(this.stats.moveSpeed * percentage);
            case 'critRate':
            case 'critDamage':
            case 'attackSpeed':
            case 'skillRange':
            case 'skillCooldown':
                return percentage; // 这些保持百分比形式
            default:
                return percentage;
        }
    }

    /**
     * 更新属性
     */
    private updateStatsWithBoost(type: string, value: number): void {
        switch (type) {
            case 'attack':
                this.stats.attack += value;
                break;
            case 'defense':
                this.stats.defense += value;
                break;
            case 'maxHp':
                this.stats.maxHp += value;
                this.stats.hp = Math.min(this.stats.hp + value, this.stats.maxHp);
                break;
            case 'moveSpeed':
                this.stats.moveSpeed += value;
                break;
            case 'attackSpeed':
                this.stats.attackSpeed += value;
                break;
            case 'critRate':
                this.stats.critRate += value;
                break;
            case 'critDamage':
                this.stats.critDamage += value;
                break;
        }
        
        // 更新UI
        this.updateUI();
    }

    /**
     * 显示属性提升效果
     */
    private showAttributeBoostEffect(type: string, value: number, isPercentage: boolean): void {
        const typeNames: Record<string, string> = {
            'attack': '攻击力',
            'defense': '防御力',
            'maxHp': '最大生命',
            'moveSpeed': '移动速度',
            'attackSpeed': '攻击速度',
            'critRate': '暴击率',
            'critDamage': '暴击伤害',
            'skillRange': '技能范围',
            'skillCooldown': '冷却缩减',
            'bulletCount': '子弹数量'
        };

        const displayValue = isPercentage ? `${Math.round(value * 100)}%` : `${value}`;
        const text = this.scene.add.text(this.x, this.y - 50, `${typeNames[type] || type} +${displayValue}`, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: this.y - 90,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 获取特殊属性值（技能范围、冷却缩减、子弹数量等）
     */
    public getSpecialAttribute(type: string): number {
        if (!this.permanentAttributeBoosts.has(type)) {
            return 0;
        }
        return this.permanentAttributeBoosts.get(type)!.reduce((sum, v) => sum + v, 0);
    }

    /**
     * 获取所有永久属性加成
     */
    public getPermanentAttributeBoosts(): Map<string, number[]> {
        return this.permanentAttributeBoosts;
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
        this.effectManager.showBoostEffect(this.x, this.y, type, value);
    }

    /**
     * 获取击杀数
     */
    public getKillCount(): number {
        return this.killCount;
    }

    /**
     * 设置测试无敌状态
     */
    public setTestInvincible(invincible: boolean): void {
        this.testInvincible = invincible;
    }

    /**
     * 获取测试无敌状态
     */
    public isTestInvincible(): boolean {
        return this.testInvincible;
    }

    /**
     * 获取等级
     */
    public getLevel(): number {
        return this.level;
    }

    /**
     * 获取当前经验值
     */
    public getExperience(): number {
        return this.experience;
    }

    /**
     * 获取升级所需经验值
     */
    public getMaxExperience(): number {
        return this.maxExperience;
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
        return this.skillManager.getOwnedSkills();
    }

    // ========== 武器系统 ==========

    /**
     * 装备武器
     */
    public equipWeapon(weapon: Weapon, slotIndex?: number): void {
        this.weaponManager.equipWeapon(weapon, slotIndex);
        this.applyWeaponStats();
        this.effectManager.showWeaponEquipEffect(weapon, this.x, this.y);
        this.scene.events.emit('weapon-changed');
    }

    /**
     * 切换武器（按槽位）
     */
    public switchWeapon(slotIndex: number): void {
        this.weaponManager.switchWeapon(slotIndex);
        this.applyWeaponStats();
        this.effectManager.showWeaponSwitchEffect(this.x, this.y);
        this.scene.events.emit('weapon-changed');
    }

    /**
     * 切换到下一个武器
     */
    public switchToNextWeapon(): void {
        this.weaponManager.switchToNextWeapon();
        this.applyWeaponStats();
        this.effectManager.showWeaponSwitchEffect(this.x, this.y);
        this.scene.events.emit('weapon-changed');
    }

    /**
     * 应用武器属性
     */
    private applyWeaponStats(): void {
        this.weaponManager.applyWeaponStats(this.stats);
    }

    /**
     * 获取当前武器
     */
    public getCurrentWeapon(): Weapon {
        return this.weaponManager.getCurrentWeapon();
    }

    /**
     * 获取所有武器槽位
     */
    public getWeaponSlots(): (Weapon | null)[] {
        return this.weaponManager.getWeaponSlots();
    }

    /**
     * 获取已拥有武器列表
     */
    public getOwnedWeapons(): Weapon[] {
        return this.weaponManager.getOwnedWeapons();
    }

    /**
     * 获取当前武器槽位
     */
    public getActiveWeaponSlot(): number {
        return this.weaponManager.getActiveWeaponSlot();
    }

    /**
     * 获取已拥有技能列表
     */
    public getOwnedSkillIds(): string[] {
        return this.skillManager.getOwnedSkillIds();
    }

    /**
     * 显示武器装备特效
     */
    private showWeaponEquipEffect(weapon: Weapon): void {
        const rarityColors: Record<string, number> = {
            'common': 0x888888,
            'rare': 0x4488ff,
            'epic': 0xaa44ff,
            'legendary': 0xffaa00
        };

        const color = rarityColors[weapon.rarity] || 0xffffff;
        
        const text = this.scene.add.text(this.x, this.y - 50, `装备: ${weapon.name}`, {
            fontSize: '20px',
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
            y: this.y - 90,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });

        // 武器光环
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, color, 0.8);
        ring.strokeCircle(this.x, this.y, 30);

        this.scene.tweens.add({
            targets: ring,
            scale: 2,
            alpha: 0,
            duration: 600,
            onComplete: () => ring.destroy()
        });
    }

    /**
     * 显示武器切换特效
     */
    private showWeaponSwitchEffect(): void {
        const flash = this.scene.add.graphics();
        flash.fillStyle(0xffffff, 0.3);
        flash.fillRect(this.x - 20, this.y - 20, 40, 40);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    /**
     * 随机获得武器（用于掉落）
     */
    public grantRandomWeapon(): void {
        const weapon = this.weaponManager.grantRandomWeapon();
        this.applyWeaponStats();
        this.effectManager.showWeaponEquipEffect(weapon, this.x, this.y);
        this.scene.events.emit('weapon-changed');
    }

    /**
     * 清理资源
     */
    public cleanup(): void {
        // 移除事件监听器
        this.scene.events.off('skillSelected', this.onSkillSelected, this);
        this.scene.events.off('skill-shield-activated', this.onShieldActivated, this);
        this.scene.events.off('skill-overdrive-activated', this.onOverdriveActivated, this);
        this.scene.events.off('skill-hologram-activated', this.onHologramActivated, this);
        this.scene.events.off('skill-nanite-swarm-activated', this.onNaniteSwarmActivated, this);
        this.scene.events.off('skill-drone-activated', this.onDroneActivated, this);
        this.scene.events.off('shield-damaged', this.onShieldDamaged, this);
        this.scene.events.off('shield-broken', this.onShieldBroken, this);

        // 清理临时提升定时器
        this.temporaryBoosts.clear();

        // 清理护盾特效
        if (this.shieldEffectContainer && this.shieldEffectContainer.active) {
            this.shieldEffectContainer.destroy();
            this.shieldEffectContainer = null;
        }
    }

    // ========== 测试功能方法（仅开发环境可用） ==========

    /**
     * 设置测试等级（仅开发环境）
     * 用于测试菜单的降级功能
     */
    public setTestLevel(targetLevel: number): void {
        if (!import.meta.env.DEV) {
            console.warn('[Player] setTestLevel 仅在开发环境可用');
            return;
        }

        const oldLevel = this.level;
        
        // 设置等级
        this.level = Math.max(1, Math.min(99, targetLevel));
        
        // 重新计算属性
        this.recalculateStatsForLevel(this.level);
        
        // 重置经验值
        this.experience = 0;
        this.maxExperience = Math.floor(100 * Math.pow(1.5, this.level - 1));
        
        // 更新UI
        this.updateUI();
        
        console.log(`[Player] 测试等级设置: ${oldLevel} -> ${this.level}`);
    }

    /**
     * 根据等级重新计算属性（仅开发环境）
     */
    private recalculateStatsForLevel(level: number): void {
        // 重置为基础属性
        this.stats.maxHp = GAME_CONFIG.player.baseHp;
        this.stats.hp = this.stats.maxHp;
        this.stats.attack = GAME_CONFIG.player.baseAttack;
        this.stats.defense = GAME_CONFIG.player.baseDefense;
        this.stats.moveSpeed = GAME_CONFIG.player.baseMoveSpeed;
        this.stats.critRate = GAME_CONFIG.player.baseCritRate;
        this.stats.critDamage = GAME_CONFIG.player.baseCritDamage;
        this.stats.attackSpeed = 1.0;

        // 应用每级属性增长
        for (let i = 1; i < level; i++) {
            this.stats.maxHp += 10;
            this.stats.attack += 2;
            this.stats.defense += 1;
        }
        
        // 恢复满血
        this.stats.hp = this.stats.maxHp;

        // 应用永久属性加成
        this.applyPermanentBoosts(this.stats);

        // 应用武器属性
        this.applyWeaponStats();
    }

    /**
     * 重新计算所有属性（包含装备加成）
     */
    public recalculateStats(): void {
        // 基础属性重置
        const baseStats: CombatStats = {
            hp: this.stats.hp,  // 保留当前生命值
            maxHp: GAME_CONFIG.player.baseHp,
            attack: GAME_CONFIG.player.baseAttack,
            defense: GAME_CONFIG.player.baseDefense,
            moveSpeed: GAME_CONFIG.player.baseMoveSpeed,
            critRate: GAME_CONFIG.player.baseCritRate,
            critDamage: GAME_CONFIG.player.baseCritDamage,
            attackSpeed: 1.0
        };

        // 应用职业加成
        if (this.classData) {
            const bonus = this.classData.stats;
            if (bonus.maxHp) baseStats.maxHp += bonus.maxHp;
            if (bonus.maxHpPercent) baseStats.maxHp *= (1 + bonus.maxHpPercent);
            if (bonus.attack) baseStats.attack += bonus.attack;
            if (bonus.attackPercent) baseStats.attack *= (1 + bonus.attackPercent);
            if (bonus.defense) baseStats.defense += bonus.defense;
            if (bonus.defensePercent) baseStats.defense *= (1 + bonus.defensePercent);
            if (bonus.moveSpeed) baseStats.moveSpeed += bonus.moveSpeed;
            if (bonus.moveSpeedPercent) baseStats.moveSpeed *= (1 + bonus.moveSpeedPercent);
            if (bonus.critRate) baseStats.critRate += bonus.critRate;
            if (bonus.critDamage) baseStats.critDamage += bonus.critDamage;
            if (bonus.attackSpeed) baseStats.attackSpeed *= (1 + bonus.attackSpeed);
        }

        // 应用永久属性加成
        this.applyPermanentBoosts(baseStats);

        // 应用装备加成
        const equipmentStats = this.equipmentSystem.calculateTotalStats();
        if (equipmentStats.maxHp) baseStats.maxHp += equipmentStats.maxHp;
        if (equipmentStats.attack) baseStats.attack += equipmentStats.attack;
        if (equipmentStats.defense) baseStats.defense += equipmentStats.defense;
        if (equipmentStats.moveSpeed) baseStats.moveSpeed += equipmentStats.moveSpeed;
        if (equipmentStats.critRate) baseStats.critRate += equipmentStats.critRate;
        if (equipmentStats.critDamage) baseStats.critDamage += equipmentStats.critDamage;
        if (equipmentStats.attackSpeed) baseStats.attackSpeed += equipmentStats.attackSpeed;

        // 更新属性
        this.stats.maxHp = Math.floor(baseStats.maxHp);
        this.stats.attack = Math.floor(baseStats.attack);
        this.stats.defense = Math.floor(baseStats.defense);
        this.stats.moveSpeed = Math.floor(baseStats.moveSpeed);
        this.stats.critRate = Math.min(1, baseStats.critRate);
        this.stats.critDamage = baseStats.critDamage;
        this.stats.attackSpeed = baseStats.attackSpeed;

        // 确保当前生命值不超过最大值
        this.stats.hp = Math.min(this.stats.hp, this.stats.maxHp);

        // 应用武器属性
        this.applyWeaponStats();
    }

    /**
     * 清除所有技能（仅开发环境）
     */
    public clearAllSkills(): void {
        if (!import.meta.env.DEV) {
            console.warn('[Player] clearAllSkills 仅在开发环境可用');
            return;
        }

        this.skillManager.clearAllSkills();
        this.scene.events.emit('skill-changed');
        console.log('[Player] 已清除所有技能');
    }

    // ========== 存档系统相关方法 ==========

    /**
     * 获取存档数据
     */
    public getSaveData(): any {
        // 将永久属性加成转换为可序列化的对象
        const attributeBoostsObj: Record<string, number[]> = {};
        this.permanentAttributeBoosts.forEach((values, type) => {
            attributeBoostsObj[type] = values;
        });

        return {
            x: this.x,
            y: this.y,
            hp: this.stats.hp,
            maxHp: this.stats.maxHp,
            level: this.level,
            experience: this.experience,
            killCount: this.killCount,
            classId: this.classId,  // 保存职业ID
            ownedSkills: this.skillManager.getSaveData(),
            weaponSlots: this.weaponManager.getSaveData().weaponSlots,
            activeWeaponSlot: this.weaponManager.getSaveData().activeWeaponSlot,
            attributeBoosts: attributeBoostsObj,
            equipment: this.equipmentSystem.getSaveData()
        };
    }

    /**
     * 加载存档数据
     */
    public loadSaveData(data: any): void {
        // 数据验证
        if (!data || !data.player) {
            console.error('[Player] loadSaveData: 无效的存档数据');
            return;
        }
        
        // 恢复位置
        this.setPosition(data.player.x, data.player.y);

        // 恢复职业
        if (data.player.classId) {
            this.classId = data.player.classId as ClassType;
            this.classData = getClassById(this.classId);
            console.log(`[Player] 恢复职业: ${this.classData?.name || '未知'}`);
        }

        // 恢复属性
        this.stats.hp = data.player.hp || this.stats.maxHp;
        this.stats.maxHp = data.player.maxHp || this.stats.maxHp;
        this.level = data.player.level || 1;
        this.experience = data.player.experience || 0;
        this.killCount = data.player.killCount || 0;

        // 恢复技能 - 使用 ownedSkills（完整数据）或降级使用 skills（仅ID列表）
        if (data.player.ownedSkills) {
            this.skillManager.loadSaveData(data.player.ownedSkills);
        } else if (data.player.skills && Array.isArray(data.player.skills)) {
            // 兼容旧版本：只有技能ID列表，重新学习技能
            console.warn('[Player] loadSaveData: 使用旧版技能数据格式，重新学习技能');
            data.player.skills.forEach((skillId: string) => {
                this.skillManager.learnSkill(skillId);
            });
        } else {
            console.warn('[Player] loadSaveData: 没有找到技能数据');
        }

        // 恢复武器
        if (data.player.weaponSlots) {
            this.weaponManager.loadSaveData({
                weaponSlots: data.player.weaponSlots,
                activeWeaponSlot: data.player.activeWeaponSlot
            });
            this.applyWeaponStats();
        }

        // 恢复装备
        if (data.player.equipment) {
            this.equipmentSystem.loadSaveData(
                data.player.equipment,
                getWeaponById,
                getArmorById
            );
        }

        // 恢复属性加成
        if (data.stats) {
            this.stats.attack = data.stats.attack || this.stats.attack;
            this.stats.defense = data.stats.defense || this.stats.defense;
            this.stats.attackSpeed = data.stats.attackSpeed || this.stats.attackSpeed;
            this.stats.critRate = data.stats.critRate || this.stats.critRate;
            this.stats.critDamage = data.stats.critDamage || this.stats.critDamage;
            this.stats.moveSpeed = data.stats.moveSpeed || this.stats.moveSpeed;
        }

        // 恢复永久属性加成
        if (data.player.attributeBoosts) {
            this.permanentAttributeBoosts.clear();
            Object.entries(data.player.attributeBoosts).forEach(([type, values]) => {
                this.permanentAttributeBoosts.set(type, values as number[]);
            });
        }

        // 重新计算属性（包含装备加成）
        this.recalculateStats();

        // 发射更新事件
        this.scene.events.emit('skill-changed');
        this.scene.events.emit('weaponSwitched', {
            slot: this.weaponManager.getActiveWeaponSlot(),
            weapon: this.weaponManager.getCurrentWeapon()
        });
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
        this.scene.events.emit('experienceChanged', this.experience, this.maxExperience, this.level);
        this.scene.events.emit('killCountUpdated', this.killCount);
        this.scene.events.emit('equipment-changed');
    }
}
