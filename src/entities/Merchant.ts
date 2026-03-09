/**
 * 商人实体类
 * 处理商人交互、物品购买、配方解锁
 */

import Phaser from 'phaser';
import { Item } from '../core/Types';
import { InventorySystem } from '../systems/InventorySystem';
import { CraftingSystem } from '../systems/CraftingSystem';
import { getItemsByType, getItemById } from '../data/Items';

export default class Merchant extends Phaser.GameObjects.Sprite {
    private inventory: InventorySystem;
    private craftingSystem: CraftingSystem;
    private shopItems: Item[] = [];
    private isOpen: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // 使用临时占位图
        super(scene, x, y, 'tile_floor');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 设置商人外观
        this.setTint(0xffaa00); // 金色

        // 初始化商店
        this.inventory = new InventorySystem();
        this.craftingSystem = new CraftingSystem(this.inventory);

        // 生成商店物品
        this.generateShopItems();

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.setSize(32, 32);

        // 设置交互
        this.setInteractive();
        this.setupInteractions();
    }

    /**
     * 生成商店物品
     */
    private generateShopItems(): void {
        // 随机选择一些物品出售
        const allConsumables = getItemsByType('consumable' as any);
        const allWeapons = getItemsByType('weapon' as any);
        const allArmors = getItemsByType('armor' as any);

        // 随机选择2个消耗品
        for (let i = 0; i < 2; i++) {
            const randomIndex = Phaser.Math.Between(0, allConsumables.length - 1);
            this.shopItems.push(allConsumables[randomIndex]);
        }

        // 随机选择1个武器
        const weaponIndex = Phaser.Math.Between(0, allWeapons.length - 1);
        this.shopItems.push(allWeapons[weaponIndex]);

        // 随机选择1个防具
        const armorIndex = Phaser.Math.Between(0, allArmors.length - 1);
        this.shopItems.push(allArmors[armorIndex]);
    }

    /**
     * 设置交互
     */
    private setupInteractions(): void {
        this.on('pointerdown', () => {
            this.openShop();
        });

        this.on('pointerover', () => {
            this.setTint(0xffdd44);
        });

        this.on('pointerout', () => {
            this.setTint(0xffaa00);
        });
    }

    /**
     * 打开商店
     */
    private openShop(): void {
        if (this.isOpen) return;
        this.isOpen = true;

        // 创建商店UI
        this.createShopUI();
    }

    /**
     * 创建商店UI
     */
    private createShopUI(): void {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        // 创建背景
        const bg = this.scene.add.rectangle(
            width / 2,
            height / 2,
            800,
            500,
            0x1a1a2e,
            0.95
        );
        bg.setInteractive();

        // 创建标题
        const title = this.scene.add.text(
            width / 2,
            height / 2 - 200,
            '黑市商人',
            {
                fontSize: '32px',
                fontStyle: 'bold',
                color: '#ffaa00',
                fontFamily: 'Courier New, monospace'
            }
        );
        title.setOrigin(0.5);

        // 创建物品列表
        const startY = height / 2 - 100;
        const itemHeight = 80;
        const gap = 10;

        this.shopItems.forEach((item, index) => {
            const y = startY + index * (itemHeight + gap);
            this.createShopItem(width / 2 - 350, y, item);
        });

        // 创建关闭按钮
        this.createCloseButton(width / 2, height / 2 + 200, () => {
            this.closeShop();
            bg.destroy();
            title.destroy();
        });
    }

    /**
     * 创建商店物品
     */
    private createShopItem(x: number, y: number, item: Item, itemHeight: number = 80): void {
        // 物品背景
        const bg = this.scene.add.rectangle(x, y, 700, itemHeight, 0x0f0f1f, 1);
        bg.setStrokeStyle(2, 0x00ffff, 1);
        bg.setInteractive();

        // 物品名称
        const name = this.scene.add.text(
            x + 80,
            y,
            item.name,
            {
                fontSize: '20px',
                fontStyle: 'bold',
                color: this.getRarityColor(item.rarity),
                fontFamily: 'Courier New, monospace'
            }
        );
        name.setOrigin(0, 0.5);

        // 物品描述
        const description = this.scene.add.text(
            x + 80,
            y + 25,
            item.description,
            {
                fontSize: '14px',
                color: '#aaaaaa',
                fontFamily: 'Courier New, monospace'
            }
        );
        description.setOrigin(0, 0.5);

        // 物品价格（MVP阶段简化为固定价格）
        const price = this.getItemPrice(item);
        const priceText = this.scene.add.text(
            x + 600,
            y,
            `${price}G`,
            {
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#ffaa00',
                fontFamily: 'Courier New, monospace'
            }
        );
        priceText.setOrigin(0.5);

        // 购买按钮
        const buyButton = this.scene.add.text(
            x + 650,
            y,
            '购买',
            {
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace'
            }
        );
        buyButton.setOrigin(0.5);
        buyButton.setInteractive();

        // 添加按钮交互
        buyButton.on('pointerover', () => {
            buyButton.setColor('#ffffff');
        });

        buyButton.on('pointerout', () => {
            buyButton.setColor('#00ffff');
        });

        buyButton.on('pointerdown', () => {
            this.buyItem(item, price);
        });
    }

    /**
     * 创建关闭按钮
     */
    private createCloseButton(x: number, y: number, callback: () => void): void {
        const button = this.scene.add.text(x, y, '关闭', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#00ffff',
            fontFamily: 'Courier New, monospace'
        });
        button.setOrigin(0.5);
        button.setInteractive();

        button.on('pointerover', () => {
            button.setColor('#ffffff');
        });

        button.on('pointerout', () => {
            button.setColor('#00ffff');
        });

        button.on('pointerdown', () => {
            callback();
        });
    }

    /**
     * 关闭商店
     */
    private closeShop(): void {
        this.isOpen = false;

        // 清除所有商店UI元素
        // 这里简化处理，实际开发中应该使用容器管理
    }

    /**
     * 购买物品
     */
    private buyItem(item: Item, price: number): void {
        // MVP阶段简化处理，直接添加物品
        // 实际开发中需要检查金币、扣除金币等
        console.log(`Buying ${item.name} for ${price}G`);

        // 触发事件通知玩家添加物品
        const player = this.scene.children.list.find(
            (child: any) => child.constructor.name === 'Player'
        ) as any;

        if (player) {
            player.addItem(item.id);
        }
    }

    /**
     * 获取物品价格
     */
    private getItemPrice(item: Item): number {
        // MVP阶段简化为基于稀有度的固定价格
        switch (item.rarity) {
            case 'common':
                return 50;
            case 'rare':
                return 150;
            case 'epic':
                return 400;
            case 'legendary':
                return 1000;
            case 'ultimate':
                return 5000;
            default:
                return 100;
        }
    }

    /**
     * 获取稀有度颜色
     */
    private getRarityColor(rarity: any): string {
        switch (rarity) {
            case 'common':
                return '#808080';
            case 'rare':
                return '#4488ff';
            case 'epic':
                return '#aa44ff';
            case 'legendary':
                return '#ff8800';
            case 'ultimate':
                return '#ffff00';
            default:
                return '#ffffff';
        }
    }
}
