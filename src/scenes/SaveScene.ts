/**
 * 存档界面场景
 * 提供保存、加载、删除存档功能
 */

import Phaser from 'phaser';
import { SaveSystem, SaveSlot } from '../systems/SaveSystem';
import Player from '../entities/Player';

export default class SaveScene extends Phaser.Scene {
    private player!: Player;
    private slots: SaveSlot[] = [];
    private selectedIndex: number = 0;
    private mode: 'save' | 'load' = 'save';
    private titleText!: Phaser.GameObjects.Text;
    private slotButtons: Phaser.GameObjects.Container[] = [];

    constructor() {
        super({ key: 'SaveScene', active: false });
    }

    /**
     * 初始化场景
     */
    init(data: { player: Player; mode: 'save' | 'load' }): void {
        this.player = data.player;
        this.mode = data.mode || 'save';
    }

    /**
     * 创建场景
     */
    create(): void {
        // 获取存档槽位信息
        this.slots = SaveSystem.getAllSlots();

        // 创建半透明背景
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85);

        // 创建标题
        this.titleText = this.add.text(640, 60, 
            this.mode === 'save' ? '保存游戏' : '加载游戏', {
            fontSize: '36px',
            color: '#00ffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 创建槽位按钮
        this.createSlotButtons();

        // 创建底部按钮
        this.createBottomButtons();

        // 添加键盘控制
        this.setupKeyboardControls();
    }

    /**
     * 创建槽位按钮
     */
    private createSlotButtons(): void {
        const startY = 150;
        const slotHeight = 150;
        const slotWidth = 800;

        this.slots.forEach((slot, index) => {
            const container = this.add.container(640, startY + index * (slotHeight + 20));

            // 槽位背景
            const bg = this.add.rectangle(0, 0, slotWidth, slotHeight, 0x1a1a2e, 1)
                .setStrokeStyle(2, 0x00ffff);

            // 槽位编号
            const slotNumber = this.add.text(-slotWidth/2 + 30, 0, `槽位 ${index + 1}`, {
                fontSize: '24px',
                color: '#00ffff',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);

            // 存档信息
            let infoText: Phaser.GameObjects.Text;
            if (slot.isEmpty) {
                infoText = this.add.text(0, -20, '空', {
                    fontSize: '20px',
                    color: '#666666',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            } else {
                const data = slot.data!;
                infoText = this.add.text(0, -30, 
                    `等级: ${data.player.level} | 击杀: ${data.player.killCount} | 游戏时间: ${this.formatGameTime(data.gameTime)}`, {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);

                const timeText = this.add.text(0, 10, 
                    `保存时间: ${slot.lastSaved}`, {
                    fontSize: '14px',
                    color: '#888888',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                container.add(timeText);
            }

            // 操作提示
            const actionText = this.add.text(slotWidth/2 - 30, 0, 
                this.mode === 'save' ? '保存' : '加载', {
                fontSize: '18px',
                color: '#00ff00',
                fontFamily: 'Arial'
            }).setOrigin(1, 0.5);

            container.add([bg, slotNumber, infoText, actionText]);

            // 添加交互
            bg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    bg.setStrokeStyle(3, 0x00ffff);
                    this.selectedIndex = index;
                    this.updateSelection();
                })
                .on('pointerout', () => {
                    bg.setStrokeStyle(2, 0x00ffff);
                })
                .on('pointerdown', () => {
                    this.handleSlotSelect(index);
                });

            this.slotButtons.push(container);
        });

        // 默认选中第一个
        this.updateSelection();
    }

    /**
     * 创建底部按钮
     */
    private createBottomButtons(): void {
        // 返回按钮
        const backBtn = this.add.text(640, 650, '返回游戏 (ESC)', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerover', () => backBtn.setColor('#00ffff'))
          .on('pointerout', () => backBtn.setColor('#ffffff'))
          .on('pointerdown', () => this.closeScene());

        // 删除存档按钮（仅在加载模式显示）
        if (this.mode === 'load' && this.slots.some(s => !s.isEmpty)) {
            const deleteBtn = this.add.text(940, 650, '删除存档', {
                fontSize: '20px',
                color: '#ff4444',
                fontFamily: 'Arial',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5)
              .setInteractive({ useHandCursor: true })
              .on('pointerover', () => deleteBtn.setColor('#ff6666'))
              .on('pointerout', () => deleteBtn.setColor('#ff4444'))
              .on('pointerdown', () => this.handleDelete());
        }
    }

    /**
     * 设置键盘控制
     */
    private setupKeyboardControls(): void {
        // ESC 关闭
        this.input.keyboard!.on('keydown-ESC', () => {
            this.closeScene();
        });

        // 上下选择
        this.input.keyboard!.on('keydown-UP', () => {
            this.selectedIndex = (this.selectedIndex - 1 + 3) % 3;
            this.updateSelection();
        });

        this.input.keyboard!.on('keydown-DOWN', () => {
            this.selectedIndex = (this.selectedIndex + 1) % 3;
            this.updateSelection();
        });

        // 回车确认
        this.input.keyboard!.on('keydown-ENTER', () => {
            this.handleSlotSelect(this.selectedIndex);
        });

        // 数字键快速选择
        this.input.keyboard!.on('keydown-ONE', () => this.handleSlotSelect(0));
        this.input.keyboard!.on('keydown-TWO', () => this.handleSlotSelect(1));
        this.input.keyboard!.on('keydown-THREE', () => this.handleSlotSelect(2));
    }

    /**
     * 更新选中状态
     */
    private updateSelection(): void {
        this.slotButtons.forEach((container, index) => {
            const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
            if (index === this.selectedIndex) {
                bg.setStrokeStyle(3, 0x00ff00);
            } else {
                bg.setStrokeStyle(2, 0x00ffff);
            }
        });
    }

    /**
     * 处理槽位选择
     */
    private handleSlotSelect(slotId: number): void {
        if (this.mode === 'save') {
            this.saveGame(slotId);
        } else {
            this.loadGame(slotId);
        }
    }

    /**
     * 保存游戏
     */
    private saveGame(slotId: number): void {
        const playerStats = this.player.getStats();
        const playerData = this.player.getSaveData();

        const saveData = {
            version: '1.0.0',
            timestamp: Date.now(),
            player: playerData,
            stats: {
                attack: playerStats.attack,
                defense: playerStats.defense,
                attackSpeed: playerStats.attackSpeed,
                critRate: playerStats.critRate,
                critDamage: playerStats.critDamage,
                moveSpeed: playerStats.moveSpeed
            },
            gameTime: this.scene.get('GameScene').data.get('gameTime') || 0
        };

        const success = SaveSystem.save(slotId, saveData as any);
        
        if (success) {
            this.showMessage('保存成功！', '#00ff00');
            // 刷新槽位信息
            this.slots = SaveSystem.getAllSlots();
            this.scene.restart({ player: this.player, mode: this.mode });
        } else {
            this.showMessage('保存失败！', '#ff0000');
        }
    }

    /**
     * 加载游戏
     */
    private loadGame(slotId: number): void {
        const data = SaveSystem.load(slotId);
        
        if (!data) {
            this.showMessage('该槽位没有存档！', '#ff0000');
            return;
        }

        // 应用存档数据到玩家
        this.player.loadSaveData(data);
        
        this.showMessage('加载成功！', '#00ff00');
        
        // 关闭存档界面并返回游戏
        this.time.delayedCall(500, () => {
            this.closeScene();
        });
    }

    /**
     * 删除存档
     */
    private handleDelete(): void {
        if (this.slots[this.selectedIndex].isEmpty) {
            this.showMessage('该槽位没有存档！', '#ff0000');
            return;
        }

        SaveSystem.delete(this.selectedIndex);
        this.showMessage('存档已删除！', '#ffff00');
        
        // 刷新槽位信息
        this.slots = SaveSystem.getAllSlots();
        this.scene.restart({ player: this.player, mode: this.mode });
    }

    /**
     * 显示消息
     */
    private showMessage(text: string, color: string): void {
        const msg = this.add.text(640, 360, text, {
            fontSize: '32px',
            color: color,
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: 300,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    /**
     * 关闭场景
     */
    private closeScene(): void {
        this.scene.stop();
        this.scene.resume('GameScene');
    }

    /**
     * 格式化游戏时间
     */
    private formatGameTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}
