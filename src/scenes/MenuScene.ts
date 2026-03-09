/**
 * 主菜单场景
 * 显示游戏标题、开始按钮、设置按钮等
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    /**
     * 创建菜单
     */
    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建背景
        this.createBackground();

        // 创建标题
        this.createTitle();

        // 创建菜单按钮
        this.createButtons();

        // 创建版本信息
        this.createVersionInfo();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x0a0a0a, 0x1a1a2e, 0x0a0a0a, 0x1a1a2e, 1);
        graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // 添加装饰性线条
        graphics.lineStyle(2, 0x00ffff, 0.3);
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const length = Phaser.Math.Between(50, 200);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const halfLen = length / 2;
            
            graphics.beginPath();
            graphics.moveTo(x - halfLen * cos, y - halfLen * sin);
            graphics.lineTo(x + halfLen * cos, y + halfLen * sin);
            graphics.strokePath();
        }
    }

    /**
     * 创建标题
     */
    private createTitle(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 主标题
        const title = this.add.text(width / 2, height / 3, 'CYBERPUNK', {
            fontSize: '72px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);

        // 副标题
        const subtitle = this.add.text(width / 2, height / 3 + 80, 'ROGUELITE', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ff8800',
            fontFamily: 'Courier New, monospace'
        });
        subtitle.setOrigin(0.5);

        // 添加标题动画
        this.tweens.add({
            targets: [title, subtitle],
            scale: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 1000,
            ease: 'Back.easeOut'
        });
    }

    /**
     * 创建菜单按钮
     */
    private createButtons(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const startY = height / 2 + 50;
        const buttonHeight = 60;
        const buttonWidth = 300;
        const gap = 20;

        const buttons = [
            { text: '开始游戏', action: () => this.startGame() },
            { text: '设置', action: () => this.showSettings() },
            { text: '关于', action: () => this.showAbout() }
        ];

        buttons.forEach((button, index) => {
            const y = startY + index * (buttonHeight + gap);
            this.createButton(width / 2, y, buttonWidth, buttonHeight, button.text, button.action);
        });
    }

    /**
     * 创建按钮
     */
    private createButton(x: number, y: number, width: number, height: number, text: string, callback: () => void): void {
        // 创建一个矩形作为按钮背景
        const bg = this.add.rectangle(x, y, width, height, 0x1a1a2e, 0.9);
        bg.setStrokeStyle(2, 0x00ffff, 1);

        // 按钮文字
        const label = this.add.text(x, y, text, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);

        // 设置交互 - 只在矩形上设置
        bg.setInteractive({ useHandCursor: true });

        // 鼠标悬停效果
        bg.on('pointerover', () => {
            bg.setFillStyle(0x00ffff, 0.2);
            label.setColor('#ffffff');
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x1a1a2e, 0.9);
            label.setColor('#00ffff');
        });

        // 点击事件
        bg.on('pointerdown', () => {
            callback();
        });
    }

    /**
     * 创建版本信息
     */
    private createVersionInfo(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const version = this.add.text(width / 2, height - 30, 'v0.1.0 - MVP', {
            fontSize: '16px',
            color: '#666666',
            fontFamily: 'Courier New, monospace'
        });
        version.setOrigin(0.5);
    }

    /**
     * 开始游戏
     */
    private startGame(): void {
        this.scene.start('GameScene');
    }

    /**
     * 显示设置
     */
    private showSettings(): void {
        // 创建设置面板
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        overlay.setInteractive();

        // 设置面板
        const panel = this.add.rectangle(width / 2, height / 2, 400, 300, 0x1a1a2e, 1);
        panel.setStrokeStyle(2, 0x00ffff, 1);

        // 标题
        const title = this.add.text(width / 2, height / 2 - 100, '设置', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);

        // 关闭按钮
        const closeBtn = this.add.rectangle(width / 2, height / 2 + 100, 200, 50, 0x1a1a2e, 1);
        closeBtn.setStrokeStyle(2, 0xff4444, 1);
        const closeLabel = this.add.text(width / 2, height / 2 + 100, '关闭', {
            fontSize: '24px',
            color: '#ff4444',
            fontFamily: 'Courier New, monospace'
        });
        closeLabel.setOrigin(0.5);

        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            closeBtn.destroy();
            closeLabel.destroy();
        });
    }

    /**
     * 显示关于
     */
    private showAbout(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        overlay.setInteractive();

        // 关于面板
        const panel = this.add.rectangle(width / 2, height / 2, 500, 350, 0x1a1a2e, 1);
        panel.setStrokeStyle(2, 0x00ffff, 1);

        // 标题
        const title = this.add.text(width / 2, height / 2 - 120, '关于游戏', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);

        // 描述文字
        const desc = this.add.text(width / 2, height / 2 - 20, 
            '赛博朋克风格的肉鸽游戏\n\n使用 WASD 或方向键移动\n击败敌人获得经验和物品\n生存尽可能长的时间', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            lineSpacing: 10
        });
        desc.setOrigin(0.5);

        // 关闭按钮
        const closeBtn = this.add.rectangle(width / 2, height / 2 + 120, 200, 50, 0x1a1a2e, 1);
        closeBtn.setStrokeStyle(2, 0xff4444, 1);
        const closeLabel = this.add.text(width / 2, height / 2 + 120, '关闭', {
            fontSize: '24px',
            color: '#ff4444',
            fontFamily: 'Courier New, monospace'
        });
        closeLabel.setOrigin(0.5);

        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            desc.destroy();
            closeBtn.destroy();
            closeLabel.destroy();
        });
    }
}
