/**
 * 合成系统场景 - 赛博朋克风格
 * 显示武器合成、升级和强化界面
 */

import Phaser from 'phaser';
import { CraftingRecipe, CraftingMaterial, Weapon } from '../core/Types';
import { ItemRarity } from '../core/Config';
import Player from '../entities/Player';
import { WEAPONS, getWeaponById } from '../data/Weapons';

export default class CraftingScene extends Phaser.Scene {
    private player!: Player;
    private recipes: CraftingRecipe[] = [];
    private selectedRecipe: CraftingRecipe | null = null;
    private craftButton!: Phaser.GameObjects.Container;
    private resultPreview!: Phaser.GameObjects.Container;
    private materialsContainer!: Phaser.GameObjects.Container;
    private onCloseCallback?: () => void;

    constructor() {
        super({ key: 'CraftingScene', active: false });
    }

    /**
     * 初始化场景
     */
    init(data: { player: Player; onClose?: () => void }): void {
        this.player = data.player;
        this.onCloseCallback = data.onClose;
        this.initializeRecipes();
    }

    /**
     * 创建场景
     */
    create(): void {
        // 半透明背景
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, this.cameras.main.height), Phaser.Geom.Rectangle.Contains);

        // 创建合成面板
        this.createCraftingPanel();

        // 创建配方列表
        this.createRecipeList();

        // 创建材料显示区
        this.createMaterialsArea();

        // 创建结果预览区
        this.createResultPreview();

        // 创建合成按钮
        this.createCraftButton();

        // 创建关闭按钮
        this.createCloseButton();

        // 创建快捷键提示
        this.createKeyHints();

        // 监听ESC键关闭
        this.input.keyboard!.on('keydown-ESC', () => {
            this.closeScene();
        });
    }

    /**
     * 初始化合成配方
     */
    private initializeRecipes(): void {
        // 武器升级配方 - 将低稀有度武器升级为高稀有度
        this.recipes = [
            // 基础武器合成
            {
                id: 'craft_basic_sword',
                name: '基础长剑',
                ingredients: [],
                result: { itemId: 'weapon_basic_sword', quantity: 1 },
                category: 'upgrade'
            },
            {
                id: 'craft_basic_blade',
                name: '基础刀刃',
                ingredients: [],
                result: { itemId: 'weapon_basic_blade', quantity: 1 },
                category: 'upgrade'
            },
            {
                id: 'craft_basic_dagger',
                name: '基础匕首',
                ingredients: [],
                result: { itemId: 'weapon_basic_dagger', quantity: 1 },
                category: 'upgrade'
            },
            // 武器升级配方
            {
                id: 'upgrade_cyber_blade',
                name: '赛博刀锋升级',
                ingredients: [
                    { itemId: 'weapon_basic_blade', quantity: 2 }
                ],
                result: { itemId: 'weapon_cyber_blade', quantity: 1 },
                category: 'upgrade'
            },
            {
                id: 'upgrade_plasma_staff',
                name: '等离子法杖合成',
                ingredients: [
                    { itemId: 'weapon_basic_sword', quantity: 2 }
                ],
                result: { itemId: 'weapon_plasma_staff', quantity: 1 },
                category: 'fusion'
            },
            {
                id: 'upgrade_quick_dagger',
                name: '迅捷匕首升级',
                ingredients: [
                    { itemId: 'weapon_basic_dagger', quantity: 2 }
                ],
                result: { itemId: 'weapon_quick_dagger', quantity: 1 },
                category: 'upgrade'
            },
            // 史诗武器合成
            {
                id: 'craft_neon_sword',
                name: '霓虹斩击剑合成',
                ingredients: [
                    { itemId: 'weapon_cyber_blade', quantity: 1 },
                    { itemId: 'weapon_basic_sword', quantity: 1 }
                ],
                result: { itemId: 'weapon_neon_sword', quantity: 1 },
                category: 'fusion'
            },
            {
                id: 'craft_quantum_hammer',
                name: '量子重锤合成',
                ingredients: [
                    { itemId: 'weapon_plasma_staff', quantity: 1 },
                    { itemId: 'weapon_basic_blade', quantity: 1 }
                ],
                result: { itemId: 'weapon_quantum_hammer', quantity: 1 },
                category: 'fusion'
            },
            // 传说武器合成
            {
                id: 'craft_void_blade',
                name: '虚空之刃合成',
                ingredients: [
                    { itemId: 'weapon_neon_sword', quantity: 1 },
                    { itemId: 'weapon_cyber_blade', quantity: 1 }
                ],
                result: { itemId: 'weapon_void_blade', quantity: 1 },
                category: 'fusion'
            }
        ];
    }

    /**
     * 创建合成面板
     */
    private createCraftingPanel(): void {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const panelWidth = 700;
        const panelHeight = 450;

        // 面板背景
        const panel = this.add.graphics();
        
        // 外发光
        panel.fillStyle(0xff00ff, 0.1);
        panel.fillRoundedRect(centerX - panelWidth/2 - 4, centerY - panelHeight/2 - 4, panelWidth + 8, panelHeight + 8, 16);
        
        // 主面板
        panel.fillStyle(0x0a0a1a, 0.95);
        panel.fillRoundedRect(centerX - panelWidth/2, centerY - panelHeight/2, panelWidth, panelHeight, 12);
        
        // 霓虹边框
        panel.lineStyle(2, 0xff00ff, 0.8);
        panel.strokeRoundedRect(centerX - panelWidth/2, centerY - panelHeight/2, panelWidth, panelHeight, 12);

        // 标题
        const title = this.add.text(centerX, centerY - panelHeight/2 + 30, '⟡ WEAPON CRAFTING SYSTEM ⟡', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5);

        // 分隔线
        const divider = this.add.graphics();
        divider.lineStyle(1, 0xff00ff, 0.3);
        divider.moveTo(centerX - panelWidth/2 + 20, centerY - panelHeight/2 + 60);
        divider.lineTo(centerX + panelWidth/2 - 20, centerY - panelHeight/2 + 60);
        divider.strokePath();
    }

    /**
     * 创建配方列表
     */
    private createRecipeList(): void {
        const startX = this.cameras.main.width / 2 - 320;
        const startY = this.cameras.main.height / 2 - 140;
        const recipeWidth = 280;
        const recipeHeight = 50;

        // 标签
        const label = this.add.text(startX, startY - 25, 'RECIPES', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });

        // 创建配方项
        this.recipes.forEach((recipe, index) => {
            const y = startY + index * (recipeHeight + 8);
            const resultWeapon = getWeaponById(recipe.result.itemId);
            if (!resultWeapon) return;

            const container = this.add.container(startX, y);
            
            // 背景
            const bg = this.add.graphics();
            bg.fillStyle(0x1a1a2e, 0.8);
            bg.fillRoundedRect(0, 0, recipeWidth, recipeHeight, 6);
            bg.lineStyle(1, 0x333344, 0.8);
            bg.strokeRoundedRect(0, 0, recipeWidth, recipeHeight, 6);
            container.add(bg);

            // 武器图标
            const rarityColors: Record<string, number> = {
                'common': 0x888888,
                'rare': 0x4488ff,
                'epic': 0xaa44ff,
                'legendary': 0xffaa00,
                'ultimate': 0xff4444
            };
            const iconColor = rarityColors[resultWeapon.rarity] || 0xffffff;
            
            const iconBg = this.add.graphics();
            iconBg.fillStyle(iconColor, 0.2);
            iconBg.fillRoundedRect(8, 8, 34, 34, 4);
            iconBg.lineStyle(1, iconColor, 0.8);
            iconBg.strokeRoundedRect(8, 8, 34, 34, 4);
            container.add(iconBg);

            // 武器图标
            const iconKey = `weapon_${resultWeapon.type}`;
            const icon = this.add.image(25, 25, iconKey);
            icon.setDisplaySize(26, 26);
            container.add(icon);

            // 配方名称
            const nameText = this.add.text(50, 10, recipe.name, {
                fontSize: '13px',
                fontStyle: 'bold',
                color: `#${iconColor.toString(16).padStart(6, '0')}`,
                fontFamily: 'Courier New, monospace'
            });
            container.add(nameText);

            // 武器属性
            const statsText = this.add.text(50, 28, `ATK:${resultWeapon.attack} SPD:${resultWeapon.attackSpeed.toFixed(1)}`, {
                fontSize: '10px',
                color: '#888899',
                fontFamily: 'Courier New, monospace'
            });
            container.add(statsText);

            // 分类标签
            const categoryColors: Record<string, number> = {
                'upgrade': 0x44ff44,
                'fusion': 0xff8800,
                'enhance': 0x4488ff
            };
            const categoryLabel = this.add.text(recipeWidth - 55, 18, recipe.category.toUpperCase(), {
                fontSize: '9px',
                color: `#${(categoryColors[recipe.category] || 0xffffff).toString(16).padStart(6, '0')}`,
                fontFamily: 'Courier New, monospace'
            });
            container.add(categoryLabel);

            // 交互
            const hitArea = this.add.rectangle(recipeWidth/2, recipeHeight/2, recipeWidth, recipeHeight, 0x000000, 0);
            hitArea.setInteractive({ useHandCursor: true });
            container.add(hitArea);

            hitArea.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0x2a2a3e, 1);
                bg.fillRoundedRect(0, 0, recipeWidth, recipeHeight, 6);
                bg.lineStyle(2, iconColor, 0.8);
                bg.strokeRoundedRect(0, 0, recipeWidth, recipeHeight, 6);
            });

            hitArea.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0x1a1a2e, 0.8);
                bg.fillRoundedRect(0, 0, recipeWidth, recipeHeight, 6);
                bg.lineStyle(1, 0x333344, 0.8);
                bg.strokeRoundedRect(0, 0, recipeWidth, recipeHeight, 6);
            });

            hitArea.on('pointerdown', () => {
                this.selectRecipe(recipe);
            });
        });
    }

    /**
     * 选择配方
     */
    private selectRecipe(recipe: CraftingRecipe): void {
        this.selectedRecipe = recipe;
        this.updateMaterialsDisplay();
        this.updateResultPreview();
        this.updateCraftButton();
    }

    /**
     * 创建材料显示区
     */
    private createMaterialsArea(): void {
        const x = this.cameras.main.width / 2 + 20;
        const y = this.cameras.main.height / 2 - 140;

        // 标签
        const label = this.add.text(x, y - 25, 'MATERIALS REQUIRED', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });

        // 容器
        this.materialsContainer = this.add.container(x, y);

        // 提示文字
        const hint = this.add.text(120, 60, 'Select a recipe to view materials', {
            fontSize: '12px',
            color: '#666677',
            fontFamily: 'Courier New, monospace'
        });
        hint.setOrigin(0.5);
        this.materialsContainer.add(hint);
    }

    /**
     * 更新材料显示
     */
    private updateMaterialsDisplay(): void {
        this.materialsContainer.removeAll(true);

        if (!this.selectedRecipe) {
            const hint = this.add.text(120, 60, 'Select a recipe to view materials', {
                fontSize: '12px',
                color: '#666677',
                fontFamily: 'Courier New, monospace'
            });
            hint.setOrigin(0.5);
            this.materialsContainer.add(hint);
            return;
        }

        const materials = this.selectedRecipe.ingredients;
        
        if (materials.length === 0) {
            // 无需材料（基础武器）
            const freeText = this.add.text(120, 40, '✓ NO MATERIALS REQUIRED', {
                fontSize: '14px',
                fontStyle: 'bold',
                color: '#44ff44',
                fontFamily: 'Courier New, monospace'
            });
            freeText.setOrigin(0.5);
            this.materialsContainer.add(freeText);

            const hintText = this.add.text(120, 70, 'Free to craft!', {
                fontSize: '12px',
                color: '#888899',
                fontFamily: 'Courier New, monospace'
            });
            hintText.setOrigin(0.5);
            this.materialsContainer.add(hintText);
            return;
        }

        // 显示所需材料
        materials.forEach((material, index) => {
            const y = index * 50;
            const weapon = getWeaponById(material.itemId);
            if (!weapon) return;

            const ownedWeapons = this.player.getOwnedWeapons();
            const ownedCount = ownedWeapons.filter(w => w.id === weapon.id).length;
            const hasEnough = ownedCount >= material.quantity;

            // 材料背景
            const bg = this.add.graphics();
            bg.fillStyle(0x1a1a2e, hasEnough ? 0.6 : 0.8);
            bg.fillRoundedRect(0, y, 240, 40, 4);
            bg.lineStyle(1, hasEnough ? 0x44ff44 : 0xff4444, 0.8);
            bg.strokeRoundedRect(0, y, 240, 40, 4);
            this.materialsContainer.add(bg);

            // 武器名称
            const nameText = this.add.text(10, y + 12, weapon.name, {
                fontSize: '13px',
                color: hasEnough ? '#ffffff' : '#ff6666',
                fontFamily: 'Courier New, monospace'
            });
            this.materialsContainer.add(nameText);

            // 数量
            const countText = this.add.text(180, y + 12, `${ownedCount}/${material.quantity}`, {
                fontSize: '13px',
                fontStyle: 'bold',
                color: hasEnough ? '#44ff44' : '#ff4444',
                fontFamily: 'Courier New, monospace'
            });
            this.materialsContainer.add(countText);

            // 状态图标
            const statusIcon = this.add.text(220, y + 12, hasEnough ? '✓' : '✗', {
                fontSize: '14px',
                color: hasEnough ? '#44ff44' : '#ff4444',
                fontFamily: 'Courier New, monospace'
            });
            this.materialsContainer.add(statusIcon);
        });
    }

    /**
     * 创建结果预览区
     */
    private createResultPreview(): void {
        const x = this.cameras.main.width / 2 + 20;
        const y = this.cameras.main.height / 2 + 60;

        // 标签
        const label = this.add.text(x, y - 25, 'RESULT PREVIEW', {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });

        // 容器
        this.resultPreview = this.add.container(x, y);
    }

    /**
     * 更新结果预览
     */
    private updateResultPreview(): void {
        this.resultPreview.removeAll(true);

        if (!this.selectedRecipe) {
            const hint = this.add.text(120, 40, 'No recipe selected', {
                fontSize: '12px',
                color: '#666677',
                fontFamily: 'Courier New, monospace'
            });
            hint.setOrigin(0.5);
            this.resultPreview.add(hint);
            return;
        }

        const resultWeapon = getWeaponById(this.selectedRecipe.result.itemId);
        if (!resultWeapon) return;

        const rarityColors: Record<string, number> = {
            'common': 0x888888,
            'rare': 0x4488ff,
            'epic': 0xaa44ff,
            'legendary': 0xffaa00,
            'ultimate': 0xff4444
        };
        const color = rarityColors[resultWeapon.rarity] || 0xffffff;

        // 武器图标背景
        const iconBg = this.add.graphics();
        iconBg.fillStyle(color, 0.2);
        iconBg.fillRoundedRect(80, 0, 80, 80, 8);
        iconBg.lineStyle(2, color, 1);
        iconBg.strokeRoundedRect(80, 0, 80, 80, 8);
        this.resultPreview.add(iconBg);

        // 武器图标
        const iconKey = `weapon_${resultWeapon.type}`;
        const icon = this.add.image(120, 40, iconKey);
        icon.setDisplaySize(60, 60);
        this.resultPreview.add(icon);

        // 武器名称
        const nameText = this.add.text(120, 95, resultWeapon.name, {
            fontSize: '16px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        nameText.setOrigin(0.5);
        this.resultPreview.add(nameText);

        // 武器属性
        const statsText = this.add.text(120, 115, `ATK: ${resultWeapon.attack} | SPD: ${resultWeapon.attackSpeed.toFixed(1)} | CRIT: ${(resultWeapon.critRate * 100).toFixed(0)}%`, {
            fontSize: '11px',
            color: '#888899',
            fontFamily: 'Courier New, monospace'
        });
        statsText.setOrigin(0.5);
        this.resultPreview.add(statsText);

        // 特殊效果
        if (resultWeapon.specialEffect) {
            const effectText = this.add.text(120, 135, `⚡ ${resultWeapon.specialEffect}`, {
                fontSize: '10px',
                color: '#ffaa00',
                fontFamily: 'Courier New, monospace',
                wordWrap: { width: 240 }
            });
            effectText.setOrigin(0.5);
            this.resultPreview.add(effectText);
        }
    }

    /**
     * 创建合成按钮
     */
    private createCraftButton(): void {
        const x = this.cameras.main.width / 2 + 140;
        const y = this.cameras.main.height / 2 + 170;

        this.craftButton = this.add.container(x, y);

        // 按钮背景
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRoundedRect(0, 0, 150, 50, 8);
        bg.lineStyle(2, 0x666688, 0.8);
        bg.strokeRoundedRect(0, 0, 150, 50, 8);
        this.craftButton.add(bg);

        // 按钮文字
        const text = this.add.text(75, 25, 'CRAFT', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#666688',
            fontFamily: 'Courier New, monospace'
        });
        text.setOrigin(0.5);
        text.setName('buttonText');
        this.craftButton.add(text);

        // 交互区域
        const hitArea = this.add.rectangle(75, 25, 150, 50, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        this.craftButton.add(hitArea);

        hitArea.on('pointerdown', () => {
            this.attemptCraft();
        });
    }

    /**
     * 更新合成按钮状态
     */
    private updateCraftButton(): void {
        const text = this.craftButton.getByName('buttonText') as Phaser.GameObjects.Text;
        const bg = this.craftButton.getAt(0) as Phaser.GameObjects.Graphics;
        
        if (!this.selectedRecipe) {
            text.setColor('#666688');
            bg.clear();
            bg.fillStyle(0x1a1a2e, 1);
            bg.fillRoundedRect(0, 0, 150, 50, 8);
            bg.lineStyle(2, 0x666688, 0.8);
            bg.strokeRoundedRect(0, 0, 150, 50, 8);
            return;
        }

        const canCraft = this.canCraftRecipe(this.selectedRecipe);
        
        text.setColor(canCraft ? '#44ff44' : '#ff4444');
        bg.clear();
        bg.fillStyle(canCraft ? 0x1a2a1a : 0x2a1a1a, 1);
        bg.fillRoundedRect(0, 0, 150, 50, 8);
        bg.lineStyle(2, canCraft ? 0x44ff44 : 0xff4444, 0.8);
        bg.strokeRoundedRect(0, 0, 150, 50, 8);
    }

    /**
     * 检查是否可以合成
     */
    private canCraftRecipe(recipe: CraftingRecipe): boolean {
        const ownedWeapons = this.player.getOwnedWeapons();

        for (const material of recipe.ingredients) {
            const count = ownedWeapons.filter(w => w.id === material.itemId).length;
            if (count < material.quantity) return false;
        }

        return true;
    }

    /**
     * 尝试合成
     */
    private attemptCraft(): void {
        if (!this.selectedRecipe) return;
        if (!this.canCraftRecipe(this.selectedRecipe)) {
            this.showMessage('Not enough materials!', 0xff4444);
            return;
        }

        // 执行合成
        this.performCraft(this.selectedRecipe);
    }

    /**
     * 执行合成
     */
    private performCraft(recipe: CraftingRecipe): void {
        // 移除材料
        const ownedWeapons = this.player.getOwnedWeapons();
        for (const material of recipe.ingredients) {
            let removed = 0;
            for (let i = ownedWeapons.length - 1; i >= 0 && removed < material.quantity; i--) {
                if (ownedWeapons[i].id === material.itemId) {
                    ownedWeapons.splice(i, 1);
                    removed++;
                }
            }
        }

        // 添加结果武器
        const resultWeapon = getWeaponById(recipe.result.itemId);
        if (resultWeapon) {
            this.player.equipWeapon(resultWeapon);
            this.showMessage(`Crafted: ${resultWeapon.name}!`, 0x44ff44);
        }

        // 刷新显示
        this.updateMaterialsDisplay();
        this.updateCraftButton();
    }

    /**
     * 显示消息
     */
    private showMessage(message: string, color: number): void {
        const text = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, message, {
            fontSize: '24px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 3
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.tweens.add({
            targets: text,
            y: this.cameras.main.height / 2 - 50,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * 创建关闭按钮
     */
    private createCloseButton(): void {
        const x = this.cameras.main.width / 2 + 330;
        const y = this.cameras.main.height / 2 - 195;

        const button = this.add.container(x, y);

        // 按钮
        const bg = this.add.graphics();
        bg.fillStyle(0xff4444, 0.2);
        bg.fillRoundedRect(0, 0, 30, 30, 4);
        bg.lineStyle(1, 0xff4444, 0.8);
        bg.strokeRoundedRect(0, 0, 30, 30, 4);
        button.add(bg);

        // X图标
        const xIcon = this.add.text(15, 15, '✕', {
            fontSize: '18px',
            color: '#ff4444',
            fontFamily: 'Courier New, monospace'
        });
        xIcon.setOrigin(0.5);
        button.add(xIcon);

        // 交互
        const hitArea = this.add.rectangle(15, 15, 30, 30, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        button.add(hitArea);

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0xff4444, 0.4);
            bg.fillRoundedRect(0, 0, 30, 30, 4);
            bg.lineStyle(2, 0xff4444, 1);
            bg.strokeRoundedRect(0, 0, 30, 30, 4);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0xff4444, 0.2);
            bg.fillRoundedRect(0, 0, 30, 30, 4);
            bg.lineStyle(1, 0xff4444, 0.8);
            bg.strokeRoundedRect(0, 0, 30, 30, 4);
        });

        hitArea.on('pointerdown', () => {
            this.closeScene();
        });
    }

    /**
     * 创建快捷键提示
     */
    private createKeyHints(): void {
        const hint = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 210, 
            'ESC to close | Click recipe to select | Click CRAFT to create', {
            fontSize: '11px',
            color: '#666677',
            fontFamily: 'Courier New, monospace'
        });
        hint.setOrigin(0.5);
    }

    /**
     * 关闭场景
     */
    private closeScene(): void {
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
        this.scene.stop();
    }
}
