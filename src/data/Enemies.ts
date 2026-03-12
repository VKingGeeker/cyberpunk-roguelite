/**
 * 敌人数据定义
 * 定义MVP阶段的所有敌人
 */

import { EnemyType } from '../core/Types';

/**
 * 敌人属性模板
 */
export interface EnemyTemplate {
    type: EnemyType;
    name: string;
    hp: number;
    attack: number;
    defense: number;
    attackSpeed: number;
    critRate: number;
    critDamage: number;
    moveSpeed: number;
    experience: number;      // 击杀获得经验值
    lootTable: { itemId: string; chance: number }[]; // 掉落表
    // 特殊属性
    attackRange?: number;     // 攻击范围（远程敌人）
    preferredDistance?: number; // 保持距离（远程敌人）
    summonCount?: number;     // 召唤数量（召唤型敌人）
    summonType?: EnemyType;   // 召唤类型（召唤型敌人）
    splitCount?: number;      // 分裂数量（分裂型敌人）
    splitType?: EnemyType;    // 分裂类型（分裂型敌人）
    specialAbility?: string;  // 特殊能力描述
}

/**
 * MVP 敌人列表
 */
export const MVP_ENEMIES: EnemyTemplate[] = [
    // ========== 基础敌人 ==========
    {
        type: EnemyType.COMMON,
        name: '街头混混',
        hp: 50,
        attack: 15,
        defense: 5,
        attackSpeed: 0.8,
        critRate: 0.02,
        critDamage: 1.2,
        moveSpeed: 100,
        experience: 10,
        lootTable: [
            { itemId: 'material_gear', chance: 0.5 },
            { itemId: 'consumable_nanobot', chance: 0.1 },
            { itemId: 'weapon_common_vibroblade', chance: 0.05 }
        ]
    },
    {
        type: EnemyType.ELITE,
        name: '赛博保镖',
        hp: 150,
        attack: 30,
        defense: 15,
        attackSpeed: 0.6,
        critRate: 0.05,
        critDamage: 1.3,
        moveSpeed: 120,
        experience: 50,
        lootTable: [
            { itemId: 'material_chip', chance: 0.8 },
            { itemId: 'material_gear', chance: 1.0 },
            { itemId: 'consumable_battery', chance: 0.3 },
            { itemId: 'weapon_rare_heatkatana', chance: 0.1 },
            { itemId: 'armor_rare_kevlar', chance: 0.1 }
        ]
    },
    
    // ========== 特殊敌人 ==========
    {
        type: EnemyType.RANGED,
        name: '狙击无人机',
        hp: 40,
        attack: 25,
        defense: 3,
        attackSpeed: 0.5,
        critRate: 0.1,
        critDamage: 1.5,
        moveSpeed: 80,
        experience: 15,
        attackRange: 400,
        preferredDistance: 300,
        specialAbility: '远程射击，保持距离',
        lootTable: [
            { itemId: 'material_gear', chance: 0.4 },
            { itemId: 'material_chip', chance: 0.3 },
            { itemId: 'consumable_battery', chance: 0.2 }
        ]
    },
    {
        type: EnemyType.SUMMONER,
        name: '黑客召唤师',
        hp: 80,
        attack: 10,
        defense: 8,
        attackSpeed: 0.4,
        critRate: 0.02,
        critDamage: 1.2,
        moveSpeed: 70,
        experience: 30,
        summonCount: 3,
        summonType: EnemyType.COMMON,
        specialAbility: '召唤小型无人机',
        lootTable: [
            { itemId: 'material_chip', chance: 0.9 },
            { itemId: 'material_gear', chance: 0.6 },
            { itemId: 'consumable_nanobot', chance: 0.3 }
        ]
    },
    {
        type: EnemyType.SPLITTER,
        name: '纳米分裂体',
        hp: 60,
        attack: 12,
        defense: 4,
        attackSpeed: 0.7,
        critRate: 0.03,
        critDamage: 1.3,
        moveSpeed: 90,
        experience: 20,
        splitCount: 2,
        splitType: EnemyType.COMMON,
        specialAbility: '死亡时分裂成小敌人',
        lootTable: [
            { itemId: 'material_gear', chance: 0.5 },
            { itemId: 'consumable_nanobot', chance: 0.4 }
        ]
    },
    
    // ========== BOSS敌人 ==========
    {
        type: EnemyType.BOSS,
        name: '区域首领',
        hp: 5000,
        attack: 80,
        defense: 40,
        attackSpeed: 0.5,
        critRate: 0.08,
        critDamage: 1.5,
        moveSpeed: 80,
        experience: 200,
        lootTable: [
            { itemId: 'material_crystal', chance: 1.0 },
            { itemId: 'material_chip', chance: 1.0 },
            { itemId: 'material_gear', chance: 1.0 },
            { itemId: 'weapon_legendary_thunderaxe', chance: 0.2 },
            { itemId: 'consumable_teleport', chance: 0.3 },
            { itemId: 'consumable_shield', chance: 0.3 }
        ]
    },
    {
        type: EnemyType.BOSS_MECH_BEAST,
        name: '机械巨兽',
        hp: 8000,
        attack: 120,
        defense: 60,
        attackSpeed: 0.4,
        critRate: 0.1,
        critDamage: 2.0,
        moveSpeed: 100,
        experience: 500,
        attackRange: 150,
        specialAbility: '冲锋攻击、范围践踏',
        lootTable: [
            { itemId: 'material_crystal', chance: 1.0 },
            { itemId: 'material_chip', chance: 1.0 },
            { itemId: 'weapon_legendary_thunderaxe', chance: 0.3 },
            { itemId: 'armor_legendary_exoskeleton', chance: 0.2 },
            { itemId: 'consumable_shield', chance: 0.5 }
        ]
    },
    {
        type: EnemyType.BOSS_DATA_GHOST,
        name: '数据幽灵',
        hp: 4000,
        attack: 100,
        defense: 20,
        attackSpeed: 0.8,
        critRate: 0.15,
        critDamage: 2.5,
        moveSpeed: 150,
        experience: 400,
        attackRange: 300,
        specialAbility: '隐身、瞬移、幻影分身',
        lootTable: [
            { itemId: 'material_crystal', chance: 1.0 },
            { itemId: 'material_chip', chance: 1.0 },
            { itemId: 'weapon_legendary_phantomblade', chance: 0.3 },
            { itemId: 'consumable_teleport', chance: 0.6 },
            { itemId: 'skill_scroll_stealth', chance: 0.2 }
        ]
    },
    {
        type: EnemyType.BOSS_BIO_TYRANT,
        name: '生化暴君',
        hp: 6000,
        attack: 90,
        defense: 50,
        attackSpeed: 0.5,
        critRate: 0.08,
        critDamage: 1.8,
        moveSpeed: 90,
        experience: 450,
        attackRange: 200,
        summonCount: 4,
        summonType: EnemyType.SPLITTER,
        specialAbility: '毒气喷射、召唤分裂体',
        lootTable: [
            { itemId: 'material_crystal', chance: 1.0 },
            { itemId: 'material_chip', chance: 1.0 },
            { itemId: 'weapon_legendary_bioacid', chance: 0.3 },
            { itemId: 'armor_legendary_hazmat', chance: 0.2 },
            { itemId: 'consumable_antidote', chance: 0.8 }
        ]
    }
];

/**
 * 根据类型获取敌人模板
 */
export function getEnemyTemplate(type: EnemyType): EnemyTemplate | undefined {
    return MVP_ENEMIES.find(enemy => enemy.type === type);
}

/**
 * 计算敌人属性（根据关卡等级）
 */
export function calculateEnemyStats(template: EnemyTemplate, level: number): EnemyTemplate {
    const levelMultiplier = 1 + (level - 1) * 0.2; // 每关属性提升20%

    return {
        ...template,
        hp: Math.floor(template.hp * levelMultiplier),
        attack: Math.floor(template.attack * levelMultiplier),
        defense: Math.floor(template.defense * levelMultiplier),
        experience: Math.floor(template.experience * levelMultiplier)
    };
}

/**
 * 随机掉落物品
 */
export function rollLoot(template: EnemyTemplate): string[] {
    const loot: string[] = [];

    for (const item of template.lootTable) {
        if (Math.random() < item.chance) {
            loot.push(item.itemId);
        }
    }

    return loot;
}

/**
 * 获取敌人名称
 */
export function getEnemyName(type: EnemyType): string {
    const template = getEnemyTemplate(type);
    return template?.name || '未知敌人';
}

/**
 * 获取敌人经验值
 */
export function getEnemyExperience(type: EnemyType): number {
    const template = getEnemyTemplate(type);
    return template?.experience || 0;
}
