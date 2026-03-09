/**
 * 合成系统数据定义
 * 定义MVP阶段的所有合成配方
 */

import { CraftingRecipe } from '../core/Types';

/**
 * MVP 合成配方列表
 */
export const MVP_RECIPES: CraftingRecipe[] = [
    // ========== 武器升级 ==========
    {
        id: 'recipe_weapon_common_to_rare',
        name: '热能武士刀合成',
        ingredients: [
            { itemId: 'weapon_common_vibroblade', quantity: 2 }
        ],
        result: { itemId: 'weapon_rare_heatkatana', quantity: 1 },
        category: 'upgrade',
        isHidden: false
    },
    {
        id: 'recipe_weapon_rare_to_epic',
        name: '高频振刃合成',
        ingredients: [
            { itemId: 'weapon_rare_heatkatana', quantity: 2 },
            { itemId: 'material_gear', quantity: 5 }
        ],
        result: { itemId: 'weapon_epic_highfreqblade', quantity: 1 },
        category: 'upgrade',
        isHidden: false
    },
    {
        id: 'recipe_weapon_epic_to_legendary',
        name: '雷电战斧合成',
        ingredients: [
            { itemId: 'weapon_epic_highfreqblade', quantity: 2 },
            { itemId: 'material_chip', quantity: 3 }
        ],
        result: { itemId: 'weapon_legendary_thunderaxe', quantity: 1 },
        category: 'upgrade',
        isHidden: false
    },

    // ========== 防具升级 ==========
    {
        id: 'recipe_armor_common_to_rare',
        name: '凯夫拉护甲合成',
        ingredients: [
            { itemId: 'armor_common_jacket', quantity: 2 }
        ],
        result: { itemId: 'armor_rare_kevlar', quantity: 1 },
        category: 'upgrade',
        isHidden: false
    },

    // ========== 特殊配方（隐藏） ==========
    // 这里的配方是隐藏的，玩家需要通过探索或提示解锁
    {
        id: 'recipe_hidden_vaporblast',
        name: '蒸汽爆破刃合成',
        ingredients: [
            { itemId: 'weapon_rare_heatkatana', quantity: 1 },
            { itemId: 'consumable_shield', quantity: 1 }
        ],
        result: { itemId: 'weapon_epic_vaporblast', quantity: 1 },
        category: 'fusion',
        isHidden: true
    }
];

/**
 * 根据ID获取配方
 */
export function getRecipeById(id: string): CraftingRecipe | undefined {
    return MVP_RECIPES.find(recipe => recipe.id === id);
}

/**
 * 根据类型获取配方列表
 */
export function getRecipesByCategory(category: 'upgrade' | 'fusion' | 'enhance'): CraftingRecipe[] {
    return MVP_RECIPES.filter(recipe => recipe.category === category);
}

/**
 * 获取所有可显示的配方
 */
export function getVisibleRecipes(): CraftingRecipe[] {
    return MVP_RECIPES.filter(recipe => !recipe.isHidden);
}

/**
 * 根据材料查找可用配方
 */
export function findAvailableRecipes(inventoryItems: Map<string, number>): CraftingRecipe[] {
    const availableRecipes: CraftingRecipe[] = [];

    for (const recipe of MVP_RECIPES) {
        if (recipe.isHidden) continue;

        let canCraft = true;
        for (const ingredient of recipe.ingredients) {
            const hasQuantity = inventoryItems.get(ingredient.itemId) || 0;
            if (hasQuantity < ingredient.quantity) {
                canCraft = false;
                break;
            }
        }

        if (canCraft) {
            availableRecipes.push(recipe);
        }
    }

    return availableRecipes;
}
