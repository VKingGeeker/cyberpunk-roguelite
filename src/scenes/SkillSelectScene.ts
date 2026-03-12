/**
 * 技能选择场景
 * 玩家升级时显示技能选择界面
 */

import Phaser from 'phaser';
import { Skill } from '../core/Types';
import { getAllAvailableSkills, getSkillUpgradeDescription, getSkillColor, SKILL_UPGRADE_DATA, getSkillById } from '../data/Skills';
import { getRandomAttributeOptions, getAttributeOptionById, ATTRIBUTE_OPTIONS, GAME_CONFIG } from '../core/Config';

const MAX_SKILLS = 6;

interface SkillOption {
    skill: Skill;
    isNew: boolean;
    replaceTargetId?: string; // 如果是替换技能，记录被替换的技能ID
}

interface AttributeOption {
    id: string;
    name: string;
    type: string;
    description: string;
    icon: string;
    rarity: string;
    value: number;
    isPercentage: boolean;
    maxStack: number;
    weight: number;
}

interface SelectionOption {
    type: 'skill' | 'attribute';
    skillOption?: SkillOption;
    attributeOption?: AttributeOption;
}

export default class SkillSelectScene extends Phaser.Scene {
    private selectedCallback: ((skillId: string, isNew: boolean, replaceTargetId?: string) => void) | null = null;
    private attributeCallback: ((attributeId: string, value: number, isPercentage: boolean) => void) | null = null;
    private currentSkills: Map<string, number> = new Map();
    private currentAttributeBoosts: Map<string, number[]> = new Map();
    private options: SelectionOption[] = [];

    constructor() {
        super({ key: 'SkillSelectScene' });
    }

    /**
     * 初始化场景
     */
    init(data: { 
        currentSkills: Map<string, number>,
        currentAttributeBoosts?: Map<string, number[]>,
        callback: (skillId: string, isNew: boolean, replaceTargetId?: string) => void,
        attributeCallback?: (attributeId: string, value: number, isPercentage: boolean) => void
    }): void {
        this.currentSkills = data.currentSkills;
        this.currentAttributeBoosts = data.currentAttributeBoosts || new Map();
        this.selectedCallback = data.callback;
        this.attributeCallback = data.attributeCallback || null;
    }

    /**
     * 创建场景
     */
    create(): void {
        // 暂停游戏场景
        this.scene.pause('GameScene');

        // 生成随机选项
        this.generateOptions();

        // 创建背景
        this.createBackground();

        // 创建标题
        this.createTitle();

        // 创建技能选项卡片
        this.createSkillCards();

        // 创建装饰效果
        this.createDecorations();
    }

    /**
     * 生成随机技能和属性选项
     */
    private generateOptions(): void {
        const allSkills = getAllAvailableSkills();
        const skillOptions: SelectionOption[] = [];
        const attributeOptions: SelectionOption[] = [];
        
        // 计算当前拥有的技能数量
        const ownedSkillCount = Array.from(this.currentSkills.values()).filter(l => l > 0).length;
        const canAddNewSkill = ownedSkillCount < MAX_SKILLS;

        // 分离已有技能和新技能
        const ownedSkills: Skill[] = [];
        const newSkills: Skill[] = [];

        for (const skill of allSkills) {
            const level = this.currentSkills.get(skill.id) || 0;
            if (level > 0 && level < (skill.maxLevel || 5)) {
                ownedSkills.push({ ...skill, level });
            } else if (level === 0) {
                newSkills.push(skill);
            }
        }

        // 随机打乱
        Phaser.Utils.Array.Shuffle(ownedSkills);
        Phaser.Utils.Array.Shuffle(newSkills);

        // 如果技能已满，只显示升级选项或替换选项
        if (!canAddNewSkill) {
            // 优先添加已有技能升级选项
            for (const skill of ownedSkills) {
                if (skillOptions.length < 2) {
                    skillOptions.push({ 
                        type: 'skill', 
                        skillOption: { skill, isNew: false } 
                    });
                }
            }
            
            // 添加替换选项：随机选择一个新技能和一个已有技能配对
            if (newSkills.length > 0 && ownedSkills.length > 0) {
                const randomNewSkill = newSkills[0];
                // 获取所有已满级技能作为替换目标
                const maxedSkills = Array.from(this.currentSkills.entries())
                    .filter(([id, level]) => level > 0)
                    .map(([id, level]) => {
                        const skillData = getSkillById(id);
                        return skillData ? { ...skillData, level } : null;
                    })
                    .filter((s): s is Skill => s !== null);
                
                if (maxedSkills.length > 0) {
                    Phaser.Utils.Array.Shuffle(maxedSkills);
                    skillOptions.push({ 
                        type: 'skill',
                        skillOption: { 
                            skill: { ...randomNewSkill, level: 0 }, 
                            isNew: true,
                            replaceTargetId: maxedSkills[0].id 
                        }
                    });
                }
            }
        } else {
            // 技能未满，正常选择
            // 优先选择已有技能升级（60%概率）
            // 然后选择新技能（40%概率）
            
            // 添加已有技能升级选项
            for (const skill of ownedSkills) {
                if (skillOptions.length < 2) {
                    skillOptions.push({ 
                        type: 'skill', 
                        skillOption: { skill, isNew: false } 
                    });
                }
            }

            // 添加新技能选项
            for (const skill of newSkills) {
                if (skillOptions.length < 3) {
                    skillOptions.push({ 
                        type: 'skill', 
                        skillOption: { skill, isNew: true } 
                    });
                }
            }
        }

        // 如果技能选项不足3个，从剩余技能中填充
        const remaining = [...ownedSkills, ...newSkills].filter(
            s => !skillOptions.find(o => o.skillOption && o.skillOption.skill.id === s.id)
        );
        for (const skill of remaining) {
            if (skillOptions.length >= 3) break;
            const level = this.currentSkills.get(skill.id) || 0;
            skillOptions.push({ 
                type: 'skill',
                skillOption: { 
                    skill: { ...skill, level }, 
                    isNew: level === 0 
                }
            });
        }

        // 生成属性选项
        // 获取已达到最大叠加次数的属性类型
        const maxedAttributeTypes: string[] = [];
        this.currentAttributeBoosts.forEach((values, type) => {
            const attrOption = Object.values(ATTRIBUTE_OPTIONS).find((opt: any) => opt.type === type);
            if (attrOption && values.length >= attrOption.maxStack) {
                maxedAttributeTypes.push(type);
            }
        });

        // 获取随机属性选项，排除已满的
        const randomAttrs = getRandomAttributeOptions(3, maxedAttributeTypes);
        for (const attr of randomAttrs) {
            // 检查当前叠加次数
            const currentStacks = this.currentAttributeBoosts.get(attr.type)?.length || 0;
            if (currentStacks < attr.maxStack) {
                attributeOptions.push({
                    type: 'attribute',
                    attributeOption: attr
                });
            }
        }

        // 混合技能和属性选项
        // 策略：1-2个技能选项，1-2个属性选项
        this.options = [];
        
        // 添加1-2个技能选项
        const skillCount = Math.min(2, skillOptions.length);
        for (let i = 0; i < skillCount; i++) {
            if (skillOptions[i]) {
                this.options.push(skillOptions[i]);
            }
        }

        // 添加1-2个属性选项
        const attrCount = Math.min(3 - this.options.length, attributeOptions.length);
        for (let i = 0; i < attrCount; i++) {
            if (attributeOptions[i]) {
                this.options.push(attributeOptions[i]);
            }
        }

        // 如果选项不足3个，从剩余选项中填充
        while (this.options.length < 3) {
            const remainingSkills = skillOptions.filter(s => !this.options.includes(s));
            const remainingAttrs = attributeOptions.filter(a => !this.options.includes(a));
            
            if (remainingSkills.length > 0) {
                this.options.push(remainingSkills[0]);
            } else if (remainingAttrs.length > 0) {
                this.options.push(remainingAttrs[0]);
            } else {
                break;
            }
        }

        this.options = this.options.slice(0, 3);
    }

    /**
     * 创建背景
     * 使用固定的游戏屏幕尺寸确保背景覆盖整个屏幕
     */
    private createBackground(): void {
        // 使用游戏配置中的固定屏幕尺寸
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;

        // 半透明黑色背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, width, height);

        // 网格效果
        overlay.lineStyle(1, 0x00ffff, 0.1);
        for (let x = 0; x < width; x += 40) {
            overlay.moveTo(x, 0);
            overlay.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            overlay.moveTo(0, y);
            overlay.lineTo(width, y);
        }
        overlay.strokePath();

        // 扫描线
        const scanline = this.add.graphics();
        scanline.fillStyle(0x00ffff, 0.05);
        scanline.fillRect(0, 0, width, 3);
        
        this.tweens.add({
            targets: scanline,
            y: height,
            duration: 2000,
            repeat: -1
        });
    }

    /**
     * 创建标题
     * 使用固定的游戏屏幕尺寸确保标题居中
     */
    private createTitle(): void {
        const width = GAME_CONFIG.width;

        // 主标题
        const title = this.add.text(width / 2, 80, '升级', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ff00ff',
            strokeThickness: 3
        });
        title.setOrigin(0.5);

        // 发光效果
        const glow = this.add.text(width / 2, 80, '升级', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        glow.setOrigin(0.5);
        glow.setAlpha(0.3);
        glow.setTint(0x00ffff);

        this.tweens.add({
            targets: glow,
            alpha: { from: 0.2, to: 0.4 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // 副标题
        const subtitle = this.add.text(width / 2, 130, '选择一项技能升级', {
            fontSize: '18px',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace'
        });
        subtitle.setOrigin(0.5);
    }

    /**
     * 创建技能/属性卡片
     * 使用固定的游戏屏幕尺寸确保弹窗居中显示
     */
    private createSkillCards(): void {
        // 使用游戏配置中的固定屏幕尺寸，而不是相机尺寸
        // 这样可以确保弹窗在任何分辨率下都居中显示
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;
        const cardWidth = 280;
        const cardHeight = 450; // 增加高度以容纳属性
        const gap = 40;
        
        // 计算卡片起始位置，确保居中
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (width - totalWidth) / 2 + cardWidth / 2;

        this.options.forEach((option, index) => {
            const x = startX + index * (cardWidth + gap);
            const y = height / 2;
            
            if (option.type === 'skill' && option.skillOption) {
                this.createSkillCard(x, y, cardWidth, cardHeight, option.skillOption, index);
            } else if (option.type === 'attribute' && option.attributeOption) {
                this.createAttributeCard(x, y, cardWidth, cardHeight, option.attributeOption, index);
            }
        });
    }

    /**
     * 创建单个技能卡片
     */
    private createSkillCard(
        x: number, y: number, 
        width: number, height: number, 
        option: SkillOption, index: number
    ): void {
        const { skill, isNew, replaceTargetId } = option;
        const color = getSkillColor(skill.id);
        
        // 卡片容器
        const container = this.add.container(x, y);

        // 卡片背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.95);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 12);
        bg.lineStyle(3, color, 1);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 12);

        // 外发光
        const glow = this.add.graphics();
        glow.fillStyle(color, 0.15);
        glow.fillRoundedRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10, 15);

        container.add(glow);
        container.add(bg);

        // 状态标签（新技能/升级/替换）
        let labelColor = isNew ? 0x00ffff : 0xffff00;
        let labelText = isNew ? '新技能' : `Lv.${skill.level} → Lv.${skill.level + 1}`;
        
        // 如果是替换技能
        if (replaceTargetId) {
            const targetSkill = getSkillById(replaceTargetId);
            if (targetSkill) {
                labelText = `替换: ${targetSkill.name}`;
                labelColor = 0xff4444;
            }
        }
        
        const label = this.add.text(0, -height/2 + 25, labelText, {
            fontSize: '14px',
            fontStyle: 'bold',
            color: `#${labelColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);
        container.add(label);

        // 技能图标
        const iconBg = this.add.graphics();
        iconBg.fillStyle(0x1a1a2e, 1);
        iconBg.fillCircle(0, -80, 40);
        iconBg.lineStyle(3, color, 1);
        iconBg.strokeCircle(0, -80, 40);

        const icon = this.add.image(0, -80, skill.icon);
        icon.setDisplaySize(55, 55);
        container.add(iconBg);
        container.add(icon);

        // 技能名称
        const name = this.add.text(0, -20, skill.name, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            stroke: `#${color.toString(16).padStart(6, '0')}`,
            strokeThickness: 1
        });
        name.setOrigin(0.5);
        container.add(name);

        // 技能分支
        const branchNames: Record<string, string> = {
            'offense': '攻击',
            'defense': '防御',
            'utility': '辅助'
        };
        const branchColors: Record<string, number> = {
            'offense': 0xff4444,
            'defense': 0x44ff44,
            'utility': 0xffff44
        };
        
        const branchText = this.add.text(0, 5, `[${branchNames[skill.branch] || '未知'}]`, {
            fontSize: '11px',
            color: `#${(branchColors[skill.branch] || 0xffffff).toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        branchText.setOrigin(0.5);
        container.add(branchText);

        // 技能属性面板
        this.createSkillStatsPanel(container, skill, 35);

        // 技能描述
        const desc = this.add.text(0, 120, skill.description, {
            fontSize: '11px',
            color: '#aaaaaa',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            wordWrap: { width: width - 30 }
        });
        desc.setOrigin(0.5);
        container.add(desc);

        // 升级效果（如果是升级）
        if (!isNew && skill.level > 0 && !replaceTargetId) {
            const upgradeDesc = getSkillUpgradeDescription(skill.id, skill.level - 1);
            const upgradeText = this.add.text(0, 155, `升级: ${upgradeDesc}`, {
                fontSize: '11px',
                color: '#ffff00',
                fontFamily: 'Courier New, monospace',
                align: 'center',
                wordWrap: { width: width - 30 }
            });
            upgradeText.setOrigin(0.5);
            container.add(upgradeText);
        }

        // 选择按钮
        const btnY = height/2 - 30;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(color, 0.2);
        btnBg.fillRoundedRect(-80, btnY - 18, 160, 36, 6);
        btnBg.lineStyle(2, color, 1);
        btnBg.strokeRoundedRect(-80, btnY - 18, 160, 36, 6);
        container.add(btnBg);

        const btnText = this.add.text(0, btnY, replaceTargetId ? '替换' : '选择', {
            fontSize: '16px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        btnText.setOrigin(0.5);
        container.add(btnText);

        // 交互区域
        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);

        // 悬停效果
        hitArea.on('pointerover', () => {
            container.setScale(1.05);
            glow.clear();
            glow.fillStyle(color, 0.25);
            glow.fillRoundedRect(-width/2 - 8, -height/2 - 8, width + 16, height + 16, 16);
        });

        hitArea.on('pointerout', () => {
            container.setScale(1);
            glow.clear();
            glow.fillStyle(color, 0.15);
            glow.fillRoundedRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10, 15);
        });

        hitArea.on('pointerdown', () => {
            this.selectSkill(skill.id, isNew, replaceTargetId);
        });

        // 入场动画
        container.setAlpha(0);
        container.setY(y + 50);
        
        this.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 300,
            delay: index * 100,
            ease: 'Back.out'
        });
    }

    /**
     * 创建技能属性面板
     */
    private createSkillStatsPanel(container: Phaser.GameObjects.Container, skill: Skill, startY: number): void {
        const effect = skill.effect;
        const stats: { label: string; value: string; icon: string }[] = [];

        // 伤害
        if (effect.damage) {
            stats.push({ 
                label: '伤害', 
                value: `${Math.round(effect.damage * 100)}%`, 
                icon: '⚔' 
            });
        }

        // 范围
        if (effect.range) {
            stats.push({ 
                label: '范围', 
                value: `${effect.range}`, 
                icon: '◎' 
            });
        }

        // 冷却
        stats.push({ 
            label: '冷却', 
            value: `${skill.cooldown}s`, 
            icon: '⏱' 
        });

        // 连锁次数
        if (effect.chains) {
            stats.push({ 
                label: '连锁', 
                value: `${effect.chains}`, 
                icon: '⚡' 
            });
        }

        // 持续时间
        if (effect.duration) {
            stats.push({ 
                label: '持续', 
                value: `${effect.duration}s`, 
                icon: '⏳' 
            });
        }

        // 治疗量
        if (effect.healValue) {
            stats.push({ 
                label: '治疗', 
                value: `${effect.healValue}%`, 
                icon: '❤' 
            });
        }

        // 眩晕时间
        if (effect.stunDuration) {
            stats.push({ 
                label: '眩晕', 
                value: `${effect.stunDuration}s`, 
                icon: '💫' 
            });
        }

        // 速度加成
        if (effect.speedBoost) {
            stats.push({ 
                label: '加速', 
                value: `${Math.round(effect.speedBoost * 100)}%`, 
                icon: '💨' 
            });
        }

        // 创建属性面板背景
        const panelWidth = 240;
        const panelHeight = Math.max(40, Math.ceil(stats.length / 3) * 25 + 10);
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.8);
        panelBg.fillRoundedRect(-panelWidth/2, startY, panelWidth, panelHeight, 6);
        panelBg.lineStyle(1, 0x333344, 0.5);
        panelBg.strokeRoundedRect(-panelWidth/2, startY, panelWidth, panelHeight, 6);
        container.add(panelBg);

        // 显示属性（每行3个）
        const colWidth = 80;
        const startX = -panelWidth/2 + 40;
        stats.forEach((stat, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = startX + col * colWidth;
            const y = startY + 8 + row * 25;

            const statText = this.add.text(x, y, `${stat.icon}${stat.value}`, {
                fontSize: '11px',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace'
            });
            statText.setOrigin(0.5, 0);
            container.add(statText);
        });
    }

    /**
     * 创建装饰效果
     * 使用固定的游戏屏幕尺寸确保装饰元素位置正确
     */
    private createDecorations(): void {
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;

        // 角落装饰
        const corners = [
            { x: 30, y: 30, rotation: 0 },
            { x: width - 30, y: 30, rotation: Math.PI / 2 },
            { x: width - 30, y: height - 30, rotation: Math.PI },
            { x: 30, y: height - 30, rotation: -Math.PI / 2 }
        ];

        corners.forEach(corner => {
            const decor = this.add.graphics();
            decor.lineStyle(2, 0x00ffff, 0.5);
            decor.moveTo(0, 30);
            decor.lineTo(0, 0);
            decor.lineTo(30, 0);
            decor.strokePath();
            decor.x = corner.x;
            decor.y = corner.y;
            decor.rotation = corner.rotation;
        });

        // 数据流效果
        for (let i = 0; i < 3; i++) {
            const text = this.add.text(
                -200,
                200 + i * 100,
                '01010110 11001010 10101010 01011010',
                {
                    fontSize: '10px',
                    color: '#00ffff',
                    fontFamily: 'Courier New, monospace'
                }
            );
            text.setAlpha(0.2);

            this.tweens.add({
                targets: text,
                x: width + 200,
                duration: 10000 + i * 3000,
                repeat: -1,
                delay: i * 2000
            });
        }
    }

    /**
     * 创建属性卡片
     */
    private createAttributeCard(
        x: number, y: number, 
        width: number, height: number, 
        attrOption: AttributeOption, index: number
    ): void {
        const color = this.getAttributeColor(attrOption.rarity);
        
        // 卡片容器
        const container = this.add.container(x, y);

        // 卡片背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.95);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 12);
        bg.lineStyle(3, color, 1);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 12);

        // 外发光
        const glow = this.add.graphics();
        glow.fillStyle(color, 0.15);
        glow.fillRoundedRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10, 15);

        container.add(glow);
        container.add(bg);

        // 属性类型标签
        const typeNames: Record<string, string> = {
            'attack': '攻击',
            'defense': '防御',
            'maxHp': '生命',
            'moveSpeed': '速度',
            'attackSpeed': '攻速',
            'critRate': '暴击率',
            'critDamage': '暴伤',
            'skillRange': '范围',
            'skillCooldown': '冷却',
            'bulletCount': '子弹'
        };

        const label = this.add.text(0, -height/2 + 25, `[${typeNames[attrOption.type] || '属性'}]`, {
            fontSize: '14px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);
        container.add(label);

        // 属性图标（使用文字代替）
        const iconBg = this.add.graphics();
        iconBg.fillStyle(0x1a1a2e, 1);
        iconBg.fillCircle(0, -80, 40);
        iconBg.lineStyle(3, color, 1);
        iconBg.strokeCircle(0, -80, 40);

        const iconText = this.add.text(0, -80, this.getAttributeIcon(attrOption.type), {
            fontSize: '40px',
            color: '#ffffff'
        });
        iconText.setOrigin(0.5);
        container.add(iconBg);
        container.add(iconText);

        // 属性名称
        const name = this.add.text(0, -20, attrOption.name, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            stroke: `#${color.toString(16).padStart(6, '0')}`,
            strokeThickness: 1
        });
        name.setOrigin(0.5);
        container.add(name);

        // 稀有度标签
        const rarityNames: Record<string, string> = {
            'common': '普通',
            'rare': '稀有',
            'epic': '史诗',
            'legendary': '传说'
        };
        const rarityText = this.add.text(0, 5, `[${rarityNames[attrOption.rarity] || '普通'}]`, {
            fontSize: '11px',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        rarityText.setOrigin(0.5);
        container.add(rarityText);

        // 属性值显示
        const displayValue = attrOption.isPercentage 
            ? `${Math.round(attrOption.value * 100)}%` 
            : `+${attrOption.value}`;
        const valueText = this.add.text(0, 50, displayValue, {
            fontSize: '36px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        valueText.setOrigin(0.5);
        container.add(valueText);

        // 当前叠加次数
        const currentStacks = this.currentAttributeBoosts.get(attrOption.type)?.length || 0;
        const stackText = this.add.text(0, 85, `(${currentStacks}/${attrOption.maxStack})`, {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        stackText.setOrigin(0.5);
        container.add(stackText);

        // 属性描述
        const desc = this.add.text(0, 120, attrOption.description, {
            fontSize: '11px',
            color: '#aaaaaa',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            wordWrap: { width: width - 30 }
        });
        desc.setOrigin(0.5);
        container.add(desc);

        // 选择按钮
        const btnY = height/2 - 30;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(color, 0.2);
        btnBg.fillRoundedRect(-80, btnY - 18, 160, 36, 6);
        btnBg.lineStyle(2, color, 1);
        btnBg.strokeRoundedRect(-80, btnY - 18, 160, 36, 6);
        container.add(btnBg);

        const btnText = this.add.text(0, btnY, '选择', {
            fontSize: '16px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        btnText.setOrigin(0.5);
        container.add(btnText);

        // 交互区域
        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);

        // 悬停效果
        hitArea.on('pointerover', () => {
            container.setScale(1.05);
            glow.clear();
            glow.fillStyle(color, 0.25);
            glow.fillRoundedRect(-width/2 - 8, -height/2 - 8, width + 16, height + 16, 16);
        });

        hitArea.on('pointerout', () => {
            container.setScale(1);
            glow.clear();
            glow.fillStyle(color, 0.15);
            glow.fillRoundedRect(-width/2 - 5, -height/2 - 5, width + 10, height + 10, 15);
        });

        hitArea.on('pointerdown', () => {
            this.selectAttribute(attrOption.id, attrOption.value, attrOption.isPercentage);
        });

        // 入场动画
        container.setAlpha(0);
        container.setY(y + 50);
        
        this.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 300,
            delay: index * 100,
            ease: 'Back.out'
        });
    }

    /**
     * 获取属性颜色
     */
    private getAttributeColor(rarity: string): number {
        const colors: Record<string, number> = {
            'common': 0x888888,
            'rare': 0x4488ff,
            'epic': 0xaa44ff,
            'legendary': 0xffaa00
        };
        return colors[rarity] || 0x00ffff;
    }

    /**
     * 获取属性图标
     */
    private getAttributeIcon(type: string): string {
        const icons: Record<string, string> = {
            'attack': '⚔',
            'defense': '🛡',
            'maxHp': '❤',
            'moveSpeed': '💨',
            'attackSpeed': '⚡',
            'critRate': '🎯',
            'critDamage': '💥',
            'skillRange': '◎',
            'skillCooldown': '⏱',
            'bulletCount': '🔫'
        };
        return icons[type] || '?';
    }

    /**
     * 选择技能
     */
    private selectSkill(skillId: string, isNew: boolean, replaceTargetId?: string): void {
        // 播放选择音效和动画
        this.cameras.main.flash(200, 0, 255, 255, false);

        // 延迟关闭场景
        this.time.delayedCall(200, () => {
            // 恢复游戏场景
            this.scene.resume('GameScene');
            
            // 调用回调
            if (this.selectedCallback) {
                this.selectedCallback(skillId, isNew, replaceTargetId);
            }
            
            // 关闭场景
            this.scene.stop();
        });
    }

    /**
     * 选择属性
     */
    private selectAttribute(attributeId: string, value: number, isPercentage: boolean): void {
        // 播放选择音效和动画
        this.cameras.main.flash(200, 0, 255, 255, false);

        // 延迟关闭场景
        this.time.delayedCall(200, () => {
            // 恢复游戏场景
            this.scene.resume('GameScene');
            
            // 调用回调
            if (this.attributeCallback) {
                this.attributeCallback(attributeId, value, isPercentage);
            }
            
            // 关闭场景
            this.scene.stop();
        });
    }
}
