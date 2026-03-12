/**
 * 职业选择场景
 * 玩家在开始游戏前选择职业
 */

import Phaser from 'phaser';
import { ClassType } from '../core/Types';
import { GAME_CONFIG } from '../core/Config';
import { getAllClasses, getClassColorHex, ClassData } from '../data/Classes';

/**
 * 职业视觉描述配置
 */
const CLASS_VISUAL_DESCRIPTIONS: Record<ClassType, {
    body: string;      // 身体特征
    accessory: string; // 特色配饰
    weapon: string;    // 武器类型
    aura: string;      // 气场效果
}> = {
    [ClassType.STREET_SAMURAI]: {
        body: '重型装甲披风',
        accessory: '机械义眼',
        weapon: '武士刀',
        aura: '红色霓虹光晕'
    },
    [ClassType.DATA_HACKER]: {
        body: '数据流紧身战衣',
        accessory: 'AR全息护目镜',
        weapon: '数据光拳',
        aura: '青色数据风暴'
    },
    [ClassType.BIO_ENGINEER]: {
        body: '纳米强化装甲',
        accessory: '双机械臂',
        weapon: '生化能量拳',
        aura: '橙色能量场'
    },
    [ClassType.SHADOW_ASSASSIN]: {
        body: '光学迷彩紧身衣',
        accessory: '生物发光纹身',
        weapon: '双匕首',
        aura: '紫色暗影波纹'
    }
};

export default class ClassSelectScene extends Phaser.Scene {
    private selectedClassIndex: number = 0;
    private classes: ClassData[] = [];
    private classCards: Phaser.GameObjects.Container[] = [];
    private detailPanel!: Phaser.GameObjects.Container;
    private confirmButton!: Phaser.GameObjects.Container;
    private isMultiplayer: boolean = false;

    constructor() {
        super({ key: 'ClassSelectScene' });
    }

    /**
     * 初始化场景
     */
    init(data: any): void {
        // 重置联机模式状态，默认为单人模式
        this.isMultiplayer = false;
        
        // 如果有传入已选择的职业索引
        if (data && data.selectedIndex !== undefined) {
            this.selectedClassIndex = data.selectedIndex;
        }
        
        // 检查是否为联机模式（只有明确传入 multiplayer: true 时才启用）
        // 使用严格比较，确保只有明确传入 true 时才启用联机模式
        if (data && typeof data.multiplayer === 'boolean' && data.multiplayer === true) {
            this.isMultiplayer = true;
        }
    }

    /**
     * 创建场景
     */
    create(): void {
        this.classes = getAllClasses();

        // 创建背景
        this.createBackground();

        // 创建标题
        this.createTitle();

        // 创建职业卡片
        this.createClassCards();

        // 创建详情面板
        this.createDetailPanel();

        // 创建确认按钮
        this.createConfirmButton();

        // 创建返回按钮
        this.createBackButton();

        // 创建提示文字
        this.createHintText();

        // 默认选中第一个职业
        this.selectClass(0);

        // 键盘导航
        this.setupKeyboardNavigation();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 深色背景
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a0a1a, 1);
        graphics.fillRect(0, 0, width, height);

        // 霓虹网格
        graphics.lineStyle(1, 0x00ffff, 0.08);
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
    }

    /**
     * 创建标题
     */
    private createTitle(): void {
        const width = this.cameras.main.width;

        // 主标题
        const title = this.add.text(width / 2, 50, '// 选择你的职业', {
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#ff00ff',
            strokeThickness: 3
        });
        title.setOrigin(0.5);

        // 副标题
        const subtitle = this.add.text(width / 2, 95, '每个职业都有独特的玩法风格和特殊能力', {
            fontSize: '18px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        subtitle.setOrigin(0.5);

        // 标题动画
        this.tweens.add({
            targets: title,
            alpha: { from: 0, to: 1 },
            duration: 500
        });
    }

    /**
     * 创建职业卡片
     */
    private createClassCards(): void {
        const width = this.cameras.main.width;
        const cardWidth = 240;
        const cardHeight = 300;
        const spacing = 30;
        const startX = (width - (this.classes.length * cardWidth + (this.classes.length - 1) * spacing)) / 2;
        const startY = 180;

        this.classes.forEach((classData, index) => {
            const x = startX + index * (cardWidth + spacing) + cardWidth / 2;
            const y = startY + cardHeight / 2;

            const card = this.createClassCard(x, y, cardWidth, cardHeight, classData, index);
            this.classCards.push(card);
        });
    }

    /**
     * 创建单个职业卡片
     */
    private createClassCard(
        x: number, y: number, width: number, height: number,
        classData: ClassData, index: number
    ): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);

        // 卡片背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.95);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
        bg.lineStyle(3, classData.color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
        container.add(bg);

        // 职业角色外观 - 使用程序化生成的职业纹理
        const classTextureKey = `player_${classData.id}_idle_0`;
        const classSprite = this.add.sprite(0, -height / 2 + 55, classTextureKey);
        classSprite.setScale(1.2);
        classSprite.setTint(classData.color);
        container.add(classSprite);

        // 角色浮动动画效果
        this.tweens.add({
            targets: classSprite,
            y: classSprite.y - 3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 角色外观底部的职业专属光效
        const glowGraphics = this.add.graphics();
        glowGraphics.fillStyle(classData.color, 0.15);
        glowGraphics.fillEllipse(0, -height / 2 + 55, 50, 35);
        container.add(glowGraphics);

        // 职业名称
        const name = this.add.text(0, -height / 2 + 100, classData.name, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: getClassColorHex(classData.id),
            fontFamily: 'Courier New, monospace'
        });
        name.setOrigin(0.5);
        container.add(name);

        // 职业称号
        const title = this.add.text(0, -height / 2 + 130, classData.title, {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);
        container.add(title);

        // 玩法风格
        const playstyle = this.add.text(0, -height / 2 + 170, classData.playstyle, {
            fontSize: '12px',
            color: '#aaaaaa',
            fontFamily: 'Courier New, monospace',
            align: 'center',
            wordWrap: { width: width - 20 }
        });
        playstyle.setOrigin(0.5);
        container.add(playstyle);

        // 职业视觉特征描述
        const visualDesc = CLASS_VISUAL_DESCRIPTIONS[classData.id];
        const visualText = [
            `外观: ${visualDesc.body}`,
            `配饰: ${visualDesc.accessory}`,
            `武器: ${visualDesc.weapon}`
        ];

        const visualInfo = this.add.text(0, height / 2 - 85, visualText, {
            fontSize: '10px',
            color: getClassColorHex(classData.id),
            fontFamily: 'Courier New, monospace',
            align: 'center',
            lineSpacing: 3
        });
        visualInfo.setOrigin(0.5);
        container.add(visualInfo);

        // 难度标签
        const difficultyColors: Record<string, string> = {
            'easy': '#44ff44',
            'medium': '#ffff44',
            'hard': '#ff4444'
        };
        const difficultyNames: Record<string, string> = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难'
        };
        const difficulty = this.add.text(0, height / 2 - 45, `难度: ${difficultyNames[classData.difficulty]}`, {
            fontSize: '14px',
            color: difficultyColors[classData.difficulty],
            fontFamily: 'Courier New, monospace'
        });
        difficulty.setOrigin(0.5);
        container.add(difficulty);

        // 标签
        const tags = this.add.text(0, height / 2 - 25, classData.tags.join(' | '), {
            fontSize: '11px',
            color: '#666666',
            fontFamily: 'Courier New, monospace'
        });
        tags.setOrigin(0.5);
        container.add(tags);

        // 交互区域
        const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);

        // 悬停效果
        hitArea.on('pointerover', () => {
            if (index !== this.selectedClassIndex) {
                bg.clear();
                bg.fillStyle(classData.color, 0.15);
                bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
                bg.lineStyle(3, classData.color, 1);
                bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
            }
        });

        hitArea.on('pointerout', () => {
            if (index !== this.selectedClassIndex) {
                bg.clear();
                bg.fillStyle(0x0a0a1a, 0.95);
                bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
                bg.lineStyle(3, classData.color, 1);
                bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
            }
        });

        hitArea.on('pointerdown', () => {
            this.selectClass(index);
        });

        // 存储引用
        container.setData('index', index);
        container.setData('bg', bg);
        container.setData('classData', classData);

        return container;
    }

    /**
     * 选择职业
     */
    private selectClass(index: number): void {
        if (!this.classCards || this.classCards.length === 0) {
            return;
        }

        this.classCards.forEach((card, i) => {
            const bg = card.getData('bg') as Phaser.GameObjects.Graphics | null;
            const classData = card.getData('classData') as ClassData | null;

            if (!bg || !classData) return;

            if (i === index) {
                bg.clear();
                bg.fillStyle(classData.color, 0.3);
                bg.fillRoundedRect(-120, -150, 240, 300, 8);
                bg.lineStyle(4, classData.color, 1);
                bg.strokeRoundedRect(-120, -150, 240, 300, 8);

                this.tweens.add({
                    targets: card,
                    scale: 1.05,
                    duration: 200
                });
            } else {
                bg.clear();
                bg.fillStyle(0x0a0a1a, 0.95);
                bg.fillRoundedRect(-120, -150, 240, 300, 8);
                bg.lineStyle(3, classData.color, 1);
                bg.strokeRoundedRect(-120, -150, 240, 300, 8);

                this.tweens.add({
                    targets: card,
                    scale: 1,
                    duration: 200
                });
            }
        });

        this.selectedClassIndex = index;

        if (this.classes && this.classes[index]) {
            this.updateDetailPanel(this.classes[index]);
        }
    }

    /**
     * 创建详情面板
     */
    private createDetailPanel(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const panelWidth = width - 100;
        const panelHeight = 180;
        const x = width / 2;
        const y = 520;

        this.detailPanel = this.add.container(x, y);

        // 面板背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.95);
        bg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
        bg.lineStyle(2, 0x00ffff, 0.5);
        bg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 8);
        this.detailPanel.add(bg);

        // 占位文字（将在 updateDetailPanel 中更新）
        const placeholder = this.add.text(0, 0, '', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace'
        });
        placeholder.setOrigin(0.5);
        placeholder.setName('detailText');
        this.detailPanel.add(placeholder);
    }

    /**
     * 更新详情面板
     */
    private updateDetailPanel(classData: ClassData): void {
        const detailText = this.detailPanel.getByName('detailText') as Phaser.GameObjects.Text;

        // 构建详情文本
        let text = `【${classData.name} - ${classData.title}】\n\n`;
        text += `${classData.description}\n\n`;

        // 属性加成
        text += '【属性加成】\n';
        const stats = classData.stats;
        if (stats.maxHp) text += `生命值: ${stats.maxHp > 0 ? '+' : ''}${stats.maxHp}  `;
        if (stats.maxHpPercent) text += `生命值%: ${stats.maxHpPercent > 0 ? '+' : ''}${Math.round(stats.maxHpPercent * 100)}%  `;
        if (stats.attack) text += `攻击力: ${stats.attack > 0 ? '+' : ''}${stats.attack}  `;
        if (stats.attackPercent) text += `攻击力%: +${Math.round(stats.attackPercent * 100)}%  `;
        if (stats.defense) text += `防御力: ${stats.defense > 0 ? '+' : ''}${stats.defense}  `;
        if (stats.critRate) text += `暴击率: +${Math.round(stats.critRate * 100)}%  `;
        if (stats.critDamage) text += `暴击伤害: +${Math.round(stats.critDamage * 100)}%  `;
        if (stats.moveSpeed) text += `移动速度: ${stats.moveSpeed > 0 ? '+' : ''}${stats.moveSpeed}  `;

        text += '\n\n【特殊能力】\n';
        classData.abilities.forEach(ability => {
            text += `• ${ability.name}: ${ability.description}\n`;
        });

        detailText.setText(text);
        detailText.setStyle({
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            align: 'left',
            wordWrap: { width: 1100 }
        });
        detailText.setOrigin(0.5);
    }

    /**
     * 创建确认按钮
     */
    private createConfirmButton(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const x = width / 2;
        const y = height - 60;

        this.confirmButton = this.add.container(x, y);

        // 按钮背景
        const bg = this.add.graphics();
        bg.fillStyle(0x00ff88, 0.3);
        bg.fillRoundedRect(-120, -25, 240, 50, 8);
        bg.lineStyle(3, 0x00ff88, 1);
        bg.strokeRoundedRect(-120, -25, 240, 50, 8);
        this.confirmButton.add(bg);

        // 按钮文字
        const label = this.add.text(0, 0, '>> 确认选择', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#00ff88',
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);
        this.confirmButton.add(label);

        // 交互区域
        const hitArea = this.add.rectangle(0, 0, 240, 50, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        this.confirmButton.add(hitArea);

        // 悬停效果
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x00ff88, 0.5);
            bg.fillRoundedRect(-120, -25, 240, 50, 8);
            bg.lineStyle(3, 0x00ff88, 1);
            bg.strokeRoundedRect(-120, -25, 240, 50, 8);
            label.setColor('#ffffff');
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x00ff88, 0.3);
            bg.fillRoundedRect(-120, -25, 240, 50, 8);
            bg.lineStyle(3, 0x00ff88, 1);
            bg.strokeRoundedRect(-120, -25, 240, 50, 8);
            label.setColor('#00ff88');
        });

        hitArea.on('pointerdown', () => {
            this.confirmSelection();
        });
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(): void {
        const width = this.cameras.main.width;

        const backBtn = this.add.container(80, 50);

        const bg = this.add.graphics();
        bg.fillStyle(0xff4444, 0.3);
        bg.fillRoundedRect(-60, -20, 120, 40, 6);
        bg.lineStyle(2, 0xff4444, 1);
        bg.strokeRoundedRect(-60, -20, 120, 40, 6);
        backBtn.add(bg);

        const label = this.add.text(0, 0, '<< 返回', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ff4444',
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0.5);
        backBtn.add(label);

        const hitArea = this.add.rectangle(0, 0, 120, 40, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        backBtn.add(hitArea);

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0xff4444, 0.5);
            bg.fillRoundedRect(-60, -20, 120, 40, 6);
            bg.lineStyle(2, 0xff4444, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 6);
            label.setColor('#ffffff');
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0xff4444, 0.3);
            bg.fillRoundedRect(-60, -20, 120, 40, 6);
            bg.lineStyle(2, 0xff4444, 1);
            bg.strokeRoundedRect(-60, -20, 120, 40, 6);
            label.setColor('#ff4444');
        });

        hitArea.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * 创建提示文字
     */
    private createHintText(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const hint = this.add.text(width / 2, height - 20, '使用 ← → 键或鼠标选择职业，按 Enter 确认', {
            fontSize: '12px',
            color: '#666666',
            fontFamily: 'Courier New, monospace'
        });
        hint.setOrigin(0.5);
    }

    /**
     * 设置键盘导航
     */
    private setupKeyboardNavigation(): void {
        // 左右箭头键
        this.input.keyboard!.on('keydown-LEFT', () => {
            const newIndex = (this.selectedClassIndex - 1 + this.classes.length) % this.classes.length;
            this.selectClass(newIndex);
        });

        this.input.keyboard!.on('keydown-RIGHT', () => {
            const newIndex = (this.selectedClassIndex + 1) % this.classes.length;
            this.selectClass(newIndex);
        });

        // Enter键确认
        this.input.keyboard!.on('keydown-ENTER', () => {
            this.confirmSelection();
        });

        // ESC键返回
        this.input.keyboard!.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * 确认选择
     */
    private confirmSelection(): void {
        const selectedClass = this.classes[this.selectedClassIndex];

        // 保存选择到游戏注册表
        this.registry.set('selectedClass', selectedClass.id);

        // 显示确认消息
        this.showMessage(`已选择职业: ${selectedClass.name}`, selectedClass.color);

        // 延迟后进入游戏或联机大厅
        this.time.delayedCall(500, () => {
            if (this.isMultiplayer) {
                // 联机模式：进入联机大厅
                this.scene.start('LobbyScene', {
                    selectedClass: selectedClass.id,
                    playerName: `玩家_${Math.floor(Math.random() * 10000)}`
                });
            } else {
                // 单人模式：直接进入游戏
                this.scene.start('GameScene', {
                    selectedClass: selectedClass.id
                });
            }
        });
    }

    /**
     * 显示消息
     */
    private showMessage(text: string, color: number): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const msg = this.add.text(width / 2, height / 2, text, {
            fontSize: '32px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            y: msg.y - 50,
            duration: 1000,
            onComplete: () => msg.destroy()
        });
    }
}
