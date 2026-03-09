/**
 * UI场景
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
    private manaBar!: Phaser.GameObjects.Graphics;
    private manaBarBg!: Phaser.GameObjects.Graphics;
    private manaText!: Phaser.GameObjects.Text;
    private skillIcons: Phaser.GameObjects.Image[] = [];
    private skillCooldowns: Phaser.GameObjects.Text[] = [];
    private timeText!: Phaser.GameObjects.Text;
    private experienceBar!: Phaser.GameObjects.Graphics;
    private experienceBarBg!: Phaser.GameObjects.Graphics;
    private levelText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'UIScene', active: false });
    }

    /**
     * 创建场景
     */
    create(data: { player: Player }): void {
        this.player = data.player;

        // 创建UI元素
        this.createHealthBar();
        this.createManaBar();
        this.createSkillBar();
        this.createTimeDisplay();
        this.createExperienceBar();

        // 监听玩家事件
        this.scene.get('GameScene').events.on('updateHealth', this.updateHealth, this);
        this.scene.get('GameScene').events.on('updateMana', this.updateMana, this);
        this.scene.get('GameScene').events.on('updateExperience', this.updateExperience, this);
        this.scene.get('GameScene').events.on('timeUpdate', this.updateTime, this);
        this.scene.get('GameScene').events.on('skillUsed', this.onSkillUsed, this);

        // 创建交互
        this.createInteractions();
    }

    /**
     * 创建生命条
     */
    private createHealthBar(): void {
        const y = this.cameras.main.height - 50;

        // 背景
        this.healthBarBg = this.add.graphics();
        this.healthBarBg.fillStyle(0x1a1a2e, 1);
        this.healthBarBg.fillRect(20, y, GAME_CONFIG.ui.healthBarWidth, GAME_CONFIG.ui.healthBarHeight);

        // 生命条
        this.healthBar = this.add.graphics();
        this.healthBar.fillStyle(0xff4444, 1);
        this.healthBar.fillRect(20, y, GAME_CONFIG.ui.healthBarWidth, GAME_CONFIG.ui.healthBarHeight);

        // 文字
        this.healthText = this.add.text(
            20 + GAME_CONFIG.ui.healthBarWidth / 2,
            y + GAME_CONFIG.ui.healthBarHeight / 2,
            '100/100',
            {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace'
            }
        );
        this.healthText.setOrigin(0.5);
    }

    /**
     * 创建法力条
     */
    private createManaBar(): void {
        const y = this.cameras.main.height - 80;

        // 背景
        this.manaBarBg = this.add.graphics();
        this.manaBarBg.fillStyle(0x1a1a2e, 1);
        this.manaBarBg.fillRect(20, y, GAME_CONFIG.ui.manaBarWidth, GAME_CONFIG.ui.manaBarHeight);

        // 法力条
        this.manaBar = this.add.graphics();
        this.manaBar.fillStyle(0x4444ff, 1);
        this.manaBar.fillRect(20, y, GAME_CONFIG.ui.manaBarWidth, GAME_CONFIG.ui.manaBarHeight);

        // 文字
        this.manaText = this.add.text(
            20 + GAME_CONFIG.ui.manaBarWidth / 2,
            y + GAME_CONFIG.ui.manaBarHeight / 2,
            '50/50',
            {
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace'
            }
        );
        this.manaText.setOrigin(0.5);
    }

    /**
     * 创建技能栏
     */
    private createSkillBar(): void {
        const skillSystem = this.player.getSkillSystem();
        const skills = skillSystem.getActiveSkills();

        const startX = 20;
        const y = this.cameras.main.height - 140;
        const gap = 10;

        for (let i = 0; i < 3; i++) {
            const x = startX + i * (GAME_CONFIG.ui.skillIconSize + gap);

            // 技能图标
            const icon = this.add.image(x, y, 'icon_slash');
            icon.setDisplaySize(GAME_CONFIG.ui.skillIconSize, GAME_CONFIG.ui.skillIconSize);
            icon.setInteractive();
            icon.setData('skillIndex', i);

            // 技能编号
            const keyText = this.add.text(
                x - GAME_CONFIG.ui.skillIconSize / 2 + 5,
                y - GAME_CONFIG.ui.skillIconSize / 2 + 5,
                `${i + 1}`,
                {
                    fontSize: '16px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                    fontFamily: 'Courier New, monospace'
                }
            );

            // 冷却时间显示
            const cooldownText = this.add.text(
                x,
                y,
                '',
                {
                    fontSize: '20px',
                    fontStyle: 'bold',
                    color: '#ffffff',
                    fontFamily: 'Courier New, monospace'
                }
            );
            cooldownText.setOrigin(0.5);
            cooldownText.setVisible(false);

            this.skillIcons.push(icon);
            this.skillCooldowns.push(cooldownText);
        }
    }

    /**
     * 创建时间显示
     */
    private createTimeDisplay(): void {
        this.timeText = this.add.text(
            this.cameras.main.width - 20,
            30,
            '10:00',
            {
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace'
            }
        );
        this.timeText.setOrigin(1, 0);
    }

    /**
     * 创建经验条
     */
    private createExperienceBar(): void {
        const y = 30;

        // 背景
        this.experienceBarBg = this.add.graphics();
        this.experienceBarBg.fillStyle(0x1a1a2e, 1);
        this.experienceBarBg.fillRect(0, y, this.cameras.main.width, 20);

        // 经验条
        this.experienceBar = this.add.graphics();
        this.experienceBar.fillStyle(0xffaa00, 1);
        this.experienceBar.fillRect(0, y, 0, 20);

        // 等级文字
        this.levelText = this.add.text(
            this.cameras.main.width / 2,
            y + 10,
            'Lv.1',
            {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ffffff',
                fontFamily: 'Courier New, monospace'
            }
        );
        this.levelText.setOrigin(0.5);
    }

    /**
     * 创建交互
     */
    private createInteractions(): void {
        // 技能图标点击
        for (const icon of this.skillIcons) {
            icon.on('pointerdown', () => {
                const skillIndex = icon.getData('skillIndex');
                this.player.useSkill(skillIndex);
            });
        }

        // 背包快捷键
        this.input.keyboard!.on('keydown-I', () => {
            this.toggleInventory();
        });
    }

    /**
     * 更新生命条
     */
    private updateHealth(currentHp: number, maxHp: number): void {
        const percentage = currentHp / maxHp;
        const width = GAME_CONFIG.ui.healthBarWidth * percentage;

        this.healthBar.clear();
        this.healthBar.fillStyle(0xff4444, 1);
        this.healthBar.fillRect(20, this.cameras.main.height - 50, width, GAME_CONFIG.ui.healthBarHeight);

        this.healthText.setText(`${Math.floor(currentHp)}/${maxHp}`);
    }

    /**
     * 更新法力条
     */
    private updateMana(currentMana: number, maxMana: number): void {
        const percentage = currentMana / maxMana;
        const width = GAME_CONFIG.ui.manaBarWidth * percentage;

        this.manaBar.clear();
        this.manaBar.fillStyle(0x4444ff, 1);
        this.manaBar.fillRect(20, this.cameras.main.height - 80, width, GAME_CONFIG.ui.manaBarHeight);

        this.manaText.setText(`${Math.floor(currentMana)}/${maxMana}`);
    }

    /**
     * 更新经验条
     */
    private updateExperience(currentExp: number, maxExp: number, level: number): void {
        const percentage = currentExp / maxExp;
        const width = this.cameras.main.width * percentage;

        this.experienceBar.clear();
        this.experienceBar.fillStyle(0xffaa00, 1);
        this.experienceBar.fillRect(0, 30, width, 20);

        this.levelText.setText(`Lv.${level}`);
    }

    /**
     * 更新时间
     */
    private updateTime(data: { elapsed: number; remaining: number }): void {
        const minutes = Math.floor(data.remaining / 60);
        const seconds = Math.floor(data.remaining % 60);
        this.timeText.setText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

        // 时间不足30秒时显示红色
        if (data.remaining <= 30) {
            this.timeText.setColor('#ff4444');
        } else {
            this.timeText.setColor('#00ffff');
        }
    }

    /**
     * 技能使用事件
     */
    private onSkillUsed(data: { skillIndex: number; cooldown: number }): void {
        const cooldownText = this.skillCooldowns[data.skillIndex];
        cooldownText.setVisible(true);
        cooldownText.setText(`${data.cooldown.toFixed(1)}`);

        // 创建冷却倒计时
        const timer = this.time.addEvent({
            delay: 100,
            callback: () => {
                const remaining = data.cooldown - timer.getElapsedSeconds();
                if (remaining <= 0) {
                    cooldownText.setVisible(false);
                    timer.remove();
                } else {
                    cooldownText.setText(`${remaining.toFixed(1)}`);
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * 切换背包显示
     */
    private toggleInventory(): void {
        // TODO: 实现背包UI
        console.log('Inventory not implemented yet');
    }

    /**
     * 更新场景
     */
    update(time: number, delta: number): void {
        // 更新技能冷却显示
        const skillSystem = this.player.getSkillSystem();
        for (let i = 0; i < this.skillCooldowns.length; i++) {
            const cooldown = skillSystem.getSkillCooldown(i, time);
            const cooldownText = this.skillCooldowns[i];
            if (cooldown > 0) {
                cooldownText.setVisible(true);
                cooldownText.setText(`${cooldown.toFixed(1)}`);
            } else {
                cooldownText.setVisible(false);
            }
        }
    }
}
