/**
 * 物品数据定义
 * 定义MVP阶段的所有物品
 */

import { Item, ItemType, ItemRarity, ConsumableEffect, ItemStats } from '../core/Types';

/**
 * MVP 物品列表
 * 1个职业（街头武士）的装备
 */
export const MVP_ITEMS: Item[] = [
    // ========== 武器 ==========
    {
        id: 'weapon_common_vibroblade',
        name: '振动短刀',
        type: ItemType.WEAPON,
        rarity: ItemRarity.COMMON,
        stats: {
            attack: 25,
            attackSpeed: 1.2,
            critRate: 0.05,
            critDamage: 1.5
        },
        icon: 'vibroblade.png',
        description: '基础武器，无视10%护甲',
        specialEffect: '攻击时无视10%护甲'
    },
    {
        id: 'weapon_rare_heatkatana',
        name: '热能武士刀',
        type: ItemType.WEAPON,
        rarity: ItemRarity.RARE,
        stats: {
            attack: 45,
            attackSpeed: 0.9,
            critRate: 0.08,
            critDamage: 1.6
        },
        icon: 'heatkatana.png',
        description: '攻击有20%概率造成持续燃烧（3秒，每秒10伤害）',
        specialEffect: '20%概率造成燃烧'
    },
    {
        id: 'weapon_epic_highfreqblade',
        name: '高频振刃',
        type: ItemType.WEAPON,
        rarity: ItemRarity.EPIC,
        stats: {
            attack: 80,
            attackSpeed: 1.5,
            critRate: 0.12,
            critDamage: 1.8
        },
        icon: 'highfreqblade.png',
        description: '每次攻击积累振动槽，满槽后下次攻击必定暴击',
        specialEffect: '满振动槽后下次必定暴击'
    },
    {
        id: 'weapon_legendary_thunderaxe',
        name: '雷电战斧',
        type: ItemType.WEAPON,
        rarity: ItemRarity.LEGENDARY,
        stats: {
            attack: 150,
            attackSpeed: 0.7,
            critRate: 0.15,
            critDamage: 2.0
        },
        icon: 'thunderaxe.png',
        description: '攻击范围扩大50%，对机械敌人造成双倍伤害',
        specialEffect: '对机械敌人双倍伤害'
    },

    // ========== 防具 ==========
    {
        id: 'armor_common_jacket',
        name: '皮夹克',
        type: ItemType.ARMOR,
        rarity: ItemRarity.COMMON,
        stats: {
            defense: 15,
            maxHp: 20
        },
        icon: 'jacket.png',
        description: '基础护甲',
        specialEffect: null
    },
    {
        id: 'armor_rare_kevlar',
        name: '凯夫拉护甲',
        type: ItemType.ARMOR,
        rarity: ItemRarity.RARE,
        stats: {
            defense: 30,
            maxHp: 40
        },
        icon: 'kevlar.png',
        description: '受到近战伤害减少15%',
        specialEffect: '近战减伤15%'
    },

    // ========== 消耗品 ==========
    {
        id: 'consumable_nanobot',
        name: '医疗纳米机器人',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effect: {
            type: 'heal',
            value: 30
        },
        icon: 'nanobot.png',
        description: '立即回复30%生命值',
        specialEffect: null
    },
    {
        id: 'consumable_battery',
        name: '能量电池',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effect: {
            type: 'mana',
            value: 50
        },
        icon: 'battery.png',
        description: '立即回复50%法力值',
        specialEffect: null
    },
    {
        id: 'consumable_teleport',
        name: '闪现装置',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        effect: {
            type: 'teleport',
            value: 5,
            duration: 0.5
        },
        icon: 'teleport.png',
        description: '瞬移至前方5米处，脱离锁定',
        specialEffect: null
    },
    {
        id: 'consumable_shield',
        name: '护盾发生器',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        effect: {
            type: 'shield',
            value: 200
        },
        icon: 'shield.png',
        description: '生成临时护盾（200点），持续8秒',
        specialEffect: null
    }
];

/**
 * 材料列表
 */
export const MATERIAL_ITEMS: Item[] = [
    {
        id: 'material_gear',
        name: '齿轮',
        type: ItemType.MATERIAL,
        rarity: ItemRarity.COMMON,
        icon: 'gear.png',
        description: '普通怪物掉落的基础材料',
        specialEffect: null
    },
    {
        id: 'material_chip',
        name: '芯片',
        type: ItemType.MATERIAL,
        rarity: ItemRarity.RARE,
        icon: 'chip.png',
        description: '精英怪物掉落的稀有材料',
        specialEffect: null
    },
    {
        id: 'material_crystal',
        name: '核心晶体',
        type: ItemType.MATERIAL,
        rarity: ItemRarity.EPIC,
        icon: 'crystal.png',
        description: 'BOSS掉落的史诗材料',
        specialEffect: null
    },
    {
        id: 'material_darkmatter',
        name: '黑暗物质',
        type: ItemType.MATERIAL,
        rarity: ItemRarity.LEGENDARY,
        icon: 'darkmatter.png',
        description: '隐藏事件获得的传说材料',
        specialEffect: null
    }
];

/**
 * 获取物品ID列表
 */
export function getItemIds(): string[] {
    return [...MVP_ITEMS, ...MATERIAL_ITEMS].map(item => item.id);
}

/**
 * 根据ID获取物品
 */
export function getItemById(id: string): Item | undefined {
    const allItems = [...MVP_ITEMS, ...MATERIAL_ITEMS];
    return allItems.find(item => item.id === id);
}

/**
 * 根据类型获取物品列表
 */
export function getItemsByType(type: ItemType): Item[] {
    const allItems = [...MVP_ITEMS, ...MATERIAL_ITEMS];
    return allItems.filter(item => item.type === type);
}

/**
 * 根据稀有度获取物品列表
 */
export function getItemsByRarity(rarity: ItemRarity): Item[] {
    const allItems = [...MVP_ITEMS, ...MATERIAL_ITEMS];
    return allItems.filter(item => item.rarity === rarity);
}
