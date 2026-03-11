/**
 * 教程引导系统
 * 为新玩家提供游戏操作引导
 */

import Phaser from 'phaser';

export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    highlight?: { x: number; y: number; width: number; height: number };
    arrow?: { x: number; y: number; direction: 'up' | 'down' | 'left' | 'right' };
    waitFor?: 'click' | 'key' | 'action';
    actionKey?: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        title: '欢迎来到赛博朋克肉鸽游戏',
        description: '这是一个充满霓虹灯光和激烈战斗的世界。\n让我们一起学习基本操作！',
        waitFor: 'click'
    },
    {
        id: 'move',
        title: '移动',
        description: '使用 WASD 或 方向键 移动角色\n试着走动一下！',
        waitFor: 'action',
        actionKey: 'WASD'
    },
    {
        id: 'attack',
        title: '攻击',
        description: '点击 鼠标左键 进行攻击\n消灭敌人获得经验值！',
        waitFor: 'action',
        actionKey: 'attack'
    },
    {
        id: 'skills',
        title: '被动技能',
        description: '技能会自动释放，无需手动操作\n升级时可以选择新技能或升级已有技能',
        waitFor: 'click'
    },
    {
        id: 'weapons',
        title: '武器系统',
        description: '按 1/2/3 切换武器槽位\n按 Q 循环切换武器\n不同武器有不同的属性加成！',
        waitFor: 'click'
    },
    {
        id: 'crafting',
        title: '合成系统',
        description: '按 C 打开合成界面\n可以将低级武器合成为高级武器',
        waitFor: 'click'
    },
    {
        id: 'save',
        title: '存档系统',
        description: 'F5 - 快速保存\nF9 - 快速加载\nCtrl+S - 打开存档界面',
        waitFor: 'click'
    },
    {
        id: 'complete',
        title: '教程完成！',
        description: '现在你已经掌握了基本操作\n祝你在赛博朋克世界中玩得愉快！',
        waitFor: 'click'
    }
];

/**
 * 教程管理类
 */
export class TutorialSystem {
    private scene: Phaser.Scene;
    private currentStep: number = 0;
    private isActive: boolean = false;
    private container: Phaser.GameObjects.Container | null = null;
    private overlay: Phaser.GameObjects.Rectangle | null = null;
    private highlight: Phaser.GameObjects.Rectangle | null = null;
    private arrow: Phaser.GameObjects.Graphics | null = null;
    private onProgress: ((step: number, total: number) => void) | null = null;
    private onComplete: (() => void) | null = null;

    // 存储教程完成状态
    private static readonly TUTORIAL_KEY = 'cyberpunk_tutorial_completed';

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 检查是否已完成教程
     */
    public static isCompleted(): boolean {
        return localStorage.getItem(this.TUTORIAL_KEY) === 'true';
    }

    /**
     * 标记教程完成
     */
    public static markCompleted(): void {
        localStorage.setItem(this.TUTORIAL_KEY, 'true');
    }

    /**
     * 重置教程状态
     */
    public static reset(): void {
        localStorage.removeItem(this.TUTORIAL_KEY);
    }

    /**
     * 开始教程
     */
    public start(onProgress?: (step: number, total: number) => void, onComplete?: () => void): void {
        if (TutorialSystem.isCompleted()) {
            console.log('[Tutorial] 教程已完成，跳过');
            if (onComplete) onComplete();
            return;
        }

        this.currentStep = 0;
        this.isActive = true;
        this.onProgress = onProgress;
        this.onComplete = onComplete;

        this.showStep(this.currentStep);
        console.log('[Tutorial] 教程开始');
    }

    /**
     * 显示指定步骤
     */
    private showStep(index: number): void {
        if (index >= TUTORIAL_STEPS.length) {
            this.complete();
            return;
        }

        const step = TUTORIAL_STEPS[index];

        // 清除之前的UI
        this.clearUI();

        // 创建容器
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(3000);

        // 创建半透明遮罩
        this.overlay = this.scene.add.rectangle(
            this.scene.cameras.main.scrollX + 640,
            this.scene.cameras.main.scrollY + 360,
            1280, 720,
            0x000000, 0.7
        );
        this.container.add(this.overlay);

        // 创建高亮区域
        if (step.highlight) {
            this.highlight = this.scene.add.rectangle(
                step.highlight.x,
                step.highlight.y,
                step.highlight.width,
                step.highlight.height,
                0xffffff, 0.1
            );
            this.highlight.setStrokeStyle(3, 0x00ffff);
            this.container.add(this.highlight);
        }

        // 创建箭头
        if (step.arrow) {
            this.arrow = this.createArrow(step.arrow.x, step.arrow.y, step.arrow.direction);
            this.container.add(this.arrow);
        }

        // 创建对话框
        const dialogWidth = 500;
        const dialogHeight = 180;
        const dialogX = this.scene.cameras.main.scrollX + 640;
        const dialogY = this.scene.cameras.main.scrollY + 550;

        const dialog = this.scene.add.rectangle(dialogX, dialogY, dialogWidth, dialogHeight, 0x1a1a2e, 1);
        dialog.setStrokeStyle(2, 0x00ffff);
        this.container.add(dialog);

        // 标题
        const title = this.scene.add.text(dialogX, dialogY - 60, step.title, {
            fontSize: '24px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);

        // 描述
        const desc = this.scene.add.text(dialogX, dialogY, step.description, {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);
        this.container.add(desc);

        // 步骤指示
        const stepText = this.scene.add.text(dialogX, dialogY + 70, 
            `${index + 1} / ${TUTORIAL_STEPS.length}`, {
            fontSize: '14px',
            color: '#666666',
            fontFamily: 'Courier New, monospace'
        }).setOrigin(0.5);
        this.container.add(stepText);

        // 提示文字
        let hint = '';
        switch (step.waitFor) {
            case 'click':
                hint = '点击继续';
                break;
            case 'key':
                hint = `按下 ${step.actionKey} 继续`;
                break;
            case 'action':
                hint = '完成操作后继续';
                break;
        }
        
        const hintText = this.scene.add.text(dialogX + 180, dialogY + 70, hint, {
            fontSize: '14px',
            color: '#ffff00',
            fontFamily: 'Courier New, monospace'
        }).setOrigin(0.5);
        this.container.add(hintText);

        // 添加交互
        if (step.waitFor === 'click') {
            this.overlay.setInteractive();
            this.overlay.on('pointerdown', () => this.nextStep());
        }

        // 通知进度
        if (this.onProgress) {
            this.onProgress(index, TUTORIAL_STEPS.length);
        }
    }

    /**
     * 创建箭头
     */
    private createArrow(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right'): Phaser.GameObjects.Graphics {
        const arrow = this.scene.add.graphics();
        arrow.fillStyle(0x00ffff, 1);

        const size = 20;
        switch (direction) {
            case 'up':
                arrow.fillTriangle(x, y - size, x - size, y + size, x + size, y + size);
                break;
            case 'down':
                arrow.fillTriangle(x, y + size, x - size, y - size, x + size, y - size);
                break;
            case 'left':
                arrow.fillTriangle(x - size, y, x + size, y - size, x + size, y + size);
                break;
            case 'right':
                arrow.fillTriangle(x + size, y, x - size, y - size, x - size, y + size);
                break;
        }

        // 添加弹跳动画
        this.scene.tweens.add({
            targets: arrow,
            y: direction === 'up' ? y - 10 : direction === 'down' ? y + 10 : y,
            x: direction === 'left' ? x - 10 : direction === 'right' ? x + 10 : x,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        return arrow;
    }

    /**
     * 下一步
     */
    public nextStep(): void {
        if (!this.isActive) return;

        this.currentStep++;
        this.showStep(this.currentStep);
    }

    /**
     * 通知动作完成（用于 waitFor: 'action' 的步骤）
     */
    public notifyAction(action: string): void {
        if (!this.isActive) return;

        const step = TUTORIAL_STEPS[this.currentStep];
        if (step && step.waitFor === 'action') {
            if (!step.actionKey || action === step.actionKey) {
                // 延迟一点再进入下一步，让玩家看到效果
                this.scene.time.delayedCall(500, () => {
                    this.nextStep();
                });
            }
        }
    }

    /**
     * 跳过教程
     */
    public skip(): void {
        this.complete();
    }

    /**
     * 完成教程
     */
    private complete(): void {
        this.isActive = false;
        this.clearUI();
        TutorialSystem.markCompleted();

        console.log('[Tutorial] 教程完成');
        
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * 清除UI
     */
    private clearUI(): void {
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.overlay = null;
        this.highlight = null;
        this.arrow = null;
    }

    /**
     * 检查是否激活
     */
    public isTutorialActive(): boolean {
        return this.isActive;
    }

    /**
     * 获取当前步骤
     */
    public getCurrentStep(): number {
        return this.currentStep;
    }

    /**
     * 获取总步骤数
     */
    public getTotalSteps(): number {
        return TUTORIAL_STEPS.length;
    }
}
