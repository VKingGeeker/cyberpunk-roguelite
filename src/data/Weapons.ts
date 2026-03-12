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
    },

    // ========== 职业专属武器 ==========
    
    // 街头武士专属 - 武士刀
    {
        id: 'weapon_katana_starter',
        name: '新手武士刀',
        type: 'katana',
        rarity: ItemRarity.COMMON,
        attack: 12,
        attackSpeed: 1.2,
        critRate: 0.08,
        critDamage: 1.8,
        range: 65,
        icon: 'weapon_katana',
        description: '街头武士的入门武器，平衡的攻击和速度。',
        classRestriction: 'street_samurai'
    },
    {
        id: 'weapon_katana_neon',
        name: '霓虹武士刀',
        type: 'katana',
        rarity: ItemRarity.RARE,
        attack: 18,
        attackSpeed: 1.4,
        critRate: 0.12,
        critDamage: 2.2,
        range: 70,
        specialEffect: '连击数达到5时，下次攻击必定暴击',
        icon: 'weapon_katana',
        description: '闪烁着霓虹光芒的武士刀，专为连击设计。',
        classRestriction: 'street_samurai'
    },
    {
        id: 'weapon_katana_plasma',
        name: '等离子武士刀',
        type: 'katana',
        rarity: ItemRarity.EPIC,
        attack: 28,
        attackSpeed: 1.5,
        critRate: 0.18,
        critDamage: 2.8,
        range: 75,
        specialEffect: '暴击时触发等离子爆发，对前方敌人造成范围伤害',
        icon: 'weapon_katana',
        description: '等离子能量充盈的武士刀，每次挥击都释放毁灭性能量。',
        classRestriction: 'street_samurai'
    },
    {
        id: 'weapon_katana_void',
        name: '虚空斩魂刀',
        type: 'katana',
        rarity: ItemRarity.LEGENDARY,
        attack: 45,
        attackSpeed: 1.8,
        critRate: 0.25,
        critDamage: 3.5,
        range: 80,
        specialEffect: '每次击杀恢复10%生命值，暴击时撕裂空间造成额外50%伤害',
        icon: 'weapon_katana',
        description: '传说中的虚空武士刀，据说能斩断灵魂。',
        classRestriction: 'street_samurai'
    },

    // 数据黑客专属 - 数据手套
    {
        id: 'weapon_dataglove_starter',
        name: '基础数据手套',
        type: 'data_glove',
        rarity: ItemRarity.COMMON,
        attack: 8,
        attackSpeed: 1.5,
        critRate: 0.06,
        critDamage: 1.6,
        range: 80,
        icon: 'weapon_dataglove',
        description: '数据黑客的基础装备，能够发射数据流攻击。',
        classRestriction: 'data_hacker'
    },
    {
        id: 'weapon_dataglove_quantum',
        name: '量子数据手套',
        type: 'data_glove',
        rarity: ItemRarity.RARE,
        attack: 14,
        attackSpeed: 1.8,
        critRate: 0.1,
        critDamage: 2.0,
        range: 100,
        specialEffect: '攻击有20%几率触发数据溢出，造成双倍伤害',
        icon: 'weapon_dataglove',
        description: '量子加密的数据手套，攻击附带数据干扰效果。',
        classRestriction: 'data_hacker'
    },
    {
        id: 'weapon_dataglove_neural',
        name: '神经链接手套',
        type: 'data_glove',
        rarity: ItemRarity.EPIC,
        attack: 22,
        attackSpeed: 2.0,
        critRate: 0.15,
        critDamage: 2.5,
        range: 120,
        specialEffect: '每次攻击有15%几率入侵敌人系统，使其眩晕1.5秒',
        icon: 'weapon_dataglove',
        description: '直接连接神经系统的数据手套，能够入侵敌人意识。',
        classRestriction: 'data_hacker'
    },
    {
        id: 'weapon_dataglove_matrix',
        name: '矩阵掌控者',
        type: 'data_glove',
        rarity: ItemRarity.LEGENDARY,
        attack: 35,
        attackSpeed: 2.5,
        critRate: 0.22,
        critDamage: 3.2,
        range: 150,
        specialEffect: '攻击无视敌人防御，暴击时重置所有技能冷却时间（冷却30秒）',
        icon: 'weapon_dataglove',
        description: '传说中的数据手套，据说能掌控整个数字世界。',
        classRestriction: 'data_hacker'
    },

    // 生化改造者专属 - 生化拳套
    {
        id: 'weapon_biofist_starter',
        name: '基础生化拳套',
        type: 'bio_fist',
        rarity: ItemRarity.COMMON,
        attack: 15,
        attackSpeed: 0.9,
        critRate: 0.04,
        critDamage: 1.5,
        range: 45,
        icon: 'weapon_biofist',
        description: '生化改造者的基础武器，提供强大的近战力量。',
        classRestriction: 'bio_engineer'
    },
    {
        id: 'weapon_biofist_titan',
        name: '泰坦生化拳套',
        type: 'bio_fist',
        rarity: ItemRarity.RARE,
        attack: 25,
        attackSpeed: 1.0,
        critRate: 0.06,
        critDamage: 1.8,
        range: 50,
        specialEffect: '攻击有25%几率击退敌人，并造成额外20%伤害',
        icon: 'weapon_biofist',
        description: '强化肌肉纤维的生化拳套，拥有惊人的力量。',
        classRestriction: 'bio_engineer'
    },
    {
        id: 'weapon_biofist_berserker',
        name: '狂战士拳套',
        type: 'bio_fist',
        rarity: ItemRarity.EPIC,
        attack: 38,
        attackSpeed: 1.1,
        critRate: 0.1,
        critDamage: 2.2,
        range: 55,
        specialEffect: '生命值越低攻击力越高，最高提升50%攻击力',
        icon: 'weapon_biofist',
        description: '狂暴的生化拳套，越战越勇。',
        classRestriction: 'bio_engineer'
    },
    {
        id: 'weapon_biofist_apocalypse',
        name: '末日审判拳套',
        type: 'bio_fist',
        rarity: ItemRarity.LEGENDARY,
        attack: 55,
        attackSpeed: 1.3,
        critRate: 0.15,
        critDamage: 2.8,
        range: 60,
        specialEffect: '每次攻击恢复5%生命值，暴击时对周围敌人造成冲击波伤害',
        icon: 'weapon_biofist',
        description: '传说中的生化拳套，一拳足以毁灭一切。',
        classRestriction: 'bio_engineer'
    },

    // 暗影刺客专属 - 双匕首
    {
        id: 'weapon_dualdagger_starter',
        name: '基础双匕首',
        type: 'dual_dagger',
        rarity: ItemRarity.COMMON,
        attack: 7,
        attackSpeed: 2.2,
        critRate: 0.1,
        critDamage: 1.7,
        range: 40,
        icon: 'weapon_dualdagger',
        description: '暗影刺客的基础武器，快速且致命。',
        classRestriction: 'shadow_assassin'
    },
    {
        id: 'weapon_dualdagger_shadow',
        name: '暗影双匕首',
        type: 'dual_dagger',
        rarity: ItemRarity.RARE,
        attack: 11,
        attackSpeed: 2.5,
        critRate: 0.15,
        critDamage: 2.1,
        range: 45,
        specialEffect: '从背后攻击必定暴击',
        icon: 'weapon_dualdagger',
        description: '暗影编织的双匕首，专为暗杀设计。',
        classRestriction: 'shadow_assassin'
    },
    {
        id: 'weapon_dualdagger_phantom',
        name: '幻影双匕首',
        type: 'dual_dagger',
        rarity: ItemRarity.EPIC,
        attack: 16,
        attackSpeed: 3.0,
        critRate: 0.22,
        critDamage: 2.6,
        range: 50,
        specialEffect: '暴击时留下幻影，1秒后对同一目标再次造成50%伤害',
        icon: 'weapon_dualdagger',
        description: '幻影般的双匕首，攻击如鬼魅般难以捉摸。',
        classRestriction: 'shadow_assassin'
    },
    {
        id: 'weapon_dualdagger_reaper',
        name: '死神之吻',
        type: 'dual_dagger',
        rarity: ItemRarity.LEGENDARY,
        attack: 25,
        attackSpeed: 3.5,
        critRate: 0.3,
        critDamage: 3.5,
        range: 55,
        specialEffect: '连续暴击3次触发"死神降临"，下次攻击造成300%伤害并恢复20%生命值',
        icon: 'weapon_dualdagger',
        description: '传说中的双匕首，被它触碰的敌人将面对死神。',
        classRestriction: 'shadow_assassin'
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
