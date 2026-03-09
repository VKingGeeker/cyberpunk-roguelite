/**
 * 战斗系统
 * 处理伤害计算、暴击判定、连击系统
 */

import { CombatStats, DamageResult } from '../core/Types';
import { GAME_CONFIG } from '../core/Config';

/**
 * 战斗系统类
 */
export class CombatSystem {
    /**
     * 计算伤害
     * @param attacker 攻击者属性
     * @param defender 防御者属性
     * @returns 伤害计算结果
     */
    public static calculateDamage(attacker: CombatStats, defender: CombatStats): DamageResult {
        let damage = attacker.attack - defender.defense * 0.5;
        damage = Math.max(damage, GAME_CONFIG.combat.baseAttackRange * 0.2); // 最小伤害

        // 暴击判定
        const isCrit = Math.random() < attacker.critRate;
        if (isCrit) {
            damage *= attacker.critDamage;
        }

        // 元素加成（暂未实现）
        const elementalBonus = 1.0;

        // 格挡判定（暂未实现）
        const isBlocked = false;

        return {
            damage: Math.floor(damage),
            isCrit,
            isBlocked,
            elementalBonus
        };
    }

    /**
     * 计算技能伤害
     * @param attacker 攻击者属性
     * @param defender 防御者属性
     * @param damageMultiplier 伤害倍率
     * @returns 伤害计算结果
     */
    public static calculateSkillDamage(
        attacker: CombatStats,
        defender: CombatStats,
        damageMultiplier: number
    ): DamageResult {
        let damage = attacker.attack * damageMultiplier - defender.defense * 0.5;
        damage = Math.max(damage, GAME_CONFIG.combat.baseAttackRange * 0.3);

        // 技能暴击判定
        const isCrit = Math.random() < attacker.critRate * 1.2; // 技能暴击率略高
        if (isCrit) {
            damage *= attacker.critDamage;
        }

        return {
            damage: Math.floor(damage),
            isCrit,
            isBlocked: false,
            elementalBonus: 1.0
        };
    }

    /**
     * 检查攻击是否冷却完毕
     * @param lastAttackTime 上次攻击时间
     * @param attackSpeed 攻击速度（次/秒）
     * @param currentTime 当前时间（毫秒）
     * @returns 是否可以攻击
     */
    public static canAttack(lastAttackTime: number, attackSpeed: number, currentTime: number): boolean {
        const attackInterval = 1000 / attackSpeed;
        return currentTime - lastAttackTime >= attackInterval;
    }

    /**
     * 检查是否暴击
     * @param critRate 暴击率
     * @returns 是否暴击
     */
    public static checkCrit(critRate: number): boolean {
        return Math.random() < critRate;
    }

    /**
     * 计算暴击伤害
     * @param baseDamage 基础伤害
     * @param critDamage 暴击伤害倍率
     * @returns 暴击伤害
     */
    public static calculateCritDamage(baseDamage: number, critDamage: number): number {
        return Math.floor(baseDamage * critDamage);
    }

    /**
     * 计算连击加成
     * @param comboCount 连击数
     * @returns 连击加成倍率
     */
    public static calculateComboBonus(comboCount: number): number {
        // 每5次连击增加10%伤害，最高50%
        const bonus = Math.min(Math.floor(comboCount / 5), 5) * 0.1;
        return 1.0 + bonus;
    }

    /**
     * 检查连击是否超时
     * @param lastComboTime 上次连击时间
     * @param currentTime 当前时间（毫秒）
     * @returns 是否超时
     */
    public static isComboTimeout(lastComboTime: number, currentTime: number): boolean {
        return currentTime - lastComboTime >= GAME_CONFIG.combat.comboResetTime;
    }

    /**
     * 计算治疗量
     * @param maxHp 最大生命值
     * @param healPercentage 治疗百分比
     * @returns 治疗量
     */
    public static calculateHealAmount(maxHp: number, healPercentage: number): number {
        return Math.floor(maxHp * (healPercentage / 100));
    }

    /**
     * 计算护盾值
     * @param maxHp 最大生命值
     * @param shieldPercentage 护盾百分比
     * @returns 护盾值
     */
    public static calculateShieldValue(maxHp: number, shieldPercentage: number): number {
        return Math.floor(maxHp * (shieldPercentage / 100));
    }
}

/**
 * 战斗事件类型
 */
export enum CombatEventType {
    DAMAGE_DEALT = 'damageDealt',
    DAMAGE_TAKEN = 'damageTaken',
    HEAL = 'heal',
    CRIT = 'crit',
    COMBO = 'combo',
    KILL = 'kill',
    DEATH = 'death'
}

/**
 * 战斗事件数据
 */
export interface CombatEventData {
    type: CombatEventType;
    source: any;
    target: any;
    value: number;
    isCrit?: boolean;
}

/**
 * 战斗事件监听器
 */
export type CombatEventListener = (event: CombatEventData) => void;

/**
 * 战斗事件管理器
 */
export class CombatEventManager {
    private static listeners: Map<CombatEventType, CombatEventListener[]> = new Map();

    /**
     * 注册事件监听器
     * @param type 事件类型
     * @param listener 监听器函数
     */
    public static on(type: CombatEventType, listener: CombatEventListener): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(listener);
    }

    /**
     * 移除事件监听器
     * @param type 事件类型
     * @param listener 监听器函数
     */
    public static off(type: CombatEventType, listener: CombatEventListener): void {
        const listeners = this.listeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * 触发战斗事件
     * @param event 战斗事件数据
     */
    public static emit(event: CombatEventData): void {
        const listeners = this.listeners.get(event.type);
        if (listeners) {
            for (const listener of listeners) {
                listener(event);
            }
        }
    }

    /**
     * 清除所有事件监听器
     */
    public static clear(): void {
        this.listeners.clear();
    }
}
