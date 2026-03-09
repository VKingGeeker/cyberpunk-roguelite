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
    private skillIcons: Phaser.GameObjects.Image[] = [];
    private experienceBar!: Phaser.GameObjects.Graphics;
    private experienceBarBg!: Phaser.GameObjects.Graphics;
    private levelText!: Phaser.GameObjects.Text;
    private killText!: Phaser.GameObjects.Text;

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
        this.createSkillBar();
        this.createExperienceBar();
        this.createKillCounter();

        // 监听玩家事件
        this.scene.get('GameScene').events.on('updateHealth', this.updateHealth, this);
        this.scene.get('GameScene').events.on('updateExperience', this.updateExperience, this);
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
     * 创建技能栏（被动技能显示）
     */
    private createSkillBar(): void {
        const startX = 20;
        const y = this.cameras.main.height - 120;
        const gap = 10;

        const skillNames = ['横扫斩', '旋风斩', '闪现突袭'];
        const skillCooldowns = ['2秒', '5秒', '8秒'];

        for (let i = 0; i < 3; i++) {
            const x = startX + i * (GAME_CONFIG.ui.skillIconSize + gap);

            // 技能图标
            const icon = this.add.image(x, y, `icon_${['slash', 'spin', 'dash'][i]}`);
            icon.setDisplaySize(GAME_CONFIG.ui.skillIconSize, GAME_CONFIG.ui.skillIconSize);
            icon.setOrigin(0, 0.5);

            // 技能名称
            const nameText = this.add.text(x + GAME_CONFIG.ui.skillIconSize / 2, y + 35, skillNames[i], {
                fontSize: '12px',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace'
            });
            nameText.setOrigin(0.5);

            // 冷却提示
            const cdText = this.add.text(x + GAME_CONFIG.ui.skillIconSize / 2, y + 48, skillCooldowns[i], {
                fontSize: '10px',
                color: '#888888',
                fontFamily: 'Courier New, monospace'
            });
            cdText.setOrigin(0.5);

            this.skillIcons.push(icon);
        }
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
     * 创建击杀计数器
     */
    private createKillCounter(): void {
        this.killText = this.add.text(
            this.cameras.main.width - 20,
            70,
            '击杀: 0',
            {
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#ff8800',
                fontFamily: 'Courier New, monospace'
            }
        );
        this.killText.setOrigin(1, 0);
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
     * 更新击杀数
     */
    public updateKillCount(count: number): void {
        this.killText.setText(`击杀: ${count}`);
    }
}
