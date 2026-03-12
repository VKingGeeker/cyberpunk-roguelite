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
        enemyCount: 30,    // 初始敌人数量（增加）
        eliteCount: 3,     // 初始精英数量（增加）
        enemyRespawnTime: 5, // 敌人重生时间（秒）
        enemySpawnInterval: 800, // 敌人生成间隔（毫秒）- 基础间隔
        maxEnemies: 80, // 最大敌人数量（大幅增加）
        bossSpawnTime: 120, // Boss生成时间（秒）
        
        // 难度曲线配置 - 敌人生成间隔动态调整
        difficultyCurve: {
            enabled: true,              // 是否启用难度曲线
            initialSpawnInterval: 1500, // 游戏开始时的生成间隔（毫秒）- 较慢
            minSpawnInterval: 400,      // 后期最小生成间隔（毫秒）- 最快
            curveDuration: 300,         // 难度曲线过渡时间（秒）- 5分钟内完成过渡
            curveType: 'ease-in'        // 曲线类型: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
        }
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
    },

    // 音效配置
    audio: {
        defaultMasterVolume: 0.7,   // 默认主音量
        defaultMusicVolume: 0.5,    // 默认音乐音量
        defaultSFXVolume: 0.8,      // 默认音效音量
        bgmFadeInDuration: 1000,    // 背景音乐淡入时间（毫秒）
        bgmFadeOutDuration: 500     // 背景音乐淡出时间（毫秒）
    },

    // 职业系统配置
    class: {
        enableClassSystem: true,     // 是否启用职业系统
        defaultClass: 'bio_engineer', // 默认职业（生化改造者，适合新手）
        allowClassChange: false,     // 游戏中是否允许更换职业
        classBonusMultiplier: 1.0    // 职业属性加成倍率
    },

    // 联机系统配置
    multiplayer: {
        enabled: true,                    // 是否启用联机功能
        serverUrl: 'http://localhost:3000', // 服务器地址
        maxPlayers: 4,                    // 最大玩家数
        syncInterval: 50,                 // 状态同步间隔（毫秒）
        interpolationDelay: 100,          // 插值延迟（毫秒）
        interpolationSpeed: 5,            // 插值速度
        predictionEnabled: true,          // 是否启用客户端预测
        reconciliationThreshold: 2,       // 位置和解阈值（像素）
        reconnectAttempts: 5,             // 重连尝试次数
        reconnectDelay: 1000,             // 重连延迟（毫秒）
        timeout: 10000,                   // 连接超时（毫秒）
        
        // 难度动态调整
        difficultyScaling: {
            baseMultiplier: 1.0,          // 基础难度倍率
            perPlayerBonus: 0.3,          // 每增加一个玩家的难度加成
            maxMultiplier: 3.0            // 最大难度倍率
        },
        
        // 经验共享
        experienceSharing: {
            enabled: true,                // 是否启用经验共享
            shareRadius: 800,             // 共享半径（像素）
            bonusMultiplier: 1.2          // 联机经验加成倍率
        },
        
        // 掉落物分配
        lootDistribution: {
            mode: 'round_robin',          // 分配模式: 'round_robin' | 'random' | 'need_greed'
            announceDelay: 2000           // 掉落公告延迟（毫秒）
        },
        
        // 时间回溯投票
        timeRewindVoting: {
            enabled: true,                // 是否启用时间回溯投票
            voteTimeout: 30000,           // 投票超时时间（毫秒）
            requiredAgreement: 1.0        // 需要同意的比例（1.0 = 100%）
        },
        
        // 联机奖励
        rewards: {
            completionBonus: 1.5,         // 完成奖励倍率
            timeBonus: 0.1,               // 每分钟时间奖励
            teamworkBonus: 0.2            // 团队合作奖励
        }
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
    // 基础类型
    COMMON = 'common',           // 普通敌人 - 近战攻击
    ELITE = 'elite',             // 精英敌人 - 近战攻击
    
    // 特殊类型
    RANGED = 'ranged',           // 远程敌人 - 射击型，保持距离
    SUMMONER = 'summoner',       // 召唤型敌人 - 召唤小怪
    SPLITTER = 'splitter',       // 分裂型敌人 - 死亡时分裂
    
    // BOSS类型
    BOSS_MECH_BEAST = 'boss_mech_beast',       // 机械巨兽 - 高血量、近战冲锋
    BOSS_DATA_GHOST = 'boss_data_ghost',       // 数据幽灵 - 隐身、瞬移
    BOSS_BIO_TYRANT = 'boss_bio_tyrant',       // 生化暴君 - 毒气、召唤
    BOSS = 'boss'                // 通用BOSS（保留兼容性）
}

/**
 * 敌人稀有度枚举
 */
export enum EnemyRarity {
    COMMON = 'common',           // 普通 - 灰色
    ELITE = 'elite',             // 精英 - 蓝色
    RARE = 'rare',               // 稀有 - 紫色
    LEGENDARY = 'legendary'      // 传说 - 金色
}

/**
 * 敌人外观配置接口
 */
export interface EnemyAppearanceConfig {
    baseColor: number;           // 基础颜色
    glowColor: number;           // 发光颜色
    scale: number;               // 体型缩放
    alpha: number;               // 透明度
    hasAura: boolean;            // 是否有光环
    auraColor?: number;          // 光环颜色
    particleEffect?: string;     // 粒子特效类型
    animationSpeed?: number;     // 动画速度倍率
}

/**
 * 敌人稀有度外观配置
 */
export const ENEMY_RARITY_APPEARANCE: Record<EnemyRarity, {
    color: number;
    glowIntensity: number;
    nameColor: string;
    borderColor: number;
}> = {
    [EnemyRarity.COMMON]: {
        color: 0x808080,         // 灰色
        glowIntensity: 0.1,
        nameColor: '#808080',
        borderColor: 0x606060
    },
    [EnemyRarity.ELITE]: {
        color: 0x4488ff,         // 蓝色
        glowIntensity: 0.3,
        nameColor: '#4488ff',
        borderColor: 0x2266dd
    },
    [EnemyRarity.RARE]: {
        color: 0xaa44ff,         // 紫色
        glowIntensity: 0.5,
        nameColor: '#aa44ff',
        borderColor: 0x8822dd
    },
    [EnemyRarity.LEGENDARY]: {
        color: 0xffaa00,         // 金色
        glowIntensity: 0.8,
        nameColor: '#ffaa00',
        borderColor: 0xdd8800
    }
};

/**
 * 敌人类型外观配置
 */
export const ENEMY_TYPE_APPEARANCE: Record<EnemyType, EnemyAppearanceConfig> = {
    // 基础类型
    [EnemyType.COMMON]: {
        baseColor: 0xff6600,      // 橙色
        glowColor: 0xff6600,
        scale: 0.9,
        alpha: 1.0,
        hasAura: false
    },
    [EnemyType.ELITE]: {
        baseColor: 0x6600ff,      // 紫色
        glowColor: 0x6600ff,
        scale: 1.1,
        alpha: 1.0,
        hasAura: true,
        auraColor: 0x6600ff
    },
    
    // 特殊类型
    [EnemyType.RANGED]: {
        baseColor: 0x00ffff,      // 青色
        glowColor: 0x00ffff,
        scale: 0.85,
        alpha: 1.0,
        hasAura: false,
        particleEffect: 'electric'
    },
    [EnemyType.SUMMONER]: {
        baseColor: 0xff00ff,      // 品红
        glowColor: 0xff00ff,
        scale: 1.0,
        alpha: 1.0,
        hasAura: true,
        auraColor: 0xff00ff,
        particleEffect: 'summon'
    },
    [EnemyType.SPLITTER]: {
        baseColor: 0x00ff00,      // 绿色
        glowColor: 0x00ff00,
        scale: 0.95,
        alpha: 1.0,
        hasAura: false,
        particleEffect: 'split'
    },
    
    // BOSS类型
    [EnemyType.BOSS]: {
        baseColor: 0xff0066,      // 粉红
        glowColor: 0xff0066,
        scale: 1.4,
        alpha: 1.0,
        hasAura: true,
        auraColor: 0xff0066,
        particleEffect: 'boss'
    },
    [EnemyType.BOSS_MECH_BEAST]: {
        baseColor: 0xff3300,      // 红橙
        glowColor: 0xff3300,
        scale: 1.8,
        alpha: 1.0,
        hasAura: true,
        auraColor: 0xff3300,
        particleEffect: 'mech'
    },
    [EnemyType.BOSS_DATA_GHOST]: {
        baseColor: 0x00ffaa,      // 青绿
        glowColor: 0x00ffaa,
        scale: 1.5,
        alpha: 0.85,
        hasAura: true,
        auraColor: 0x00ffaa,
        particleEffect: 'ghost'
    },
    [EnemyType.BOSS_BIO_TYRANT]: {
        baseColor: 0x66ff00,      // 黄绿
        glowColor: 0x66ff00,
        scale: 1.6,
        alpha: 1.0,
        hasAura: true,
        auraColor: 0x66ff00,
        particleEffect: 'bio'
    }
};

/**
 * 敌人等级视觉指示器配置
 */
export const ENEMY_LEVEL_INDICATOR = {
    // 每级体型增加比例
    scalePerLevel: 0.02,
    // 每级发光强度增加
    glowPerLevel: 0.05,
    // 等级徽章颜色
    levelBadgeColors: {
        1: 0x808080,   // 灰色
        5: 0x00ff00,   // 绿色
        10: 0x00ffff,  // 青色
        15: 0x4488ff,  // 蓝色
        20: 0xaa44ff,  // 紫色
        25: 0xffaa00,  // 金色
        30: 0xff0000   // 红色
    },
    // 等级显示阈值
    showLevelThreshold: 5
};

/**
 * 技能类型枚举
 */
export enum SkillType {
    SLASH = 'slash',
    SPIN = 'spin',
    DASH = 'dash',
    HEAL = 'heal',
    SHIELD = 'shield',
    BLINK = 'blink',
    CHAIN_LIGHTNING = 'chain_lightning',
    LASER_BEAM = 'laser_beam',
    EMP_BURST = 'emp_burst',
    OVERDRIVE = 'overdrive',
    HOLOGRAM = 'hologram',
    // 新增技能类型
    PLASMA_ORB = 'plasma_orb',
    NOVA = 'nova',
    TIME_WARP = 'time_warp',
    NANITE_SWARM = 'nanite_swarm',
    SONIC_BOOM = 'sonic_boom',
    FLAME_WAVE = 'flame_wave',
    ICE_SHARD = 'ice_shard',
    VOID_RIFT = 'void_rift',
    ENERGY_DRAIN = 'energy_drain',
    DRONE = 'drone' // 无人机召唤
}

/**
 * 技能分支枚举
 */
export enum SkillBranch {
    OFFENSE = 'offense',
    DEFENSE = 'defense',
    UTILITY = 'utility'
}

// ============ 属性选项配置 ============

/**
 * 属性选项配置
 * 定义所有可选择的属性加成
 */
export const ATTRIBUTE_OPTIONS = {
    // 攻击力加成
    attack_boost_small: {
        id: 'attack_boost_small',
        name: '攻击力提升',
        type: 'attack',
        description: '提升攻击力，增强伤害输出',
        icon: 'icon_attack',
        rarity: 'common',
        value: 5,
        isPercentage: false,
        maxStack: 10,
        weight: 100  // 权重，用于随机选择
    },
    attack_boost_medium: {
        id: 'attack_boost_medium',
        name: '强力攻击提升',
        type: 'attack',
        description: '大幅提升攻击力',
        icon: 'icon_attack',
        rarity: 'rare',
        value: 15,
        isPercentage: false,
        maxStack: 5,
        weight: 50
    },
    attack_boost_large: {
        id: 'attack_boost_large',
        name: '毁灭攻击提升',
        type: 'attack',
        description: '极大提升攻击力',
        icon: 'icon_attack',
        rarity: 'epic',
        value: 30,
        isPercentage: false,
        maxStack: 3,
        weight: 20
    },
    attack_boost_percent: {
        id: 'attack_boost_percent',
        name: '攻击力百分比提升',
        type: 'attack',
        description: '按百分比提升攻击力',
        icon: 'icon_attack',
        rarity: 'rare',
        value: 0.1,  // 10%
        isPercentage: true,
        maxStack: 5,
        weight: 40
    },

    // 防御力加成
    defense_boost_small: {
        id: 'defense_boost_small',
        name: '防御力提升',
        type: 'defense',
        description: '提升防御力，减少受到的伤害',
        icon: 'icon_defense',
        rarity: 'common',
        value: 3,
        isPercentage: false,
        maxStack: 10,
        weight: 100
    },
    defense_boost_medium: {
        id: 'defense_boost_medium',
        name: '坚固防御提升',
        type: 'defense',
        description: '大幅提升防御力',
        icon: 'icon_defense',
        rarity: 'rare',
        value: 10,
        isPercentage: false,
        maxStack: 5,
        weight: 50
    },
    defense_boost_percent: {
        id: 'defense_boost_percent',
        name: '防御力百分比提升',
        type: 'defense',
        description: '按百分比提升防御力',
        icon: 'icon_defense',
        rarity: 'rare',
        value: 0.15,  // 15%
        isPercentage: true,
        maxStack: 5,
        weight: 40
    },

    // 生命值加成
    max_hp_boost_small: {
        id: 'max_hp_boost_small',
        name: '生命值提升',
        type: 'maxHp',
        description: '提升最大生命值',
        icon: 'icon_hp',
        rarity: 'common',
        value: 20,
        isPercentage: false,
        maxStack: 10,
        weight: 100
    },
    max_hp_boost_medium: {
        id: 'max_hp_boost_medium',
        name: '强力生命提升',
        type: 'maxHp',
        description: '大幅提升最大生命值',
        icon: 'icon_hp',
        rarity: 'rare',
        value: 50,
        isPercentage: false,
        maxStack: 5,
        weight: 50
    },
    max_hp_boost_percent: {
        id: 'max_hp_boost_percent',
        name: '生命值百分比提升',
        type: 'maxHp',
        description: '按百分比提升最大生命值',
        icon: 'icon_hp',
        rarity: 'rare',
        value: 0.1,  // 10%
        isPercentage: true,
        maxStack: 5,
        weight: 40
    },

    // 移动速度加成
    move_speed_boost: {
        id: 'move_speed_boost',
        name: '移动速度提升',
        type: 'moveSpeed',
        description: '提升移动速度',
        icon: 'icon_speed',
        rarity: 'common',
        value: 20,
        isPercentage: false,
        maxStack: 8,
        weight: 80
    },
    move_speed_boost_percent: {
        id: 'move_speed_boost_percent',
        name: '疾风速度提升',
        type: 'moveSpeed',
        description: '按百分比提升移动速度',
        icon: 'icon_speed',
        rarity: 'rare',
        value: 0.1,  // 10%
        isPercentage: true,
        maxStack: 5,
        weight: 40
    },

    // 攻击速度加成
    attack_speed_boost: {
        id: 'attack_speed_boost',
        name: '攻击速度提升',
        type: 'attackSpeed',
        description: '提升攻击速度',
        icon: 'icon_attack_speed',
        rarity: 'common',
        value: 0.1,  // 10%
        isPercentage: true,
        maxStack: 8,
        weight: 80
    },
    attack_speed_boost_large: {
        id: 'attack_speed_boost_large',
        name: '狂暴攻击速度',
        type: 'attackSpeed',
        description: '大幅提升攻击速度',
        icon: 'icon_attack_speed',
        rarity: 'rare',
        value: 0.2,  // 20%
        isPercentage: true,
        maxStack: 4,
        weight: 40
    },

    // 暴击率加成
    crit_rate_boost: {
        id: 'crit_rate_boost',
        name: '暴击率提升',
        type: 'critRate',
        description: '提升暴击概率',
        icon: 'icon_crit',
        rarity: 'rare',
        value: 0.05,  // 5%
        isPercentage: true,
        maxStack: 10,
        weight: 60
    },
    crit_rate_boost_large: {
        id: 'crit_rate_boost_large',
        name: '致命暴击提升',
        type: 'critRate',
        description: '大幅提升暴击概率',
        icon: 'icon_crit',
        rarity: 'epic',
        value: 0.1,  // 10%
        isPercentage: true,
        maxStack: 5,
        weight: 25
    },

    // 暴击伤害加成
    crit_damage_boost: {
        id: 'crit_damage_boost',
        name: '暴击伤害提升',
        type: 'critDamage',
        description: '提升暴击伤害倍率',
        icon: 'icon_crit_damage',
        rarity: 'rare',
        value: 0.2,  // 20%
        isPercentage: true,
        maxStack: 8,
        weight: 50
    },
    crit_damage_boost_large: {
        id: 'crit_damage_boost_large',
        name: '毁灭暴击伤害',
        type: 'critDamage',
        description: '大幅提升暴击伤害倍率',
        icon: 'icon_crit_damage',
        rarity: 'epic',
        value: 0.5,  // 50%
        isPercentage: true,
        maxStack: 4,
        weight: 20
    },

    // 技能范围加成
    skill_range_boost: {
        id: 'skill_range_boost',
        name: '技能范围提升',
        type: 'skillRange',
        description: '提升所有技能的作用范围',
        icon: 'icon_range',
        rarity: 'rare',
        value: 0.15,  // 15%
        isPercentage: true,
        maxStack: 6,
        weight: 50
    },
    skill_range_boost_large: {
        id: 'skill_range_boost_large',
        name: '广域技能范围',
        type: 'skillRange',
        description: '大幅提升技能作用范围',
        icon: 'icon_range',
        rarity: 'epic',
        value: 0.3,  // 30%
        isPercentage: true,
        maxStack: 3,
        weight: 20
    },

    // 技能冷却减少
    skill_cd_reduction: {
        id: 'skill_cd_reduction',
        name: '冷却缩减',
        type: 'skillCooldown',
        description: '减少技能冷却时间',
        icon: 'icon_cooldown',
        rarity: 'rare',
        value: 0.1,  // 10%
        isPercentage: true,
        maxStack: 6,
        weight: 50
    },
    skill_cd_reduction_large: {
        id: 'skill_cd_reduction_large',
        name: '极速冷却',
        type: 'skillCooldown',
        description: '大幅减少技能冷却时间',
        icon: 'icon_cooldown',
        rarity: 'epic',
        value: 0.2,  // 20%
        isPercentage: true,
        maxStack: 3,
        weight: 20
    },

    // 子弹数量加成（针对射击类技能）
    bullet_count_boost: {
        id: 'bullet_count_boost',
        name: '子弹数量提升',
        type: 'bulletCount',
        description: '增加射击类技能的子弹数量',
        icon: 'icon_bullet',
        rarity: 'rare',
        value: 1,
        isPercentage: false,
        maxStack: 5,
        weight: 40
    },
    bullet_count_boost_large: {
        id: 'bullet_count_boost_large',
        name: '弹幕风暴',
        type: 'bulletCount',
        description: '大幅增加子弹数量',
        icon: 'icon_bullet',
        rarity: 'epic',
        value: 2,
        isPercentage: false,
        maxStack: 3,
        weight: 20
    }
};

/**
 * 获取所有属性选项
 */
export function getAllAttributeOptions(): any[] {
    return Object.values(ATTRIBUTE_OPTIONS);
}

/**
 * 根据ID获取属性选项
 */
export function getAttributeOptionById(id: string): any {
    return ATTRIBUTE_OPTIONS[id] || null;
}

/**
 * 根据稀有度获取属性选项
 */
export function getAttributeOptionsByRarity(rarity: string): any[] {
    return Object.values(ATTRIBUTE_OPTIONS).filter(opt => opt.rarity === rarity);
}

/**
 * 随机获取属性选项（基于权重）
 */
export function getRandomAttributeOptions(count: number, excludeIds: string[] = []): any[] {
    const availableOptions = Object.values(ATTRIBUTE_OPTIONS)
        .filter(opt => !excludeIds.includes(opt.id));
    
    const result: any[] = [];
    const totalWeight = availableOptions.reduce((sum, opt) => sum + opt.weight, 0);
    
    while (result.length < count && availableOptions.length > 0) {
        let random = Math.random() * totalWeight;
        let selected = null;
        
        for (const opt of availableOptions) {
            random -= opt.weight;
            if (random <= 0) {
                selected = opt;
                break;
            }
        }
        
        if (selected && !result.find(r => r.id === selected.id)) {
            result.push(selected);
        }
    }
    
    return result;
}

// ============ 随机事件系统配置 ============

/**
 * 随机事件配置
 */
export const EVENT_CONFIG = {
    // 事件触发配置
    trigger: {
        baseChance: 0.15,           // 基础触发概率（每次击杀精英/升级时）
        cooldown: 120,              // 事件冷却时间（秒）
        minKillCount: 10,           // 最小击杀数才可能触发
        levelBonus: 0.02,           // 每级增加的触发概率
    },
    
    // 各类型事件权重
    typeWeights: {
        merchant: 25,               // 商人
        trap: 20,                   // 陷阱
        shrine: 20,                 // 神龛
        roulette: 20,               // 转盘
        camp: 15                    // 营地
    },
    
    // 商人配置
    merchant: {
        discountChance: 0.3,        // 折扣概率
        discountRange: [0.7, 0.9],  // 折扣范围
        itemPoolSize: 4,            // 商品池大小
        refreshCost: 50,            // 刷新商品花费
    },
    
    // 陷阱配置
    trap: {
        riskChanceRange: [0.2, 0.5], // 风险触发概率范围
        rewardMultiplier: 1.5,       // 风险奖励倍率
    },
    
    // 神龛配置
    shrine: {
        offeringTypes: ['gold', 'hp', 'time_fragment'],  // 祭品类型
        blessingDuration: 300,       // 祝福持续时间（秒）
    },
    
    // 转盘配置
    roulette: {
        spinCost: 30,                // 转动花费
        segments: 8,                 // 转盘分段数
        jackpotChance: 0.05,         // 头奖概率
    },
    
    // 营地配置
    camp: {
        healPercent: 0.5,            // 恢复生命百分比
        restBonus: 0.1,              // 休息增益
    },
    
    // 奖励稀有度权重
    rewardRarityWeights: {
        common: 50,
        rare: 30,
        epic: 15,
        legendary: 5
    }
};

// ============ 联机系统配置 ============

/**
 * 联机系统配置
 */
export const MULTIPLAYER_CONFIG = {
    // 服务器配置
    serverUrl: GAME_CONFIG.multiplayer.serverUrl,
    maxPlayers: GAME_CONFIG.multiplayer.maxPlayers,
    
    // 同步配置
    syncInterval: GAME_CONFIG.multiplayer.syncInterval,
    interpolationDelay: GAME_CONFIG.multiplayer.interpolationDelay,
    interpolationSpeed: GAME_CONFIG.multiplayer.interpolationSpeed,
    predictionEnabled: GAME_CONFIG.multiplayer.predictionEnabled,
    reconciliationThreshold: GAME_CONFIG.multiplayer.reconciliationThreshold,
    
    // 连接配置
    reconnectAttempts: GAME_CONFIG.multiplayer.reconnectAttempts,
    reconnectDelay: GAME_CONFIG.multiplayer.reconnectDelay,
    timeout: GAME_CONFIG.multiplayer.timeout,
    
    // 难度动态调整
    difficultyScaling: GAME_CONFIG.multiplayer.difficultyScaling,
    
    // 经验共享
    experienceSharing: GAME_CONFIG.multiplayer.experienceSharing,
    
    // 掉落物分配
    lootDistribution: GAME_CONFIG.multiplayer.lootDistribution,
    
    // 时间回溯投票
    timeRewindVoting: GAME_CONFIG.multiplayer.timeRewindVoting,
    
    // 联机奖励
    rewards: GAME_CONFIG.multiplayer.rewards
};
