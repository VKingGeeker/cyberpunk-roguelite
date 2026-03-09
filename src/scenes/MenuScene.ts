/**
 * 主菜单场景 - 赛博朋克风格
 * 显示游戏标题、开始按钮、设置按钮等
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';

export default class MenuScene extends Phaser.Scene {
    private particleGraphics!: Phaser.GameObjects.Graphics;
    
    constructor() {
        super({ key: 'MenuScene' });
    }

    /**
     * 创建菜单
     */
    create(): void {
        // 创建赛博朋克背景
        this.createCyberpunkBackground();

        // 创建霓虹标题
        this.createNeonTitle();

        // 创建菜单按钮
        this.createCyberpunkButtons();

        // 创建版本信息
        this.createVersionInfo();

        // 创建粒子效果
        this.createParticles();

        // 创建扫描线效果
        this.createScanlines();
    }

    /**
     * 创建赛博朋克背景
     */
    private createCyberpunkBackground(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 深色背景
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a0a1a, 1);
        graphics.fillRect(0, 0, width, height);

        // 霓虹网格
        graphics.lineStyle(1, 0x00ffff, 0.1);
        const gridSize = 60;
        for (let x = 0; x <= width; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(width, y);
        }
        graphics.strokePath();

        // 电路板纹理
        graphics.lineStyle(1, 0x0066ff, 0.15);
        for (let i = 0; i < 30; i++) {
            const startX = Phaser.Math.Between(0, width);
            const startY = Phaser.Math.Between(0, height);
            graphics.beginPath();
            graphics.moveTo(startX, startY);
            
            let x = startX, y = startY;
            for (let j = 0; j < 5; j++) {
                const dir = Phaser.Math.Between(0, 3);
                const len = Phaser.Math.Between(30, 80);
                switch (dir) {
                    case 0: x += len; break;
                    case 1: x -= len; break;
                    case 2: y += len; break;
                    case 3: y -= len; break;
                }
                graphics.lineTo(x, y);
            }
            graphics.strokePath();
        }

        // 随机霓虹光点
        const colors = [0x00ffff, 0xff00ff, 0xffff00, 0xff6600];
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const color = colors[Phaser.Math.Between(0, colors.length - 1)];
            
            graphics.fillStyle(color, 0.05);
            graphics.fillCircle(x, y, Phaser.Math.Between(20, 50));
            graphics.fillStyle(color, 0.3);
            graphics.fillCircle(x, y, 2);
        }
    }

    /**
     * 创建霓虹标题
     */
    private createNeonTitle(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 主标题发光层
        const glowText = this.add.text(width / 2, height / 3 - 5, 'NEON', {
            fontSize: '100px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        glowText.setOrigin(0.5);
        glowText.setAlpha(0.3);
        glowText.setTint(0x00ffff);

        // 主标题
        const title = this.add.text(width / 2, height / 3 - 5, 'NEON', {
            fontSize: '100px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ff00ff',
            strokeThickness: 4
        });
        title.setOrigin(0.5);

        // 副标题
        const subtitle = this.add.text(width / 2, height / 3 + 70, 'ROGUE', {
            fontSize: '60px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace',
            stroke: '#00ffff',
            strokeThickness: 2
        });
        subtitle.setOrigin(0.5);

        // 标语
        const tagline = this.add.text(width / 2, height / 3 + 130, '// CYBERPUNK EDITION //', {
            fontSize: '16px',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace'
        });
        tagline.setOrigin(0.5);

        // 标题动画
        this.tweens.add({
            targets: [title, glowText],
            scale: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 1000,
            ease: 'Back.easeOut'
        });

        // 霓虹闪烁效果
        this.tweens.add({
            targets: glowText,
            alpha: { from: 0.2, to: 0.4 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: subtitle,
            alpha: { from: 0.8, to: 1 },
            duration: 300,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 创建赛博朋克按钮
     */
    private createCyberpunkButtons(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const startY = height / 2 + 80;

        const buttons = [
            { text: '>> START GAME', action: () => this.startGame(), color: 0x00ffff },
            { text: '>> SETTINGS', action: () => this.showSettings(), color: 0xff00ff },
            { text: '>> ABOUT', action: () => this.showAbout(), color: 0xffff00 }
        ];

        buttons.forEach((button, index) => {
            const y = startY + index * 70;
            this.createCyberButton(width / 2, y, 320, 50, button.text, button.action, button.color);
        });
    }

    /**
     * 创建赛博风格按钮
     */
    private createCyberButton(
        x: number, y: number, width: number, height: number, 
        text: string, callback: () => void, color: number
    ): void {
        const container = this.add.container(x, y);

        // 按钮背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.9);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 4);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 4);

        // 角落装饰
        bg.lineStyle(3, color, 1);
        const cornerSize = 12;
        // 左上
        bg.moveTo(-width/2 + 4, -height/2 + cornerSize);
        bg.lineTo(-width/2 + 4, -height/2 + 4);
        bg.lineTo(-width/2 + cornerSize, -height/2 + 4);
        // 右下
        bg.moveTo(width/2 - 4, height/2 - cornerSize);
        bg.lineTo(width/2 - 4, height/2 - 4);
        bg.lineTo(width/2 - cornerSize, height/2 - 4);
        bg.strokePath();

        container.add(bg);

        // 按钮文字
        const label = this.add.text(0, 0, text, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);
        container.add(label);

        // 交互区域
        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);

        // 悬停效果
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(color, 0.2);
            bg.fillRoundedRect(-width/2, -height/2, width, height, 4);
            bg.lineStyle(3, color, 1);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, 4);
            
            // 角落装饰
            bg.lineStyle(3, 0xffffff, 1);
            bg.moveTo(-width/2 + 4, -height/2 + cornerSize);
            bg.lineTo(-width/2 + 4, -height/2 + 4);
            bg.lineTo(-width/2 + cornerSize, -height/2 + 4);
            bg.moveTo(width/2 - 4, height/2 - cornerSize);
            bg.lineTo(width/2 - 4, height/2 - 4);
            bg.lineTo(width/2 - cornerSize, height/2 - 4);
            bg.strokePath();
            
            label.setColor('#ffffff');
            label.setFontSize('24px');
            
            // 音效反馈
            container.setScale(1.05);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x0a0a1a, 0.9);
            bg.fillRoundedRect(-width/2, -height/2, width, height, 4);
            bg.lineStyle(2, color, 1);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, 4);
            
            bg.lineStyle(3, color, 1);
            bg.moveTo(-width/2 + 4, -height/2 + cornerSize);
            bg.lineTo(-width/2 + 4, -height/2 + 4);
            bg.lineTo(-width/2 + cornerSize, -height/2 + 4);
            bg.moveTo(width/2 - 4, height/2 - cornerSize);
            bg.lineTo(width/2 - 4, height/2 - 4);
            bg.lineTo(width/2 - cornerSize, height/2 - 4);
            bg.strokePath();
            
            label.setColor(`#${color.toString(16).padStart(6, '0')}`);
            label.setFontSize('22px');
            container.setScale(1);
        });

        hitArea.on('pointerdown', () => {
            container.setScale(0.95);
        });

        hitArea.on('pointerup', () => {
            container.setScale(1.05);
            callback();
        });
    }

    /**
     * 创建粒子效果
     */
    private createParticles(): void {
        this.particleGraphics = this.add.graphics();
        
        this.time.addEvent({
            delay: 100,
            callback: () => this.updateParticles(),
            loop: true
        });
    }

    private particles: { x: number; y: number; speed: number; color: number; size: number }[] = [];

    private updateParticles(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加新粒子
        if (this.particles.length < 100 && Math.random() < 0.3) {
            const colors = [0x00ffff, 0xff00ff, 0xffff00];
            this.particles.push({
                x: Math.random() < 0.5 ? 0 : width,
                y: Phaser.Math.Between(0, height),
                speed: Phaser.Math.Between(1, 3),
                color: colors[Phaser.Math.Between(0, colors.length - 1)],
                size: Phaser.Math.Between(1, 3)
            });
        }

        // 更新粒子位置
        this.particles = this.particles.filter(p => {
            p.x += p.x < width / 2 ? p.speed : -p.speed;
            return p.x > 0 && p.x < width;
        });

        // 重绘粒子
        this.particleGraphics.clear();
        this.particles.forEach(p => {
            this.particleGraphics.fillStyle(p.color, 0.5);
            this.particleGraphics.fillCircle(p.x, p.y, p.size);
        });
    }

    /**
     * 创建扫描线效果
     */
    private createScanlines(): void {
        const scanline = this.add.graphics();
        scanline.fillStyle(0x00ffff, 0.03);
        scanline.fillRect(0, 0, this.cameras.main.width, 3);
        
        this.tweens.add({
            targets: scanline,
            y: this.cameras.main.height,
            duration: 3000,
            repeat: -1
        });
    }

    /**
     * 创建版本信息
     */
    private createVersionInfo(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const version = this.add.text(width / 2, height - 25, 'v0.1.0 // CYBERPUNK MVP BUILD', {
            fontSize: '12px',
            color: '#666688',
            fontFamily: 'Courier New, monospace'
        });
        version.setOrigin(0.5);

        // 闪烁效果
        this.tweens.add({
            targets: version,
            alpha: { from: 0.5, to: 1 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * 开始游戏
     */
    private startGame(): void {
        this.scene.start('GameScene');
    }

    /**
     * 显示设置面板
     */
    private showSettings(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        overlay.setInteractive();

        // 设置面板
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0a1a, 1);
        panel.fillRoundedRect(width/2 - 220, height/2 - 150, 440, 300, 8);
        panel.lineStyle(3, 0x00ffff, 1);
        panel.strokeRoundedRect(width/2 - 220, height/2 - 150, 440, 300, 8);

        // 标题
        const title = this.add.text(width / 2, height / 2 - 110, '// SETTINGS', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);

        // 设置选项
        const options = this.add.text(width / 2, height / 2, 
            'AUDIO: ON\n\nDIFFICULTY: NORMAL\n\nGRAPHICS: HIGH', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            lineSpacing: 5
        });
        options.setOrigin(0.5);

        // 关闭按钮
        const closeBtn = this.add.graphics();
        closeBtn.fillStyle(0xff0044, 0.3);
        closeBtn.fillRoundedRect(width/2 - 100, height/2 + 90, 200, 45, 4);
        closeBtn.lineStyle(2, 0xff0044, 1);
        closeBtn.strokeRoundedRect(width/2 - 100, height/2 + 90, 200, 45, 4);

        const closeLabel = this.add.text(width / 2, height / 2 + 112, 'CLOSE', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ff0044',
            fontFamily: 'Courier New, monospace'
        });
        closeLabel.setOrigin(0.5);

        const closeHitArea = this.add.rectangle(width / 2, height / 2 + 112, 200, 45, 0x000000, 0);
        closeHitArea.setInteractive({ useHandCursor: true });

        closeHitArea.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            options.destroy();
            closeBtn.destroy();
            closeLabel.destroy();
            closeHitArea.destroy();
        });
    }

    /**
     * 显示关于面板
     */
    private showAbout(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        overlay.setInteractive();

        // 关于面板
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0a1a, 1);
        panel.fillRoundedRect(width/2 - 250, height/2 - 170, 500, 340, 8);
        panel.lineStyle(3, 0xff00ff, 1);
        panel.strokeRoundedRect(width/2 - 250, height/2 - 170, 500, 340, 8);

        // 标题
        const title = this.add.text(width / 2, height / 2 - 130, '// ABOUT', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);

        // 描述文字
        const desc = this.add.text(width / 2, height / 2 - 20, 
            'NEON ROGUE - CYBERPUNK EDITION\n\n' +
            'WASD / Arrow Keys - Move\n' +
            'Mouse Click - Attack\n\n' +
            'Defeat enemies to gain EXP and items.\n' +
            'Survive as long as you can!\n\n' +
            'Passive skills auto-trigger in combat.', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            lineSpacing: 8
        });
        desc.setOrigin(0.5);

        // 关闭按钮
        const closeBtn = this.add.graphics();
        closeBtn.fillStyle(0xff0044, 0.3);
        closeBtn.fillRoundedRect(width/2 - 100, height/2 + 110, 200, 45, 4);
        closeBtn.lineStyle(2, 0xff0044, 1);
        closeBtn.strokeRoundedRect(width/2 - 100, height/2 + 110, 200, 45, 4);

        const closeLabel = this.add.text(width / 2, height / 2 + 132, 'CLOSE', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ff0044',
            fontFamily: 'Courier New, monospace'
        });
        closeLabel.setOrigin(0.5);

        const closeHitArea = this.add.rectangle(width / 2, height / 2 + 132, 200, 45, 0x000000, 0);
        closeHitArea.setInteractive({ useHandCursor: true });

        closeHitArea.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            desc.destroy();
            closeBtn.destroy();
            closeLabel.destroy();
            closeHitArea.destroy();
        });
    }
}
