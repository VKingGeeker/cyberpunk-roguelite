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
            
            // 计算旋转后的坐标
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
            { text: '关于', action: () => this.showAbout() },
            { text: '退出', action: () => this.quitGame() }
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
        // 按钮背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.lineStyle(2, 0x00ffff, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

        // 按钮文字
        const label = this.add.text(0, 0, text, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);

        // 创建容器
        const container = this.add.container(x, y, [bg, label]);
        container.setSize(width, height);

        // 添加交互
        const hitbox = container.setInteractive({
            useHandCursor: true,
            hitArea: new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains
        });

        // 鼠标悬停效果
        hitbox.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x00ffff, 0.2);
            bg.lineStyle(2, 0x00ffff, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
            label.setColor('#ffffff');
        });

        hitbox.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x1a1a2e, 0.9);
            bg.lineStyle(2, 0x00ffff, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
            label.setColor('#00ffff');
        });

        // 点击事件
        hitbox.on('pointerdown', () => {
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
        // TODO: 实现设置界面
        console.log('Settings not implemented yet');
    }

    /**
     * 显示关于
     */
    private showAbout(): void {
        // TODO: 实现关于界面
        console.log('About not implemented yet');
    }

    /**
     * 退出游戏
     */
    private quitGame(): void {
        // 在浏览器中无法真正退出，这里可以重置到主菜单
        console.log('Quit game');
    }
}
