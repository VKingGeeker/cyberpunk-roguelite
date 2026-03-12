/**
 * 技能系统
 * 管理技能释放、冷却时间、法力消耗
 */

import { Skill } from '../core/Types';
import { getSkillById } from '../data/Skills';

/**
 * 技能系统类
 */
export class SkillSystem {
    private skills: Map<string, Skill>;
    private activeSkills: Skill[] = []; // 当前装备的技能

    constructor() {
        this.skills = new Map();
        this.loadSkills();
    }

    /**
     * 加载技能数据
     */
    private loadSkills(): void {
        // 这里从数据文件加载技能
        // MVP阶段暂时硬编码
        const skillIds = ['skill_neon_slash', 'skill_plasma_spin', 'skill_chain_lightning', 'skill_laser_beam', 'skill_nanobot_shield'];
        for (const id of skillIds) {
            const skill = getSkillById(id);
            if (skill) {
                this.skills.set(id, { ...skill });
            }
        }
    }

    /**
     * 装备技能到主动技能槽
     * @param skillId 技能ID
     * @param slotIndex 技能槽索引（0-2）
     * @returns 是否装备成功
     */
    public equipSkill(skillId: string, slotIndex: number): boolean {
        if (slotIndex < 0 || slotIndex > 2) return false;

        const skill = this.skills.get(skillId);
        if (!skill) return false;

        // 确保技能槽数组有足够长度
        while (this.activeSkills.length <= slotIndex) {
            this.activeSkills.push(null as any);
        }

        this.activeSkills[slotIndex] = skill;
        return true;
    }

    /**
     * 使用技能
     * @param slotIndex 技能槽索引
     * @param currentTime 当前时间（毫秒）
     * @returns 技能数据（成功）或 null（失败）
     */
    public useSkill(slotIndex: number, currentTime: number): Skill | null {
        if (slotIndex < 0 || slotIndex >= this.activeSkills.length) return null;

        const skill = this.activeSkills[slotIndex];
        if (!skill) return null;

        // 检查冷却时间
        if (!this.isSkillReady(skill, currentTime)) return null;

        // 更新使用时间
        skill.lastUsedTime = currentTime;

        return skill;
    }

    /**
     * 检查技能是否就绪
     * @param skill 技能数据
     * @param currentTime 当前时间（毫秒）
     * @returns 是否就绪
     */
    public isSkillReady(skill: Skill, currentTime: number): boolean {
        const cooldownMs = skill.cooldown * 1000;
        return currentTime - skill.lastUsedTime >= cooldownMs;
    }

    /**
     * 获取技能剩余冷却时间
     * @param slotIndex 技能槽索引
     * @param currentTime 当前时间（毫秒）
     * @returns 剩余冷却时间（秒）
     */
    public getSkillCooldown(slotIndex: number, currentTime: number): number {
        if (slotIndex < 0 || slotIndex >= this.activeSkills.length) return 0;

        const skill = this.activeSkills[slotIndex];
        if (!skill) return 0;

        const cooldownMs = skill.cooldown * 1000;
        const elapsed = currentTime - skill.lastUsedTime;
        const remaining = Math.max(0, cooldownMs - elapsed);

        return remaining / 1000;
    }

    /**
     * 升级技能
     * @param skillId 技能ID
     * @returns 是否升级成功
     */
    public upgradeSkill(skillId: string): boolean {
        const skill = this.skills.get(skillId);
        if (!skill) return false;

        if (skill.level >= 3) return false;

        skill.level++;
        return true;
    }

    /**
     * 获取技能等级
     * @param skillId 技能ID
     * @returns 技能等级
     */
    public getSkillLevel(skillId: string): number {
        const skill = this.skills.get(skillId);
        return skill ? skill.level : 0;
    }

    /**
     * 获取主动技能列表
     */
    public getActiveSkills(): Skill[] {
        return [...this.activeSkills];
    }

    /**
     * 获取指定技能槽的技能
     */
    public getActiveSkill(slotIndex: number): Skill | null {
        if (slotIndex < 0 || slotIndex >= this.activeSkills.length) return null;
        return this.activeSkills[slotIndex];
    }

    /**
     * 获取所有技能
     */
    public getAllSkills(): Skill[] {
        return Array.from(this.skills.values());
    }

    /**
     * 更新技能状态（每帧调用）
     * @param deltaTime 帧时间（毫秒）
     */
    public update(deltaTime: number): void {
        // 这里可以处理技能的持续效果
        // 比如旋风斩的伤害计算
    }
}
