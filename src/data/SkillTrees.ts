/**
 * 职业专属技能树数据定义
 * 每个职业有3条技能分支，每条分支有5-7个技能节点
 */

import { Profession, SkillTreeBranch, ProfessionSkillTree, SkillNodeType, SkillBranch } from '../core/Types';

/**
 * 战士职业技能树 - 近战专家
 */
const WARRIOR_SKILL_TREE: ProfessionSkillTree = {
    profession: Profession.WARRIOR,
    name: '战士',
    description: '近战专家，擅长正面战斗和防御',
    icon: 'icon_warrior',
    branches: [
        // ========== 攻击分支 - 狂暴之路 ==========
        {
            id: 'warrior_fury',
            name: '狂暴之路',
            description: '强化攻击能力，提升伤害输出',
            color: 0xff4444,
            nodes: [
                {
                    id: 'warrior_fury_1',
                    skillId: 'skill_neon_slash',
                    name: '霓虹斩击',
                    description: '向前方释放霓虹能量斩，造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_slash',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'warrior_fury_2',
                    skillId: 'skill_plasma_spin',
                    name: '等离子漩涡',
                    description: '释放等离子漩涡，对周围敌人造成攻击力220%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['warrior_fury_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_spin',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'warrior_fury_3',
                    skillId: 'skill_sonic_boom',
                    name: '音爆冲击',
                    description: '释放音波冲击，造成攻击力160%伤害并击退敌人',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['warrior_fury_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_sonic',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'warrior_fury_4',
                    skillId: 'skill_flame_wave',
                    name: '烈焰波',
                    description: '释放火焰波，造成攻击力150%伤害并持续燃烧',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['warrior_fury_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_flame',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'warrior_fury_5',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['warrior_fury_3', 'warrior_fury_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_nova',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'warrior_fury_ultimate',
                    skillId: 'skill_void_rift',
                    name: '虚空裂缝',
                    description: '撕裂空间，对裂缝中敌人造成持续伤害，总计可达攻击力320%',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['warrior_fury_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_void',
                    branch: SkillBranch.OFFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 防御分支 - 钢铁意志 ==========
        {
            id: 'warrior_defense',
            name: '钢铁意志',
            description: '强化防御能力，提升生存能力',
            color: 0x4488ff,
            nodes: [
                {
                    id: 'warrior_defense_1',
                    skillId: 'skill_nanobot_shield',
                    name: '纳米护盾',
                    description: '生成纳米护盾，抵挡下一次攻击并回复15%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_shield',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'warrior_defense_2',
                    skillId: 'skill_emp_burst',
                    name: 'EMP冲击波',
                    description: '释放电磁脉冲，造成攻击力100%伤害并眩晕周围敌人2秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['warrior_defense_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_emp',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'warrior_defense_3',
                    skillId: 'skill_time_warp',
                    name: '时间扭曲',
                    description: '减缓周围敌人移动速度60%，持续4秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['warrior_defense_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_time',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'warrior_defense_4',
                    skillId: 'skill_nanite_swarm',
                    name: '纳米虫群',
                    description: '释放纳米虫群，每秒恢复8%生命值并对附近敌人造成攻击力60%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['warrior_defense_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_nanite',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'warrior_defense_5',
                    skillId: 'skill_energy_drain',
                    name: '能量汲取',
                    description: '汲取敌人能量，造成攻击力130%伤害并恢复20%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['warrior_defense_3', 'warrior_defense_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_drain',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'warrior_defense_ultimate',
                    skillId: 'skill_hologram',
                    name: '全息幻影',
                    description: '创建全息分身吸引敌人，持续4秒',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['warrior_defense_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_hologram',
                    branch: SkillBranch.DEFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 辅助分支 - 战术机动 ==========
        {
            id: 'warrior_utility',
            name: '战术机动',
            description: '强化机动能力，提升战斗灵活性',
            color: 0x44ff44,
            nodes: [
                {
                    id: 'warrior_utility_1',
                    skillId: 'skill_overdrive',
                    name: '超频驱动',
                    description: '进入超频状态，移动速度提升60%，持续6秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_overdrive',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'warrior_utility_2',
                    skillId: 'skill_chain_lightning',
                    name: '连锁闪电',
                    description: '释放闪电链，对最多4个敌人造成攻击力140%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['warrior_utility_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_lightning',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'warrior_utility_3',
                    skillId: 'skill_laser_beam',
                    name: '激光射线',
                    description: '发射贯穿激光，对直线上所有敌人造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['warrior_utility_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_laser',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'warrior_utility_4',
                    skillId: 'skill_ice_shard',
                    name: '冰霜碎片',
                    description: '发射冰霜碎片，造成攻击力130%伤害并减速敌人40%',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['warrior_utility_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_ice',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'warrior_utility_5',
                    skillId: 'skill_plasma_orb',
                    name: '等离子球',
                    description: '发射追踪等离子球，造成攻击力180%伤害并爆炸',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['warrior_utility_3', 'warrior_utility_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_orb',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'warrior_utility_ultimate',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['warrior_utility_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_nova',
                    branch: SkillBranch.UTILITY,
                    isUltimate: true
                }
            ]
        }
    ]
};

/**
 * 法师职业技能树 - 远程魔法
 */
const MAGE_SKILL_TREE: ProfessionSkillTree = {
    profession: Profession.MAGE,
    name: '法师',
    description: '远程魔法专家，擅长元素控制和范围伤害',
    icon: 'icon_mage',
    branches: [
        // ========== 攻击分支 - 元素掌控 ==========
        {
            id: 'mage_elemental',
            name: '元素掌控',
            description: '强化元素魔法，提升伤害输出',
            color: 0xff44ff,
            nodes: [
                {
                    id: 'mage_elemental_1',
                    skillId: 'skill_chain_lightning',
                    name: '连锁闪电',
                    description: '释放闪电链，对最多4个敌人造成攻击力140%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_lightning',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'mage_elemental_2',
                    skillId: 'skill_laser_beam',
                    name: '激光射线',
                    description: '发射贯穿激光，对直线上所有敌人造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['mage_elemental_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_laser',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'mage_elemental_3',
                    skillId: 'skill_flame_wave',
                    name: '烈焰波',
                    description: '释放火焰波，造成攻击力150%伤害并持续燃烧',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['mage_elemental_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_flame',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'mage_elemental_4',
                    skillId: 'skill_ice_shard',
                    name: '冰霜碎片',
                    description: '发射冰霜碎片，造成攻击力130%伤害并减速敌人40%',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['mage_elemental_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_ice',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'mage_elemental_5',
                    skillId: 'skill_plasma_orb',
                    name: '等离子球',
                    description: '发射追踪等离子球，造成攻击力180%伤害并爆炸',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['mage_elemental_3', 'mage_elemental_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_orb',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'mage_elemental_ultimate',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['mage_elemental_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_nova',
                    branch: SkillBranch.OFFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 防御分支 - 奥术护盾 ==========
        {
            id: 'mage_arcane',
            name: '奥术护盾',
            description: '强化防御魔法，提升生存能力',
            color: 0x44ffff,
            nodes: [
                {
                    id: 'mage_arcane_1',
                    skillId: 'skill_nanobot_shield',
                    name: '纳米护盾',
                    description: '生成纳米护盾，抵挡下一次攻击并回复15%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_shield',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'mage_arcane_2',
                    skillId: 'skill_time_warp',
                    name: '时间扭曲',
                    description: '减缓周围敌人移动速度60%，持续4秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['mage_arcane_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_time',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'mage_arcane_3',
                    skillId: 'skill_emp_burst',
                    name: 'EMP冲击波',
                    description: '释放电磁脉冲，造成攻击力100%伤害并眩晕周围敌人2秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['mage_arcane_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_emp',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'mage_arcane_4',
                    skillId: 'skill_nanite_swarm',
                    name: '纳米虫群',
                    description: '释放纳米虫群，每秒恢复8%生命值并对附近敌人造成攻击力60%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['mage_arcane_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_nanite',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'mage_arcane_5',
                    skillId: 'skill_energy_drain',
                    name: '能量汲取',
                    description: '汲取敌人能量，造成攻击力130%伤害并恢复20%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['mage_arcane_3', 'mage_arcane_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_drain',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'mage_arcane_ultimate',
                    skillId: 'skill_void_rift',
                    name: '虚空裂缝',
                    description: '撕裂空间，对裂缝中敌人造成持续伤害，总计可达攻击力320%',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['mage_arcane_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_void',
                    branch: SkillBranch.DEFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 辅助分支 - 时空操控 ==========
        {
            id: 'mage_temporal',
            name: '时空操控',
            description: '强化时空魔法，提升机动能力',
            color: 0xffaa00,
            nodes: [
                {
                    id: 'mage_temporal_1',
                    skillId: 'skill_overdrive',
                    name: '超频驱动',
                    description: '进入超频状态，移动速度提升60%，持续6秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_overdrive',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'mage_temporal_2',
                    skillId: 'skill_hologram',
                    name: '全息幻影',
                    description: '创建全息分身吸引敌人，持续4秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['mage_temporal_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_hologram',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'mage_temporal_3',
                    skillId: 'skill_neon_slash',
                    name: '霓虹斩击',
                    description: '向前方释放霓虹能量斩，造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['mage_temporal_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_slash',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'mage_temporal_4',
                    skillId: 'skill_sonic_boom',
                    name: '音爆冲击',
                    description: '释放音波冲击，造成攻击力160%伤害并击退敌人',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['mage_temporal_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_sonic',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'mage_temporal_5',
                    skillId: 'skill_plasma_spin',
                    name: '等离子漩涡',
                    description: '释放等离子漩涡，对周围敌人造成攻击力220%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['mage_temporal_3', 'mage_temporal_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_spin',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'mage_temporal_ultimate',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['mage_temporal_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_nova',
                    branch: SkillBranch.UTILITY,
                    isUltimate: true
                }
            ]
        }
    ]
};

/**
 * 刺客职业技能树 - 敏捷爆发
 */
const ROGUE_SKILL_TREE: ProfessionSkillTree = {
    profession: Profession.ROGUE,
    name: '刺客',
    description: '敏捷爆发专家，擅长快速移动和致命打击',
    icon: 'icon_rogue',
    branches: [
        // ========== 攻击分支 - 暗影杀戮 ==========
        {
            id: 'rogue_shadow',
            name: '暗影杀戮',
            description: '强化爆发能力，提升瞬间伤害',
            color: 0xff00ff,
            nodes: [
                {
                    id: 'rogue_shadow_1',
                    skillId: 'skill_neon_slash',
                    name: '霓虹斩击',
                    description: '向前方释放霓虹能量斩，造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_slash',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'rogue_shadow_2',
                    skillId: 'skill_chain_lightning',
                    name: '连锁闪电',
                    description: '释放闪电链，对最多4个敌人造成攻击力140%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['rogue_shadow_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_lightning',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'rogue_shadow_3',
                    skillId: 'skill_plasma_orb',
                    name: '等离子球',
                    description: '发射追踪等离子球，造成攻击力180%伤害并爆炸',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['rogue_shadow_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_orb',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'rogue_shadow_4',
                    skillId: 'skill_sonic_boom',
                    name: '音爆冲击',
                    description: '释放音波冲击，造成攻击力160%伤害并击退敌人',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['rogue_shadow_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_sonic',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'rogue_shadow_5',
                    skillId: 'skill_plasma_spin',
                    name: '等离子漩涡',
                    description: '释放等离子漩涡，对周围敌人造成攻击力220%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['rogue_shadow_3', 'rogue_shadow_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_spin',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'rogue_shadow_ultimate',
                    skillId: 'skill_void_rift',
                    name: '虚空裂缝',
                    description: '撕裂空间，对裂缝中敌人造成持续伤害，总计可达攻击力320%',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['rogue_shadow_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_void',
                    branch: SkillBranch.OFFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 防御分支 - 暗影闪避 ==========
        {
            id: 'rogue_evasion',
            name: '暗影闪避',
            description: '强化闪避能力，提升生存能力',
            color: 0x8800ff,
            nodes: [
                {
                    id: 'rogue_evasion_1',
                    skillId: 'skill_overdrive',
                    name: '超频驱动',
                    description: '进入超频状态，移动速度提升60%，持续6秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_overdrive',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'rogue_evasion_2',
                    skillId: 'skill_hologram',
                    name: '全息幻影',
                    description: '创建全息分身吸引敌人，持续4秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['rogue_evasion_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_hologram',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'rogue_evasion_3',
                    skillId: 'skill_nanobot_shield',
                    name: '纳米护盾',
                    description: '生成纳米护盾，抵挡下一次攻击并回复15%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['rogue_evasion_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_shield',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'rogue_evasion_4',
                    skillId: 'skill_time_warp',
                    name: '时间扭曲',
                    description: '减缓周围敌人移动速度60%，持续4秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['rogue_evasion_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_time',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'rogue_evasion_5',
                    skillId: 'skill_energy_drain',
                    name: '能量汲取',
                    description: '汲取敌人能量，造成攻击力130%伤害并恢复20%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['rogue_evasion_3', 'rogue_evasion_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_drain',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'rogue_evasion_ultimate',
                    skillId: 'skill_nanite_swarm',
                    name: '纳米虫群',
                    description: '释放纳米虫群，每秒恢复8%生命值并对附近敌人造成攻击力60%伤害',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['rogue_evasion_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_nanite',
                    branch: SkillBranch.DEFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 辅助分支 - 敏捷机动 ==========
        {
            id: 'rogue_agility',
            name: '敏捷机动',
            description: '强化机动能力，提升战斗灵活性',
            color: 0x00ffaa,
            nodes: [
                {
                    id: 'rogue_agility_1',
                    skillId: 'skill_laser_beam',
                    name: '激光射线',
                    description: '发射贯穿激光，对直线上所有敌人造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_laser',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'rogue_agility_2',
                    skillId: 'skill_ice_shard',
                    name: '冰霜碎片',
                    description: '发射冰霜碎片，造成攻击力130%伤害并减速敌人40%',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['rogue_agility_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_ice',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'rogue_agility_3',
                    skillId: 'skill_emp_burst',
                    name: 'EMP冲击波',
                    description: '释放电磁脉冲，造成攻击力100%伤害并眩晕周围敌人2秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['rogue_agility_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_emp',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'rogue_agility_4',
                    skillId: 'skill_flame_wave',
                    name: '烈焰波',
                    description: '释放火焰波，造成攻击力150%伤害并持续燃烧',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['rogue_agility_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_flame',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'rogue_agility_5',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['rogue_agility_3', 'rogue_agility_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_nova',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'rogue_agility_ultimate',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['rogue_agility_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_nova',
                    branch: SkillBranch.UTILITY,
                    isUltimate: true
                }
            ]
        }
    ]
};

/**
 * 工程师职业技能树 - 科技支援
 */
const ENGINEER_SKILL_TREE: ProfessionSkillTree = {
    profession: Profession.ENGINEER,
    name: '工程师',
    description: '科技支援专家，擅长科技武器和防御设施',
    icon: 'icon_engineer',
    branches: [
        // ========== 攻击分支 - 科技火力 ==========
        {
            id: 'engineer_tech',
            name: '科技火力',
            description: '强化科技武器，提升伤害输出',
            color: 0xffaa00,
            nodes: [
                {
                    id: 'engineer_tech_1',
                    skillId: 'skill_laser_beam',
                    name: '激光射线',
                    description: '发射贯穿激光，对直线上所有敌人造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_laser',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'engineer_tech_2',
                    skillId: 'skill_plasma_orb',
                    name: '等离子球',
                    description: '发射追踪等离子球，造成攻击力180%伤害并爆炸',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['engineer_tech_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_orb',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'engineer_tech_3',
                    skillId: 'skill_chain_lightning',
                    name: '连锁闪电',
                    description: '释放闪电链，对最多4个敌人造成攻击力140%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['engineer_tech_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_lightning',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'engineer_tech_4',
                    skillId: 'skill_emp_burst',
                    name: 'EMP冲击波',
                    description: '释放电磁脉冲，造成攻击力100%伤害并眩晕周围敌人2秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['engineer_tech_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_emp',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'engineer_tech_5',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['engineer_tech_3', 'engineer_tech_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_nova',
                    branch: SkillBranch.OFFENSE
                },
                {
                    id: 'engineer_tech_ultimate',
                    skillId: 'skill_void_rift',
                    name: '虚空裂缝',
                    description: '撕裂空间，对裂缝中敌人造成持续伤害，总计可达攻击力320%',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['engineer_tech_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_void',
                    branch: SkillBranch.OFFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 防御分支 - 防御矩阵 ==========
        {
            id: 'engineer_defense',
            name: '防御矩阵',
            description: '强化防御设施，提升生存能力',
            color: 0x00aaff,
            nodes: [
                {
                    id: 'engineer_defense_1',
                    skillId: 'skill_nanobot_shield',
                    name: '纳米护盾',
                    description: '生成纳米护盾，抵挡下一次攻击并回复15%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_shield',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'engineer_defense_2',
                    skillId: 'skill_nanite_swarm',
                    name: '纳米虫群',
                    description: '释放纳米虫群，每秒恢复8%生命值并对附近敌人造成攻击力60%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['engineer_defense_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_nanite',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'engineer_defense_3',
                    skillId: 'skill_time_warp',
                    name: '时间扭曲',
                    description: '减缓周围敌人移动速度60%，持续4秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['engineer_defense_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_time',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'engineer_defense_4',
                    skillId: 'skill_hologram',
                    name: '全息幻影',
                    description: '创建全息分身吸引敌人，持续4秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['engineer_defense_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_hologram',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'engineer_defense_5',
                    skillId: 'skill_energy_drain',
                    name: '能量汲取',
                    description: '汲取敌人能量，造成攻击力130%伤害并恢复20%生命值',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['engineer_defense_3', 'engineer_defense_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_drain',
                    branch: SkillBranch.DEFENSE
                },
                {
                    id: 'engineer_defense_ultimate',
                    skillId: 'skill_nanite_swarm',
                    name: '纳米虫群',
                    description: '释放纳米虫群，每秒恢复8%生命值并对附近敌人造成攻击力60%伤害',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['engineer_defense_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_nanite',
                    branch: SkillBranch.DEFENSE,
                    isUltimate: true
                }
            ]
        },
        // ========== 辅助分支 - 科技支援 ==========
        {
            id: 'engineer_support',
            name: '科技支援',
            description: '强化支援能力，提升团队效益',
            color: 0x88ff00,
            nodes: [
                {
                    id: 'engineer_support_1',
                    skillId: 'skill_overdrive',
                    name: '超频驱动',
                    description: '进入超频状态，移动速度提升60%，持续6秒',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 0 },
                    prerequisites: [],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_overdrive',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'engineer_support_2',
                    skillId: 'skill_neon_slash',
                    name: '霓虹斩击',
                    description: '向前方释放霓虹能量斩，造成攻击力180%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 1 },
                    prerequisites: ['engineer_support_1'],
                    cost: 1,
                    maxLevel: 5,
                    icon: 'icon_slash',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'engineer_support_3',
                    skillId: 'skill_plasma_spin',
                    name: '等离子漩涡',
                    description: '释放等离子漩涡，对周围敌人造成攻击力220%伤害',
                    type: SkillNodeType.NORMAL,
                    position: { x: -1, y: 2 },
                    prerequisites: ['engineer_support_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_spin',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'engineer_support_4',
                    skillId: 'skill_sonic_boom',
                    name: '音爆冲击',
                    description: '释放音波冲击，造成攻击力160%伤害并击退敌人',
                    type: SkillNodeType.NORMAL,
                    position: { x: 1, y: 2 },
                    prerequisites: ['engineer_support_2'],
                    cost: 2,
                    maxLevel: 5,
                    icon: 'icon_sonic',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'engineer_support_5',
                    skillId: 'skill_flame_wave',
                    name: '烈焰波',
                    description: '释放火焰波，造成攻击力150%伤害并持续燃烧',
                    type: SkillNodeType.NORMAL,
                    position: { x: 0, y: 3 },
                    prerequisites: ['engineer_support_3', 'engineer_support_4'],
                    cost: 3,
                    maxLevel: 5,
                    icon: 'icon_flame',
                    branch: SkillBranch.UTILITY
                },
                {
                    id: 'engineer_support_ultimate',
                    skillId: 'skill_nova',
                    name: '能量新星',
                    description: '爆发能量新星，对周围敌人造成攻击力280%伤害',
                    type: SkillNodeType.ULTIMATE,
                    position: { x: 0, y: 4 },
                    prerequisites: ['engineer_support_5'],
                    cost: 5,
                    maxLevel: 1,
                    icon: 'icon_nova',
                    branch: SkillBranch.UTILITY,
                    isUltimate: true
                }
            ]
        }
    ]
};

/**
 * 所有职业技能树映射
 */
export const PROFESSION_SKILL_TREES: Record<string, ProfessionSkillTree> = {
    [Profession.WARRIOR]: WARRIOR_SKILL_TREE,
    [Profession.MAGE]: MAGE_SKILL_TREE,
    [Profession.ROGUE]: ROGUE_SKILL_TREE,
    [Profession.ENGINEER]: ENGINEER_SKILL_TREE
};

/**
 * 根据职业获取技能树
 */
export function getSkillTreeByProfession(profession: Profession): ProfessionSkillTree | undefined {
    return PROFESSION_SKILL_TREES[profession];
}

/**
 * 根据节点ID获取节点数据
 */
export function getSkillNodeById(profession: Profession, nodeId: string): { node: any; branch: SkillTreeBranch } | undefined {
    const tree = PROFESSION_SKILL_TREES[profession];
    if (!tree) return undefined;

    for (const branch of tree.branches) {
        const node = branch.nodes.find(n => n.id === nodeId);
        if (node) {
            return { node, branch };
        }
    }

    return undefined;
}

/**
 * 检查节点是否可以解锁
 */
export function canUnlockNode(
    profession: Profession,
    nodeId: string,
    unlockedNodes: Map<string, number>,
    availablePoints: number
): { canUnlock: boolean; reason: string } {
    const result = getSkillNodeById(profession, nodeId);
    if (!result) {
        return { canUnlock: false, reason: '节点不存在' };
    }

    const { node } = result;

    // 检查是否已解锁
    if (unlockedNodes.has(nodeId)) {
        const currentLevel = unlockedNodes.get(nodeId) || 0;
        if (currentLevel >= node.maxLevel) {
            return { canUnlock: false, reason: '已达到最大等级' };
        }
    }

    // 检查技能点是否足够
    if (availablePoints < node.cost) {
        return { canUnlock: false, reason: '技能点不足' };
    }

    // 检查前置条件
    for (const prereqId of node.prerequisites) {
        if (!unlockedNodes.has(prereqId)) {
            return { canUnlock: false, reason: '前置技能未解锁' };
        }
    }

    // 如果是终极技能，检查前置技能是否全部解锁到最大等级
    if (node.isUltimate) {
        for (const prereqId of node.prerequisites) {
            const prereqResult = getSkillNodeById(profession, prereqId);
            if (prereqResult) {
                const prereqLevel = unlockedNodes.get(prereqId) || 0;
                if (prereqLevel < prereqResult.node.maxLevel) {
                    return { canUnlock: false, reason: '前置技能未达到最大等级' };
                }
            }
        }
    }

    return { canUnlock: true, reason: '' };
}

/**
 * 获取职业名称
 */
export function getProfessionName(profession: Profession): string {
    const names: Record<string, string> = {
        [Profession.WARRIOR]: '战士',
        [Profession.MAGE]: '法师',
        [Profession.ROGUE]: '刺客',
        [Profession.ENGINEER]: '工程师'
    };
    return names[profession] || '未知';
}

/**
 * 获取职业描述
 */
export function getProfessionDescription(profession: Profession): string {
    const descriptions: Record<string, string> = {
        [Profession.WARRIOR]: '近战专家，擅长正面战斗和防御',
        [Profession.MAGE]: '远程魔法专家，擅长元素控制和范围伤害',
        [Profession.ROGUE]: '敏捷爆发专家，擅长快速移动和致命打击',
        [Profession.ENGINEER]: '科技支援专家，擅长科技武器和防御设施'
    };
    return descriptions[profession] || '';
}
