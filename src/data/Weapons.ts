/**
 * 武器数据定义
 * 定义游戏中所有可用武器
 */

import { Weapon, ItemRarity } from '../core/Types';

export const WEAPONS: Weapon[] = [
    // 普通武器 (Common)
    {
        id: 'weapon_basic_sword',
        name: '基础长剑',
        type: 'sword',
        rarity: ItemRarity.COMMON,
        attack: 10,
        attackSpeed: 1.0,
        critRate: 0.05,
        critDamage: 1.5,
        range: 60,
        icon: 'weapon_sword',
        description: '一把普通的铁剑，适合新手使用。'
    },
    {
        id: 'weapon_basic_blade',
        name: '基础刀刃',
        type: 'blade',
        rarity: ItemRarity.COMMON,
        attack: 8,
        attackSpeed: 1.3,
        critRate: 0.08,
        critDamage: 1.6,
        range: 50,
        icon: 'weapon_blade',
        description: '轻便的刀刃，攻击速度较快。'
    },
    {
        id: 'weapon_basic_dagger',
        name: '基础匕首',
        type: 'dagger',
        rarity: ItemRarity.COMMON,
        attack: 6,
        attackSpeed: 2.0,
        critRate: 0.12,
        critDamage: 1.8,
        range: 40,
        icon: 'weapon_dagger',
        description: '短小精悍的匕首，攻击速度极快。'
    },

    // 稀有武器 (Rare)
    {
        id: 'weapon_cyber_blade',
        name: '赛博刀锋',
        type: 'blade',
        rarity: ItemRarity.RARE,
        attack: 15,
        attackSpeed: 1.4,
        critRate: 0.12,
        critDamage: 2.0,
        range: 55,
        specialEffect: '攻击时有20%几率触发额外一次攻击',
        icon: 'weapon_blade',
        description: '注入了赛博能量的刀刃，锋利无比。'
    },
    {
        id: 'weapon_plasma_staff',
        name: '等离子法杖',
        type: 'staff',
        rarity: ItemRarity.RARE,
        attack: 20,
        attackSpeed: 0.8,
        critRate: 0.06,
        critDamage: 1.6,
        range: 100,
        specialEffect: '攻击范围提升50%',
        icon: 'weapon_staff',
        description: '能够引导等离子能量的法杖，攻击范围广阔。'
    },
    {
        id: 'weapon_quick_dagger',
        name: '迅捷匕首',
        type: 'dagger',
        rarity: ItemRarity.RARE,
        attack: 10,
        attackSpeed: 2.5,
        critRate: 0.18,
        critDamage: 2.2,
        range: 35,
        specialEffect: '暴击率额外提升10%',
        icon: 'weapon_dagger',
        description: '极其轻便的匕首，专为快速打击设计。'
    },

    // 史诗武器 (Epic)
    {
        id: 'weapon_neon_sword',
        name: '霓虹斩击剑',
        type: 'sword',
        rarity: ItemRarity.EPIC,
        attack: 25,
        attackSpeed: 1.2,
        critRate: 0.15,
        critDamage: 2.5,
        range: 70,
        specialEffect: '每次暴击回复5点生命值',
        icon: 'weapon_sword',
        description: '闪烁着霓虹光芒的长剑，拥有强大的切割力。'
    },
    {
        id: 'weapon_quantum_hammer',
        name: '量子重锤',
        type: 'hammer',
        rarity: ItemRarity.EPIC,
        attack: 35,
        attackSpeed: 0.6,
        critRate: 0.08,
        critDamage: 3.0,
        range: 80,
        specialEffect: '攻击时有30%几率眩晕敌人1秒',
        icon: 'weapon_hammer',
        description: '蕴含量子力量的巨锤，每次挥击都能撼动空间。'
    },
    {
        id: 'weapon_dual_blade',
        name: '双持利刃',
        type: 'blade',
        rarity: ItemRarity.EPIC,
        attack: 18,
        attackSpeed: 2.0,
        critRate: 0.20,
        critDamage: 2.0,
        range: 50,
        specialEffect: '连击数每达到10次，下次攻击必定暴击',
        icon: 'weapon_blade',
        description: '两把协调的利刃，能够发动连续攻击。'
    },

    // 传说武器 (Legendary)
    {
        id: 'weapon_void_blade',
        name: '虚空之刃',
        type: 'blade',
        rarity: ItemRarity.LEGENDARY,
        attack: 40,
        attackSpeed: 1.6,
        critRate: 0.25,
        critDamage: 3.5,
        range: 65,
        specialEffect: '暴击时触发虚空裂隙，对周围敌人造成额外伤害',
        icon: 'weapon_blade',
        description: '从虚空裂缝中锻造而出的神秘刀刃，拥有撕裂现实的力量。'
    },
    {
        id: 'weapon_nanite_sword',
        name: '纳米聚合剑',
        type: 'sword',
        rarity: ItemRarity.LEGENDARY,
        attack: 30,
        attackSpeed: 1.8,
        critRate: 0.22,
        critDamage: 2.8,
        range: 75,
        specialEffect: '每5次攻击触发纳米虫群，对范围内敌人造成持续伤害',
        icon: 'weapon_sword',
        description: '由纳米机器人构成的智能剑，能够自我修复和进化。'
    },
    {
        id: 'weapon_time_dagger',
        name: '时间断刃',
        type: 'dagger',
        rarity: ItemRarity.LEGENDARY,
        attack: 20,
        attackSpeed: 3.5,
        critRate: 0.30,
        critDamage: 4.0,
        range: 45,
        specialEffect: '攻击时有15%几率使敌人时间减缓50%，持续2秒',
        icon: 'weapon_dagger',
        description: '能够切割时间的匕首，让敌人在瞬间中颤抖。'
    }
];

/**
 * 根据ID获取武器
 */
export function getWeaponById(id: string): Weapon | undefined {
    return WEAPONS.find(w => w.id === id);
}

/**
 * 根据稀有度获取武器列表
 */
export function getWeaponsByRarity(rarity: ItemRarity): Weapon[] {
    return WEAPONS.filter(w => w.rarity === rarity);
}

/**
 * 获取初始武器
 */
export function getStarterWeapon(): Weapon {
    return WEAPONS[0]; // 返回基础长剑
}

/**
 * 随机获取武器（按稀有度权重）
 */
export function getRandomWeapon(): Weapon {
    const weights: Record<ItemRarity, number> = {
        [ItemRarity.COMMON]: 50,
        [ItemRarity.RARE]: 30,
        [ItemRarity.EPIC]: 15,
        [ItemRarity.LEGENDARY]: 5,
        [ItemRarity.ULTIMATE]: 0 // MVP阶段不生成终极武器
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (const [rarity, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) {
            const weapons = getWeaponsByRarity(rarity as ItemRarity);
            return weapons[Math.floor(Math.random() * weapons.length)];
        }
    }

    return WEAPONS[0];
}
