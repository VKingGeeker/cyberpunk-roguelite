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
    
    // 帮助面板
    private helpPanel: Phaser.GameObjects.Container | null = null;
    private isHelpVisible: boolean = false;
    
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
        this.createWeaponBar();
        this.createSkillBar();
        this.createExperienceBar();
        this.createKillCounter();
        this.createHelpButton();
        this.createCyberpunkDecorations();

        // 监听玩家事件
        this.scene.get('GameScene').events.on('updateHealth', this.updateHealth, this);
        this.scene.get('GameScene').events.on('updateExperience', this.updateExperience, this);
        this.scene.get('GameScene').events.on('skill-changed', this.updateSkillDisplay, this);
        this.scene.get('GameScene').events.on('updateKillCount', this.updateKillCount, this);
        this.scene.get('GameScene').events.on('weapon-changed', this.updateWeaponDisplay, this);
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
     * 创建武器栏 - 显示当前武器和武器槽位
     */
    private createWeaponBar(): void {
        const x = this.cameras.main.width - 190;
        const y = this.cameras.main.height - 80;
        const size = 50;

        // 武器栏背景 - 调整宽度以容纳3个槽位
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.9);
        bg.fillRoundedRect(x - 10, y - size/2 - 20, 190, size + 50, 8);
        bg.lineStyle(2, 0xff00ff, 0.5);
        bg.strokeRoundedRect(x - 10, y - size/2 - 20, 190, size + 50, 8);

        // 标题
        const title = this.add.text(x + 75, y - size/2 - 15, 'WEAPON', {
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5, 0);

        // 初始显示武器
        this.updateWeaponDisplay();
    }

    /**
     * 更新武器显示
     */
    public updateWeaponDisplay(): void {
        if (!this.player) return;

        const x = this.cameras.main.width - 190;
        const y = this.cameras.main.height - 80;
        const size = 50;

        // 清除旧的武器显示（通过标签查找）
        this.children.each((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Graphics || 
                child instanceof Phaser.GameObjects.Text ||
                child instanceof Phaser.GameObjects.Image) {
                if (child.getData('isWeaponUI')) {
                    child.destroy();
                }
            }
        });

        const weaponSlots = this.player.getWeaponSlots();
        const currentWeapon = this.player.getCurrentWeapon();

        // 稀有度颜色
        const rarityColors: Record<string, number> = {
            'common': 0x888888,
            'rare': 0x4488ff,
            'epic': 0xaa44ff,
            'legendary': 0xffaa00
        };

        // 显示武器槽位
        weaponSlots.forEach((weapon, index) => {
            const slotX = x + 10 + index * 55;
            const slotBg = this.add.graphics();
            slotBg.setData('isWeaponUI', true);

            if (weapon) {
                const color = rarityColors[weapon.rarity] || 0xffffff;
                
                // 槽位背景
                slotBg.fillStyle(0x1a1a2e, 1);
                slotBg.fillRoundedRect(slotX, y - size/2, size, size, 6);
                slotBg.lineStyle(2, color, index === 0 ? 1 : 0.5);
                slotBg.strokeRoundedRect(slotX, y - size/2, size, size, 6);

                // 武器图标
                const weaponType = weapon.type;
                const iconKey = `weapon_${weaponType}`;
                const icon = this.add.image(slotX + size/2, y, iconKey);
                icon.setDisplaySize(size - 10, size - 10);
                icon.setOrigin(0.5);
                icon.setData('isWeaponUI', true);

                // 武器名称
                const nameText = this.add.text(slotX + size/2, y + size/2 + 8, weapon.name.substring(0, 4), {
                    fontSize: '9px',
                    color: `#${color.toString(16).padStart(6, '0')}`,
                    fontFamily: 'Courier New, monospace'
                });
                nameText.setOrigin(0.5);
                nameText.setData('isWeaponUI', true);
            } else {
                // 空槽位
                slotBg.fillStyle(0x1a1a2e, 0.3);
                slotBg.fillRoundedRect(slotX, y - size/2, size, size, 6);
                slotBg.lineStyle(1, 0x333344, 0.5);
                slotBg.strokeRoundedRect(slotX, y - size/2, size, size, 6);

                // 槽位编号
                const slotNum = this.add.text(slotX + size/2, y, `${index + 1}`, {
                    fontSize: '16px',
                    color: '#444466',
                    fontFamily: 'Courier New, monospace'
                });
                slotNum.setOrigin(0.5);
                slotNum.setData('isWeaponUI', true);
            }
        });

        // 显示当前武器详细信息
        if (currentWeapon) {
            const infoY = y + size/2 + 25;
            const color = rarityColors[currentWeapon.rarity] || 0xffffff;
            
            const infoText = this.add.text(x + 75, infoY, 
                `ATK: ${currentWeapon.attack} | SPD: ${currentWeapon.attackSpeed.toFixed(1)}`, {
                fontSize: '10px',
                color: `#${color.toString(16).padStart(6, '0')}`,
                fontFamily: 'Courier New, monospace'
            });
            infoText.setOrigin(0.5);
            infoText.setData('isWeaponUI', true);
        }
    }

    /**
     * 创建技能栏（被动技能显示）- 动态显示已学技能
     */
    private createSkillBar(): void {
        const startX = 20;
        const y = this.cameras.main.height - 130;
        const size = GAME_CONFIG.ui.skillIconSize;
        const maxSlots = 6; // 最多显示6个技能，缩小间距

        // 技能栏背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.9);
        bg.fillRoundedRect(startX - 10, y - size/2 - 15, size * maxSlots + 15 * (maxSlots - 1) + 20, size + 45, 8);
        bg.lineStyle(2, 0x00ffff, 0.5);
        bg.strokeRoundedRect(startX - 10, y - size/2 - 15, size * maxSlots + 15 * (maxSlots - 1) + 20, size + 45, 8);

        // 标题
        const title = this.add.text(startX + (size * maxSlots + 15 * (maxSlots - 1)) / 2, y - size/2 - 10, 'SKILLS', {
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5, 0);

        // 初始更新技能显示
        this.updateSkillDisplay();
    }

    /**
     * 更新技能显示
     */
    public updateSkillDisplay(): void {
        if (!this.player) return;
        
        const ownedSkills = this.player.getOwnedSkills();
        if (!ownedSkills || ownedSkills.size === 0) return;

        const startX = 20;
        const y = this.cameras.main.height - 130;
        const size = GAME_CONFIG.ui.skillIconSize;

        // 清除旧图标
        if (this.skillIcons && this.skillIcons.length > 0) {
            this.skillIcons.forEach(icon => icon.destroy());
        }
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
            'skill_hologram': 'icon_hologram',
            // 新增技能
            'skill_plasma_orb': 'icon_orb',
            'skill_energy_nova': 'icon_nova',
            'skill_sonic_boom': 'icon_sonic',
            'skill_flame_wave': 'icon_flame',
            'skill_void_rift': 'icon_void',
            'skill_time_warp': 'icon_time',
            'skill_nanite_swarm': 'icon_nanite',
            'skill_energy_drain': 'icon_drain',
            'skill_ice_shard': 'icon_ice'
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
            'skill_hologram': '幻影',
            // 新增技能
            'skill_plasma_orb': '等离子球',
            'skill_energy_nova': '新星',
            'skill_sonic_boom': '音爆',
            'skill_flame_wave': '烈焰',
            'skill_void_rift': '虚空',
            'skill_time_warp': '时间',
            'skill_nanite_swarm': '虫群',
            'skill_energy_drain': '汲取',
            'skill_ice_shard': '冰霜'
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
            'skill_hologram': 0xaa44ff,
            // 新增技能
            'skill_plasma_orb': 0xff66ff,
            'skill_energy_nova': 0xffaa00,
            'skill_sonic_boom': 0x00aaff,
            'skill_flame_wave': 0xff4400,
            'skill_void_rift': 0x8800ff,
            'skill_time_warp': 0x00ffaa,
            'skill_nanite_swarm': 0x88ff00,
            'skill_energy_drain': 0xff0066,
            'skill_ice_shard': 0x88ffff
        };

        let index = 0;
        ownedSkills.forEach((data, skillId) => {
            if (index >= 6) return; // 最多显示6个

            const x = startX + index * (size + 15);
            const iconKey = iconMap[skillId] || 'icon_slash';
            const color = colorMap[skillId] || 0x00ffff;

            // 技能槽背景
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0x1a1a2e, 1);
            slotBg.fillRoundedRect(x, y - size/2, size, size, 6);
            slotBg.lineStyle(2, color, 0.8);
            slotBg.strokeRoundedRect(x, y - size/2, size, size, 6);

            // 等级指示器 - 显示在图标内部底部
            const level = data.skill.level;
            if (level > 0) {
                const dotSize = 4;
                const dotSpacing = 8;
                const startXDots = x + size/2 - ((level - 1) * dotSpacing) / 2;
                for (let i = 0; i < level; i++) {
                    slotBg.fillStyle(color, 0.9);
                    slotBg.fillCircle(startXDots + i * dotSpacing, y + size/2 - 6, dotSize);
                }
            }

            // 技能图标
            const icon = this.add.image(x + size/2, y, iconKey);
            icon.setDisplaySize(size - 12, size - 12);
            icon.setOrigin(0.5);

            // 技能名称
            const nameText = this.add.text(x + size/2, y + size/2 + 8, nameMap[skillId] || '技能', {
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
     * 创建帮助按钮 - 右上角
     */
    private createHelpButton(): void {
        const width = this.cameras.main.width;
        const btnX = width - 50;
        const btnY = 50;

        // 按钮背景
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x0a0a1a, 0.9);
        btnBg.fillCircle(btnX, btnY, 25);
        btnBg.lineStyle(2, 0x00ffff, 1);
        btnBg.strokeCircle(btnX, btnY, 25);

        // 问号图标
        const helpIcon = this.add.text(btnX, btnY, '?', {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        helpIcon.setOrigin(0.5);

        // 交互区域
        const hitArea = this.add.circle(btnX, btnY, 25, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        // 悬停效果
        hitArea.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x1a1a2e, 1);
            btnBg.fillCircle(btnX, btnY, 25);
            btnBg.lineStyle(3, 0x00ffff, 1);
            btnBg.strokeCircle(btnX, btnY, 25);
            helpIcon.setScale(1.2);
        });

        hitArea.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x0a0a1a, 0.9);
            btnBg.fillCircle(btnX, btnY, 25);
            btnBg.lineStyle(2, 0x00ffff, 1);
            btnBg.strokeCircle(btnX, btnY, 25);
            helpIcon.setScale(1);
        });

        hitArea.on('pointerdown', () => {
            this.toggleHelpPanel();
        });
    }

    /**
     * 切换帮助面板显示
     */
    private toggleHelpPanel(): void {
        if (this.isHelpVisible) {
            this.hideHelpPanel();
        } else {
            this.showHelpPanel();
        }
    }

    /**
     * 显示帮助面板
     */
    private showHelpPanel(): void {
        if (this.helpPanel) return;

        this.isHelpVisible = true;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建面板容器
        this.helpPanel = this.add.container(width / 2, height / 2);
        this.helpPanel.setDepth(2000);

        // 半透明背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(-width / 2, -height / 2, width, height);
        this.helpPanel.add(overlay);

        // 面板背景
        const panelWidth = 600;
        const panelHeight = 500;
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x0a0a1a, 0.98);
        panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
        panelBg.lineStyle(3, 0x00ffff, 1);
        panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
        this.helpPanel.add(panelBg);

        // 标题
        const title = this.add.text(0, -panelHeight / 2 + 30, '>> GAME HELP <<', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        this.helpPanel.add(title);

        // 帮助内容
        const helpContent = [
            { label: 'MOVEMENT', content: 'WASD or Arrow Keys' },
            { label: 'ATTACK', content: 'Left Click / Space' },
            { label: 'SWITCH WEAPON', content: '1 / 2 / 3 or Q' },
            { label: 'CRAFTING', content: 'C Key' },
            { label: 'QUICK SAVE', content: 'F5' },
            { label: 'QUICK LOAD', content: 'F9' },
            { label: 'SAVE MENU', content: 'Ctrl + S' },
            { label: 'LOAD MENU', content: 'Ctrl + L' },
            { label: 'TIME REWIND', content: 'T Key' },
            { label: 'SKILL SLOTS', content: 'Max 6 Skills' }
        ];

        const startY = -panelHeight / 2 + 80;
        helpContent.forEach((item, index) => {
            const y = startY + index * 38;
            
            // 标签
            const label = this.add.text(-200, y, item.label, {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ff00ff',
                fontFamily: 'Courier New, monospace'
            });
            this.helpPanel.add(label);

            // 分隔符
            const separator = this.add.text(-50, y, ':', {
                fontSize: '16px',
                color: '#888888',
                fontFamily: 'Courier New, monospace'
            });
            this.helpPanel.add(separator);

            // 内容
            const content = this.add.text(-30, y, item.content, {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace'
            });
            this.helpPanel.add(content);
        });

        // 游戏提示
        const tipsY = startY + helpContent.length * 38 + 20;
        const tipsTitle = this.add.text(0, tipsY, '--- TIPS ---', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace'
        });
        tipsTitle.setOrigin(0.5);
        this.helpPanel.add(tipsTitle);

        const tips = [
            '• Collect power-ups to gain XP and level up',
            '• Skills auto-trigger when enemies are nearby',
            '• Craft better gear from dropped materials',
            '• Use time fragments to rewind time'
        ];

        tips.forEach((tip, index) => {
            const tipText = this.add.text(0, tipsY + 30 + index * 25, tip, {
                fontSize: '14px',
                color: '#aaaaaa',
                fontFamily: 'Courier New, monospace'
            });
            tipText.setOrigin(0.5);
            this.helpPanel.add(tipText);
        });

        // 关闭按钮
        const closeBtnY = panelHeight / 2 - 35;
        const closeBtnBg = this.add.graphics();
        closeBtnBg.fillStyle(0xff0044, 0.3);
        closeBtnBg.fillRoundedRect(-60, closeBtnY - 18, 120, 36, 6);
        closeBtnBg.lineStyle(2, 0xff0044, 1);
        closeBtnBg.strokeRoundedRect(-60, closeBtnY - 18, 120, 36, 6);
        this.helpPanel.add(closeBtnBg);

        const closeBtnText = this.add.text(0, closeBtnY, 'CLOSE', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ff0044',
            fontFamily: 'Courier New, monospace'
        });
        closeBtnText.setOrigin(0.5);
        this.helpPanel.add(closeBtnText);

        const closeHitArea = this.add.rectangle(0, closeBtnY, 120, 36, 0x000000, 0);
        closeHitArea.setInteractive({ useHandCursor: true });
        this.helpPanel.add(closeHitArea);

        closeHitArea.on('pointerover', () => {
            closeBtnBg.clear();
            closeBtnBg.fillStyle(0xff0044, 0.5);
            closeBtnBg.fillRoundedRect(-60, closeBtnY - 18, 120, 36, 6);
            closeBtnBg.lineStyle(2, 0xff0044, 1);
            closeBtnBg.strokeRoundedRect(-60, closeBtnY - 18, 120, 36, 6);
        });

        closeHitArea.on('pointerout', () => {
            closeBtnBg.clear();
            closeBtnBg.fillStyle(0xff0044, 0.3);
            closeBtnBg.fillRoundedRect(-60, closeBtnY - 18, 120, 36, 6);
            closeBtnBg.lineStyle(2, 0xff0044, 1);
            closeBtnBg.strokeRoundedRect(-60, closeBtnY - 18, 120, 36, 6);
        });

        closeHitArea.on('pointerdown', () => {
            this.hideHelpPanel();
        });

        // 入场动画
        this.helpPanel.setAlpha(0);
        this.helpPanel.setScale(0.8);
        this.tweens.add({
            targets: this.helpPanel,
            alpha: 1,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });

        // 暂停游戏
        this.scene.get('GameScene').scene.pause();
    }

    /**
     * 隐藏帮助面板
     */
    private hideHelpPanel(): void {
        if (!this.helpPanel) return;

        this.tweens.add({
            targets: this.helpPanel,
            alpha: 0,
            scale: 0.8,
            duration: 150,
            ease: 'Back.in',
            onComplete: () => {
                if (this.helpPanel) {
                    this.helpPanel.destroy();
                    this.helpPanel = null;
                }
                this.isHelpVisible = false;
                
                // 恢复游戏
                this.scene.get('GameScene').scene.resume();
            }
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
            gameScene.events.off('updateKillCount', this.updateKillCount, this);
        }

        // 清理技能图标
        this.skillIcons.forEach(icon => icon.destroy());
        this.skillIcons = [];
    }
}
