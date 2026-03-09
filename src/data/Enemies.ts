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
}

/**
 * MVP 敌人列表
 */
export const MVP_ENEMIES: EnemyTemplate[] = [
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
