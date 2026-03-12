/**
 * 职业数据定义
 * 定义游戏中所有可选择的职业
 */

import { ClassType } from '../core/Types';

/**
 * 职业属性加成
 */
export interface ClassStatsBonus {
    maxHp?: number;           // 最大生命值加成（绝对值）
    maxHpPercent?: number;    // 最大生命值加成（百分比）
    attack?: number;          // 攻击力加成（绝对值）
    attackPercent?: number;   // 攻击力加成（百分比）
    defense?: number;         // 防御力加成（绝对值）
    defensePercent?: number;  // 防御力加成（百分比）
    moveSpeed?: number;       // 移动速度加成（绝对值）
    moveSpeedPercent?: number;// 移动速度加成（百分比）
    critRate?: number;        // 暴击率加成（百分比）
    critDamage?: number;      // 暴击伤害加成（百分比）
    attackSpeed?: number;     // 攻击速度加成（百分比）
    maxMana?: number;         // 最大法力值加成
    manaRegen?: number;       // 法力回复加成
}

/**
 * 职业特殊能力
 */
export interface ClassAbility {
    id: string;               // 能力ID
    name: string;             // 能力名称
    description: string;      // 能力描述
    type: 'passive' | 'active'; // 能力类型
    effect: string;           // 效果描述
}

/**
 * 职业数据
 */
export interface ClassData {
    id: ClassType;            // 职业ID
    name: string;             // 职业名称
    title: string;            // 职业称号
    description: string;      // 职业描述
    playstyle: string;        // 玩法风格
    stats: ClassStatsBonus;   // 属性加成
    startingSkill: string;    // 初始技能ID
    startingWeapon: string;   // 初始武器ID
    abilities: ClassAbility[];// 特殊能力
    color: number;            // 主题颜色（十六进制）
    icon: string;             // 图标资源路径
    difficulty: 'easy' | 'medium' | 'hard'; // 难度等级
    tags: string[];           // 标签（用于筛选）
}

/**
 * 所有职业数据
 */
export const CLASSES: Record<ClassType, ClassData> = {
    // ========== 街头武士 ==========
    [ClassType.STREET_SAMURAI]: {
        id: ClassType.STREET_SAMURAI,
        name: '街头武士',
        title: '霓虹之刃',
        description: '在赛博都市的暗巷中磨练出致命剑术的战士。以极高的攻击力和暴击率著称，能够在瞬间爆发惊人的伤害。',
        playstyle: '近战爆发型 - 高攻击、高暴击、低防御',
        stats: {
            maxHp: -20,           // 生命值降低
            maxHpPercent: -0.1,   // 生命值降低10%
            attack: 8,            // 攻击力大幅提升
            attackPercent: 0.15,  // 攻击力提升15%
            defense: -2,          // 防御力降低
            critRate: 0.1,        // 暴击率提升10%
            critDamage: 0.3,      // 暴击伤害提升30%
            attackSpeed: 0.1      // 攻击速度提升10%
        },
        startingSkill: 'skill_neon_slash',
        startingWeapon: 'weapon_katana_starter',
        abilities: [
            {
                id: 'blade_mastery',
                name: '剑术精通',
                description: '近战武器伤害提升25%',
                type: 'passive',
                effect: 'melee_damage_bonus_25%'
            },
            {
                id: 'berserker_rage',
                name: '狂战士之怒',
                description: '生命值低于30%时，攻击力提升50%',
                type: 'passive',
                effect: 'low_hp_attack_boost_50%'
            }
        ],
        color: 0xff4444,
        icon: 'icon_samurai',
        difficulty: 'medium',
        tags: ['近战', '爆发', '高风险']
    },

    // ========== 数据黑客 ==========
    [ClassType.DATA_HACKER]: {
        id: ClassType.DATA_HACKER,
        name: '数据黑客',
        title: '网络幽灵',
        description: '操控数据的网络术士，初始自带一个战斗无人机协助作战。能够释放强大的电子技能，技能伤害极高，但需要合理管理法力值。',
        playstyle: '远程控制型 - 中攻击、高技能伤害、召唤无人机',
        stats: {
            maxHp: 0,
            attack: 2,            // 攻击力略微提升
            defense: -1,          // 防御力略微降低
            critRate: 0.05,       // 暴击率提升5%
            maxMana: 30,          // 法力值大幅提升
            manaRegen: 0.5        // 法力回复提升
        },
        startingSkill: 'skill_chain_lightning',
        startingWeapon: 'weapon_dataglove_starter',
        abilities: [
            {
                id: 'skill_overclock',
                name: '技能超频',
                description: '技能伤害提升20%，技能冷却减少15%',
                type: 'passive',
                effect: 'skill_damage_20%_cd_reduction_15%'
            },
            {
                id: 'drone_summon',
                name: '无人机召唤',
                description: '游戏开始5秒后自动召唤一个战斗无人机，每30秒自动补充，最多同时存在3个',
                type: 'passive',
                effect: 'auto_summon_drone'
            }
        ],
        color: 0x00ffff,
        icon: 'icon_hacker',
        difficulty: 'hard',
        tags: ['远程', '技能', '召唤']
    },

    // ========== 生化改造者 ==========
    [ClassType.BIO_ENGINEER]: {
        id: ClassType.BIO_ENGINEER,
        name: '生化改造者',
        title: '钢铁之心',
        description: '经过重度生化改造的战士，拥有超强的防御力和生命值。能够自我修复并保护队友，是团队的坚实盾牌。',
        playstyle: '坦克辅助型 - 高防御、高生命、治疗能力',
        stats: {
            maxHp: 40,            // 生命值大幅提升
            maxHpPercent: 0.2,    // 生命值提升20%
            attack: -2,           // 攻击力降低
            defense: 8,           // 防御力大幅提升
            defensePercent: 0.2,  // 防御力提升20%
            moveSpeed: -20,       // 移动速度降低
            critRate: -0.02       // 暴击率降低
        },
        startingSkill: 'skill_nanobot_shield',
        startingWeapon: 'weapon_biofist_starter',
        abilities: [
            {
                id: 'regeneration',
                name: '纳米再生',
                description: '每秒恢复最大生命值的1%',
                type: 'passive',
                effect: 'hp_regen_1%_per_sec'
            },
            {
                id: 'fortress',
                name: '钢铁堡垒',
                description: '受到的伤害降低15%，护盾效果提升50%',
                type: 'passive',
                effect: 'damage_reduction_15%_shield_boost_50%'
            }
        ],
        color: 0x44ff44,
        icon: 'icon_engineer',
        difficulty: 'easy',
        tags: ['坦克', '治疗', '防御']
    },

    // ========== 暗影刺客 ==========
    [ClassType.SHADOW_ASSASSIN]: {
        id: ClassType.SHADOW_ASSASSIN,
        name: '暗影刺客',
        title: '无声杀手',
        description: '在暗影中穿行的致命刺客，拥有极高的暴击率和闪避能力。擅长从背后发动致命一击，瞬间秒杀敌人。',
        playstyle: '潜行爆发型 - 高暴击、高闪避、背刺伤害',
        stats: {
            maxHp: -10,           // 生命值略微降低
            attack: 4,            // 攻击力提升
            defense: -3,          // 防御力降低
            moveSpeed: 30,        // 移动速度大幅提升
            moveSpeedPercent: 0.15,// 移动速度提升15%
            critRate: 0.15,       // 暴击率大幅提升
            critDamage: 0.5,      // 暴击伤害大幅提升
            attackSpeed: 0.2      // 攻击速度提升20%
        },
        startingSkill: 'skill_hologram',
        startingWeapon: 'weapon_dualdagger_starter',
        abilities: [
            {
                id: 'backstab',
                name: '背刺',
                description: '从背后攻击敌人时，伤害提升100%',
                type: 'passive',
                effect: 'backstab_damage_100%'
            },
            {
                id: 'shadow_step',
                name: '暗影步',
                description: '有20%几率闪避敌人的攻击',
                type: 'passive',
                effect: 'dodge_chance_20%'
            }
        ],
        color: 0xaa44ff,
        icon: 'icon_assassin',
        difficulty: 'hard',
        tags: ['潜行', '暴击', '高机动']
    }
};

/**
 * 获取所有职业列表
 */
export function getAllClasses(): ClassData[] {
    return Object.values(CLASSES);
}

/**
 * 根据ID获取职业数据
 */
export function getClassById(id: ClassType): ClassData | null {
    return CLASSES[id] || null;
}

/**
 * 获取职业名称
 */
export function getClassName(id: ClassType): string {
    const classData = CLASSES[id];
    return classData ? classData.name : '未知职业';
}

/**
 * 获取职业颜色
 */
export function getClassColor(id: ClassType): number {
    const classData = CLASSES[id];
    return classData ? classData.color : 0xffffff;
}

/**
 * 获取职业主题颜色（十六进制字符串）
 */
export function getClassColorHex(id: ClassType): string {
    const color = getClassColor(id);
    return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * 根据难度获取职业列表
 */
export function getClassesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): ClassData[] {
    return Object.values(CLASSES).filter(c => c.difficulty === difficulty);
}

/**
 * 根据标签获取职业列表
 */
export function getClassesByTag(tag: string): ClassData[] {
    return Object.values(CLASSES).filter(c => c.tags.includes(tag));
}

/**
 * 获取推荐职业（新手友好）
 */
export function getRecommendedClassForBeginners(): ClassData {
    return CLASSES.bio_engineer; // 生化改造者最适合新手
}

/**
 * 验证职业ID是否有效
 */
export function isValidClassId(id: string): id is ClassType {
    return id in CLASSES;
}
