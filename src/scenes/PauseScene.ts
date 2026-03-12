/**
 * 暂停场景 - 赛博朋克风格
 * 显示暂停菜单：继续游戏、重新开始、返回主菜单
 */

import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    private panelContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'PauseScene' });
    }

    /**
     * 创建暂停场景
     */
    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建半透明背景
        this.createOverlay(width, height);

        // 创建暂停面板
        this.createPausePanel(width, height);

        // 创建扫描线效果
        this.createScanlineEffect(width, height);

        // 添加ESC键关闭暂停菜单
        this.input.keyboard!.on('keydown-ESC', () => {
            this.resumeGame();
        }, this);

        // 入场动画
        this.panelContainer.setAlpha(0);
        this.panelContainer.setScale(0.9);
        this.tweens.add({
            targets: this.panelContainer,
            alpha: 1,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }

    /**
     * 创建半透明背景
     */
    private createOverlay(width: number, height: number): void {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(0);
    }

    /**
     * 创建暂停面板
     */
    private createPausePanel(width: number, height: number): void {
        this.panelContainer = this.add.container(width / 2, height / 2);
        this.panelContainer.setDepth(10);

        const panelWidth = 450;
        const panelHeight = 400;

        // 面板背景
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x0a0a1a, 0.98);
        panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
        panelBg.lineStyle(3, 0xffaa00, 1);
        panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 15);
        this.panelContainer.add(panelBg);

        // 角落装饰
        this.addCornerDecorations(panelBg, panelWidth, panelHeight, 0xffaa00);

        // 标题
        const title = this.add.text(0, -panelHeight / 2 + 40, '>> 游戏暂停 <<', {
            fontSize: '42px',
            fontStyle: 'bold',
            color: '#ffaa00',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 3
        });
        title.setOrigin(0.5);
        this.panelContainer.add(title);

        // 副标题
        const subtitle = this.add.text(0, -panelHeight / 2 + 85, '// 系统已暂停 //', {
            fontSize: '14px',
            color: '#ff6600',
            fontFamily: 'Courier New, monospace'
        });
        subtitle.setOrigin(0.5);
        this.panelContainer.add(subtitle);

        // 创建菜单按钮
        const buttonStartY = -panelHeight / 2 + 140;
        const buttonSpacing = 70;

        // 继续游戏按钮
        this.createMenuButton(
            0, 
            buttonStartY, 
            320, 
            55, 
            '>> 继续游戏', 
            () => this.resumeGame(),
            0x00ffff
        );

        // 重新开始按钮
        this.createMenuButton(
            0, 
            buttonStartY + buttonSpacing, 
            320, 
            55, 
            '>> 重新开始', 
            () => this.restartGame(),
            0xff00ff
        );

        // 返回主菜单按钮
        this.createMenuButton(
            0, 
            buttonStartY + buttonSpacing * 2, 
            320, 
            55, 
            '>> 返回主菜单', 
            () => this.returnToMainMenu(),
            0xff0044
        );

        // 提示文字
        const hint = this.add.text(0, panelHeight / 2 - 40, '按 ESC 键继续游戏', {
            fontSize: '14px',
            color: '#666688',
            fontFamily: 'Courier New, monospace'
        });
        hint.setOrigin(0.5);
        this.panelContainer.add(hint);

        // 标题闪烁效果
        this.tweens.add({
            targets: title,
            alpha: { from: 0.8, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 添加角落装饰
     */
    private addCornerDecorations(
        graphics: Phaser.GameObjects.Graphics, 
        width: number, 
        height: number, 
        color: number
    ): void {
        const cornerSize = 20;
        graphics.lineStyle(3, color, 1);

        // 左上
        graphics.moveTo(-width / 2 + 5, -height / 2 + cornerSize);
        graphics.lineTo(-width / 2 + 5, -height / 2 + 5);
        graphics.lineTo(-width / 2 + cornerSize, -height / 2 + 5);

        // 右上
        graphics.moveTo(width / 2 - 5, -height / 2 + cornerSize);
        graphics.lineTo(width / 2 - 5, -height / 2 + 5);
        graphics.lineTo(width / 2 - cornerSize, -height / 2 + 5);

        // 左下
        graphics.moveTo(-width / 2 + 5, height / 2 - cornerSize);
        graphics.lineTo(-width / 2 + 5, height / 2 - 5);
        graphics.lineTo(-width / 2 + cornerSize, height / 2 - 5);

        // 右下
        graphics.moveTo(width / 2 - 5, height / 2 - cornerSize);
        graphics.lineTo(width / 2 - 5, height / 2 - 5);
        graphics.lineTo(width / 2 - cornerSize, height / 2 - 5);

        graphics.strokePath();
    }

    /**
     * 创建菜单按钮
     */
    private createMenuButton(
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        text: string, 
        callback: () => void,
        color: number
    ): void {
        const buttonContainer = this.add.container(x, y);
        this.panelContainer.add(buttonContainer);

        // 按钮背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
        buttonContainer.add(bg);

        // 按钮文字
        const label = this.add.text(0, 0, text, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);
        buttonContainer.add(label);

        // 交互区域
        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        buttonContainer.add(hitArea);

        // 悬停效果
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 0.2);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bg.lineStyle(3, color, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
            label.setColor('#ffffff');
            buttonContainer.setScale(1.05);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x1a1a2e, 1);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bg.lineStyle(2, color, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
            label.setColor(`#${color.toString(16).padStart(6, '0')}`);
            buttonContainer.setScale(1);
        });

        hitArea.on('pointerdown', () => {
            buttonContainer.setScale(0.95);
        });

        hitArea.on('pointerup', () => {
            buttonContainer.setScale(1.05);
            callback();
        });
    }

    /**
     * 创建扫描线效果
     */
    private createScanlineEffect(width: number, height: number): void {
        const scanline = this.add.graphics();
        scanline.fillStyle(0xffaa00, 0.05);
        scanline.fillRect(0, 0, width, 3);

        this.tweens.add({
            targets: scanline,
            y: height,
            duration: 2000,
            repeat: -1
        });
    }

    /**
     * 继续游戏
     */
    private resumeGame(): void {
        // 退出动画
        this.tweens.add({
            targets: this.panelContainer,
            alpha: 0,
            scale: 0.9,
            duration: 150,
            ease: 'Back.in',
            onComplete: () => {
                // 通知GameScene恢复游戏
                this.scene.stop();
                this.scene.get('GameScene').events.emit('resume-game');
            }
        });
    }

    /**
     * 重新开始游戏
     */
    private restartGame(): void {
        // 退出动画
        this.tweens.add({
            targets: this.panelContainer,
            alpha: 0,
            scale: 0.9,
            duration: 150,
            ease: 'Back.in',
            onComplete: () => {
                // 停止UI场景
                this.scene.stop('UIScene');
                // 停止暂停场景
                this.scene.stop();
                // 重新开始游戏场景
                this.scene.get('GameScene').scene.restart();
            }
        });
    }

    /**
     * 返回主菜单
     */
    private returnToMainMenu(): void {
        // 退出动画
        this.tweens.add({
            targets: this.panelContainer,
            alpha: 0,
            scale: 0.9,
            duration: 150,
            ease: 'Back.in',
            onComplete: () => {
                // 停止UI场景
                this.scene.stop('UIScene');
                // 停止暂停场景
                this.scene.stop();
                // 停止游戏场景并返回主菜单
                this.scene.stop('GameScene');
                this.scene.start('MenuScene');
            }
        });
    }
}
