/**
 * 主菜单场景 - 赛博朋克风格
 * 显示游戏标题、开始按钮、设置按钮等
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';

export default class MenuScene extends Phaser.Scene {
    private particleGraphics!: Phaser.GameObjects.Graphics;
    // 游戏设置
    private soundEnabled: boolean = true;
    private difficulty: string = '普通';
    private quality: string = '高';
    // 防止设置面板关闭后立即重新打开
    private settingsPanelOpen: boolean = false;
    private canOpenSettings: boolean = true;
    
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
        const glowText = this.add.text(width / 2, height / 3 - 5, '霓虹', {
            fontSize: '100px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        glowText.setOrigin(0.5);
        glowText.setAlpha(0.3);
        glowText.setTint(0x00ffff);

        // 主标题
        const title = this.add.text(width / 2, height / 3 - 5, '霓虹', {
            fontSize: '100px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ff00ff',
            strokeThickness: 4
        });
        title.setOrigin(0.5);

        // 副标题
        const subtitle = this.add.text(width / 2, height / 3 + 70, '侠盗', {
            fontSize: '60px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace',
            stroke: '#00ffff',
            strokeThickness: 2
        });
        subtitle.setOrigin(0.5);

        // 标语
        const tagline = this.add.text(width / 2, height / 3 + 130, '// 赛博朋克版 //', {
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
            { text: '>> 开始游戏', action: () => this.startGame(), color: 0x00ffff },
            { text: '>> 联机对战', action: () => this.startMultiplayer(), color: 0xff00ff },
            { text: '>> 游戏设置', action: () => this.showSettings(), color: 0xff00ff },
            { text: '>> 关于游戏', action: () => this.showAbout(), color: 0xffff00 }
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

        hitArea.on('pointerup', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
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

    private particles: { x: number; y: number; vx: number; vy: number; color: number; size: number; alpha: number; life: number }[] = [];

    private updateParticles(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加新粒子 - 随机位置生成
        if (this.particles.length < 80 && Math.random() < 0.4) {
            const colors = [0x00ffff, 0xff00ff, 0xffff00, 0xff6600];
            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(1, 3);
            this.particles.push({
                x: Phaser.Math.Between(0, width),
                y: Phaser.Math.Between(0, height),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Phaser.Math.Between(0, colors.length - 1)],
                size: Phaser.Math.Between(1, 3),
                alpha: 0.5,
                life: Phaser.Math.Between(100, 300)
            });
        }

        // 更新粒子位置
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = Math.max(0.1, p.life / 200);
            return p.life > 0 && p.x > 0 && p.x < width && p.y > 0 && p.y < height;
        });

        // 重绘粒子
        this.particleGraphics.clear();
        this.particles.forEach(p => {
            this.particleGraphics.fillStyle(p.color, p.alpha);
            this.particleGraphics.fillCircle(p.x, p.y, p.size);
            // 添加拖尾效果
            this.particleGraphics.fillStyle(p.color, p.alpha * 0.3);
            this.particleGraphics.fillCircle(p.x - p.vx * 2, p.y - p.vy * 2, p.size * 0.8);
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

        const version = this.add.text(width / 2, height - 25, 'v0.1.0 // 赛博朋克测试版', {
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
        // 跳转到职业选择场景，明确传递单机模式
        this.scene.start('ClassSelectScene', { multiplayer: false });
    }

    /**
     * 开始联机游戏
     */
    private startMultiplayer(): void {
        // 跳转到职业选择场景，并标记为联机模式
        this.scene.start('ClassSelectScene', { multiplayer: true });
    }

    /**
     * 显示消息
     */
    private showMessage(text: string, color: number): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const msg = this.add.text(width / 2, height - 100, text, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 30,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    /**
     * 显示设置面板
     */
    private showSettings(): void {
        // 防止重复打开
        if (this.settingsPanelOpen || !this.canOpenSettings) return;
        this.settingsPanelOpen = true;
        this.canOpenSettings = false;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 半透明背景
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        overlay.setInteractive();

        // 设置面板
        const panel = this.add.graphics();
        panel.fillStyle(0x0a0a1a, 1);
        panel.fillRoundedRect(width/2 - 220, height/2 - 180, 440, 360, 8);
        panel.lineStyle(3, 0x00ffff, 1);
        panel.strokeRoundedRect(width/2 - 220, height/2 - 180, 440, 360, 8);

        // 标题
        const title = this.add.text(width / 2, height / 2 - 140, '// 游戏设置', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);

        // 存储所有需要销毁的元素
        const elementsToDestroy: Phaser.GameObjects.GameObject[] = [overlay, panel, title];

        // --- 音效开关 ---
        const soundLabel = this.add.text(width / 2 - 180, height / 2 - 70, '音效:', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        elementsToDestroy.push(soundLabel);

        const soundBtn = this.createToggleButton(
            width / 2 + 50, height / 2 - 60, 140, 36,
            () => this.soundEnabled ? '开启' : '关闭',
            () => {
                this.soundEnabled = !this.soundEnabled;
                updateSoundBtn();
            },
            0x00ffff
        );
        elementsToDestroy.push(...soundBtn.elements);

        const updateSoundBtn = () => {
            soundBtn.label.setText(this.soundEnabled ? '开启' : '关闭');
            soundBtn.label.setColor(this.soundEnabled ? '#00ff00' : '#ff4444');
        };
        updateSoundBtn();

        // --- 难度选择 ---
        const diffLabel = this.add.text(width / 2 - 180, height / 2, '难度:', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        elementsToDestroy.push(diffLabel);

        const difficulties = ['简单', '普通', '困难'];
        const diffButtons: { btn: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }[] = [];

        difficulties.forEach((diff, index) => {
            const x = width / 2 - 80 + index * 90;
            const btn = this.createOptionButton(
                x, height / 2 + 10, 80, 32,
                diff,
                () => {
                    this.difficulty = diff;
                    updateDiffButtons();
                },
                0xff00ff
            );
            diffButtons.push(btn);
            elementsToDestroy.push(btn.btn, btn.label);
        });

        const updateDiffButtons = () => {
            diffButtons.forEach((item, index) => {
                const isSelected = difficulties[index] === this.difficulty;
                item.label.setColor(isSelected ? '#ffffff' : '#888888');
                // 重绘按钮背景
                item.btn.clear();
                item.btn.fillStyle(isSelected ? 0xff00ff : 0x1a1a2a, isSelected ? 0.8 : 0.5);
                item.btn.fillRoundedRect(-40, -16, 80, 32, 4);
                item.btn.lineStyle(2, 0xff00ff, isSelected ? 1 : 0.5);
                item.btn.strokeRoundedRect(-40, -16, 80, 32, 4);
            });
        };
        updateDiffButtons();

        // --- 画质选择 ---
        const qualLabel = this.add.text(width / 2 - 180, height / 2 + 70, '画质:', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        elementsToDestroy.push(qualLabel);

        const qualities = ['低', '中', '高'];
        const qualButtons: { btn: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }[] = [];

        qualities.forEach((qual, index) => {
            const x = width / 2 - 80 + index * 90;
            const btn = this.createOptionButton(
                x, height / 2 + 80, 80, 32,
                qual,
                () => {
                    this.quality = qual;
                    updateQualButtons();
                },
                0xffff00
            );
            qualButtons.push(btn);
            elementsToDestroy.push(btn.btn, btn.label);
        });

        const updateQualButtons = () => {
            qualButtons.forEach((item, index) => {
                const isSelected = qualities[index] === this.quality;
                item.label.setColor(isSelected ? '#ffffff' : '#888888');
                // 重绘按钮背景
                item.btn.clear();
                item.btn.fillStyle(isSelected ? 0xffff00 : 0x1a1a2a, isSelected ? 0.8 : 0.5);
                item.btn.fillRoundedRect(-40, -16, 80, 32, 4);
                item.btn.lineStyle(2, 0xffff00, isSelected ? 1 : 0.5);
                item.btn.strokeRoundedRect(-40, -16, 80, 32, 4);
            });
        };
        updateQualButtons();

        // --- 保存按钮 ---
        const saveBtn = this.add.graphics();
        saveBtn.fillStyle(0x00ff88, 0.3);
        saveBtn.fillRoundedRect(width/2 - 160, height/2 + 120, 140, 45, 4);
        saveBtn.lineStyle(2, 0x00ff88, 1);
        saveBtn.strokeRoundedRect(width/2 - 160, height/2 + 120, 140, 45, 4);
        elementsToDestroy.push(saveBtn);

        const saveLabel = this.add.text(width/2 - 90, height / 2 + 142, '保存', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#00ff88',
            fontFamily: 'Courier New, monospace'
        });
        saveLabel.setOrigin(0.5);
        elementsToDestroy.push(saveLabel);

        const saveHitArea = this.add.rectangle(width/2 - 90, height / 2 + 142, 140, 45, 0x000000, 0);
        saveHitArea.setInteractive({ useHandCursor: true });
        elementsToDestroy.push(saveHitArea);

        saveHitArea.on('pointerover', () => {
            saveBtn.clear();
            saveBtn.fillStyle(0x00ff88, 0.5);
            saveBtn.fillRoundedRect(width/2 - 160, height/2 + 120, 140, 45, 4);
            saveBtn.lineStyle(3, 0x00ff88, 1);
            saveBtn.strokeRoundedRect(width/2 - 160, height/2 + 120, 140, 45, 4);
            saveLabel.setColor('#ffffff');
        });

        saveHitArea.on('pointerout', () => {
            saveBtn.clear();
            saveBtn.fillStyle(0x00ff88, 0.3);
            saveBtn.fillRoundedRect(width/2 - 160, height/2 + 120, 140, 45, 4);
            saveBtn.lineStyle(2, 0x00ff88, 1);
            saveBtn.strokeRoundedRect(width/2 - 160, height/2 + 120, 140, 45, 4);
            saveLabel.setColor('#00ff88');
        });

        saveHitArea.on('pointerdown', () => {
            this.saveSettings();
            this.showMessage('设置已保存!', 0x00ff88);
        });

        // --- 关闭按钮 ---
        const closeBtn = this.add.graphics();
        closeBtn.fillStyle(0xff0044, 0.3);
        closeBtn.fillRoundedRect(width/2 + 20, height/2 + 120, 140, 45, 4);
        closeBtn.lineStyle(2, 0xff0044, 1);
        closeBtn.strokeRoundedRect(width/2 + 20, height/2 + 120, 140, 45, 4);
        elementsToDestroy.push(closeBtn);

        const closeLabel = this.add.text(width/2 + 90, height / 2 + 142, '关闭', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ff0044',
            fontFamily: 'Courier New, monospace'
        });
        closeLabel.setOrigin(0.5);
        elementsToDestroy.push(closeLabel);

        const closeHitArea = this.add.rectangle(width/2 + 90, height / 2 + 142, 140, 45, 0x000000, 0);
        closeHitArea.setInteractive({ useHandCursor: true });
        elementsToDestroy.push(closeHitArea);

        closeHitArea.on('pointerover', () => {
            closeBtn.clear();
            closeBtn.fillStyle(0xff0044, 0.5);
            closeBtn.fillRoundedRect(width/2 + 20, height/2 + 120, 140, 45, 4);
            closeBtn.lineStyle(3, 0xff0044, 1);
            closeBtn.strokeRoundedRect(width/2 + 20, height/2 + 120, 140, 45, 4);
            closeLabel.setColor('#ffffff');
        });

        closeHitArea.on('pointerout', () => {
            closeBtn.clear();
            closeBtn.fillStyle(0xff0044, 0.3);
            closeBtn.fillRoundedRect(width/2 + 20, height/2 + 120, 140, 45, 4);
            closeBtn.lineStyle(2, 0xff0044, 1);
            closeBtn.strokeRoundedRect(width/2 + 20, height/2 + 120, 140, 45, 4);
            closeLabel.setColor('#ff0044');
        });

        closeHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            elementsToDestroy.forEach(el => el.destroy());
            this.settingsPanelOpen = false;
            // 延迟恢复可打开状态，防止立即重新打开
            this.time.delayedCall(300, () => {
                this.canOpenSettings = true;
            });
        });
    }

    /**
     * 创建切换按钮
     */
    private createToggleButton(
        x: number, y: number, width: number, height: number,
        getText: () => string, callback: () => void, color: number
    ): { elements: Phaser.GameObjects.GameObject[]; label: Phaser.GameObjects.Text } {
        const btn = this.add.graphics();
        btn.fillStyle(0x1a1a2a, 0.8);
        btn.fillRoundedRect(x - width/2, y - height/2, width, height, 4);
        btn.lineStyle(2, color, 0.8);
        btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 4);

        const label = this.add.text(x, y, getText(), {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#00ff00',
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            btn.clear();
            btn.fillStyle(color, 0.3);
            btn.fillRoundedRect(x - width/2, y - height/2, width, height, 4);
            btn.lineStyle(3, color, 1);
            btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 4);
        });

        hitArea.on('pointerout', () => {
            btn.clear();
            btn.fillStyle(0x1a1a2a, 0.8);
            btn.fillRoundedRect(x - width/2, y - height/2, width, height, 4);
            btn.lineStyle(2, color, 0.8);
            btn.strokeRoundedRect(x - width/2, y - height/2, width, height, 4);
        });

        hitArea.on('pointerdown', () => {
            callback();
        });

        return { elements: [btn, label, hitArea], label };
    }

    /**
     * 创建选项按钮
     */
    private createOptionButton(
        x: number, y: number, width: number, height: number,
        text: string, callback: () => void, color: number
    ): { btn: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text } {
        const btn = this.add.graphics();
        btn.fillStyle(0x1a1a2a, 0.5);
        btn.fillRoundedRect(-width/2, -height/2, width, height, 4);
        btn.lineStyle(2, color, 0.5);
        btn.strokeRoundedRect(-width/2, -height/2, width, height, 4);
        btn.setPosition(x, y);

        const label = this.add.text(x, y, text, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            btn.clear();
            btn.fillStyle(color, 0.3);
            btn.fillRoundedRect(-width/2, -height/2, width, height, 4);
            btn.lineStyle(2, color, 1);
            btn.strokeRoundedRect(-width/2, -height/2, width, height, 4);
        });

        hitArea.on('pointerout', () => {
            callback(); // 触发更新以恢复正确状态
        });

        hitArea.on('pointerdown', () => {
            callback();
        });

        return { btn, label };
    }

    /**
     * 保存设置
     */
    private saveSettings(): void {
        // 这里可以将设置保存到本地存储或游戏配置中
        localStorage.setItem('gameSettings', JSON.stringify({
            soundEnabled: this.soundEnabled,
            difficulty: this.difficulty,
            quality: this.quality
        }));
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
        const title = this.add.text(width / 2, height / 2 - 130, '// 关于游戏', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);

        // 描述文字
        const desc = this.add.text(width / 2, height / 2 - 20, 
            '霓虹侠盗 - 赛博朋克版\n\n' +
            'WASD / 方向键 - 移动\n' +
            '鼠标点击 - 攻击\n\n' +
            '击败敌人获得经验和道具。\n' +
            '尽可能存活更长时间！\n\n' +
            '被动技能在战斗中自动触发。', {
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

        const closeLabel = this.add.text(width / 2, height / 2 + 132, '关闭', {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ff0044',
            fontFamily: 'Courier New, monospace'
        });
        closeLabel.setOrigin(0.5);

        const closeHitArea = this.add.rectangle(width / 2, height / 2 + 132, 200, 45, 0x000000, 0);
        closeHitArea.setInteractive({ useHandCursor: true });

        // 存储所有需要销毁的元素
        const elementsToDestroy: Phaser.GameObjects.GameObject[] = [overlay, panel, title, desc, closeBtn, closeLabel, closeHitArea];

        // 使用 pointerdown 事件而不是 pointerup，防止误触
        closeHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            // 阻止事件冒泡
            event.stopPropagation();
            // 销毁所有元素
            elementsToDestroy.forEach(el => el.destroy());
        });

        // 阻止背景点击事件冒泡
        overlay.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
        });
    }
}
