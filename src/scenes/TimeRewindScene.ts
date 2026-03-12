/**
 * 时间回溯场景
 * 显示时间快照列表，允许玩家选择回溯
 */

import Phaser from 'phaser';
import Player from '../entities/Player';
import { TimeRewindSystem, TimeSnapshot, TIME_REWIND_CONFIG } from '../systems/TimeRewindSystem';

interface TimeRewindSceneData {
    player: Player;
    timeRewindSystem: TimeRewindSystem;
}

export default class TimeRewindScene extends Phaser.Scene {
    private player!: Player;
    private timeRewindSystem!: TimeRewindSystem;
    private container: Phaser.GameObjects.Container | null = null;
    private selectedIndex: number = 0;
    private snapshots: TimeSnapshot[] = [];

    constructor() {
        super({ key: 'TimeRewindScene' });
    }

    create(data: TimeRewindSceneData): void {
        this.player = data.player;
        this.timeRewindSystem = data.timeRewindSystem;
        this.snapshots = this.timeRewindSystem.getSnapshots();
        this.selectedIndex = 0;

        // 暂停游戏场景
        this.scene.pause('GameScene');

        // 创建UI
        this.createUI();

        // 监听键盘
        this.setupKeyboardInput();
    }

    /**
     * 创建UI
     */
    private createUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.container = this.add.container(0, 0);

        // 半透明背景
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
        this.container.add(overlay);

        // 标题
        const title = this.add.text(width / 2, 60, '⏱ 时间回溯', {
            fontSize: '36px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            stroke: '#ff00ff',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.container.add(title);

        // 时空碎片显示
        const fragments = this.timeRewindSystem.getTimeFragments();
        const fragmentText = this.add.text(width / 2, 110, `时空碎片: ${fragments}`, {
            fontSize: '20px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        }).setOrigin(0.5);
        this.container.add(fragmentText);

        // 惩罚提示
        const penalty = TIME_REWIND_CONFIG.rewindPenalty;
        const penaltyText = this.add.text(width / 2, 140, 
            `回溯消耗: ${penalty.timeFragmentCost} 碎片 | HP -${penalty.hpLossPercent}% | 经验 -${penalty.experienceLossPercent}%`, {
            fontSize: '14px',
            color: '#ff6600',
            fontFamily: 'Courier New, monospace'
        }).setOrigin(0.5);
        this.container.add(penaltyText);

        // 快照列表
        if (this.snapshots.length === 0) {
            const noData = this.add.text(width / 2, height / 2, '暂无时间快照', {
                fontSize: '24px',
                color: '#666666',
                fontFamily: 'Courier New, monospace'
            }).setOrigin(0.5);
            this.container.add(noData);
        } else {
            this.createSnapshotList();
        }

        // 操作提示
        const hint = this.add.text(width / 2, height - 60, 
            '↑↓ 选择 | Enter 确认 | Esc 取消', {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        }).setOrigin(0.5);
        this.container.add(hint);

        // 关闭按钮
        const closeBtn = this.add.text(width - 80, 30, '[X] 关闭', {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#1a1a2e',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeBtn.on('pointerover', () => closeBtn.setColor('#ff6600'));
        closeBtn.on('pointerout', () => closeBtn.setColor('#888888'));
        closeBtn.on('pointerdown', () => this.closeScene());
        this.container.add(closeBtn);
    }

    /**
     * 创建快照列表
     */
    private createSnapshotList(): void {
        const width = this.cameras.main.width;
        const startY = 180;
        const itemHeight = 100;
        const maxVisible = 4;

        for (let i = 0; i < Math.min(this.snapshots.length, maxVisible); i++) {
            const snapshot = this.snapshots[i];
            const y = startY + i * (itemHeight + 10);
            
            this.createSnapshotItem(snapshot, i, width / 2, y);
        }
    }

    /**
     * 创建单个快照项
     */
    private createSnapshotItem(snapshot: TimeSnapshot, index: number, x: number, y: number): void {
        const itemWidth = 500;
        const itemHeight = 90;
        const isSelected = index === this.selectedIndex;
        const canRewind = this.timeRewindSystem.canRewind();

        // 背景
        const bg = this.add.rectangle(x, y, itemWidth, itemHeight, 
            isSelected ? 0x1a2a3a : 0x0a0a1a, 0.9);
        bg.setStrokeStyle(isSelected ? 3 : 1, isSelected ? 0x00ffff : 0x333333);
        
        if (isSelected && canRewind) {
            bg.setInteractive({ useHandCursor: true });
            bg.on('pointerdown', () => this.selectSnapshot(index));
        }
        this.container!.add(bg);

        // 时间标签
        const label = this.add.text(x - 220, y - 30, snapshot.metadata.label, {
            fontSize: '20px',
            color: isSelected ? '#00ffff' : '#ffffff',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold'
        });
        this.container!.add(label);

        // 检查点标记
        if (snapshot.metadata.isCheckpoint) {
            const checkpoint = this.add.text(x + 180, y - 30, '⭐ 检查点', {
                fontSize: '14px',
                color: '#ffaa00',
                fontFamily: 'Courier New, monospace'
            });
            this.container!.add(checkpoint);
        }

        // 玩家状态
        const stats = snapshot.playerData;
        const statsText = this.add.text(x - 220, y, 
            `HP: ${stats.hp}/${stats.maxHp}  Lv.${stats.level}  击杀: ${stats.killCount}`, {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        this.container!.add(statsText);

        // 武器和技能
        const skillsText = this.add.text(x - 220, y + 25, 
            `武器: ${stats.weapons.length}  技能: ${stats.skills.length}`, {
            fontSize: '14px',
            color: '#666666',
            fontFamily: 'Courier New, monospace'
        });
        this.container!.add(skillsText);

        // 选中指示
        if (isSelected) {
            const arrow = this.add.text(x - 250, y, '▶', {
                fontSize: '24px',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace'
            });
            this.container!.add(arrow);
        }
    }

    /**
     * 设置键盘输入
     */
    private setupKeyboardInput(): void {
        // 上键
        this.input.keyboard!.on('keydown-UP', () => {
            if (this.snapshots.length === 0) return;
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.refreshUI();
        });

        // 下键
        this.input.keyboard!.on('keydown-DOWN', () => {
            if (this.snapshots.length === 0) return;
            this.selectedIndex = Math.min(this.snapshots.length - 1, this.selectedIndex + 1);
            this.refreshUI();
        });

        // Enter确认
        this.input.keyboard!.on('keydown-ENTER', () => {
            this.confirmRewind();
        });

        // Esc取消
        this.input.keyboard!.on('keydown-ESC', () => {
            this.closeScene();
        });
    }

    /**
     * 选择快照
     */
    private selectSnapshot(index: number): void {
        this.selectedIndex = index;
        this.refreshUI();
    }

    /**
     * 确认回溯
     */
    private confirmRewind(): void {
        if (this.snapshots.length === 0) {
            this.showMessage('没有可用的快照', '#ff0000');
            return;
        }

        if (!this.timeRewindSystem.canRewind()) {
            this.showMessage('时空碎片不足', '#ff0000');
            return;
        }

        const snapshot = this.snapshots[this.selectedIndex];
        if (!snapshot) return;

        // 执行回溯
        const result = this.timeRewindSystem.rewind(snapshot.id);
        if (result) {
            // 应用惩罚（使用深拷贝避免修改原始快照）
            const penalizedData = this.timeRewindSystem.applyPenalty(JSON.parse(JSON.stringify(result.playerData)));
            
            // 通知游戏场景应用回溯数据
            this.scene.get('GameScene').events.emit('time-rewind', {
                snapshot: { ...result, playerData: penalizedData }
            });

            // 恢复游戏场景的物理引擎
            const gameScene = this.scene.get('GameScene') as any;
            if (gameScene && gameScene.physics) {
                gameScene.physics.resume();
            }

            // 恢复游戏场景（重要：确保GameScene的update循环恢复执行）
            this.scene.resume('GameScene');

            // 立即关闭场景，让 GameScene 接管恢复流程
            this.scene.stop();
        }
    }

    /**
     * 显示消息
     */
    private showMessage(text: string, color: string): void {
        const msg = this.add.text(this.cameras.main.width / 2, 
            this.cameras.main.height - 120, text, {
            fontSize: '18px',
            color: color,
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#000000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(100);
        
        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 30,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    /**
     * 刷新UI
     */
    private refreshUI(): void {
        if (this.container) {
            this.container.destroy();
        }
        this.createUI();
    }

    /**
     * 关闭场景
     */
    private closeScene(): void {
        // 恢复游戏场景的物理引擎
        const gameScene = this.scene.get('GameScene') as any;
        if (gameScene && gameScene.physics) {
            gameScene.physics.resume();
        }
        
        // 恢复游戏场景
        this.scene.resume('GameScene');
        this.scene.stop();
    }

    /**
     * 场景关闭时的清理
     */
    shutdown(): void {
        // 清理键盘事件监听
        if (this.input.keyboard) {
            this.input.keyboard.off('keydown-UP');
            this.input.keyboard.off('keydown-DOWN');
            this.input.keyboard.off('keydown-ENTER');
            this.input.keyboard.off('keydown-ESC');
        }
        
        // 清理容器
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        // 清理快照引用
        this.snapshots = [];
    }
}
