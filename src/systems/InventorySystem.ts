/**
 * 物品系统
 * 管理物品获取、装备、使用、背包
 */

import { Item, InventorySlot, ItemType, ItemRarity } from '../core/Types';
import { getItemById } from '../data/Items';
import { GAME_CONFIG } from '../core/Config';

/**
 * 物品系统类
 */
export class InventorySystem {
    private slots: InventorySlot[];
    private maxSlots: number;
    private equippedWeapon: Item | null = null;
    private equippedArmor: Item | null = null;

    constructor(maxSlots: number = GAME_CONFIG.maxInventorySlots) {
        this.maxSlots = maxSlots;
        this.slots = this.createEmptySlots(maxSlots);
    }

    /**
     * 创建空的背包槽位
     */
    private createEmptySlots(count: number): InventorySlot[] {
        const slots: InventorySlot[] = [];
        for (let i = 0; i < count; i++) {
            slots.push({
                item: null,
                quantity: 0
            });
        }
        return slots;
    }

    /**
     * 添加物品到背包
     * @param itemId 物品ID
     * @param quantity 数量
     * @returns 是否添加成功
     */
    public addItem(itemId: string, quantity: number = 1): boolean {
        const item = getItemById(itemId);
        if (!item) return false;

        // 消耗品和材料可以堆叠
        if (item.type === ItemType.CONSUMABLE || item.type === ItemType.MATERIAL) {
            // 先尝试堆叠到现有槽位
            for (const slot of this.slots) {
                if (slot.item && slot.item.id === itemId && slot.quantity < 99) {
                    const canAdd = Math.min(quantity, 99 - slot.quantity);
                    slot.quantity += canAdd;
                    quantity -= canAdd;
                    if (quantity <= 0) return true;
                }
            }
        }

        // 寻找空槽位
        for (const slot of this.slots) {
            if (slot.item === null) {
                slot.item = item;
                slot.quantity = quantity;
                return true;
            }
        }

        // 背包已满
        return false;
    }

    /**
     * 从背包移除物品
     * @param itemId 物品ID
     * @param quantity 数量
     * @returns 是否移除成功
     */
    public removeItem(itemId: string, quantity: number = 1): boolean {
        let remaining = quantity;

        for (const slot of this.slots) {
            if (slot.item && slot.item.id === itemId) {
                if (slot.quantity >= remaining) {
                    slot.quantity -= remaining;
                    if (slot.quantity <= 0) {
                        slot.item = null;
                        slot.quantity = 0;
                    }
                    return true;
                } else {
                    remaining -= slot.quantity;
                    slot.item = null;
                    slot.quantity = 0;
                }
            }
        }

        return false;
    }

    /**
     * 获取物品数量
     * @param itemId 物品ID
     * @returns 物品数量
     */
    public getItemCount(itemId: string): number {
        let count = 0;
        for (const slot of this.slots) {
            if (slot.item && slot.item.id === itemId) {
                count += slot.quantity;
            }
        }
        return count;
    }

    /**
     * 检查是否有足够的物品
     * @param items 物品列表
     * @returns 是否足够
     */
    public hasItems(items: { itemId: string; quantity: number }[]): boolean {
        for (const item of items) {
            if (this.getItemCount(item.itemId) < item.quantity) {
                return false;
            }
        }
        return true;
    }

    /**
     * 装备武器
     * @param slotIndex 槽位索引
     * @returns 是否装备成功
     */
    public equipWeapon(slotIndex: number): boolean {
        const slot = this.slots[slotIndex];
        if (!slot.item || slot.item.type !== ItemType.WEAPON) return false;

        // 卸下当前武器
        const oldWeapon = this.equippedWeapon;
        this.equippedWeapon = slot.item;

        // 将旧武器放回背包
        if (oldWeapon) {
            slot.item = oldWeapon;
        } else {
            slot.item = null;
            slot.quantity = 0;
        }

        return true;
    }

    /**
     * 装备防具
     * @param slotIndex 槽位索引
     * @returns 是否装备成功
     */
    public equipArmor(slotIndex: number): boolean {
        const slot = this.slots[slotIndex];
        if (!slot.item || slot.item.type !== ItemType.ARMOR) return false;

        // 卸下当前防具
        const oldArmor = this.equippedArmor;
        this.equippedArmor = slot.item;

        // 将旧防具放回背包
        if (oldArmor) {
            slot.item = oldArmor;
        } else {
            slot.item = null;
            slot.quantity = 0;
        }

        return true;
    }

    /**
     * 获取当前装备的武器
     */
    public getEquippedWeapon(): Item | null {
        return this.equippedWeapon;
    }

    /**
     * 获取当前装备的防具
     */
    public getEquippedArmor(): Item | null {
        return this.equippedArmor;
    }

    /**
     * 计算装备提供的属性加成
     */
    public getEquipmentBonus(): any {
        const bonus: any = {
            attack: 0,
            defense: 0,
            attackSpeed: 0,
            critRate: 0,
            critDamage: 0,
            moveSpeed: 0,
            maxHp: 0,
            maxMana: 0
        };

        if (this.equippedWeapon && this.equippedWeapon.stats) {
            const stats = this.equippedWeapon.stats;
            if (stats.attack) bonus.attack += stats.attack;
            if (stats.attackSpeed) bonus.attackSpeed += stats.attackSpeed;
            if (stats.critRate) bonus.critRate += stats.critRate;
            if (stats.critDamage) bonus.critDamage += stats.critDamage;
        }

        if (this.equippedArmor && this.equippedArmor.stats) {
            const stats = this.equippedArmor.stats;
            if (stats.defense) bonus.defense += stats.defense;
            if (stats.maxHp) bonus.maxHp += stats.maxHp;
        }

        return bonus;
    }

    /**
     * 使用消耗品
     * @param slotIndex 槽位索引
     * @returns 使用结果（成功/失败/无效果）
     */
    public useConsumable(slotIndex: number): 'success' | 'failed' | 'no_effect' {
        const slot = this.slots[slotIndex];
        if (!slot.item || slot.item.type !== ItemType.CONSUMABLE) return 'failed';

        if (slot.quantity <= 0) return 'no_effect';

        // 消耗物品
        slot.quantity--;
        if (slot.quantity <= 0) {
            slot.item = null;
        }

        return 'success';
    }

    /**
     * 获取所有背包槽位
     */
    public getSlots(): InventorySlot[] {
        return [...this.slots];
    }

    /**
     * 获取指定槽位
     */
    public getSlot(slotIndex: number): InventorySlot {
        return this.slots[slotIndex];
    }

    /**
     * 清空背包
     */
    public clear(): void {
        this.slots = this.createEmptySlots(this.maxSlots);
        this.equippedWeapon = null;
        this.equippedArmor = null;
    }

    /**
     * 序列化背包数据
     */
    public serialize(): object {
        return {
            slots: this.slots,
            equippedWeapon: this.equippedWeapon?.id || null,
            equippedArmor: this.equippedArmor?.id || null
        };
    }

    /**
     * 反序列化背包数据
     */
    public deserialize(data: any): void {
        if (!data) return;

        this.slots = data.slots || this.createEmptySlots(this.maxSlots);
        if (data.equippedWeapon) {
            this.equippedWeapon = getItemById(data.equippedWeapon) || null;
        }
        if (data.equippedArmor) {
            this.equippedArmor = getItemById(data.equippedArmor) || null;
        }
    }
}
