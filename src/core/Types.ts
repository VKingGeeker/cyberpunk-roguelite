/**
 * 核心类型定义
 * 定义游戏主要数据结构和接口
 */

// 从 Config 导入并重新导出枚举
import {
    ItemRarity,
    ItemType,
    EnemyType,
    SkillType,
    SkillBranch,
    EnemyRarity,
    ENEMY_RARITY_APPEARANCE,
    ENEMY_TYPE_APPEARANCE,
    ENEMY_LEVEL_INDICATOR
} from './Config';

export {
    ItemRarity,
    ItemType,
    EnemyType,
    SkillType,
    SkillBranch,
    EnemyRarity,
    ENEMY_RARITY_APPEARANCE,
    ENEMY_TYPE_APPEARANCE,
    ENEMY_LEVEL_INDICATOR
};

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
    explosionRange?: number; // 爆炸范围（AOE技能）
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
export type WeaponType = 'sword' | 'blade' | 'staff' | 'hammer' | 'dagger' | 'katana' | 'data_glove' | 'bio_fist' | 'dual_dagger';

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
    classRestriction?: string; // 职业限制（职业专属武器）
}

// ============ 防具系统类型 ============

/**
 * 防具槽位类型
 */
export type ArmorSlotType = 'helmet' | 'chestplate' | 'leggings' | 'accessory';

/**
 * 套装效果类型
 */
export type SetEffectType =
    | 'lifesteal'           // 吸血
    | 'armor_penetration'   // 穿透
    | 'damage_reflect'      // 反弹
    | 'shield'              // 护盾
    | 'thorns'              // 荆棘（受伤反伤）
    | 'regeneration'        // 生命恢复
    | 'dodge'               // 闪避
    | 'critical_fury'       // 暴击狂怒
    | 'berserker'           // 狂战士
    | 'arcane_shield';      // 奥术护盾

/**
 * 套装效果数据
 */
export interface SetEffect {
    type: SetEffectType;           // 效果类型
    value: number;                 // 效果数值
    description: string;           // 效果描述
}

/**
 * 套装数据
 */
export interface ArmorSet {
    id: string;                    // 套装ID
    name: string;                  // 套装名称
    pieces: string[];              // 套装部件ID列表
    twoPieceBonus: SetEffect;      // 2件套效果
    fourPieceBonus: SetEffect;     // 4件套效果
}

/**
 * 防具数据
 */
export interface Armor {
    id: string;                    // 防具ID
    name: string;                  // 防具名称
    slot: ArmorSlotType;           // 装备槽位
    rarity: ItemRarity;            // 稀有度
    setId?: string;                // 所属套装ID
    stats: ItemStats;              // 属性加成
    specialEffect?: string;        // 特殊效果描述
    icon: string;                  // 图标资源路径
    description: string;           // 描述
    visualEffect?: string;         // 视觉效果标识
}

/**
 * 装备槽位数据
 */
export interface EquipmentSlots {
    weapon: Weapon | null;         // 武器槽
    helmet: Armor | null;          // 头盔槽
    chestplate: Armor | null;      // 胸甲槽
    leggings: Armor | null;        // 护腿槽
    accessory: Armor | null;       // 饰品槽
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

// ============ 属性选项系统类型 ============

/**
 * 属性类型枚举
 */
export enum AttributeType {
    ATTACK = 'attack',              // 攻击力
    DEFENSE = 'defense',            // 防御力
    MAX_HP = 'maxHp',               // 最大生命值
    MOVE_SPEED = 'moveSpeed',       // 移动速度
    ATTACK_SPEED = 'attackSpeed',   // 攻击速度
    CRIT_RATE = 'critRate',         // 暴击率
    CRIT_DAMAGE = 'critDamage',     // 暴击伤害
    SKILL_RANGE = 'skillRange',     // 技能范围
    SKILL_CD = 'skillCooldown',     // 技能冷却
    BULLET_COUNT = 'bulletCount'    // 子弹数量
}

/**
 * 属性选项数据
 */
export interface AttributeOption {
    id: string;                     // 属性ID
    name: string;                   // 属性名称
    type: AttributeType;            // 属性类型
    description: string;            // 属性描述
    icon: string;                   // 图标资源路径
    rarity: ItemRarity;             // 稀有度
    value: number;                  // 属性值（绝对值或百分比）
    isPercentage: boolean;          // 是否为百分比加成
    maxStack: number;               // 最大叠加次数
    currentStack: number;           // 当前叠加次数
}

/**
 * 属性加成数据
 */
export interface AttributeBoost {
    type: AttributeType;
    value: number;
    isPercentage: boolean;
}

// ============ 音效系统类型 ============

/**
 * 音效类型枚举
 */
export enum SoundType {
    // 玩家音效
    PLAYER_ATTACK = 'player_attack',
    PLAYER_HURT = 'player_hurt',
    PLAYER_HEAL = 'player_heal',
    PLAYER_LEVEL_UP = 'player_level_up',
    PLAYER_DIE = 'player_die',
    PLAYER_SHIELD = 'player_shield',

    // 技能音效
    SKILL_SLASH = 'skill_slash',
    SKILL_SPIN = 'skill_spin',
    SKILL_LIGHTNING = 'skill_lightning',
    SKILL_LASER = 'skill_laser',
    SKILL_EMP = 'skill_emp',
    SKILL_NOVA = 'skill_nova',
    SKILL_ORB = 'skill_orb',
    SKILL_BOOM = 'skill_boom',
    SKILL_FLAME = 'skill_flame',
    SKILL_ICE = 'skill_ice',
    SKILL_VOID = 'skill_void',
    SKILL_TIME = 'skill_time',

    // 敌人音效
    ENEMY_HIT = 'enemy_hit',
    ENEMY_DIE = 'enemy_die',

    // 道具音效
    ITEM_PICKUP = 'item_pickup',
    POWERUP_COLLECT = 'powerup_collect',

    // UI音效
    UI_CLICK = 'ui_click',
    UI_HOVER = 'ui_hover',
    UI_ERROR = 'ui_error',

    // 背景音乐
    BGM_GAME = 'bgm_game',
    BGM_MENU = 'bgm_menu'
}

/**
 * 音量设置
 */
export interface VolumeSettings {
    master: number;     // 主音量 (0-1)
    music: number;      // 音乐音量 (0-1)
    sfx: number;        // 音效音量 (0-1)
    isMuted: boolean;   // 是否静音
}

// ============ 随机事件系统类型 ============

/**
 * 事件类型枚举
 */
export enum EventType {
    MERCHANT = 'merchant',      // 商人 - 购买物品
    TRAP = 'trap',              // 陷阱 - 风险与奖励
    SHRINE = 'shrine',          // 神龛 - 祭祀获得增益
    ROULETTE = 'roulette',      // 转盘 - 随机奖励
    CAMP = 'camp'               // 营地 - 休息恢复
}

/**
 * 事件稀有度
 */
export enum EventRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

/**
 * 事件奖励类型
 */
export type EventRewardType =
    | 'gold'           // 金币
    | 'experience'     // 经验
    | 'item'           // 物品
    | 'skill'          // 技能
    | 'weapon'         // 武器
    | 'heal'           // 治疗
    | 'stat_boost'     // 属性提升
    | 'time_fragment'  // 时空碎片
    | 'nothing';       // 无奖励

/**
 * 事件奖励数据
 */
export interface EventReward {
    type: EventRewardType;
    value?: number;           // 数值（金币、经验、治疗量等）
    itemId?: string;          // 物品ID
    skillId?: string;         // 技能ID
    weaponId?: string;        // 武器ID
    statType?: string;        // 属性类型
    statValue?: number;       // 属性值
    isPercentage?: boolean;   // 是否为百分比
    rarity?: ItemRarity;      // 稀有度
}

/**
 * 事件风险数据
 */
export interface EventRisk {
    type: 'damage' | 'debuff' | 'lose_gold' | 'lose_item' | 'spawn_enemy' | 'nothing';
    value?: number;           // 数值
    statType?: string;        // 属性类型（debuff）
    itemId?: string;          // 物品ID
    enemyType?: EnemyType;    // 敌人类型
    enemyCount?: number;      // 敌人数量
    description: string;      // 风险描述
}

/**
 * 事件选项
 */
export interface EventOption {
    id: string;
    text: string;             // 选项文本
    description: string;      // 选项描述
    rewards: EventReward[];   // 奖励列表
    risk?: EventRisk;         // 风险（可选）
    riskChance?: number;      // 风险触发概率（0-1）
    cost?: {                  // 代价（可选）
        type: 'gold' | 'hp' | 'item' | 'time_fragment';
        value: number;
        itemId?: string;
    };
    requirement?: {           // 需求条件（可选）
        type: 'level' | 'gold' | 'hp' | 'item';
        value: number;
        itemId?: string;
    };
}

/**
 * 事件数据
 */
export interface EventData {
    id: string;
    name: string;
    type: EventType;
    rarity: EventRarity;
    description: string;      // 事件描述
    icon: string;             // 图标
    options: EventOption[];   // 可选选项
    weight: number;           // 出现权重
    minLevel?: number;        // 最低出现等级
    maxLevel?: number;        // 最高出现等级
    oneTime?: boolean;        // 是否一次性事件
}

/**
 * 事件触发结果
 */
export interface EventResult {
    success: boolean;
    rewards: EventReward[];
    risk?: EventRisk;
    message: string;
}

/**
 * 事件状态
 */
export interface EventState {
    triggeredEvents: string[];    // 已触发的事件ID列表
    lastEventTime: number;        // 上次事件触发时间
    eventCooldown: number;        // 事件冷却时间
}

// ============ 职业系统类型 ============

/**
 * 职业类型枚举（用于技能树系统）
 */
export enum Profession {
    WARRIOR = 'warrior',           // 战士
    MAGE = 'mage',                 // 法师
    ROGUE = 'rogue',               // 刺客
    ENGINEER = 'engineer'          // 工程师
}

/**
 * 职业类型枚举（用于职业选择系统）
 */
export enum ClassType {
    STREET_SAMURAI = 'street_samurai',     // 街头武士
    DATA_HACKER = 'data_hacker',           // 数据黑客
    BIO_ENGINEER = 'bio_engineer',         // 生化改造者
    SHADOW_ASSASSIN = 'shadow_assassin'    // 暗影刺客
}

/**
 * 职业类型别名（用于类型检查）
 */
export type ClassTypeId = 'street_samurai' | 'data_hacker' | 'bio_engineer' | 'shadow_assassin';

/**
 * 职业选择数据
 */
export interface ClassSelection {
    classId: ClassType;        // 选择的职业ID
    timestamp: number;         // 选择时间戳
}

/**
 * 技能树节点类型
 */
export enum SkillNodeType {
    NORMAL = 'normal',        // 普通技能节点
    BRANCH = 'branch',        // 分支节点（分支入口）
    ULTIMATE = 'ultimate'     // 终极技能节点
}

/**
 * 技能树节点位置
 */
export interface SkillNodePosition {
    x: number;
    y: number;
}

/**
 * 技能树节点数据
 */
export interface SkillTreeNode {
    id: string;                          // 节点ID
    skillId: string;                     // 关联的技能ID
    name: string;                        // 节点名称
    description: string;                 // 节点描述
    type: SkillNodeType;                 // 节点类型
    position: SkillNodePosition;         // 节点位置
    prerequisites: string[];             // 前置节点ID列表
    cost: number;                        // 解锁消耗技能点
    maxLevel: number;                    // 最大等级
    icon: string;                        // 图标
    branch: SkillBranch;                 // 所属分支
    isUltimate?: boolean;                // 是否为终极技能
}

/**
 * 技能树分支数据
 */
export interface SkillTreeBranch {
    id: string;                          // 分支ID
    name: string;                        // 分支名称
    description: string;                 // 分支描述
    color: number;                       // 分支颜色
    nodes: SkillTreeNode[];              // 分支下的节点列表
}

/**
 * 职业技能树数据
 */
export interface ProfessionSkillTree {
    profession: Profession;              // 职业
    name: string;                        // 职业名称
    description: string;                 // 职业描述
    branches: SkillTreeBranch[];         // 技能分支列表
    icon: string;                        // 职业图标
}

/**
 * 技能树状态
 */
export interface SkillTreeState {
    unlockedNodes: Map<string, number>;  // 已解锁节点及等级 (nodeId -> level)
    availablePoints: number;             // 可用技能点
    totalPointsEarned: number;           // 总共获得的技能点
}

// ============ 联机系统类型 ============

/**
 * 联机状态枚举
 */
export enum MultiplayerState {
    DISCONNECTED = 'disconnected',   // 未连接
    CONNECTING = 'connecting',       // 连接中
    CONNECTED = 'connected',         // 已连接
    AUTHENTICATING = 'authenticating', // 认证中
    AUTHENTICATED = 'authenticated', // 已认证
    MATCHING = 'matching',           // 匹配中
    IN_ROOM = 'in_room',             // 在房间中
    PLAYING = 'playing'              // 游戏中
}

/**
 * 房间数据
 */
export interface RoomData {
    id: string;
    name: string;
    maxPlayers: number;
    currentPlayers: number;
    gameMode: string;
    isPrivate: boolean;
    state: string;
    hostId: string;
    players: PlayerInfo[];
    createdAt?: number;
}

/**
 * 玩家信息（联机）
 */
export interface PlayerInfo {
    id: string;
    name: string;
    class: ClassType;
    ready: boolean;
    joinedAt?: number;
}

/**
 * 玩家同步数据
 */
export interface PlayerSyncData {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    facing: number;
    state: string;
    hp: number;
    timestamp?: number;
}

/**
 * 敌人同步数据
 */
export interface EnemySyncData {
    id: string;
    type: EnemyType;
    x: number;
    y: number;
    hp: number;
    state: string;
    targetId?: string;
    timestamp?: number;
}

/**
 * 技能同步数据
 */
export interface SkillSyncData {
    skillId: string;
    targetX: number;
    targetY: number;
    timestamp?: number;
}

/**
 * 物品同步数据
 */
export interface ItemSyncData {
    itemId: string;
    itemData?: any;
    timestamp?: number;
}

/**
 * 伤害同步数据
 */
export interface DamageSyncData {
    targetId: string;
    targetType: 'enemy' | 'player';
    damage: number;
    isCrit: boolean;
    position?: { x: number; y: number };
    timestamp?: number;
}

/**
 * 时间回溯投票数据
 */
export interface TimeRewindVoteData {
    vote: boolean;
    snapshotId: string;
    timestamp?: number;
}

/**
 * 联机游戏配置
 */
export interface MultiplayerGameConfig {
    seed: number;              // 随机种子
    players: SpawnData[];      // 玩家出生数据
    gameMode: string;          // 游戏模式
    difficulty: number;        // 难度倍率
}

/**
 * 出生数据
 */
export interface SpawnData {
    id: string;
    name: string;
    class: ClassType;
    spawnPosition: { x: number; y: number };
}

/**
 * 远程玩家状态
 */
export interface RemotePlayerState {
    id: string;
    name: string;
    class: ClassType;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    state: string;
    facing: number;
    lastUpdate: number;
}

/**
 * 联机奖励类型
 */
export enum MultiplayerRewardType {
    EXTRA_EXPERIENCE = 'extra_experience',     // 额外经验
    BONUS_ITEM = 'bonus_item',                 // 奖励物品
    TIME_FRAGMENT_BONUS = 'time_fragment_bonus', // 时空碎片加成
    ACHIEVEMENT = 'achievement'                 // 成就
}

/**
 * 联机奖励数据
 */
export interface MultiplayerReward {
    type: MultiplayerRewardType;
    value: number;
    description: string;
}

/**
 * 延迟补偿配置
 */
export interface LatencyCompensationConfig {
    interpolationDelay: number;   // 插值延迟（毫秒）
    interpolationSpeed: number;   // 插值速度
    predictionEnabled: boolean;   // 是否启用预测
    reconciliationThreshold: number; // 和解阈值
}
