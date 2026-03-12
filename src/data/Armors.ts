/**
 * 防具数据定义
 * 定义游戏中所有防具和套装
 */

import { Armor, ArmorSet, ItemRarity, ItemStats } from '../core/Types';

// ============ 套装定义 ============

export const ARMOR_SETS: ArmorSet[] = [
    // 赛博武士套装 - 吸血和暴击
    {
        id: 'set_cyber_samurai',
        name: '赛博武士',
        pieces: ['armor_samurai_helmet', 'armor_samurai_chestplate', 'armor_samurai_leggings', 'armor_samurai_accessory'],
        twoPieceBonus: {
            type: 'lifesteal',
            value: 0.08,
            description: '攻击时恢复造成伤害的8%生命值'
        },
        fourPieceBonus: {
            type: 'critical_fury',
            value: 0.25,
            description: '暴击时额外造成25%伤害'
        }
    },
    // 纳米装甲套装 - 护盾和防御
    {
        id: 'set_nanite_armor',
        name: '纳米装甲',
        pieces: ['armor_nanite_helmet', 'armor_nanite_chestplate', 'armor_nanite_leggings', 'armor_nanite_accessory'],
        twoPieceBonus: {
            type: 'shield',
            value: 50,
            description: '每30秒获得一个50点生命值的护盾'
        },
        fourPieceBonus: {
            type: 'arcane_shield',
            value: 0.15,
            description: '受到伤害时15%几率生成护盾吸收下次攻击'
        }
    },
    // 暗影刺客套装 - 闪避和暴击伤害
    {
        id: 'set_shadow_assassin',
        name: '暗影刺客',
        pieces: ['armor_shadow_helmet', 'armor_shadow_chestplate', 'armor_shadow_leggings', 'armor_shadow_accessory'],
        twoPieceBonus: {
            type: 'dodge',
            value: 0.12,
            description: '12%几率闪避攻击'
        },
        fourPieceBonus: {
            type: 'lifesteal',
            value: 0.15,
            description: '暴击时恢复造成伤害的15%生命值'
        }
    },
    // 能量装甲套装 - 反弹和穿透
    {
        id: 'set_energy_armor',
        name: '能量装甲',
        pieces: ['armor_energy_helmet', 'armor_energy_chestplate', 'armor_energy_leggings', 'armor_energy_accessory'],
        twoPieceBonus: {
            type: 'damage_reflect',
            value: 0.15,
            description: '反弹15%受到的伤害给攻击者'
        },
        fourPieceBonus: {
            type: 'armor_penetration',
            value: 0.3,
            description: '攻击无视敌人30%防御力'
        }
    },
    // 生化改造套装 - 生命恢复和狂战士
    {
        id: 'set_bio_augment',
        name: '生化改造',
        pieces: ['armor_bio_helmet', 'armor_bio_chestplate', 'armor_bio_leggings', 'armor_bio_accessory'],
        twoPieceBonus: {
            type: 'regeneration',
            value: 2,
            description: '每秒恢复2点生命值'
        },
        fourPieceBonus: {
            type: 'berserker',
            value: 0.5,
            description: '生命值低于30%时，攻击力提升50%'
        }
    },
    // 荆棘守护套装 - 反伤和防御
    {
        id: 'set_thorn_guardian',
        name: '荆棘守护',
        pieces: ['armor_thorn_helmet', 'armor_thorn_chestplate', 'armor_thorn_leggings', 'armor_thorn_accessory'],
        twoPieceBonus: {
            type: 'thorns',
            value: 20,
            description: '受到近战攻击时对攻击者造成20点伤害'
        },
        fourPieceBonus: {
            type: 'damage_reflect',
            value: 0.25,
            description: '反弹25%受到的所有伤害'
        }
    }
];

// ============ 防具定义 ============

export const ARMORS: Armor[] = [
    // ========== 赛博武士套装（史诗） ==========
    {
        id: 'armor_samurai_helmet',
        name: '武士头盔',
        slot: 'helmet',
        rarity: ItemRarity.EPIC,
        setId: 'set_cyber_samurai',
        stats: {
            defense: 15,
            maxHp: 30,
            critRate: 0.05
        },
        icon: 'armor_helmet',
        description: '融合了武士精神的赛博头盔，提供优秀的防护和暴击加成。',
        visualEffect: 'samurai_helmet_glow'
    },
    {
        id: 'armor_samurai_chestplate',
        name: '武士胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.EPIC,
        setId: 'set_cyber_samurai',
        stats: {
            defense: 25,
            maxHp: 50,
            attack: 8
        },
        icon: 'armor_chestplate',
        description: '轻量化设计的武士胸甲，兼顾防护与机动性。',
        visualEffect: 'samurai_chest_glow'
    },
    {
        id: 'armor_samurai_leggings',
        name: '武士护腿',
        slot: 'leggings',
        rarity: ItemRarity.EPIC,
        setId: 'set_cyber_samurai',
        stats: {
            defense: 18,
            moveSpeed: 15,
            critDamage: 0.2
        },
        icon: 'armor_leggings',
        description: '灵活的武士护腿，提供移动速度和暴击伤害加成。',
        visualEffect: 'samurai_legs_glow'
    },
    {
        id: 'armor_samurai_accessory',
        name: '武士勋章',
        slot: 'accessory',
        rarity: ItemRarity.EPIC,
        setId: 'set_cyber_samurai',
        stats: {
            attack: 12,
            critRate: 0.08,
            critDamage: 0.25
        },
        icon: 'armor_accessory',
        description: '象征武士荣耀的勋章，大幅提升攻击和暴击能力。',
        visualEffect: 'samurai_accessory_glow'
    },

    // ========== 纳米装甲套装（传说） ==========
    {
        id: 'armor_nanite_helmet',
        name: '纳米头盔',
        slot: 'helmet',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_nanite_armor',
        stats: {
            defense: 20,
            maxHp: 40,
            mana: 20
        },
        specialEffect: '受到致命伤害时，纳米机器人自动修复，恢复30%生命值（冷却60秒）',
        icon: 'armor_helmet',
        description: '由纳米机器人构成的智能头盔，能够自动修复损伤。',
        visualEffect: 'nanite_helmet_particles'
    },
    {
        id: 'armor_nanite_chestplate',
        name: '纳米胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_nanite_armor',
        stats: {
            defense: 45,
            maxHp: 80
        },
        specialEffect: '每5秒自动修复5%最大生命值',
        icon: 'armor_chestplate',
        description: '纳米机器人编织的胸甲，提供持续的自我修复能力。',
        visualEffect: 'nanite_chest_particles'
    },
    {
        id: 'armor_nanite_leggings',
        name: '纳米护腿',
        slot: 'leggings',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_nanite_armor',
        stats: {
            defense: 25,
            maxHp: 50,
            moveSpeed: 10
        },
        icon: 'armor_leggings',
        description: '纳米材料制成的护腿，轻便且防护力强。',
        visualEffect: 'nanite_legs_particles'
    },
    {
        id: 'armor_nanite_accessory',
        name: '纳米核心',
        slot: 'accessory',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_nanite_armor',
        stats: {
            maxHp: 60,
            defense: 15,
            mana: 30
        },
        specialEffect: '护盾值提升50%',
        icon: 'armor_accessory',
        description: '纳米系统的核心模块，强化所有防护能力。',
        visualEffect: 'nanite_core_particles'
    },

    // ========== 暗影刺客套装（传说） ==========
    {
        id: 'armor_shadow_helmet',
        name: '暗影面具',
        slot: 'helmet',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_shadow_assassin',
        stats: {
            defense: 12,
            critRate: 0.1,
            critDamage: 0.3
        },
        specialEffect: '暴击时20%几率使敌人眩晕1秒',
        icon: 'armor_helmet',
        description: '暗影编织的面具，让使用者在黑暗中如鱼得水。',
        visualEffect: 'shadow_helmet_aura'
    },
    {
        id: 'armor_shadow_chestplate',
        name: '暗影斗篷',
        slot: 'chestplate',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_shadow_assassin',
        stats: {
            defense: 18,
            attack: 15,
            critDamage: 0.35
        },
        specialEffect: '闪避成功时，下次攻击必定暴击',
        icon: 'armor_chestplate',
        description: '能够吸收光线的暗影斗篷，提供极高的机动性。',
        visualEffect: 'shadow_chest_aura'
    },
    {
        id: 'armor_shadow_leggings',
        name: '暗影护腿',
        slot: 'leggings',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_shadow_assassin',
        stats: {
            defense: 14,
            moveSpeed: 25,
            critRate: 0.08
        },
        icon: 'armor_leggings',
        description: '轻盈的暗影护腿，让移动如同鬼魅。',
        visualEffect: 'shadow_legs_aura'
    },
    {
        id: 'armor_shadow_accessory',
        name: '暗影之戒',
        slot: 'accessory',
        rarity: ItemRarity.LEGENDARY,
        setId: 'set_shadow_assassin',
        stats: {
            attack: 18,
            critRate: 0.12,
            critDamage: 0.4
        },
        specialEffect: '暴击伤害额外提升20%',
        icon: 'armor_accessory',
        description: '蕴含暗影力量的戒指，极大增强暴击能力。',
        visualEffect: 'shadow_ring_aura'
    },

    // ========== 能量装甲套装（史诗） ==========
    {
        id: 'armor_energy_helmet',
        name: '能量头盔',
        slot: 'helmet',
        rarity: ItemRarity.EPIC,
        setId: 'set_energy_armor',
        stats: {
            defense: 18,
            maxHp: 35,
            attack: 5
        },
        icon: 'armor_helmet',
        description: '充能型能量头盔，提供稳定的防护。',
        visualEffect: 'energy_helmet_glow'
    },
    {
        id: 'armor_energy_chestplate',
        name: '能量胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.EPIC,
        setId: 'set_energy_armor',
        stats: {
            defense: 30,
            maxHp: 60,
            attack: 8
        },
        specialEffect: '受到伤害时有20%几率触发能量护盾',
        icon: 'armor_chestplate',
        description: '高能量密度的胸甲，能够吸收部分伤害。',
        visualEffect: 'energy_chest_glow'
    },
    {
        id: 'armor_energy_leggings',
        name: '能量护腿',
        slot: 'leggings',
        rarity: ItemRarity.EPIC,
        setId: 'set_energy_armor',
        stats: {
            defense: 22,
            maxHp: 40,
            moveSpeed: 8
        },
        icon: 'armor_leggings',
        description: '能量护腿，提供均衡的防护和机动性。',
        visualEffect: 'energy_legs_glow'
    },
    {
        id: 'armor_energy_accessory',
        name: '能量核心',
        slot: 'accessory',
        rarity: ItemRarity.EPIC,
        setId: 'set_energy_armor',
        stats: {
            attack: 10,
            defense: 12,
            maxHp: 30
        },
        icon: 'armor_accessory',
        description: '能量系统的核心，强化所有能量装备的效果。',
        visualEffect: 'energy_core_glow'
    },

    // ========== 生化改造套装（稀有） ==========
    {
        id: 'armor_bio_helmet',
        name: '生化头盔',
        slot: 'helmet',
        rarity: ItemRarity.RARE,
        setId: 'set_bio_augment',
        stats: {
            defense: 12,
            maxHp: 25,
            attack: 3
        },
        icon: 'armor_helmet',
        description: '生化改造的头盔，增强生命活力。',
        visualEffect: 'bio_helmet_glow'
    },
    {
        id: 'armor_bio_chestplate',
        name: '生化胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.RARE,
        setId: 'set_bio_augment',
        stats: {
            defense: 20,
            maxHp: 45,
            attack: 5
        },
        specialEffect: '每秒恢复1点生命值',
        icon: 'armor_chestplate',
        description: '生化肌肉纤维编织的胸甲，提供持续恢复能力。',
        visualEffect: 'bio_chest_glow'
    },
    {
        id: 'armor_bio_leggings',
        name: '生化护腿',
        slot: 'leggings',
        rarity: ItemRarity.RARE,
        setId: 'set_bio_augment',
        stats: {
            defense: 15,
            maxHp: 30,
            moveSpeed: 10
        },
        icon: 'armor_leggings',
        description: '生化改造的护腿，增强肌肉力量。',
        visualEffect: 'bio_legs_glow'
    },
    {
        id: 'armor_bio_accessory',
        name: '生化芯片',
        slot: 'accessory',
        rarity: ItemRarity.RARE,
        setId: 'set_bio_augment',
        stats: {
            attack: 8,
            maxHp: 35,
            defense: 8
        },
        icon: 'armor_accessory',
        description: '生化改造芯片，强化身体机能。',
        visualEffect: 'bio_chip_glow'
    },

    // ========== 荆棘守护套装（史诗） ==========
    {
        id: 'armor_thorn_helmet',
        name: '荆棘头盔',
        slot: 'helmet',
        rarity: ItemRarity.EPIC,
        setId: 'set_thorn_guardian',
        stats: {
            defense: 25,
            maxHp: 40
        },
        specialEffect: '受到近战攻击时反弹10点伤害',
        icon: 'armor_helmet',
        description: '布满尖刺的头盔，让攻击者付出代价。',
        visualEffect: 'thorn_helmet_spikes'
    },
    {
        id: 'armor_thorn_chestplate',
        name: '荆棘胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.EPIC,
        setId: 'set_thorn_guardian',
        stats: {
            defense: 45,
            maxHp: 70
        },
        specialEffect: '反弹15%受到的伤害',
        icon: 'armor_chestplate',
        description: '荆棘覆盖的重型胸甲，提供极强的防护和反伤能力。',
        visualEffect: 'thorn_chest_spikes'
    },
    {
        id: 'armor_thorn_leggings',
        name: '荆棘护腿',
        slot: 'leggings',
        rarity: ItemRarity.EPIC,
        setId: 'set_thorn_guardian',
        stats: {
            defense: 33,
            maxHp: 50
        },
        icon: 'armor_leggings',
        description: '荆棘护腿，增强防御的同时提供反伤效果。',
        visualEffect: 'thorn_legs_spikes'
    },
    {
        id: 'armor_thorn_accessory',
        name: '荆棘之心',
        slot: 'accessory',
        rarity: ItemRarity.EPIC,
        setId: 'set_thorn_guardian',
        stats: {
            defense: 15,
            maxHp: 40,
            attack: 5
        },
        specialEffect: '反弹伤害提升50%',
        icon: 'armor_accessory',
        description: '荆棘守护的核心，强化所有反伤效果。',
        visualEffect: 'thorn_heart_glow'
    },

    // ========== 独立防具（普通） ==========
    {
        id: 'armor_basic_helmet',
        name: '基础头盔',
        slot: 'helmet',
        rarity: ItemRarity.COMMON,
        stats: {
            defense: 8,
            maxHp: 15
        },
        icon: 'armor_helmet',
        description: '简单的防护头盔，提供基础防护。'
    },
    {
        id: 'armor_basic_chestplate',
        name: '基础胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.COMMON,
        stats: {
            defense: 12,
            maxHp: 25
        },
        icon: 'armor_chestplate',
        description: '基础的防护胸甲，适合新手使用。'
    },
    {
        id: 'armor_basic_leggings',
        name: '基础护腿',
        slot: 'leggings',
        rarity: ItemRarity.COMMON,
        stats: {
            defense: 10,
            maxHp: 20
        },
        icon: 'armor_leggings',
        description: '基础的护腿装备，提供基本防护。'
    },
    {
        id: 'armor_basic_accessory',
        name: '基础饰品',
        slot: 'accessory',
        rarity: ItemRarity.COMMON,
        stats: {
            attack: 3,
            defense: 3
        },
        icon: 'armor_accessory',
        description: '简单的装饰品，提供微弱的属性加成。'
    },

    // ========== 独立防具（稀有） ==========
    {
        id: 'armor_reinforced_helmet',
        name: '强化头盔',
        slot: 'helmet',
        rarity: ItemRarity.RARE,
        stats: {
            defense: 14,
            maxHp: 30,
            critRate: 0.03
        },
        icon: 'armor_helmet',
        description: '经过强化的头盔，提供更好的防护和少量暴击加成。'
    },
    {
        id: 'armor_reinforced_chestplate',
        name: '强化胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.RARE,
        stats: {
            defense: 22,
            maxHp: 45,
            attack: 5
        },
        icon: 'armor_chestplate',
        description: '强化型胸甲，提供均衡的防护和攻击加成。'
    },
    {
        id: 'armor_reinforced_leggings',
        name: '强化护腿',
        slot: 'leggings',
        rarity: ItemRarity.RARE,
        stats: {
            defense: 18,
            maxHp: 35,
            moveSpeed: 8
        },
        icon: 'armor_leggings',
        description: '强化护腿，兼顾防护和机动性。'
    },
    {
        id: 'armor_reinforced_accessory',
        name: '强化饰品',
        slot: 'accessory',
        rarity: ItemRarity.RARE,
        stats: {
            attack: 6,
            defense: 6,
            critRate: 0.04
        },
        icon: 'armor_accessory',
        description: '强化饰品，提供全面的属性加成。'
    },

    // ========== 独立防具（史诗） ==========
    {
        id: 'armor_elite_helmet',
        name: '精英头盔',
        slot: 'helmet',
        rarity: ItemRarity.EPIC,
        stats: {
            defense: 18,
            maxHp: 40,
            critRate: 0.06,
            critDamage: 0.15
        },
        specialEffect: '暴击时5%几率立即重置技能冷却',
        icon: 'armor_helmet',
        description: '精英战士的头盔，提供优秀的防护和暴击加成。'
    },
    {
        id: 'armor_elite_chestplate',
        name: '精英胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.EPIC,
        stats: {
            defense: 33,
            maxHp: 60,
            attack: 10
        },
        specialEffect: '受到伤害时10%几率获得护盾',
        icon: 'armor_chestplate',
        description: '精英级胸甲，提供强大的防护能力。'
    },
    {
        id: 'armor_elite_leggings',
        name: '精英护腿',
        slot: 'leggings',
        rarity: ItemRarity.EPIC,
        stats: {
            defense: 22,
            maxHp: 45,
            moveSpeed: 12,
            critRate: 0.04
        },
        icon: 'armor_leggings',
        description: '精英护腿，提供优秀的机动性和防护。'
    },
    {
        id: 'armor_elite_accessory',
        name: '精英饰品',
        slot: 'accessory',
        rarity: ItemRarity.EPIC,
        stats: {
            attack: 12,
            defense: 10,
            critRate: 0.07,
            critDamage: 0.2
        },
        specialEffect: '所有属性提升5%',
        icon: 'armor_accessory',
        description: '精英级饰品，全面提升战斗能力。'
    },

    // ========== 独立防具（传说） ==========
    {
        id: 'armor_legendary_helmet',
        name: '传说之冠',
        slot: 'helmet',
        rarity: ItemRarity.LEGENDARY,
        stats: {
            defense: 22,
            maxHp: 50,
            critRate: 0.1,
            critDamage: 0.25
        },
        specialEffect: '生命值低于50%时，暴击率额外提升15%',
        icon: 'armor_helmet',
        description: '传说中的头盔，蕴含强大的力量。'
    },
    {
        id: 'armor_legendary_chestplate',
        name: '传说胸甲',
        slot: 'chestplate',
        rarity: ItemRarity.LEGENDARY,
        stats: {
            defense: 50,
            maxHp: 90,
            attack: 15
        },
        specialEffect: '每10秒获得一个吸收100点伤害的护盾',
        icon: 'armor_chestplate',
        description: '传说中的胸甲，提供无与伦比的防护。'
    },
    {
        id: 'armor_legendary_leggings',
        name: '传说护腿',
        slot: 'leggings',
        rarity: ItemRarity.LEGENDARY,
        stats: {
            defense: 28,
            maxHp: 60,
            moveSpeed: 18,
            critRate: 0.08
        },
        specialEffect: '移动时每秒恢复2点生命值',
        icon: 'armor_leggings',
        description: '传说中的护腿，让使用者如风般迅捷。'
    },
    {
        id: 'armor_legendary_accessory',
        name: '传说之心',
        slot: 'accessory',
        rarity: ItemRarity.LEGENDARY,
        stats: {
            attack: 20,
            defense: 15,
            critRate: 0.12,
            critDamage: 0.35
        },
        specialEffect: '所有伤害提升15%',
        icon: 'armor_accessory',
        description: '传说中的饰品，蕴含无穷的力量。'
    }
];

// ============ 辅助函数 ============

/**
 * 根据ID获取防具
 */
export function getArmorById(id: string): Armor | undefined {
    return ARMORS.find(a => a.id === id);
}

/**
 * 根据槽位获取防具列表
 */
export function getArmorsBySlot(slot: string): Armor[] {
    return ARMORS.filter(a => a.slot === slot);
}

/**
 * 根据稀有度获取防具列表
 */
export function getArmorsByRarity(rarity: ItemRarity): Armor[] {
    return ARMORS.filter(a => a.rarity === rarity);
}

/**
 * 根据套装ID获取套装数据
 */
export function getArmorSetById(setId: string): ArmorSet | undefined {
    return ARMOR_SETS.find(s => s.id === setId);
}

/**
 * 获取套装的所有部件
 */
export function getArmorSetPieces(setId: string): Armor[] {
    const set = getArmorSetById(setId);
    if (!set) return [];
    
    return set.pieces
        .map(pieceId => getArmorById(pieceId))
        .filter((a): a is Armor => a !== undefined);
}

/**
 * 随机获取防具（按稀有度权重）
 */
export function getRandomArmor(slot?: string): Armor {
    const weights: Record<ItemRarity, number> = {
        [ItemRarity.COMMON]: 50,
        [ItemRarity.RARE]: 30,
        [ItemRarity.EPIC]: 15,
        [ItemRarity.LEGENDARY]: 5,
        [ItemRarity.ULTIMATE]: 0
    };

    const pool = slot ? getArmorsBySlot(slot) : ARMORS;
    const totalWeight = pool.reduce((sum, armor) => sum + weights[armor.rarity], 0);
    let random = Math.random() * totalWeight;

    for (const armor of pool) {
        random -= weights[armor.rarity];
        if (random <= 0) {
            return armor;
        }
    }

    return pool[0];
}

/**
 * 获取初始防具套装
 */
export function getStarterArmorSet(): { [slot: string]: Armor } {
    return {
        helmet: getArmorById('armor_basic_helmet')!,
        chestplate: getArmorById('armor_basic_chestplate')!,
        leggings: getArmorById('armor_basic_leggings')!,
        accessory: getArmorById('armor_basic_accessory')!
    };
}
