/**
 * 游戏全局配置
 * 定义游戏的核心参数和常量
 */

export const GAME_CONFIG = {
    // 屏幕配置（游戏窗口大小）
    width: 1280,
    height: 720,

    // 世界配置（实际地图大小）
    worldWidth: 3200,
    worldHeight: 2400,

    // 瓦片配置
    tileSize: 32,

    // 背包配置
    maxInventorySlots: 20,

    // 玩家基础属性
    player: {
        baseHp: 100,
        baseAttack: 10,
        baseDefense: 5,
        baseMoveSpeed: 200,
        baseCritRate: 0.05,
        baseCritDamage: 1.5,
        baseMana: 50,
        manaRegenPerSecond: 1
    },

    // 关卡配置
    level: {
        duration: 600, // 10分钟（秒）
        width: 100,     // 地图宽度（瓦片数）
        height: 75,    // 地图高度（瓦片数）
        enemyCount: 10,
        eliteCount: 1,
        enemyRespawnTime: 10, // 敌人重生时间（秒）
        enemySpawnInterval: 3000, // 敌人生成间隔（毫秒）
        maxEnemies: 20 // 最大敌人数量
    },

    // 合成配置
    crafting: {
        commonToRare: 2,        // 合成稀有需要普通物品数量
        rareToEpic: 3,          // 合成史诗需要稀有物品数量
        epicToLegendary: 4,     // 合成传说需要史诗物品数量
        commonGear: 5,          // 升级到史诗需要的齿轮数量
        rareChip: 3             // 升级到传说需要的芯片数量
    },

    // 战斗配置
    combat: {
        baseAttackRange: 50,      // 基础攻击范围（像素）
        baseSkillRange: 150,      // 基础技能范围（像素）
        stunDuration: 1000,       // 眩晕持续时间（毫秒）
        comboResetTime: 2000,     // 连击重置时间（毫秒）
        damageDisplayDuration: 1000 // 伤害数字显示持续时间（毫秒）
    },

    // UI配置
    ui: {
        healthBarWidth: 200,
        healthBarHeight: 20,
        manaBarWidth: 200,
        manaBarHeight: 15,
        skillIconSize: 50,
        skillBarHeight: 60
    },

    // 颜色配置
    colors: {
        health: '#ff4444',
        mana: '#4444ff',
        common: '#808080',
        rare: '#4488ff',
        epic: '#aa44ff',
        legendary: '#ff8800',
        ultimate: '#ffff00',
        crit: '#ffff00',
        normal: '#ffffff'
    }
};

/**
 * 物品质级枚举
 */
export enum ItemRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary',
    ULTIMATE = 'ultimate'
}

/**
 * 物品类型枚举
 */
export enum ItemType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    CONSUMABLE = 'consumable',
    MATERIAL = 'material'
}

/**
 * 敌人类型枚举
 */
export enum EnemyType {
    COMMON = 'common',
    ELITE = 'elite',
    BOSS = 'boss'
}

/**
 * 技能类型枚举
 */
export enum SkillType {
    SLASH = 'slash',
    SPIN = 'spin',
    DASH = 'dash',
    HEAL = 'heal',
    SHIELD = 'shield',
    BLINK = 'blink'
}

/**
 * 技能分支枚举
 */
export enum SkillBranch {
    OFFENSE = 'offense',
    DEFENSE = 'defense',
    UTILITY = 'utility'
}
