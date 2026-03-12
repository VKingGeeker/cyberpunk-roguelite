/**
 * 技能树场景 - 显示职业专属技能树
 * 玩家可以在这里解锁和升级技能
 */

import Phaser from 'phaser';
import { Profession, SkillTreeNode, SkillTreeBranch, SkillTreeState, SoundType } from '../core/Types';
import { 
    getSkillTreeByProfession, 
    canUnlockNode, 
    getSkillNodeById,
    getProfessionName,
    getProfessionDescription 
} from '../data/SkillTrees';
import { getSkillById, getSkillColor } from '../data/Skills';
import Player from '../entities/Player';

export default class SkillTreeScene extends Phaser.Scene {
    private player!: Player;
    private profession!: Profession;
    private skillTreeState!: SkillTreeState;
    
    // UI元素
    private container!: Phaser.GameObjects.Container;
    private nodeElements: Map<string, Phaser.GameObjects.Container> = new Map();
    private connectionLines: Phaser.GameObjects.Graphics[] = [];
    private detailPanel: Phaser.GameObjects.Container | null = null;
    private pointsText!: Phaser.GameObjects.Text;
    private professionText!: Phaser.GameObjects.Text;
    
    // 当前选中的节点
    private selectedNodeId: string | null = null;
    
    // 分支标签
    private branchTabs: Phaser.GameObjects.Container[] = [];
    private currentBranchIndex: number = 0;
    
    constructor() {
        super({ key: 'SkillTreeScene', active: false });
    }
    
    /**
     * 初始化场景
     */
    init(data: { player?: Player; profession?: Profession; skillTreeState?: SkillTreeState }): void {
        if (!data.player || !data.profession || !data.skillTreeState) {
            console.warn('SkillTreeScene: 缺少必要参数，使用默认值');
            this.profession = data.profession ?? Profession.WARRIOR;
            this.skillTreeState = data.skillTreeState ?? {
                unlockedNodes: new Map(),
                availablePoints: 0,
                totalPointsEarned: 0
            };
            this.player = data.player ?? null as any;
        } else {
            this.player = data.player;
            this.profession = data.profession;
            this.skillTreeState = data.skillTreeState;
        }
    }
    
    /**
     * 创建场景
     */
    create(): void {
        // 创建半透明背景
        this.createBackground();
        
        // 创建主容器
        this.container = this.add.container(0, 0);
        
        // 创建标题栏
        this.createHeader();
        
        // 创建分支标签
        this.createBranchTabs();
        
        // 创建技能树视图
        this.createSkillTreeView();
        
        // 创建关闭按钮
        this.createCloseButton();
        
        // 创建技能点显示
        this.createPointsDisplay();
        
        // 入场动画
        this.playEnterAnimation();
    }
    
    /**
     * 创建半透明背景
     */
    private createBackground(): void {
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // 点击背景关闭详情面板
        bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, this.cameras.main.height), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', () => {
            this.hideDetailPanel();
        });
    }
    
    /**
     * 创建标题栏
     */
    private createHeader(): void {
        const centerX = this.cameras.main.width / 2;
        
        // 标题背景
        const headerBg = this.add.graphics();
        headerBg.fillStyle(0x0a0a1a, 0.95);
        headerBg.fillRect(0, 0, this.cameras.main.width, 80);
        headerBg.lineStyle(2, 0x00ffff, 1);
        headerBg.lineBetween(0, 80, this.cameras.main.width, 80);
        this.container.add(headerBg);
        
        // 职业名称
        this.professionText = this.add.text(centerX, 25, `${getProfessionName(this.profession)} - 技能树`, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.professionText.setOrigin(0.5);
        this.container.add(this.professionText);
        
        // 职业描述
        const descText = this.add.text(centerX, 55, getProfessionDescription(this.profession), {
            fontSize: '14px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        descText.setOrigin(0.5);
        this.container.add(descText);
    }
    
    /**
     * 创建分支标签
     */
    private createBranchTabs(): void {
        const skillTree = getSkillTreeByProfession(this.profession);
        if (!skillTree) return;
        
        const startX = this.cameras.main.width / 2 - 200;
        const y = 100;
        
        skillTree.branches.forEach((branch, index) => {
            const tab = this.createBranchTab(branch, startX + index * 150, y, index);
            this.branchTabs.push(tab);
            this.container.add(tab);
        });
        
        // 高亮第一个标签
        this.highlightBranchTab(0);
    }
    
    /**
     * 创建单个分支标签
     */
    private createBranchTab(branch: SkillTreeBranch, x: number, y: number, index: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // 标签背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        bg.lineStyle(2, branch.color, 0.5);
        bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        container.add(bg);
        
        // 标签文字
        const text = this.add.text(0, 0, branch.name, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: `#${branch.color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        text.setOrigin(0.5);
        container.add(text);
        
        // 交互区域
        const hitArea = this.add.rectangle(0, 0, 120, 40, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);
        
        // 点击事件
        hitArea.on('pointerdown', () => {
            this.switchBranch(index);
            this.scene.get('GameScene').events.emit('play-sound', SoundType.UI_CLICK);
        });
        
        // 悬停效果
        hitArea.on('pointerover', () => {
            if (this.currentBranchIndex !== index) {
                bg.clear();
                bg.fillStyle(0x2a2a3e, 1);
                bg.fillRoundedRect(-60, -20, 120, 40, 8);
                bg.lineStyle(2, branch.color, 0.8);
                bg.strokeRoundedRect(-60, -20, 120, 40, 8);
            }
        });
        
        hitArea.on('pointerout', () => {
            if (this.currentBranchIndex !== index) {
                bg.clear();
                bg.fillStyle(0x1a1a2e, 1);
                bg.fillRoundedRect(-60, -20, 120, 40, 8);
                bg.lineStyle(2, branch.color, 0.5);
                bg.strokeRoundedRect(-60, -20, 120, 40, 8);
            }
        });
        
        // 存储引用
        container.setData('bg', bg);
        container.setData('text', text);
        container.setData('branch', branch);
        
        return container;
    }
    
    /**
     * 高亮分支标签
     */
    private highlightBranchTab(index: number): void {
        this.branchTabs.forEach((tab, i) => {
            const bg = tab.getData('bg') as Phaser.GameObjects.Graphics;
            const branch = tab.getData('branch') as SkillTreeBranch;
            
            bg.clear();
            
            if (i === index) {
                // 高亮状态
                bg.fillStyle(branch.color, 0.3);
                bg.fillRoundedRect(-60, -20, 120, 40, 8);
                bg.lineStyle(3, branch.color, 1);
                bg.strokeRoundedRect(-60, -20, 120, 40, 8);
            } else {
                // 普通状态
                bg.fillStyle(0x1a1a2e, 1);
                bg.fillRoundedRect(-60, -20, 120, 40, 8);
                bg.lineStyle(2, branch.color, 0.5);
                bg.strokeRoundedRect(-60, -20, 120, 40, 8);
            }
        });
    }
    
    /**
     * 切换分支
     */
    private switchBranch(index: number): void {
        this.currentBranchIndex = index;
        this.highlightBranchTab(index);
        this.createSkillTreeView();
    }
    
    /**
     * 创建技能树视图
     */
    private createSkillTreeView(): void {
        // 清除旧的节点和连线
        this.nodeElements.forEach(node => node.destroy());
        this.nodeElements.clear();
        this.connectionLines.forEach(line => line.destroy());
        this.connectionLines = [];
        
        const skillTree = getSkillTreeByProfession(this.profession);
        if (!skillTree) return;
        
        const currentBranch = skillTree.branches[this.currentBranchIndex];
        if (!currentBranch) return;
        
        // 计算布局
        const centerX = this.cameras.main.width / 2;
        const startY = 180;
        const nodeSpacingY = 100;
        const nodeSpacingX = 150;
        
        // 创建连接线
        this.createConnectionLines(currentBranch, centerX, startY, nodeSpacingX, nodeSpacingY);
        
        // 创建节点
        currentBranch.nodes.forEach(node => {
            const x = centerX + node.position.x * nodeSpacingX;
            const y = startY + node.position.y * nodeSpacingY;
            this.createNode(node, x, y, currentBranch.color);
        });
    }
    
    /**
     * 创建连接线
     */
    private createConnectionLines(branch: SkillTreeBranch, centerX: number, startY: number, spacingX: number, spacingY: number): void {
        const graphics = this.add.graphics();
        graphics.lineStyle(3, branch.color, 0.5);
        
        branch.nodes.forEach(node => {
            const nodeX = centerX + node.position.x * spacingX;
            const nodeY = startY + node.position.y * spacingY;
            
            // 绘制到前置节点的连线
            node.prerequisites.forEach(prereqId => {
                const prereqNode = branch.nodes.find(n => n.id === prereqId);
                if (prereqNode) {
                    const prereqX = centerX + prereqNode.position.x * spacingX;
                    const prereqY = startY + prereqNode.position.y * spacingY;
                    
                    // 检查前置节点是否已解锁
                    const isUnlocked = this.skillTreeState.unlockedNodes.has(prereqId);
                    
                    graphics.lineStyle(3, isUnlocked ? branch.color : 0x333344, isUnlocked ? 0.8 : 0.3);
                    graphics.beginPath();
                    graphics.moveTo(prereqX, prereqY + 35);
                    graphics.lineTo(nodeX, nodeY - 35);
                    graphics.strokePath();
                }
            });
        });
        
        this.connectionLines.push(graphics);
        this.container.add(graphics);
    }
    
    /**
     * 创建技能节点
     */
    private createNode(node: SkillTreeNode, x: number, y: number, branchColor: number): void {
        const container = this.add.container(x, y);
        
        // 获取节点状态
        const currentLevel = this.skillTreeState.unlockedNodes.get(node.id) || 0;
        const isUnlocked = currentLevel > 0;
        const isMaxLevel = currentLevel >= node.maxLevel;
        
        // 检查是否可以解锁
        const { canUnlock, reason } = canUnlockNode(
            this.profession,
            node.id,
            this.skillTreeState.unlockedNodes,
            this.skillTreeState.availablePoints
        );
        
        // 节点背景
        const bg = this.add.graphics();
        
        // 终极技能特殊样式
        if (node.isUltimate) {
            // 外发光
            const glow = this.add.graphics();
            glow.fillStyle(branchColor, 0.2);
            glow.fillCircle(0, 0, 50);
            container.add(glow);
            
            // 脉冲动画
            this.tweens.add({
                targets: glow,
                alpha: { from: 0.2, to: 0.4 },
                scale: { from: 1, to: 1.1 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        }
        
        // 节点主体
        const radius = node.isUltimate ? 40 : 35;
        bg.fillStyle(isUnlocked ? 0x2a2a3e : 0x1a1a2e, 1);
        bg.fillCircle(0, 0, radius);
        bg.lineStyle(isUnlocked ? 3 : 2, isUnlocked ? branchColor : 0x444455, isUnlocked ? 1 : 0.5);
        bg.strokeCircle(0, 0, radius);
        container.add(bg);
        
        // 技能图标
        const skillData = getSkillById(node.skillId);
        const iconKey = skillData?.icon || 'icon_slash';
        const icon = this.add.image(0, 0, iconKey);
        icon.setDisplaySize(radius * 1.2, radius * 1.2);
        icon.setTint(isUnlocked ? 0xffffff : 0x666666);
        container.add(icon);
        
        // 等级指示器
        if (isUnlocked && !isMaxLevel) {
            const levelText = this.add.text(0, radius + 10, `Lv.${currentLevel}/${node.maxLevel}`, {
                fontSize: '12px',
                color: `#${branchColor.toString(16).padStart(6, '0')}`,
                fontFamily: 'Courier New, monospace'
            });
            levelText.setOrigin(0.5);
            container.add(levelText);
        } else if (isMaxLevel) {
            const maxText = this.add.text(0, radius + 10, 'MAX', {
                fontSize: '12px',
                fontStyle: 'bold',
                color: '#ffff00',
                fontFamily: 'Courier New, monospace'
            });
            maxText.setOrigin(0.5);
            container.add(maxText);
        }
        
        // 节点名称
        const nameText = this.add.text(0, radius + 25, node.name, {
            fontSize: '14px',
            fontStyle: 'bold',
            color: isUnlocked ? '#ffffff' : '#888888',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        nameText.setOrigin(0.5);
        container.add(nameText);
        
        // 可解锁提示
        if (canUnlock && !isMaxLevel) {
            const indicator = this.add.graphics();
            indicator.fillStyle(0x00ff00, 0.8);
            indicator.fillCircle(radius - 5, -radius + 5, 8);
            container.add(indicator);
            
            // 闪烁动画
            this.tweens.add({
                targets: indicator,
                alpha: { from: 0.5, to: 1 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        
        // 交互区域
        const hitArea = this.add.circle(0, 0, radius, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        container.add(hitArea);
        
        // 点击事件
        hitArea.on('pointerdown', () => {
            this.showNodeDetail(node, x, y, branchColor);
            this.scene.get('GameScene').events.emit('play-sound', SoundType.UI_CLICK);
        });
        
        // 悬停效果
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(isUnlocked ? 0x3a3a4e : 0x2a2a3e, 1);
            bg.fillCircle(0, 0, radius);
            bg.lineStyle(3, branchColor, 1);
            bg.strokeCircle(0, 0, radius);
            
            icon.setScale(1.1);
        });
        
        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(isUnlocked ? 0x2a2a3e : 0x1a1a2e, 1);
            bg.fillCircle(0, 0, radius);
            bg.lineStyle(isUnlocked ? 3 : 2, isUnlocked ? branchColor : 0x444455, isUnlocked ? 1 : 0.5);
            bg.strokeCircle(0, 0, radius);
            
            icon.setScale(1);
        });
        
        // 存储引用
        this.nodeElements.set(node.id, container);
    }
    
    /**
     * 显示节点详情面板
     */
    private showNodeDetail(node: SkillTreeNode, nodeX: number, nodeY: number, branchColor: number): void {
        // 隐藏旧的面板
        this.hideDetailPanel();
        
        // 创建详情面板
        this.detailPanel = this.add.container(nodeX + 100, nodeY);
        this.detailPanel.setDepth(100);
        
        // 面板背景
        const panelWidth = 280;
        const panelHeight = 320;
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x0a0a1a, 0.98);
        panelBg.fillRoundedRect(0, -panelHeight / 2, panelWidth, panelHeight, 10);
        panelBg.lineStyle(3, branchColor, 1);
        panelBg.strokeRoundedRect(0, -panelHeight / 2, panelWidth, panelHeight, 10);
        this.detailPanel.add(panelBg);
        
        // 技能名称
        const title = this.add.text(panelWidth / 2, -panelHeight / 2 + 25, node.name, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: `#${branchColor.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        title.setOrigin(0.5);
        this.detailPanel.add(title);
        
        // 技能类型标签
        const typeText = node.isUltimate ? '[终极技能]' : '[普通技能]';
        const typeLabel = this.add.text(panelWidth / 2, -panelHeight / 2 + 50, typeText, {
            fontSize: '12px',
            color: node.isUltimate ? '#ffff00' : '#888888',
            fontFamily: 'Courier New, monospace'
        });
        typeLabel.setOrigin(0.5);
        this.detailPanel.add(typeLabel);
        
        // 技能描述
        const descText = this.add.text(15, -panelHeight / 2 + 75, node.description, {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            wordWrap: { width: panelWidth - 30 }
        });
        this.detailPanel.add(descText);
        
        // 当前等级
        const currentLevel = this.skillTreeState.unlockedNodes.get(node.id) || 0;
        const levelText = this.add.text(15, -panelHeight / 2 + 140, `当前等级: ${currentLevel}/${node.maxLevel}`, {
            fontSize: '14px',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        this.detailPanel.add(levelText);
        
        // 消耗技能点
        const costText = this.add.text(15, -panelHeight / 2 + 165, `消耗技能点: ${node.cost}`, {
            fontSize: '14px',
            color: '#ffaa00',
            fontFamily: 'Courier New, monospace'
        });
        this.detailPanel.add(costText);
        
        // 检查是否可以解锁
        const { canUnlock, reason } = canUnlockNode(
            this.profession,
            node.id,
            this.skillTreeState.unlockedNodes,
            this.skillTreeState.availablePoints
        );
        
        // 解锁按钮
        if (canUnlock && currentLevel < node.maxLevel) {
            const btnY = -panelHeight / 2 + 220;
            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x00ff00, 0.3);
            btnBg.fillRoundedRect(20, btnY - 18, panelWidth - 40, 36, 6);
            btnBg.lineStyle(2, 0x00ff00, 1);
            btnBg.strokeRoundedRect(20, btnY - 18, panelWidth - 40, 36, 6);
            this.detailPanel.add(btnBg);
            
            const btnText = this.add.text(panelWidth / 2, btnY, currentLevel === 0 ? '解锁技能' : '升级技能', {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#00ff00',
                fontFamily: 'Courier New, monospace'
            });
            btnText.setOrigin(0.5);
            this.detailPanel.add(btnText);
            
            const btnHitArea = this.add.rectangle(panelWidth / 2, btnY, panelWidth - 40, 36, 0x000000, 0);
            btnHitArea.setInteractive({ useHandCursor: true });
            this.detailPanel.add(btnHitArea);
            
            btnHitArea.on('pointerdown', () => {
                this.unlockNode(node);
            });
            
            btnHitArea.on('pointerover', () => {
                btnBg.clear();
                btnBg.fillStyle(0x00ff00, 0.5);
                btnBg.fillRoundedRect(20, btnY - 18, panelWidth - 40, 36, 6);
                btnBg.lineStyle(2, 0x00ff00, 1);
                btnBg.strokeRoundedRect(20, btnY - 18, panelWidth - 40, 36, 6);
            });
            
            btnHitArea.on('pointerout', () => {
                btnBg.clear();
                btnBg.fillStyle(0x00ff00, 0.3);
                btnBg.fillRoundedRect(20, btnY - 18, panelWidth - 40, 36, 6);
                btnBg.lineStyle(2, 0x00ff00, 1);
                btnBg.strokeRoundedRect(20, btnY - 18, panelWidth - 40, 36, 6);
            });
        } else if (!canUnlock) {
            // 显示原因
            const reasonText = this.add.text(panelWidth / 2, -panelHeight / 2 + 220, reason, {
                fontSize: '14px',
                color: '#ff4444',
                fontFamily: 'Courier New, monospace',
                align: 'center'
            });
            reasonText.setOrigin(0.5);
            this.detailPanel.add(reasonText);
        } else if (currentLevel >= node.maxLevel) {
            const maxText = this.add.text(panelWidth / 2, -panelHeight / 2 + 220, '已达最大等级', {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ffff00',
                fontFamily: 'Courier New, monospace'
            });
            maxText.setOrigin(0.5);
            this.detailPanel.add(maxText);
        }
        
        // 关闭按钮
        const closeBtnY = panelHeight / 2 - 30;
        const closeBtnBg = this.add.graphics();
        closeBtnBg.fillStyle(0xff4444, 0.3);
        closeBtnBg.fillRoundedRect(20, closeBtnY - 15, panelWidth - 40, 30, 6);
        closeBtnBg.lineStyle(2, 0xff4444, 1);
        closeBtnBg.strokeRoundedRect(20, closeBtnY - 15, panelWidth - 40, 30, 6);
        this.detailPanel.add(closeBtnBg);
        
        const closeBtnText = this.add.text(panelWidth / 2, closeBtnY, '关闭', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#ff4444',
            fontFamily: 'Courier New, monospace'
        });
        closeBtnText.setOrigin(0.5);
        this.detailPanel.add(closeBtnText);
        
        const closeBtnHitArea = this.add.rectangle(panelWidth / 2, closeBtnY, panelWidth - 40, 30, 0x000000, 0);
        closeBtnHitArea.setInteractive({ useHandCursor: true });
        this.detailPanel.add(closeBtnHitArea);
        
        closeBtnHitArea.on('pointerdown', () => {
            this.hideDetailPanel();
        });
        
        // 入场动画
        this.detailPanel.setAlpha(0);
        this.detailPanel.setScale(0.8);
        this.tweens.add({
            targets: this.detailPanel,
            alpha: 1,
            scale: 1,
            duration: 150,
            ease: 'Back.out'
        });
        
        this.selectedNodeId = node.id;
    }
    
    /**
     * 隐藏详情面板
     */
    private hideDetailPanel(): void {
        if (this.detailPanel) {
            this.tweens.add({
                targets: this.detailPanel,
                alpha: 0,
                scale: 0.8,
                duration: 100,
                onComplete: () => {
                    if (this.detailPanel) {
                        this.detailPanel.destroy();
                        this.detailPanel = null;
                    }
                }
            });
        }
        this.selectedNodeId = null;
    }
    
    /**
     * 解锁节点
     */
    private unlockNode(node: SkillTreeNode): void {
        // 检查是否可以解锁
        const { canUnlock } = canUnlockNode(
            this.profession,
            node.id,
            this.skillTreeState.unlockedNodes,
            this.skillTreeState.availablePoints
        );
        
        if (!canUnlock) return;
        
        // 扣除技能点
        this.skillTreeState.availablePoints -= node.cost;
        this.skillTreeState.totalPointsEarned += node.cost;
        
        // 增加节点等级
        const currentLevel = this.skillTreeState.unlockedNodes.get(node.id) || 0;
        this.skillTreeState.unlockedNodes.set(node.id, currentLevel + 1);
        
        // 学习或升级技能
        if (currentLevel === 0) {
            // 首次解锁，学习技能
            this.player.learnSkill(node.skillId);
        } else {
            // 升级技能
            this.player.upgradeSkill(node.skillId);
        }
        
        // 播放音效
        this.scene.get('GameScene').events.emit('play-sound', SoundType.PLAYER_LEVEL_UP);
        
        // 更新UI
        this.updatePointsDisplay();
        this.createSkillTreeView();
        this.hideDetailPanel();
        
        // 显示解锁成功提示
        this.showUnlockSuccess(node);
    }
    
    /**
     * 显示解锁成功提示
     */
    private showUnlockSuccess(node: SkillTreeNode): void {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        const text = this.add.text(centerX, centerY, `${node.name} 解锁成功！`, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#00ff00',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5);
        text.setDepth(200);
        
        this.tweens.add({
            targets: text,
            y: centerY - 50,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
    
    /**
     * 创建关闭按钮
     */
    private createCloseButton(): void {
        const x = this.cameras.main.width - 50;
        const y = 40;
        
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xff4444, 0.3);
        btnBg.fillCircle(x, y, 25);
        btnBg.lineStyle(2, 0xff4444, 1);
        btnBg.strokeCircle(x, y, 25);
        this.container.add(btnBg);
        
        const btnText = this.add.text(x, y, 'X', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ff4444',
            fontFamily: 'Courier New, monospace'
        });
        btnText.setOrigin(0.5);
        this.container.add(btnText);
        
        const hitArea = this.add.circle(x, y, 25, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        this.container.add(hitArea);
        
        hitArea.on('pointerdown', () => {
            this.closeScene();
            this.scene.get('GameScene').events.emit('play-sound', SoundType.UI_CLICK);
        });
        
        hitArea.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xff4444, 0.5);
            btnBg.fillCircle(x, y, 25);
            btnBg.lineStyle(3, 0xff4444, 1);
            btnBg.strokeCircle(x, y, 25);
        });
        
        hitArea.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xff4444, 0.3);
            btnBg.fillCircle(x, y, 25);
            btnBg.lineStyle(2, 0xff4444, 1);
            btnBg.strokeCircle(x, y, 25);
        });
    }
    
    /**
     * 创建技能点显示
     */
    private createPointsDisplay(): void {
        const x = 50;
        const y = 40;
        
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.9);
        bg.fillRoundedRect(x - 40, y - 20, 180, 40, 8);
        bg.lineStyle(2, 0xffaa00, 1);
        bg.strokeRoundedRect(x - 40, y - 20, 180, 40, 8);
        this.container.add(bg);
        
        const label = this.add.text(x - 30, y, '技能点:', {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        label.setOrigin(0, 0.5);
        this.container.add(label);
        
        this.pointsText = this.add.text(x + 50, y, `${this.skillTreeState.availablePoints}`, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffaa00',
            fontFamily: 'Courier New, monospace'
        });
        this.pointsText.setOrigin(0, 0.5);
        this.container.add(this.pointsText);
    }
    
    /**
     * 更新技能点显示
     */
    private updatePointsDisplay(): void {
        this.pointsText.setText(`${this.skillTreeState.availablePoints}`);
        
        // 闪烁效果
        this.tweens.add({
            targets: this.pointsText,
            scale: { from: 1.3, to: 1 },
            duration: 200,
            ease: 'Back.out'
        });
    }
    
    /**
     * 播放入场动画
     */
    private playEnterAnimation(): void {
        this.container.setAlpha(0);
        this.container.setY(-50);
        
        this.tweens.add({
            targets: this.container,
            alpha: 1,
            y: 0,
            duration: 300,
            ease: 'Power2'
        });
    }
    
    /**
     * 关闭场景
     */
    private closeScene(): void {
        this.tweens.add({
            targets: this.container,
            alpha: 0,
            y: -50,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                // 获取游戏场景并恢复
                const gameScene = this.scene.get('GameScene') as any;
                if (gameScene) {
                    // 恢复物理引擎
                    if (gameScene.physics) {
                        gameScene.physics.resume();
                    }
                    // 恢复场景
                    gameScene.scene.resume();
                }
                // 停止技能树场景
                this.scene.stop();
            }
        });
    }
    
    /**
     * 场景关闭时清理
     */
    shutdown(): void {
        this.nodeElements.clear();
        this.connectionLines = [];
        this.branchTabs = [];
        this.detailPanel = null;
    }
}
