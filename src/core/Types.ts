/**
 * 核心类型定义
 * 定义游戏主要数据结构和接口
 */

// Import and re-export enums from Config for convenience
import { ItemRarity, ItemType, EnemyType, SkillType, SkillBranch } from './Config';
export { ItemRarity, ItemType, EnemyType, SkillType, SkillBranch };

// ============ 战斗系统类型 ============

/**
 * 战斗属性
 */
export interface CombatStats {
    hp: number;              // 当前生命值
    maxHp: number;           // 最大生命值
    attack: number;          // 攻击力
    defense: number;        // 防御力
    attackSpeed: number;     // 攻击速度（次/秒）
    critRate: number;        // 暴击率（0-1）
    critDamage: number;      // 暴击伤害倍率
    moveSpeed: number;       // 移动速度
    mana?: number;          // 当前法力值
    maxMana?: number;       // 最大法力值
    manaRegenPerSecond?: number; // 法力值恢复速度
}

/**
 * 战斗状态
 */
export interface CombatState {
    isAttacking: boolean;    // 是否正在攻击
    isStunned: boolean;      // 是否被眩晕
    lastAttackTime: number;  // 上次攻击时间
    comboCount: number;      // 连击数
    lastComboTime: number;   // 上次连击时间
}

/**
 * 伤害计算结果
 */
export interface DamageResult {
    damage: number;         // 最终伤害
    isCrit: boolean;        // 是否暴击
    isBlocked: boolean;     // 是否被格挡
    elementalBonus: number; // 元素加成
}

// ============ 物品系统类型 ============

/**
 * 物品属性加成
 */
export interface ItemStats {
    attack?: number;         // 攻击力加成
    defense?: number;        // 防御力加成
    attackSpeed?: number;    // 攻击速度加成
    critRate?: number;       // 暴击率加成
    critDamage?: number;     // 暴击伤害加成
    moveSpeed?: number;      // 移动速度加成
    hp?: number;            // 生命值加成
    maxHp?: number;         // 最大生命值加成
    mana?: number;          // 法力值加成
    maxMana?: number;       // 最大法力值加成
}

/**
 * 消耗品效果
 */
export interface ConsumableEffect {
    type: 'heal' | 'mana' | 'speed' | 'shield' | 'teleport';
    value: number;          // 效果数值
    duration?: number;       // 持续时间（秒）
}

/**
 * 物品数据
 */
export interface Item {
    id: string;              // 物品ID
    name: string;            // 物品名称
    type: ItemType;         // 物品类型
    rarity: ItemRarity;     // 物品稀有度
    stats?: ItemStats;      // 装备属性
    effect?: ConsumableEffect; // 消耗品效果
    icon: string;           // 图标资源路径
    description: string;    // 描述
    specialEffect?: string; // 特殊效果描述
}

/**
 * 背包槽位
 */
export interface InventorySlot {
    item: Item | null;       // 物品
    quantity: number;        // 数量
}

// ============ 技能系统类型 ============

/**
 * 技能效果
 */
export interface SkillEffect {
    type: SkillType;        // 技能类型
    damage?: number;         // 伤害倍率（武器攻击力的倍数）
    range?: number;          // 范围（像素）
    duration?: number;       // 持续时间（秒）
    healValue?: number;     // 治疗量
    shieldValue?: number;   // 护盾值
    manaCost?: number;      // 法力消耗
    chains?: number;        // 连锁次数（连锁闪电）
    stunDuration?: number;  // 眩晕时间（秒）
    speedBoost?: number;    // 速度加成
}

/**
 * 技能数据
 */
export interface Skill {
    id: string;              // 技能ID
    name: string;            // 技能名称
    description: string;    // 技能描述
    icon: string;           // 图标资源路径
    branch: SkillBranch;    // 所属分支
    manaCost: number;       // 法力消耗
    cooldown: number;       // 冷却时间（秒）
    lastUsedTime: number;   // 上次使用时间
    level: number;          // 技能等级（0-5）
    maxLevel?: number;      // 最大等级
    effect: SkillEffect;    // 技能效果
}

// ============ 合成系统类型 ============

/**
 * 合成材料
 */
export interface CraftingMaterial {
    itemId: string;         // 物品ID
    quantity: number;        // 数量
}

/**
 * 合成配方
 */
export interface CraftingRecipe {
    id: string;              // 配方ID
    name: string;            // 配方名称
    ingredients: CraftingMaterial[]; // 材料
    result: CraftingMaterial; // 结果
    category: 'upgrade' | 'fusion' | 'enhance'; // 合成类型
    isHidden?: boolean;     // 是否隐藏配方
}

/**
 * 合成状态
 */
export interface CraftingState {
    isCrafting: boolean;
    currentRecipe: CraftingRecipe | null;
    progress: number;        // 合成进度（0-1）
}

// ============ 武器系统类型 ============

/**
 * 武器类型
 */
export type WeaponType = 'sword' | 'blade' | 'staff' | 'hammer' | 'dagger';

/**
 * 武器数据
 */
export interface Weapon {
    id: string;              // 武器ID
    name: string;            // 武器名称
    type: WeaponType;        // 武器类型
    rarity: ItemRarity;      // 武器稀有度
    attack: number;          // 基础攻击力
    attackSpeed: number;     // 攻击速度
    critRate: number;        // 暴击率
    critDamage: number;      // 暴击伤害
    range: number;           // 攻击范围
    specialEffect?: string;  // 特殊效果描述
    icon: string;            // 图标资源路径
    description: string;     // 描述
}

// ============ 关卡系统类型 ============

/**
 * 地图瓦片数据
 */
export interface TileData {
    type: 'floor' | 'wall' | 'obstacle' | 'spawn' | 'portal' | 'merchant';
    walkable: boolean;
    x: number;
    y: number;
}

/**
 * 地图数据
 */
export interface MapData {
    width: number;           // 地图宽度（瓦片数）
    height: number;          // 地图高度（瓦片数）
    tileSize: number;        // 瓦片大小（像素）
    tiles: TileData[][];     // 瓦片数据
    spawnPoint: { x: number; y: number }; // 出生点
    merchantPosition: { x: number; y: number }; // 商人位置
    portalPosition: { x: number; y: number } | null; // 传送门位置
}

/**
 * 敌人生成数据
 */
export interface EnemySpawnData {
    type: EnemyType;
    x: number;
    y: number;
    level: number;          // 敌人等级
}

/**
 * 关卡状态
 */
export interface LevelState {
    enemiesDefeated: number;
    eliteDefeated: boolean;
    bossDefeated: boolean;
    merchantVisited: boolean;
    portalSpawned: boolean;
    timeElapsed: number;     // 已用时间（秒）
    currentLevel: number;    // 当前关卡数
    maxLevel: number;        // 最大关卡数
}

// ============ 游戏全局状态 ============

/**
 * 游戏状态
 */
export interface GameState {
    currentScene: string;   // 当前场景
    isPaused: boolean;      // 是否暂停
    isGameOver: boolean;    // 是否游戏结束
    score: number;          // 分数
    playTime: number;       // 游戏时间（秒）
}

/**
 * 玩家数据
 */
export interface PlayerData {
    stats: CombatStats;
    inventory: InventorySlot[];
    skills: Skill[];
    skillPoints: number;    // 技能点
    level: number;          // 玩家等级
    experience: number;     // 经验值
    maxExperience: number;  // 升级所需经验值
}

/**
 * 游戏存档
 */
export interface GameSave {
    playerData: PlayerData;
    gameState: GameState;
    levelState: LevelState;
    timestamp: number;      // 存档时间戳
}
