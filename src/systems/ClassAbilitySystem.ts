/**
 * 职业能力系统
 * 实现各职业的独特被动能力和特性
 */

import { ClassType, CombatStats } from '../core/Types';
import { getClassById, ClassData } from '../data/Classes';
import Phaser from 'phaser';

/**
 * 职业能力上下文
 */
export interface ClassAbilityContext {
    scene: Phaser.Scene;
    playerX: number;
    playerY: number;
    playerStats: CombatStats;
    playerHp: number;
    playerMaxHp: number;
    enemies: any[];
    lastAttackTime: number;
    currentTime: number;
}

/**
 * 职业能力结果
 */
export interface ClassAbilityResult {
    damageBonus?: number;           // 伤害加成（倍率）
    defenseBonus?: number;          // 防御加成
    critRateBonus?: number;         // 暴击率加成
    critDamageBonus?: number;       // 暴击伤害加成
    moveSpeedBonus?: number;        // 移动速度加成
    attackSpeedBonus?: number;      // 攻击速度加成
    skillDamageBonus?: number;      // 技能伤害加成
    skillCooldownReduction?: number; // 技能冷却缩减
    damageReduction?: number;       // 伤害减免
    healPerSecond?: number;         // 每秒治疗量
    dodgeChance?: number;           // 闪避几率
    backstabBonus?: number;         // 背刺伤害加成
    meleeDamageBonus?: number;      // 近战伤害加成
    shouldDodge?: boolean;          // 是否闪避攻击
    customEffects?: string[];       // 自定义效果列表
}

/**
     * 职业能力系统类
     */
export class ClassAbilitySystem {
    private scene: Phaser.Scene;
    private classType: ClassType;
    private classData: ClassData | null;
    private lastDroneSummonTime: number = 0;
    private droneSummonInterval: number = 30000; // 30秒
    private droneSummonDelay: number = 5000; // 初始召唤延迟5秒
    private hasInitialDrone: boolean = false; // 是否已召唤初始无人机

    constructor(scene: Phaser.Scene, classType: ClassType) {
        this.scene = scene;
        this.classType = classType;
        this.classData = getClassById(classType);
        
        // 数据黑客职业：游戏开始时先设置较短的初始召唤延迟
        if (this.classType === ClassType.DATA_HACKER) {
            this.lastDroneSummonTime = -this.droneSummonDelay; // 允许立即召唤
        }
    }

    /**
     * 计算职业能力加成
     */
    public calculateAbilityBonuses(context: ClassAbilityContext): ClassAbilityResult {
        if (!this.classData) return {};

        const result: ClassAbilityResult = {};

        // 根据职业类型应用不同的被动能力
        switch (this.classType) {
            case ClassType.STREET_SAMURAI:
                this.applyStreetSamuraiAbilities(context, result);
                break;
            case ClassType.DATA_HACKER:
                this.applyDataHackerAbilities(context, result);
                break;
            case ClassType.BIO_ENGINEER:
                this.applyBioEngineerAbilities(context, result);
                break;
            case ClassType.SHADOW_ASSASSIN:
                this.applyShadowAssassinAbilities(context, result);
                break;
        }

        return result;
    }

    /**
     * 街头武士能力
     */
    private applyStreetSamuraiAbilities(context: ClassAbilityContext, result: ClassAbilityResult): void {
        // 剑术精通：近战武器伤害提升25%
        result.meleeDamageBonus = 0.25;

        // 狂战士之怒：生命值低于30%时，攻击力提升50%
        const hpPercent = context.playerHp / context.playerMaxHp;
        if (hpPercent < 0.3) {
            result.damageBonus = 0.5;
            if (!result.customEffects) result.customEffects = [];
            result.customEffects.push('狂战士之怒激活');
        }
    }

    /**
     * 数据黑客能力
     */
    private applyDataHackerAbilities(context: ClassAbilityContext, result: ClassAbilityResult): void {
        // 技能超频：技能伤害提升20%，技能冷却减少15%
        result.skillDamageBonus = 0.20;
        result.skillCooldownReduction = 0.15;

        // 无人机召唤：每30秒自动召唤一个战斗无人机协助作战
        this.handleDroneSummon(context);
    }

    /**
     * 生化改造者能力
     */
    private applyBioEngineerAbilities(context: ClassAbilityContext, result: ClassAbilityResult): void {
        // 纳米再生：每秒恢复最大生命值的1%
        result.healPerSecond = context.playerMaxHp * 0.01;

        // 钢铁堡垒：受到的伤害降低15%，护盾效果提升50%
        result.damageReduction = 0.15;
    }

    /**
     * 暗影刺客能力
     */
    private applyShadowAssassinAbilities(context: ClassAbilityContext, result: ClassAbilityResult): void {
        // 背刺：从背后攻击敌人时，伤害提升100%
        result.backstabBonus = 1.0;

        // 暗影步：有20%几率闪避敌人的攻击
        result.dodgeChance = 0.20;
    }

    /**
     * 处理无人机召唤
     */
    private handleDroneSummon(context: ClassAbilityContext): void {
        const timeSinceLastSummon = context.currentTime - this.lastDroneSummonTime;
        
        if (timeSinceLastSummon >= this.droneSummonInterval) {
            this.lastDroneSummonTime = context.currentTime;
            
            // 发射无人机召唤事件
            this.scene.events.emit('summon-drone', {
                x: context.playerX,
                y: context.playerY,
                damage: Math.floor(context.playerStats.attack * 0.5),
                duration: 15000 // 15秒
            });
        }
    }

    /**
     * 检查是否闪避攻击
     */
    public checkDodge(): boolean {
        if (!this.classData) return false;

        // 暗影刺客有20%闪避几率
        if (this.classType === ClassType.SHADOW_ASSASSIN) {
            return Math.random() < 0.20;
        }

        return false;
    }

    /**
     * 计算背刺伤害加成
     */
    public calculateBackstabBonus(playerX: number, playerY: number, enemyX: number, enemyY: number, enemyFacing: number): number {
        if (this.classType !== ClassType.SHADOW_ASSASSIN) return 0;

        // 计算玩家相对于敌人的角度
        const angleToPlayer = Math.atan2(playerY - enemyY, playerX - enemyX);
        
        // 判断玩家是否在敌人背后（角度差大于90度）
        const angleDiff = Math.abs(angleToPlayer - enemyFacing);
        const isBehind = angleDiff > Math.PI / 2 && angleDiff < Math.PI * 1.5;

        if (isBehind) {
            return 1.0; // 100%额外伤害
        }

        return 0;
    }

    /**
     * 计算近战伤害加成
     */
    public getMeleeDamageBonus(): number {
        if (this.classType === ClassType.STREET_SAMURAI) {
            return 0.25; // 25%近战伤害加成
        }
        return 0;
    }

    /**
     * 计算技能伤害加成
     */
    public getSkillDamageBonus(): number {
        if (this.classType === ClassType.DATA_HACKER) {
            return 0.20; // 20%技能伤害加成
        }
        return 0;
    }

    /**
     * 计算技能冷却缩减
     */
    public getSkillCooldownReduction(): number {
        if (this.classType === ClassType.DATA_HACKER) {
            return 0.15; // 15%冷却缩减
        }
        return 0;
    }

    /**
     * 计算伤害减免
     */
    public getDamageReduction(): number {
        if (this.classType === ClassType.BIO_ENGINEER) {
            return 0.15; // 15%伤害减免
        }
        return 0;
    }

    /**
     * 计算护盾效果加成
     */
    public getShieldEffectBonus(): number {
        if (this.classType === ClassType.BIO_ENGINEER) {
            return 0.50; // 50%护盾效果加成
        }
        return 0;
    }

    /**
     * 获取每秒治疗量
     */
    public getHealPerSecond(maxHp: number): number {
        if (this.classType === ClassType.BIO_ENGINEER) {
            return Math.floor(maxHp * 0.01); // 1%最大生命值
        }
        return 0;
    }

    /**
     * 获取低生命值时的攻击力加成
     */
    public getLowHpAttackBonus(currentHp: number, maxHp: number): number {
        if (this.classType === ClassType.STREET_SAMURAI) {
            const hpPercent = currentHp / maxHp;
            if (hpPercent < 0.3) {
                return 0.5; // 50%攻击力加成
            }
        }
        return 0;
    }

    /**
     * 获取职业能力描述
     */
    public getAbilityDescriptions(): string[] {
        if (!this.classData) return [];

        return this.classData.abilities.map(ability => 
            `${ability.name}: ${ability.description}`
        );
    }

    /**
     * 更新职业能力（每帧调用）
     */
    public update(context: ClassAbilityContext): void {
        if (!this.classData) return;

        // 生化改造者：每秒恢复生命
        if (this.classType === ClassType.BIO_ENGINEER) {
            const healAmount = this.getHealPerSecond(context.playerMaxHp);
            if (healAmount > 0) {
                // 通过事件通知玩家恢复
                this.scene.events.emit('class-heal', { amount: healAmount });
            }
        }

        // 数据黑客：处理无人机召唤
        if (this.classType === ClassType.DATA_HACKER) {
            this.handleDroneUpdate(context);
        }
    }

    /**
     * 处理无人机更新（每帧调用）
     */
    private handleDroneUpdate(context: ClassAbilityContext): void {
        const timeSinceLastSummon = context.currentTime - this.lastDroneSummonTime;
        
        // 如果上次召唤时间还没到，不处理
        if (timeSinceLastSummon < this.droneSummonInterval) {
            return;
        }

        // 更新召唤时间
        this.lastDroneSummonTime = context.currentTime;
        
        // 发射无人机召唤事件
        this.scene.events.emit('summon-drone', {
            x: context.playerX,
            y: context.playerY,
            damage: Math.floor(context.playerStats.attack * 0.5),
            duration: 15000 // 15秒
        });
        
        console.log('[ClassAbilitySystem] 数据黑客召唤无人机');
    }
}
