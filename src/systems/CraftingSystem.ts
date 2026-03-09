/**
 * 合成系统
 * 管理物品合成、配方查询、材料检查
 */

import { CraftingRecipe, CraftingState } from '../core/Types';
import { getRecipeById, getVisibleRecipes, findAvailableRecipes } from '../data/Crafting';
import { InventorySystem } from './InventorySystem';

/**
 * 合成系统类
 */
export class CraftingSystem {
    private inventory: InventorySystem;
    private state: CraftingState;
    private discoveredRecipes: Set<string> = new Set();

    constructor(inventory: InventorySystem) {
        this.inventory = inventory;
        this.state = {
            isCrafting: false,
            currentRecipe: null,
            progress: 0
        };

        // 自动发现所有可见配方
        this.discoverVisibleRecipes();
    }

    /**
     * 发现可见配方
     */
    private discoverVisibleRecipes(): void {
        const visibleRecipes = getVisibleRecipes();
        for (const recipe of visibleRecipes) {
            this.discoveredRecipes.add(recipe.id);
        }
    }

    /**
     * 发现新配方
     * @param recipeId 配方ID
     */
    public discoverRecipe(recipeId: string): void {
        this.discoveredRecipes.add(recipeId);
    }

    /**
     * 检查配方是否已发现
     * @param recipeId 配方ID
     * @returns 是否已发现
     */
    public isRecipeDiscovered(recipeId: string): boolean {
        return this.discoveredRecipes.has(recipeId);
    }

    /**
     * 获取所有已发现的配方
     */
    public getDiscoveredRecipes(): CraftingRecipe[] {
        const recipes: CraftingRecipe[] = [];
        for (const recipeId of this.discoveredRecipes) {
            const recipe = getRecipeById(recipeId);
            if (recipe) {
                recipes.push(recipe);
            }
        }
        return recipes;
    }

    /**
     * 获取可合成的配方列表
     */
    public getAvailableRecipes(): CraftingRecipe[] {
        const inventoryItems = this.buildInventoryMap();
        return findAvailableRecipes(inventoryItems);
    }

    /**
     * 构建背包物品映射
     */
    private buildInventoryMap(): Map<string, number> {
        const map = new Map<string, number>();
        const slots = this.inventory.getSlots();

        for (const slot of slots) {
            if (slot.item && slot.quantity > 0) {
                const currentCount = map.get(slot.item.id) || 0;
                map.set(slot.item.id, currentCount + slot.quantity);
            }
        }

        return map;
    }

    /**
     * 检查是否可以合成
     * @param recipe 合成配方
     * @returns 是否可以合成
     */
    public canCraft(recipe: CraftingRecipe): boolean {
        return this.inventory.hasItems(recipe.ingredients);
    }

    /**
     * 执行合成
     * @param recipeId 配方ID
     * @returns 是否合成成功
     */
    public craft(recipeId: string): boolean {
        const recipe = getRecipeById(recipeId);
        if (!recipe) return false;

        // 检查是否可以合成
        if (!this.canCraft(recipe)) return false;

        // 消耗材料
        for (const ingredient of recipe.ingredients) {
            this.inventory.removeItem(ingredient.itemId, ingredient.quantity);
        }

        // 添加结果物品
        const success = this.inventory.addItem(recipe.result.itemId, recipe.result.quantity);

        // 显示合成成功提示
        if (success) {
            // 这里可以添加合成成功特效
        }

        return success;
    }

    /**
     * 批量合成（用于测试）
     * @param recipeId 配方ID
     * @param count 合成次数
     * @returns 实际合成次数
     */
    public batchCraft(recipeId: string, count: number): number {
        let successCount = 0;
        for (let i = 0; i < count; i++) {
            if (this.craft(recipeId)) {
                successCount++;
            } else {
                break;
            }
        }
        return successCount;
    }

    /**
     * 获取合成状态
     */
    public getState(): CraftingState {
        return { ...this.state };
    }

    /**
     * 更新合成进度（每帧调用）
     * @param deltaTime 帧时间（毫秒）
     */
    public update(deltaTime: number): void {
        if (this.state.isCrafting) {
            // 更新合成进度
            // MVP阶段暂不实现动画效果
        }
    }

    /**
     * 序列化合成系统数据
     */
    public serialize(): object {
        return {
            discoveredRecipes: Array.from(this.discoveredRecipes)
        };
    }

    /**
     * 反序列化合成系统数据
     */
    public deserialize(data: any): void {
        if (!data) return;

        if (data.discoveredRecipes && Array.isArray(data.discoveredRecipes)) {
            this.discoveredRecipes = new Set(data.discoveredRecipes);
        }
    }
}
