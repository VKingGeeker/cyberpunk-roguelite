/**
 * 时空碎片实体类
 * 时间回溯系统的核心资源，击杀敌人有概率掉落
 */

import Phaser from 'phaser';
import { TIME_REWIND_CONFIG } from '../systems/TimeRewindSystem';

export default class TimeFragment extends Phaser.GameObjects.Sprite {
    private value: number;
    private glow: Phaser.GameObjects.Graphics | null = null;
    private collected: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, value: number = 1) {
        super(scene, x, y, 'time_fragment');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.value = value;
        this.collected = false;

        // 设置外观
        this.setupAppearance();

        // 添加动画效果
        this.addAnimations();
    }

    /**
     * 设置外观
     */
    private setupAppearance(): void {
        this.setScale(0.8);
        this.setDepth(100);

        // 创建发光效果
        this.glow = this.scene.add.graphics();
        this.glow.fillStyle(0x00ffff, 0.3);
        this.glow.fillCircle(0, 0, 20);
        this.glow.x = this.x;
        this.glow.y = this.y;
        this.scene.add.existing(this.glow);
    }

    /**
     * 添加动画效果
     */
    private addAnimations(): void {
        // 悬浮动画
        this.scene.tweens.add({
            targets: this,
            y: this.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 旋转动画
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });

        // 发光脉冲
        if (this.glow) {
            this.scene.tweens.add({
                targets: this.glow,
                alpha: { from: 0.3, to: 0.6 },
                scale: { from: 1, to: 1.3 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    /**
     * 获取碎片价值
     */
    public getValue(): number {
        return this.value;
    }

    /**
     * 收集碎片
     */
    public collect(): void {
        if (this.collected) return;
        this.collected = true;

        // 播放收集动画
        this.scene.tweens.add({
            targets: [this, this.glow],
            scale: 0,
            alpha: 0,
            y: this.y - 50,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                if (this.glow) this.glow.destroy();
                this.destroy();
            }
        });

        // 显示收集特效
        this.showCollectEffect();
    }

    /**
     * 显示收集特效
     */
    private showCollectEffect(): void {
        const text = this.scene.add.text(this.x, this.y - 20, `+${this.value} 时空碎片`, {
            fontSize: '16px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(200);

        this.scene.tweens.add({
            targets: text,
            y: text.y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 更新位置（跟随发光效果）
     */
    public updatePosition(): void {
        if (this.glow) {
            this.glow.x = this.x;
            this.glow.y = this.y;
        }
    }

    /**
     * 是否已被收集
     */
    public isCollected(): boolean {
        return this.collected;
    }

    /**
     * 销毁
     */
    public override destroy(): void {
        if (this.glow) {
            this.glow.destroy();
            this.glow = null;
        }
        super.destroy();
    }
}
