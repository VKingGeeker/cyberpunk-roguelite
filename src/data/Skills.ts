/**
 * 技能数据定义
 * 定义MVP阶段的技能（街头武士）
 */

import { Skill, SkillType, SkillBranch } from '../core/Types';

/**
 * MVP 技能列表（街头武士）
 * 3个主动技能，每个技能4级
 */
export const MVP_SKILLS: Skill[] = [
    // ========== 进攻分支 ==========
    {
        id: 'skill_slash',
        name: '横扫斩',
        description: '前方扇形范围斩击，造成150%武器伤害',
        icon: 'slash.png',
        branch: SkillBranch.OFFENSE,
        manaCost: 20,
        cooldown: 5,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: SkillType.SLASH,
            damage: 1.5,
            range: 150
        }
    },
    {
        id: 'skill_spin',
        name: '旋风斩',
        description: '原地旋转攻击，持续2秒，造成200%武器伤害/秒',
        icon: 'spin.png',
        branch: SkillBranch.OFFENSE,
        manaCost: 40,
        cooldown: 10,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: SkillType.SPIN,
            damage: 2.0,
            duration: 2
        }
    },
    {
        id: 'skill_dash',
        name: '闪现突袭',
        description: '瞬移至目标敌人身后，造成100%武器伤害',
        icon: 'dash.png',
        branch: SkillBranch.UTILITY,
        manaCost: 15,
        cooldown: 3,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: SkillType.DASH,
            damage: 1.0,
            range: 200
        }
    },
    {
        id: 'skill_heal',
        name: '再生血清',
        description: '立即回复30%生命值',
        icon: 'heal.png',
        branch: SkillBranch.DEFENSE,
        manaCost: 30,
        cooldown: 15,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: SkillType.HEAL,
            healValue: 30
        }
    },
    {
        id: 'skill_shield',
        name: '钢铁之躯',
        description: '进入钢铁状态，持续3秒，期间免疫所有伤害',
        icon: 'shield.png',
        branch: SkillBranch.DEFENSE,
        manaCost: 40,
        cooldown: 20,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: SkillType.SHIELD,
            shieldValue: 9999,
            duration: 3
        }
    }
];

/**
 * 获取技能ID列表
 */
export function getSkillIds(): string[] {
    return MVP_SKILLS.map(skill => skill.id);
}

/**
 * 根据ID获取技能
 */
export function getSkillById(id: string): Skill | undefined {
    return MVP_SKILLS.find(skill => skill.id === id);
}

/**
 * 根据分支获取技能列表
 */
export function getSkillsByBranch(branch: SkillBranch): Skill[] {
    return MVP_SKILLS.filter(skill => skill.branch === branch);
}

/**
 * 获取所有可用的技能（用于技能树选择）
 */
export function getAllAvailableSkills(): Skill[] {
    return [...MVP_SKILLS];
}

/**
 * 技能升级效果描述
 */
export function getSkillUpgradeDescription(skill: Skill, level: number): string {
    switch (skill.id) {
        case 'skill_slash':
            if (level === 1) return '范围扩大20%';
            if (level === 2) return '伤害提升至180%武器伤害';
            if (level === 3) return '增加击退效果';
            break;
        case 'skill_spin':
            if (level === 1) return '持续时间延长至2.5秒';
            if (level === 2) return '旋转时移动速度提升50%';
            if (level === 3) return '每次旋转积累振动槽';
            break;
        case 'skill_dash':
            if (level === 1) return '闪现距离增加20%';
            if (level === 2) return '闪现后获得30%闪避率（2秒）';
            if (level === 3) return '冷却时间缩短至2秒';
            break;
        case 'skill_heal':
            if (level === 1) return '回复量提升至35%';
            if (level === 2) return '回复后获得临时护盾（80点）';
            if (level === 3) return '冷却时间缩短至10秒';
            break;
        case 'skill_shield':
            if (level === 1) return '持续时间延长至4秒';
            if (level === 2) return '状态结束后下一次攻击必定暴击';
            if (level === 3) return '状态期间对周围造成伤害';
            break;
    }
    return '未知升级效果';
}
