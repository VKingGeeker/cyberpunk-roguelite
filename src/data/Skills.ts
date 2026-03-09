/**
 * 技能数据定义 - 赛博朋克被动技能
 * 升级时可选择的技能
 */

import { Skill, SkillType, SkillBranch } from '../core/Types';

/**
 * 被动技能列表
 * 升级时随机选择
 */
export const PASSIVE_SKILLS: Skill[] = [
    // ========== 攻击分支 ==========
    {
        id: 'skill_neon_slash',
        name: '霓虹斩击',
        description: '向前方释放霓虹能量斩，造成攻击力150%伤害',
        icon: 'icon_slash',
        branch: SkillBranch.OFFENSE,
        manaCost: 0,
        cooldown: 2,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.SLASH,
            damage: 1.5,
            range: 100
        }
    },
    {
        id: 'skill_plasma_spin',
        name: '等离子漩涡',
        description: '释放等离子漩涡，对周围敌人造成攻击力200%伤害',
        icon: 'icon_spin',
        branch: SkillBranch.OFFENSE,
        manaCost: 0,
        cooldown: 5,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.SPIN,
            damage: 2.0,
            range: 120
        }
    },
    {
        id: 'skill_chain_lightning',
        name: '连锁闪电',
        description: '释放闪电链，对最多3个敌人造成攻击力120%伤害',
        icon: 'icon_lightning',
        branch: SkillBranch.OFFENSE,
        manaCost: 0,
        cooldown: 3,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.CHAIN_LIGHTNING,
            damage: 1.2,
            range: 200,
            chains: 3
        }
    },
    {
        id: 'skill_laser_beam',
        name: '激光射线',
        description: '发射贯穿激光，对直线上所有敌人造成攻击力180%伤害',
        icon: 'icon_laser',
        branch: SkillBranch.OFFENSE,
        manaCost: 0,
        cooldown: 4,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.LASER_BEAM,
            damage: 1.8,
            range: 300
        }
    },
    
    // ========== 防御分支 ==========
    {
        id: 'skill_nanobot_shield',
        name: '纳米护盾',
        description: '生成纳米护盾，抵挡下一次攻击并回复10%生命值',
        icon: 'icon_shield',
        branch: SkillBranch.DEFENSE,
        manaCost: 0,
        cooldown: 12,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.SHIELD,
            healValue: 10,
            duration: 5
        }
    },
    {
        id: 'skill_emp_burst',
        name: 'EMP冲击波',
        description: '释放电磁脉冲，眩晕周围敌人2秒',
        icon: 'icon_emp',
        branch: SkillBranch.DEFENSE,
        manaCost: 0,
        cooldown: 8,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.EMP_BURST,
            damage: 0.5,
            range: 150,
            stunDuration: 2
        }
    },
    
    // ========== 辅助分支 ==========
    {
        id: 'skill_overdrive',
        name: '超频驱动',
        description: '进入超频状态，移动速度提升50%，持续5秒',
        icon: 'icon_overdrive',
        branch: SkillBranch.UTILITY,
        manaCost: 0,
        cooldown: 15,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.OVERDRIVE,
            speedBoost: 0.5,
            duration: 5
        }
    },
    {
        id: 'skill_hologram',
        name: '全息幻影',
        description: '创建全息分身吸引敌人，持续4秒',
        icon: 'icon_hologram',
        branch: SkillBranch.UTILITY,
        manaCost: 0,
        cooldown: 10,
        lastUsedTime: 0,
        level: 0,
        maxLevel: 5,
        effect: {
            type: SkillType.HOLOGRAM,
            duration: 4
        }
    }
];

/**
 * 技能升级数据
 */
export const SKILL_UPGRADE_DATA: Record<string, { damageBonus: number; cooldownReduction: number; rangeBonus: number }[]> = {
    'skill_neon_slash': [
        { damageBonus: 0.2, cooldownReduction: 0, rangeBonus: 10 },
        { damageBonus: 0.3, cooldownReduction: 0.2, rangeBonus: 15 },
        { damageBonus: 0.4, cooldownReduction: 0.3, rangeBonus: 20 },
        { damageBonus: 0.5, cooldownReduction: 0.5, rangeBonus: 25 },
        { damageBonus: 0.6, cooldownReduction: 0.5, rangeBonus: 30 }
    ],
    'skill_plasma_spin': [
        { damageBonus: 0.3, cooldownReduction: 0, rangeBonus: 10 },
        { damageBonus: 0.4, cooldownReduction: 0.5, rangeBonus: 15 },
        { damageBonus: 0.5, cooldownReduction: 1, rangeBonus: 20 },
        { damageBonus: 0.6, cooldownReduction: 1, rangeBonus: 25 },
        { damageBonus: 0.8, cooldownReduction: 1.5, rangeBonus: 30 }
    ],
    'skill_chain_lightning': [
        { damageBonus: 0.15, cooldownReduction: 0, rangeBonus: 0 },
        { damageBonus: 0.2, cooldownReduction: 0.2, rangeBonus: 20 },
        { damageBonus: 0.25, cooldownReduction: 0.3, rangeBonus: 30 },
        { damageBonus: 0.3, cooldownReduction: 0.5, rangeBonus: 40 },
        { damageBonus: 0.35, cooldownReduction: 0.5, rangeBonus: 50 }
    ],
    'skill_laser_beam': [
        { damageBonus: 0.25, cooldownReduction: 0, rangeBonus: 20 },
        { damageBonus: 0.35, cooldownReduction: 0.2, rangeBonus: 30 },
        { damageBonus: 0.45, cooldownReduction: 0.3, rangeBonus: 40 },
        { damageBonus: 0.55, cooldownReduction: 0.5, rangeBonus: 50 },
        { damageBonus: 0.7, cooldownReduction: 0.5, rangeBonus: 60 }
    ],
    'skill_nanobot_shield': [
        { damageBonus: 0, cooldownReduction: 1, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 2, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 2, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 3, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 3, rangeBonus: 0 }
    ],
    'skill_emp_burst': [
        { damageBonus: 0.1, cooldownReduction: 0.5, rangeBonus: 10 },
        { damageBonus: 0.15, cooldownReduction: 1, rangeBonus: 15 },
        { damageBonus: 0.2, cooldownReduction: 1, rangeBonus: 20 },
        { damageBonus: 0.25, cooldownReduction: 1.5, rangeBonus: 25 },
        { damageBonus: 0.3, cooldownReduction: 2, rangeBonus: 30 }
    ],
    'skill_overdrive': [
        { damageBonus: 0, cooldownReduction: 1, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 2, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 2, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 3, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 3, rangeBonus: 0 }
    ],
    'skill_hologram': [
        { damageBonus: 0, cooldownReduction: 1, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 1, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 2, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 2, rangeBonus: 0 },
        { damageBonus: 0, cooldownReduction: 3, rangeBonus: 0 }
    ]
};

/**
 * 获取技能ID列表
 */
export function getSkillIds(): string[] {
    return PASSIVE_SKILLS.map(skill => skill.id);
}

/**
 * 根据ID获取技能
 */
export function getSkillById(id: string): Skill | undefined {
    return PASSIVE_SKILLS.find(skill => skill.id === id);
}

/**
 * 根据分支获取技能列表
 */
export function getSkillsByBranch(branch: SkillBranch): Skill[] {
    return PASSIVE_SKILLS.filter(skill => skill.branch === branch);
}

/**
 * 获取所有可用的技能（用于技能选择）
 */
export function getAllAvailableSkills(): Skill[] {
    return [...PASSIVE_SKILLS];
}

/**
 * 获取技能升级描述
 */
export function getSkillUpgradeDescription(skillId: string, currentLevel: number): string {
    const skill = getSkillById(skillId);
    if (!skill) return '';
    
    const upgradeData = SKILL_UPGRADE_DATA[skillId];
    if (!upgradeData || currentLevel >= upgradeData.length) return '已达最高等级';
    
    const data = upgradeData[currentLevel];
    const parts: string[] = [];
    
    if (data.damageBonus > 0) {
        parts.push(`伤害+${Math.round(data.damageBonus * 100)}%`);
    }
    if (data.cooldownReduction > 0) {
        parts.push(`冷却-${data.cooldownReduction}秒`);
    }
    if (data.rangeBonus > 0) {
        parts.push(`范围+${data.rangeBonus}`);
    }
    
    return parts.join(' / ') || '属性提升';
}

/**
 * 获取技能颜色
 */
export function getSkillColor(skillId: string): number {
    const colors: Record<string, number> = {
        'skill_neon_slash': 0x00ffff,
        'skill_plasma_spin': 0xff00ff,
        'skill_chain_lightning': 0xffff00,
        'skill_laser_beam': 0xff4400,
        'skill_nanobot_shield': 0x44ff44,
        'skill_emp_burst': 0x4488ff,
        'skill_overdrive': 0xff8800,
        'skill_hologram': 0xaa44ff
    };
    return colors[skillId] || 0xffffff;
}

/**
 * 获取技能类型图标
 */
export function getSkillIconKey(skillId: string): string {
    const iconMap: Record<string, string> = {
        'skill_neon_slash': 'icon_slash',
        'skill_plasma_spin': 'icon_spin',
        'skill_chain_lightning': 'icon_lightning',
        'skill_laser_beam': 'icon_laser',
        'skill_nanobot_shield': 'icon_shield',
        'skill_emp_burst': 'icon_emp',
        'skill_overdrive': 'icon_overdrive',
        'skill_hologram': 'icon_hologram'
    };
    return iconMap[skillId] || 'icon_slash';
}

// 保留旧的导出以兼容
export const MVP_SKILLS = PASSIVE_SKILLS;
