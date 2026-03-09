/**
 * UI场景 - 赛博朋克风格
 * 显示游戏UI（生命条、技能栏、背包等）
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';
import Player from '../entities/Player';

export default class UIScene extends Phaser.Scene {
    private player!: Player;

    // UI元素
    private healthBar!: Phaser.GameObjects.Graphics;
    private healthBarBg!: Phaser.GameObjects.Graphics;
    private healthText!: Phaser.GameObjects.Text;
    private skillIcons: Phaser.GameObjects.Image[] = [];
    private experienceBar!: Phaser.GameObjects.Graphics;
    private experienceBarBg!: Phaser.GameObjects.Graphics;
    private levelText!: Phaser.GameObjects.Text;
    private killText!: Phaser.GameObjects.Text;
    
    // 霓虹效果
    private scanlineOverlay!: Phaser.GameObjects.Graphics;

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    /**
     * 创建场景
     */
    create(data: { player: Player }): void {
        this.player = data.player;

        // 创建霓虹扫描线效果
        this.createScanlineEffect();

        // 创建UI元素
        this.createHealthBar();
        this.createSkillBar();
        this.createExperienceBar();
        this.createKillCounter();
        this.createCyberpunkDecorations();

        // 监听玩家事件
        this.scene.get('GameScene').events.on('updateHealth', this.updateHealth, this);
        this.scene.get('GameScene').events.on('updateExperience', this.updateExperience, this);
        this.scene.get('GameScene').events.on('skill-changed', this.updateSkillDisplay, this);
    }

    /**
     * 创建扫描线效果
     */
    private createScanlineEffect(): void {
        this.scanlineOverlay = this.add.graphics();
        this.scanlineOverlay.fillStyle(0x00ffff, 0.02);
        
        for (let y = 0; y < this.cameras.main.height; y += 4) {
            this.scanlineOverlay.fillRect(0, y, this.cameras.main.width, 2);
        }
        
        this.scanlineOverlay.setDepth(1000);
    }

    /**
     * 创建生命条 - 赛博朋克风格
     */
    private createHealthBar(): void {
        const y = this.cameras.main.height - 50;
        const x = 20;
        const width = GAME_CONFIG.ui.healthBarWidth;
        const height = GAME_CONFIG.ui.healthBarHeight;

        // 外框发光效果
        const glow = this.add.graphics();
        glow.fillStyle(0xff0044, 0.15);
        glow.fillRoundedRect(x - 4, y - 4, width + 8, height + 8, 6);

        // 背景
        this.healthBarBg = this.add.graphics();
        this.healthBarBg.fillStyle(0x0a0a1a, 1);
        this.healthBarBg.fillRoundedRect(x, y, width, height, 4);
        this.healthBarBg.lineStyle(2, 0xff0044, 0.8);
        this.healthBarBg.strokeRoundedRect(x, y, width, height, 4);

        // 生命条
        this.healthBar = this.add.graphics();
        this.healthBar.fillStyle(0xff0044, 1);
        this.healthBar.fillRoundedRect(x + 2, y + 2, width - 4, height - 4, 3);

        // HP 标签
        const hpLabel = this.add.text(x, y - 20, 'HP', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ff0044',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });

        // 文字
        this.healthText = this.add.text(
            x + width / 2,
            y + height / 2,
            '100/100',
            {
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace',
                stroke: '#ff0044',
                strokeThickness: 1
            }
        );
        this.healthText.setOrigin(0.5);
        this.healthText.setDepth(10);

        // 脉冲动画
        this.tweens.add({
            targets: glow,
            alpha: { from: 0.15, to: 0.25 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 创建技能栏（被动技能显示）- 动态显示已学技能
     */
    private createSkillBar(): void {
        const startX = 20;
        const y = this.cameras.main.height - 130;
        const size = GAME_CONFIG.ui.skillIconSize;
        const maxSlots = 5; // 最多显示5个技能

        // 技能栏背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.9);
        bg.fillRoundedRect(startX - 10, y - size/2 - 10, size * maxSlots + 20 + (maxSlots - 1) * 10, size + 60, 8);
        bg.lineStyle(2, 0x00ffff, 0.5);
        bg.strokeRoundedRect(startX - 10, y - size/2 - 10, size * maxSlots + 20 + (maxSlots - 1) * 10, size + 60, 8);

        // 标题
        const title = this.add.text(startX + (size * maxSlots + (maxSlots - 1) * 10) / 2, y - size/2 - 5, 'SKILLS', {
            fontSize: '10px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5, 0);

        // 创建占位技能槽
        for (let i = 0; i < maxSlots; i++) {
            const x = startX + i * (size + 10);
            
            // 空技能槽背景
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0x1a1a2e, 0.5);
            slotBg.fillRoundedRect(x, y - size/2, size, size, 6);
            slotBg.lineStyle(1, 0x333344, 0.5);
            slotBg.strokeRoundedRect(x, y - size/2, size, size, 6);
        }

        // 初始更新技能显示
        this.updateSkillDisplay();
    }

    /**
     * 更新技能显示
     */
    public updateSkillDisplay(): void {
        if (!this.player) return;

        const ownedSkills = this.player.getOwnedSkills();
        const startX = 20;
        const y = this.cameras.main.height - 130;
        const size = GAME_CONFIG.ui.skillIconSize;

        // 清除旧图标
        this.skillIcons.forEach(icon => icon.destroy());
        this.skillIcons = [];

        // 技能名称到图标键的映射
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

        // 技能名称显示
        const nameMap: Record<string, string> = {
            'skill_neon_slash': '霓虹斩',
            'skill_plasma_spin': '等离子',
            'skill_chain_lightning': '闪电链',
            'skill_laser_beam': '激光',
            'skill_nanobot_shield': '护盾',
            'skill_emp_burst': 'EMP',
            'skill_overdrive': '超频',
            'skill_hologram': '幻影'
        };

        // 技能颜色
        const colorMap: Record<string, number> = {
            'skill_neon_slash': 0x00ffff,
            'skill_plasma_spin': 0xff00ff,
            'skill_chain_lightning': 0xffff00,
            'skill_laser_beam': 0xff4400,
            'skill_nanobot_shield': 0x44ff44,
            'skill_emp_burst': 0x4488ff,
            'skill_overdrive': 0xff8800,
            'skill_hologram': 0xaa44ff
        };

        let index = 0;
        ownedSkills.forEach((data, skillId) => {
            if (index >= 5) return; // 最多显示5个

            const x = startX + index * (size + 10);
            const iconKey = iconMap[skillId] || 'icon_slash';
            const color = colorMap[skillId] || 0x00ffff;

            // 技能槽背景
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0x1a1a2e, 1);
            slotBg.fillRoundedRect(x, y - size/2, size, size, 6);
            slotBg.lineStyle(2, color, 0.8);
            slotBg.strokeRoundedRect(x, y - size/2, size, size, 6);

            // 等级指示器
            const level = data.skill.level;
            for (let i = 0; i < level; i++) {
                slotBg.fillStyle(color, 0.8);
                slotBg.fillCircle(x + 8 + i * 8, y + size/2 - 8, 3);
            }

            // 技能图标
            const icon = this.add.image(x + size/2, y, iconKey);
            icon.setDisplaySize(size - 8, size - 8);
            icon.setOrigin(0.5);

            // 技能名称
            const nameText = this.add.text(x + size/2, y + size/2 + 10, nameMap[skillId] || '技能', {
                fontSize: '10px',
                fontStyle: 'bold',
                color: `#${color.toString(16).padStart(6, '0')}`,
                fontFamily: 'Courier New, monospace'
            });
            nameText.setOrigin(0.5);

            this.skillIcons.push(icon);
            index++;
        });
    }

    /**
     * 创建经验条 - 赛博朋克风格
     */
    private createExperienceBar(): void {
        const y = 15;
        const width = this.cameras.main.width;
        const height = 20;

        // 发光背景
        const glow = this.add.graphics();
        glow.fillStyle(0xffaa00, 0.1);
        glow.fillRect(0, y - 2, width, height + 4);

        // 背景
        this.experienceBarBg = this.add.graphics();
        this.experienceBarBg.fillStyle(0x0a0a1a, 1);
        this.experienceBarBg.fillRect(0, y, width, height);
        this.experienceBarBg.lineStyle(1, 0xffaa00, 0.3);
        this.experienceBarBg.moveTo(0, y + height);
        this.experienceBarBg.lineTo(width, y + height);
        this.experienceBarBg.strokePath();

        // 经验条
        this.experienceBar = this.add.graphics();
        this.experienceBar.fillStyle(0xffaa00, 1);
        this.experienceBar.fillRect(0, y, 0, height);

        // 网格效果
        const grid = this.add.graphics();
        grid.lineStyle(1, 0xffaa00, 0.1);
        for (let x = 0; x < width; x += 50) {
            grid.moveTo(x, y);
            grid.lineTo(x, y + height);
        }
        grid.strokePath();

        // 等级文字
        this.levelText = this.add.text(width / 2, y + height / 2, 'Lv.1', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ffaa00',
            strokeThickness: 2
        });
        this.levelText.setOrigin(0.5);
        this.levelText.setDepth(10);

        // EXP 标签
        const expLabel = this.add.text(10, y + height + 5, 'EXP', {
            fontSize: '10px',
            color: '#ffaa00',
            fontFamily: 'Courier New, monospace'
        });
    }

    /**
     * 创建击杀计数器 - 赛博朋克风格
     */
    private createKillCounter(): void {
        const x = this.cameras.main.width - 20;
        const y = 50;

        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.9);
        bg.fillRoundedRect(x - 150, y - 5, 150, 35, 4);
        bg.lineStyle(2, 0xff6600, 0.8);
        bg.strokeRoundedRect(x - 150, y - 5, 150, 35, 4);

        // 骷髅图标（使用文字代替）
        const skull = this.add.text(x - 140, y + 12, '☠', {
            fontSize: '18px',
            color: '#ff6600'
        });
        skull.setOrigin(0.5);

        // 击杀文字
        this.killText = this.add.text(x - 10, y + 12, 'KILLS: 0', {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ff6600',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.killText.setOrigin(1, 0.5);
    }

    /**
     * 创建赛博朋克装饰元素
     */
    private createCyberpunkDecorations(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 角落装饰
        const corners = [
            { x: 0, y: 0, rotation: 0 },
            { x: width, y: 0, rotation: Math.PI / 2 },
            { x: width, y: height, rotation: Math.PI },
            { x: 0, y: height, rotation: -Math.PI / 2 }
        ];

        corners.forEach(corner => {
            const decor = this.add.graphics();
            decor.lineStyle(2, 0x00ffff, 0.5);
            decor.moveTo(0, 40);
            decor.lineTo(0, 0);
            decor.lineTo(40, 0);
            decor.strokePath();
            
            decor.x = corner.x;
            decor.y = corner.y;
            decor.rotation = corner.rotation;
        });

        // 底部装饰线
        const bottomLine = this.add.graphics();
        bottomLine.lineStyle(1, 0x00ffff, 0.3);
        bottomLine.moveTo(0, height - 150);
        bottomLine.lineTo(width, height - 150);
        bottomLine.strokePath();

        // 数据流效果
        this.createDataFlowEffect();
    }

    /**
     * 创建数据流效果
     */
    private createDataFlowEffect(): void {
        const width = this.cameras.main.width;
        
        // 顶部数据流
        for (let i = 0; i < 3; i++) {
            const text = this.add.text(
                -200,
                40 + i * 5,
                '01010110 11001010 10101010 01011010',
                {
                    fontSize: '8px',
                    color: '#00ffff',
                    fontFamily: 'Courier New, monospace'
                }
            );
            text.setAlpha(0.3);

            this.tweens.add({
                targets: text,
                x: width + 200,
                duration: 15000 + i * 5000,
                repeat: -1,
                delay: i * 3000
            });
        }
    }

    /**
     * 更新生命条
     */
    private updateHealth(currentHp: number, maxHp: number): void {
        const percentage = Math.max(0, currentHp / maxHp);
        const y = this.cameras.main.height - 50;
        const x = 20;
        const width = (GAME_CONFIG.ui.healthBarWidth - 4) * percentage;
        const height = GAME_CONFIG.ui.healthBarHeight - 4;

        this.healthBar.clear();
        
        // 根据血量改变颜色
        let color = 0xff0044;
        if (percentage < 0.3) {
            color = 0xff0000;
        } else if (percentage < 0.6) {
            color = 0xff4400;
        }
        
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRoundedRect(x + 2, y + 2, width, height, 3);

        this.healthText.setText(`${Math.floor(currentHp)}/${maxHp}`);
    }

    /**
     * 更新经验条
     */
    private updateExperience(currentExp: number, maxExp: number, level: number): void {
        const percentage = Math.min(1, currentExp / maxExp);
        const width = this.cameras.main.width * percentage;
        const y = 15;

        this.experienceBar.clear();
        this.experienceBar.fillStyle(0xffaa00, 1);
        this.experienceBar.fillRect(0, y, width, 20);

        this.levelText.setText(`Lv.${level}`);
    }

    /**
     * 更新击杀数
     */
    public updateKillCount(count: number): void {
        this.killText.setText(`KILLS: ${count}`);
        
        // 击杀时闪烁效果
        this.tweens.add({
            targets: this.killText,
            scale: { from: 1.3, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });
    }

    /**
     * 场景关闭时清理资源
     */
    shutdown(): void {
        // 移除事件监听器
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.off('updateHealth', this.updateHealth, this);
            gameScene.events.off('updateExperience', this.updateExperience, this);
            gameScene.events.off('skill-changed', this.updateSkillDisplay, this);
        }

        // 清理技能图标
        this.skillIcons.forEach(icon => icon.destroy());
        this.skillIcons = [];
    }
}
