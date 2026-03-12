/**
 * 事件场景
 * 显示随机事件的UI界面，让玩家做出选择
 */

import Phaser from 'phaser';
import { 
    EventData, 
    EventOption, 
    EventResult,
    EventType,
    EventRarity
} from '../core/Types';
import { GAME_CONFIG } from '../core/Config';
import { 
    getEventTypeName, 
    getEventTypeColor, 
    getEventRarityColor 
} from '../data/Events';
import { RandomEventSystem } from '../systems/RandomEventSystem';
import Player from '../entities/Player';

export default class EventScene extends Phaser.Scene {
    private eventSystem!: RandomEventSystem;
    private player!: Player;
    private currentEvent!: EventData;
    private selectedOption: string | null = null;
    private onClose?: () => void;
    
    constructor() {
        super({ key: 'EventScene' });
    }
    
    /**
     * 初始化场景
     */
    init(data: { 
        eventSystem: RandomEventSystem;
        player: Player;
        event: EventData;
        onClose?: () => void;
    }): void {
        this.eventSystem = data.eventSystem;
        this.player = data.player;
        this.currentEvent = data.event;
        this.onClose = data.onClose;
        this.selectedOption = null;
    }
    
    /**
     * 创建场景
     */
    create(): void {
        // 暂停游戏场景
        this.scene.pause('GameScene');
        
        // 创建背景
        this.createBackground();
        
        // 创建事件面板
        this.createEventPanel();
        
        // 创建选项按钮
        this.createOptionButtons();
        
        // 创建装饰效果
        this.createDecorations();
        
        // 播放出现音效
        this.cameras.main.flash(300, 0, 255, 255, false);
    }
    
    /**
     * 创建背景
     */
    private createBackground(): void {
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;
        
        // 半透明黑色背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, width, height);
        
        // 网格效果
        overlay.lineStyle(1, 0x00ffff, 0.08);
        for (let x = 0; x < width; x += 40) {
            overlay.moveTo(x, 0);
            overlay.lineTo(x, height);
        }
        for (let y = 0; y < height; y += 40) {
            overlay.moveTo(0, y);
            overlay.lineTo(width, y);
        }
        overlay.strokePath();
        
        // 扫描线动画
        const scanline = this.add.graphics();
        scanline.fillStyle(0x00ffff, 0.1);
        scanline.fillRect(0, 0, width, 3);
        
        this.tweens.add({
            targets: scanline,
            y: height,
            duration: 3000,
            repeat: -1
        });
    }
    
    /**
     * 创建事件面板
     */
    private createEventPanel(): void {
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;
        const panelWidth = 600;
        const panelHeight = 500;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const typeColor = getEventTypeColor(this.currentEvent.type);
        const rarityColor = getEventRarityColor(this.currentEvent.rarity);
        
        // 主面板容器
        const panel = this.add.container(centerX, centerY);
        
        // 面板背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.95);
        bg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15);
        bg.lineStyle(3, typeColor, 1);
        bg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 15);
        
        // 外发光
        const glow = this.add.graphics();
        glow.fillStyle(typeColor, 0.15);
        glow.fillRoundedRect(-panelWidth/2 - 10, -panelHeight/2 - 10, panelWidth + 20, panelHeight + 20, 20);
        
        panel.add(glow);
        panel.add(bg);
        
        // 事件类型标签
        const typeLabel = this.add.text(0, -panelHeight/2 + 30, 
            `[${getEventTypeName(this.currentEvent.type)}]`, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: `#${typeColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        typeLabel.setOrigin(0.5);
        panel.add(typeLabel);
        
        // 稀有度标签
        const rarityNames: Record<EventRarity, string> = {
            [EventRarity.COMMON]: '普通',
            [EventRarity.RARE]: '稀有',
            [EventRarity.EPIC]: '史诗',
            [EventRarity.LEGENDARY]: '传说'
        };
        
        const rarityLabel = this.add.text(0, -panelHeight/2 + 55, 
            rarityNames[this.currentEvent.rarity], {
            fontSize: '12px',
            color: `#${rarityColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        rarityLabel.setOrigin(0.5);
        panel.add(rarityLabel);
        
        // 事件图标
        const iconBg = this.add.graphics();
        iconBg.fillStyle(0x1a1a2e, 1);
        iconBg.fillCircle(0, -100, 50);
        iconBg.lineStyle(3, typeColor, 1);
        iconBg.strokeCircle(0, -100, 50);
        panel.add(iconBg);
        
        // 图标文字（使用emoji代替）
        const iconText = this.add.text(0, -100, this.getEventIcon(this.currentEvent.type), {
            fontSize: '50px'
        });
        iconText.setOrigin(0.5);
        panel.add(iconText);
        
        // 事件名称
        const eventName = this.add.text(0, -30, this.currentEvent.name, {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            stroke: `#${typeColor.toString(16).padStart(6, '0')}`,
            strokeThickness: 2
        });
        eventName.setOrigin(0.5);
        panel.add(eventName);
        
        // 事件描述
        const description = this.add.text(0, 20, this.currentEvent.description, {
            fontSize: '14px',
            color: '#aaaaaa',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            wordWrap: { width: panelWidth - 60 }
        });
        description.setOrigin(0.5);
        panel.add(description);
        
        // 入场动画
        panel.setAlpha(0);
        panel.setScale(0.9);
        
        this.tweens.add({
            targets: panel,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });
    }
    
    /**
     * 创建选项按钮
     */
    private createOptionButtons(): void {
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;
        const buttonWidth = 500;
        const buttonHeight = 80;
        const gap = 15;
        const startY = height / 2 + 80;
        
        const typeColor = getEventTypeColor(this.currentEvent.type);
        
        this.currentEvent.options.forEach((option, index) => {
            const y = startY + index * (buttonHeight + gap);
            
            // 检查是否满足需求条件
            const canSelect = this.checkOptionAvailable(option);
            
            // 按钮容器
            const button = this.add.container(width / 2, y);
            
            // 按钮背景
            const bg = this.add.graphics();
            const bgColor = canSelect ? 0x1a1a2e : 0x0a0a0a;
            bg.fillStyle(bgColor, 0.95);
            bg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            bg.lineStyle(2, canSelect ? typeColor : 0x444444, canSelect ? 1 : 0.5);
            bg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
            button.add(bg);
            
            // 选项文本
            const optionText = this.add.text(-buttonWidth/2 + 20, -15, option.text, {
                fontSize: '20px',
                fontStyle: 'bold',
                color: canSelect ? '#ffffff' : '#666666',
                fontFamily: 'Courier New, monospace'
            });
            button.add(optionText);
            
            // 选项描述
            const descText = this.add.text(-buttonWidth/2 + 20, 10, option.description, {
                fontSize: '12px',
                color: canSelect ? '#888888' : '#444444',
                fontFamily: 'Courier New, monospace'
            });
            button.add(descText);
            
            // 显示代价
            if (option.cost) {
                const costText = this.getCostText(option.cost);
                const costLabel = this.add.text(buttonWidth/2 - 20, 0, costText, {
                    fontSize: '14px',
                    color: '#ff6666',
                    fontFamily: 'Courier New, monospace'
                });
                costLabel.setOrigin(1, 0.5);
                button.add(costLabel);
            }
            
            // 显示需求条件
            if (option.requirement && !canSelect) {
                const reqText = this.getRequirementText(option.requirement);
                const reqLabel = this.add.text(buttonWidth/2 - 20, 0, reqText, {
                    fontSize: '14px',
                    color: '#ff4444',
                    fontFamily: 'Courier New, monospace'
                });
                reqLabel.setOrigin(1, 0.5);
                button.add(reqLabel);
            }
            
            // 显示风险提示
            if (option.risk && option.riskChance) {
                const riskLabel = this.add.text(buttonWidth/2 - 20, -20, 
                    `风险: ${Math.round(option.riskChance * 100)}%`, {
                    fontSize: '11px',
                    color: '#ff6644',
                    fontFamily: 'Courier New, monospace'
                });
                riskLabel.setOrigin(1, 0.5);
                button.add(riskLabel);
            }
            
            // 交互区域
            const hitArea = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
            button.add(hitArea);
            
            if (canSelect) {
                hitArea.setInteractive({ useHandCursor: true });
                
                // 悬停效果
                hitArea.on('pointerover', () => {
                    button.setScale(1.02);
                    bg.clear();
                    bg.fillStyle(typeColor, 0.2);
                    bg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                    bg.lineStyle(2, typeColor, 1);
                    bg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                });
                
                hitArea.on('pointerout', () => {
                    button.setScale(1);
                    bg.clear();
                    bg.fillStyle(0x1a1a2e, 0.95);
                    bg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                    bg.lineStyle(2, typeColor, 1);
                    bg.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
                });
                
                hitArea.on('pointerdown', () => {
                    this.selectOption(option.id);
                });
            }
            
            // 入场动画
            button.setAlpha(0);
            button.setX(width / 2 - 50);
            
            this.tweens.add({
                targets: button,
                alpha: 1,
                x: width / 2,
                duration: 200,
                delay: 100 + index * 80,
                ease: 'Power2'
            });
        });
    }
    
    /**
     * 检查选项是否可用
     */
    private checkOptionAvailable(option: EventOption): boolean {
        if (!option.requirement) return true;
        
        const req = option.requirement;
        
        switch (req.type) {
            case 'level':
                return this.player.getLevel() >= req.value;
            case 'hp':
                return this.player.getStats().hp >= req.value;
            case 'gold':
            case 'item':
                // 暂未实现
                return true;
            default:
                return true;
        }
    }
    
    /**
     * 获取代价文本
     */
    private getCostText(cost: NonNullable<EventOption['cost']>): string {
        const typeNames: Record<string, string> = {
            'gold': '金币',
            'hp': '生命',
            'time_fragment': '时空碎片',
            'item': '物品'
        };
        return `-${cost.value} ${typeNames[cost.type] || cost.type}`;
    }
    
    /**
     * 获取需求文本
     */
    private getRequirementText(req: NonNullable<EventOption['requirement']>): string {
        const typeNames: Record<string, string> = {
            'level': '等级',
            'hp': '生命',
            'gold': '金币',
            'item': '物品'
        };
        return `需要: ${req.value} ${typeNames[req.type] || req.type}`;
    }
    
    /**
     * 获取事件图标
     */
    private getEventIcon(type: EventType): string {
        const icons: Record<EventType, string> = {
            [EventType.MERCHANT]: '🏪',
            [EventType.TRAP]: '⚠️',
            [EventType.SHRINE]: '⛩️',
            [EventType.ROULETTE]: '🎰',
            [EventType.CAMP]: '🏕️'
        };
        return icons[type] || '❓';
    }
    
    /**
     * 创建装饰效果
     */
    private createDecorations(): void {
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;
        
        // 角落装饰
        const corners = [
            { x: 30, y: 30, rotation: 0 },
            { x: width - 30, y: 30, rotation: Math.PI / 2 },
            { x: width - 30, y: height - 30, rotation: Math.PI },
            { x: 30, y: height - 30, rotation: -Math.PI / 2 }
        ];
        
        const typeColor = getEventTypeColor(this.currentEvent.type);
        
        corners.forEach(corner => {
            const decor = this.add.graphics();
            decor.lineStyle(2, typeColor, 0.5);
            decor.moveTo(0, 40);
            decor.lineTo(0, 0);
            decor.lineTo(40, 0);
            decor.strokePath();
            decor.x = corner.x;
            decor.y = corner.y;
            decor.rotation = corner.rotation;
        });
        
        // 数据流效果
        for (let i = 0; i < 3; i++) {
            const text = this.add.text(
                -200,
                150 + i * 150,
                '01010110 11001010 10101010 01011010',
                {
                    fontSize: '10px',
                    color: '#00ffff',
                    fontFamily: 'Courier New, monospace'
                }
            );
            text.setAlpha(0.15);
            
            this.tweens.add({
                targets: text,
                x: width + 200,
                duration: 15000 + i * 5000,
                repeat: -1,
                delay: i * 3000
            });
        }
    }
    
    /**
     * 选择选项
     */
    private selectOption(optionId: string): void {
        if (this.selectedOption) return;
        this.selectedOption = optionId;
        
        // 播放选择效果
        this.cameras.main.flash(200, 0, 255, 255, false);
        
        // 处理事件
        const result = this.eventSystem.processEventOption(optionId);
        
        // 显示结果
        this.showResult(result);
    }
    
    /**
     * 显示结果
     */
    private showResult(result: EventResult): void {
        const width = GAME_CONFIG.width;
        const height = GAME_CONFIG.height;
        
        // 创建结果面板
        const resultPanel = this.add.container(width / 2, height / 2);
        resultPanel.setDepth(100);
        
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.95);
        bg.fillRoundedRect(-250, -150, 500, 300, 15);
        bg.lineStyle(3, result.success ? 0x00ff00 : 0xff0000, 1);
        bg.strokeRoundedRect(-250, -150, 500, 300, 15);
        resultPanel.add(bg);
        
        // 结果标题
        const title = this.add.text(0, -100, result.success ? '事件完成' : '事件失败', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: result.success ? '#00ff00' : '#ff0000',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);
        resultPanel.add(title);
        
        // 奖励列表
        if (result.rewards.length > 0) {
            const rewardTexts = result.rewards.map(r => this.formatReward(r));
            const rewardsDisplay = this.add.text(0, -30, rewardTexts.join('\n'), {
                fontSize: '16px',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace',
                align: 'center'
            });
            rewardsDisplay.setOrigin(0.5);
            resultPanel.add(rewardsDisplay);
        }
        
        // 风险提示
        if (result.risk && result.risk.type !== 'nothing') {
            const riskText = this.add.text(0, 30, `风险触发: ${result.risk.description}`, {
                fontSize: '14px',
                color: '#ff6666',
                fontFamily: 'Courier New, monospace',
                align: 'center'
            });
            riskText.setOrigin(0.5);
            resultPanel.add(riskText);
        }
        
        // 确认按钮
        const confirmBtn = this.add.graphics();
        confirmBtn.fillStyle(0x1a1a2e, 1);
        confirmBtn.fillRoundedRect(-80, 80, 160, 40, 8);
        confirmBtn.lineStyle(2, 0x00ffff, 1);
        confirmBtn.strokeRoundedRect(-80, 80, 160, 40, 8);
        resultPanel.add(confirmBtn);
        
        const confirmText = this.add.text(0, 100, '确定', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        confirmText.setOrigin(0.5);
        resultPanel.add(confirmText);
        
        // 确认按钮交互
        const hitArea = this.add.rectangle(0, 100, 160, 40, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        resultPanel.add(hitArea);
        
        hitArea.on('pointerover', () => {
            confirmBtn.clear();
            confirmBtn.fillStyle(0x00ffff, 0.3);
            confirmBtn.fillRoundedRect(-80, 80, 160, 40, 8);
        });
        
        hitArea.on('pointerout', () => {
            confirmBtn.clear();
            confirmBtn.fillStyle(0x1a1a2e, 1);
            confirmBtn.fillRoundedRect(-80, 80, 160, 40, 8);
            confirmBtn.lineStyle(2, 0x00ffff, 1);
            confirmBtn.strokeRoundedRect(-80, 80, 160, 40, 8);
        });
        
        hitArea.on('pointerdown', () => {
            this.closeScene();
        });
        
        // 入场动画
        resultPanel.setAlpha(0);
        resultPanel.setScale(0.9);
        
        this.tweens.add({
            targets: resultPanel,
            alpha: 1,
            scale: 1,
            duration: 200,
            ease: 'Back.out'
        });
    }
    
    /**
     * 格式化奖励文本
     */
    private formatReward(reward: EventResult['rewards'][0]): string {
        switch (reward.type) {
            case 'gold':
                return `+${reward.value} 金币`;
            case 'experience':
                return `+${reward.value} 经验`;
            case 'item':
                return '获得物品';
            case 'weapon':
                return '获得武器';
            case 'skill':
                return '获得技能';
            case 'heal':
                return `+${reward.value} 生命`;
            case 'stat_boost':
                return `${reward.statType} +${reward.statValue}`;
            case 'time_fragment':
                return `+${reward.value} 时空碎片`;
            case 'nothing':
                return '什么都没有';
            default:
                return '';
        }
    }
    
    /**
     * 关闭场景
     */
    private closeScene(): void {
        // 恢复游戏场景
        this.scene.resume('GameScene');
        
        // 调用关闭回调
        if (this.onClose) {
            this.onClose();
        }
        
        // 关闭场景
        this.scene.stop();
    }
}
