/**
 * 随机事件数据定义
 * 定义游戏中所有可触发的随机事件
 */

import { EventData, EventType, EventRarity, ItemRarity } from '../core/Types';

/**
 * 所有事件数据
 */
export const EVENTS: Record<string, EventData> = {
    // ============ 商人事件 ============
    
    event_merchant_black_market: {
        id: 'event_merchant_black_market',
        name: '黑市商人',
        type: EventType.MERCHANT,
        rarity: EventRarity.RARE,
        description: '一个神秘的商人在阴影中出现，兜售着来自地下的稀有物品...',
        icon: 'icon_merchant',
        weight: 25,
        options: [
            {
                id: 'buy_item',
                text: '购买商品',
                description: '查看商人出售的物品',
                rewards: [],
                cost: { type: 'gold', value: 0 }
            },
            {
                id: 'trade',
                text: '交换情报',
                description: '用时空碎片交换稀有物品',
                rewards: [
                    { type: 'item', rarity: ItemRarity.RARE }
                ],
                cost: { type: 'time_fragment', value: 10 }
            },
            {
                id: 'leave',
                text: '离开',
                description: '不感兴趣，继续前进',
                rewards: []
            }
        ]
    },
    
    event_merchant_scrap_dealer: {
        id: 'event_merchant_scrap_dealer',
        name: '废品商',
        type: EventType.MERCHANT,
        rarity: EventRarity.COMMON,
        description: '一个收集废品的商人，他的货物看起来有些破旧，但也许能找到好东西...',
        icon: 'icon_merchant',
        weight: 30,
        options: [
            {
                id: 'buy_scrap',
                text: '翻找废品',
                description: '在废品堆中寻找有用的东西',
                rewards: [
                    { type: 'item', rarity: ItemRarity.COMMON }
                ],
                cost: { type: 'gold', value: 20 }
            },
            {
                id: 'buy_lucky',
                text: '购买幸运袋',
                description: '一个神秘的袋子，里面可能是任何东西',
                rewards: [
                    { type: 'item', rarity: ItemRarity.RARE }
                ],
                cost: { type: 'gold', value: 50 },
                risk: {
                    type: 'nothing',
                    description: '袋子是空的...'
                },
                riskChance: 0.3
            },
            {
                id: 'leave',
                text: '离开',
                description: '不需要这些破烂',
                rewards: []
            }
        ]
    },
    
    event_merchant_weapon_smith: {
        id: 'event_merchant_weapon_smith',
        name: '武器匠',
        type: EventType.MERCHANT,
        rarity: EventRarity.EPIC,
        description: '一位技艺精湛的武器匠，他的作品散发着致命的光芒...',
        icon: 'icon_merchant',
        weight: 15,
        minLevel: 5,
        options: [
            {
                id: 'buy_weapon',
                text: '购买武器',
                description: '查看武器匠的作品',
                rewards: [
                    { type: 'weapon', rarity: ItemRarity.RARE }
                ],
                cost: { type: 'gold', value: 100 }
            },
            {
                id: 'upgrade_weapon',
                text: '强化武器',
                description: '强化你当前的武器',
                rewards: [
                    { type: 'stat_boost', statType: 'attack', statValue: 10, isPercentage: false }
                ],
                cost: { type: 'gold', value: 80 }
            },
            {
                id: 'leave',
                text: '离开',
                description: '太贵了，买不起',
                rewards: []
            }
        ]
    },
    
    // ============ 陷阱事件 ============
    
    event_trap_data_terminal: {
        id: 'event_trap_data_terminal',
        name: '数据终端',
        type: EventType.TRAP,
        rarity: EventRarity.COMMON,
        description: '一个闪烁着诡异光芒的数据终端，似乎包含着有价值的信息...',
        icon: 'icon_terminal',
        weight: 25,
        options: [
            {
                id: 'hack',
                text: '尝试入侵',
                description: '入侵终端获取数据，但有触发安全系统的风险',
                rewards: [
                    { type: 'experience', value: 50 },
                    { type: 'item', rarity: ItemRarity.COMMON }
                ],
                risk: {
                    type: 'damage',
                    value: 20,
                    description: '安全系统触发，受到电击伤害！'
                },
                riskChance: 0.4
            },
            {
                id: 'careful',
                text: '谨慎操作',
                description: '小心翼翼地操作，减少风险但奖励也较少',
                rewards: [
                    { type: 'experience', value: 20 }
                ],
                risk: {
                    type: 'damage',
                    value: 10,
                    description: '轻微触电'
                },
                riskChance: 0.15
            },
            {
                id: 'ignore',
                text: '忽略',
                description: '太危险了，不值得冒险',
                rewards: []
            }
        ]
    },
    
    event_trap_mystery_box: {
        id: 'event_trap_mystery_box',
        name: '神秘箱子',
        type: EventType.TRAP,
        rarity: EventRarity.RARE,
        description: '一个被锁住的箱子，上面刻满了警告标志。里面会有什么？',
        icon: 'icon_box',
        weight: 20,
        options: [
            {
                id: 'open_force',
                text: '强行打开',
                description: '用力量打开箱子，可能触发陷阱',
                rewards: [
                    { type: 'item', rarity: ItemRarity.RARE },
                    { type: 'gold', value: 30 }
                ],
                risk: {
                    type: 'damage',
                    value: 30,
                    description: '箱子爆炸了！'
                },
                riskChance: 0.35
            },
            {
                id: 'open_careful',
                text: '小心解锁',
                description: '尝试破解锁具',
                rewards: [
                    { type: 'item', rarity: ItemRarity.COMMON }
                ],
                risk: {
                    type: 'nothing',
                    description: '锁太复杂了，打不开'
                },
                riskChance: 0.25
            },
            {
                id: 'leave',
                text: '离开',
                description: '不想冒险',
                rewards: []
            }
        ]
    },
    
    event_trap_corrupted_cache: {
        id: 'event_trap_corrupted_cache',
        name: '腐化缓存',
        type: EventType.TRAP,
        rarity: EventRarity.EPIC,
        description: '一个被病毒感染的数据缓存，里面可能藏着珍贵的资源...',
        icon: 'icon_cache',
        weight: 15,
        minLevel: 3,
        options: [
            {
                id: 'extract',
                text: '提取数据',
                description: '尝试提取数据，可能感染病毒',
                rewards: [
                    { type: 'time_fragment', value: 15 },
                    { type: 'experience', value: 100 }
                ],
                risk: {
                    type: 'debuff',
                    statType: 'attack',
                    value: 5,
                    description: '病毒感染，攻击力下降！'
                },
                riskChance: 0.4
            },
            {
                id: 'purge',
                text: '清除病毒',
                description: '先清除病毒再提取',
                rewards: [
                    { type: 'time_fragment', value: 5 }
                ],
                cost: { type: 'hp', value: 15 }
            },
            {
                id: 'ignore',
                text: '忽略',
                description: '太危险了',
                rewards: []
            }
        ]
    },
    
    // ============ 神龛事件 ============
    
    event_shrine_tech_altar: {
        id: 'event_shrine_tech_altar',
        name: '科技祭坛',
        type: EventType.SHRINE,
        rarity: EventRarity.RARE,
        description: '一个古老的科技祭坛，据说献上祭品可以获得祝福...',
        icon: 'icon_shrine',
        weight: 20,
        options: [
            {
                id: 'offer_gold',
                text: '献上金币',
                description: '献上50金币祈求祝福',
                rewards: [
                    { type: 'stat_boost', statType: 'attack', statValue: 5, isPercentage: false }
                ],
                cost: { type: 'gold', value: 50 }
            },
            {
                id: 'offer_hp',
                text: '献上生命',
                description: '献上20点生命值祈求强大祝福',
                rewards: [
                    { type: 'stat_boost', statType: 'attack', statValue: 10, isPercentage: false },
                    { type: 'stat_boost', statType: 'defense', statValue: 5, isPercentage: false }
                ],
                cost: { type: 'hp', value: 20 }
            },
            {
                id: 'offer_fragment',
                text: '献上时空碎片',
                description: '献上10个时空碎片祈求神秘祝福',
                rewards: [
                    { type: 'stat_boost', statType: 'critRate', statValue: 0.05, isPercentage: true },
                    { type: 'stat_boost', statType: 'critDamage', statValue: 0.2, isPercentage: true }
                ],
                cost: { type: 'time_fragment', value: 10 }
            },
            {
                id: 'leave',
                text: '离开',
                description: '不需要祝福',
                rewards: []
            }
        ]
    },
    
    event_shrine_healing_fountain: {
        id: 'event_shrine_healing_fountain',
        name: '治愈之泉',
        type: EventType.SHRINE,
        rarity: EventRarity.COMMON,
        description: '一汪散发着微光的泉水，据说有神奇的治愈效果...',
        icon: 'icon_fountain',
        weight: 25,
        options: [
            {
                id: 'drink',
                text: '饮用泉水',
                description: '喝下泉水恢复生命',
                rewards: [
                    { type: 'heal', value: 50 }
                ]
            },
            {
                id: 'fill_bottle',
                text: '装满水瓶',
                description: '带走一些泉水',
                rewards: [
                    { type: 'item', itemId: 'potion_heal' }
                ],
                cost: { type: 'gold', value: 20 }
            },
            {
                id: 'bathe',
                text: '沐浴',
                description: '在泉水中沐浴，获得临时增益',
                rewards: [
                    { type: 'heal', value: 30 },
                    { type: 'stat_boost', statType: 'defense', statValue: 3, isPercentage: false }
                ],
                cost: { type: 'time_fragment', value: 5 }
            },
            {
                id: 'leave',
                text: '离开',
                description: '不需要治疗',
                rewards: []
            }
        ]
    },
    
    event_shrine_war_memorial: {
        id: 'event_shrine_war_memorial',
        name: '战争纪念碑',
        type: EventType.SHRINE,
        rarity: EventRarity.EPIC,
        description: '一座纪念逝去战士的纪念碑，上面刻满了名字...',
        icon: 'icon_memorial',
        weight: 15,
        minLevel: 5,
        options: [
            {
                id: 'pay_respects',
                text: '致敬',
                description: '向逝去的战士致敬',
                rewards: [
                    { type: 'stat_boost', statType: 'attack', statValue: 8, isPercentage: false },
                    { type: 'stat_boost', statType: 'maxHp', statValue: 20, isPercentage: false }
                ],
                cost: { type: 'gold', value: 30 }
            },
            {
                id: 'take_inspiration',
                text: '汲取灵感',
                description: '从纪念碑中汲取战斗灵感',
                rewards: [
                    { type: 'skill', skillId: 'random' }
                ],
                cost: { type: 'time_fragment', value: 20 }
            },
            {
                id: 'leave',
                text: '离开',
                description: '不打扰逝者',
                rewards: []
            }
        ]
    },
    
    // ============ 转盘事件 ============
    
    event_roulette_fortune_wheel: {
        id: 'event_roulette_fortune_wheel',
        name: '命运转盘',
        type: EventType.ROULETTE,
        rarity: EventRarity.RARE,
        description: '一个闪烁着霓虹光芒的命运转盘，转动它试试运气吧！',
        icon: 'icon_roulette',
        weight: 20,
        options: [
            {
                id: 'spin',
                text: '转动转盘',
                description: '花费30金币转动命运转盘',
                rewards: [], // 奖励由转盘决定
                cost: { type: 'gold', value: 30 }
            },
            {
                id: 'spin_premium',
                text: '高级转盘',
                description: '花费10时空碎片转动高级转盘',
                rewards: [], // 奖励由转盘决定
                cost: { type: 'time_fragment', value: 10 },
                requirement: { type: 'level', value: 3 }
            },
            {
                id: 'leave',
                text: '离开',
                description: '不相信运气',
                rewards: []
            }
        ]
    },
    
    event_roulette_mystery_slot: {
        id: 'event_roulette_mystery_slot',
        name: '神秘老虎机',
        type: EventType.ROULETTE,
        rarity: EventRarity.COMMON,
        description: '一台看起来很旧的老虎机，但似乎还能运转...',
        icon: 'icon_slot',
        weight: 25,
        options: [
            {
                id: 'play',
                text: '玩一把',
                description: '花费20金币试试手气',
                rewards: [], // 奖励由老虎机决定
                cost: { type: 'gold', value: 20 }
            },
            {
                id: 'play_big',
                text: '豪赌',
                description: '花费50金币，赢取更大奖励',
                rewards: [], // 奖励由老虎机决定
                cost: { type: 'gold', value: 50 }
            },
            {
                id: 'leave',
                text: '离开',
                description: '不赌博',
                rewards: []
            }
        ]
    },
    
    // ============ 营地事件 ============
    
    event_camp_safe_house: {
        id: 'event_camp_safe_house',
        name: '安全屋',
        type: EventType.CAMP,
        rarity: EventRarity.COMMON,
        description: '一个隐蔽的安全屋，可以在这里休息和恢复...',
        icon: 'icon_camp',
        weight: 25,
        options: [
            {
                id: 'rest',
                text: '休息',
                description: '恢复50%生命值',
                rewards: [
                    { type: 'heal', value: 50 }
                ]
            },
            {
                id: 'train',
                text: '训练',
                description: '进行战斗训练，获得经验',
                rewards: [
                    { type: 'experience', value: 30 }
                ]
            },
            {
                id: 'search',
                text: '搜索',
                description: '搜索安全屋，可能有意外收获',
                rewards: [
                    { type: 'item', rarity: ItemRarity.COMMON }
                ],
                risk: {
                    type: 'nothing',
                    description: '什么都没找到'
                },
                riskChance: 0.3
            },
            {
                id: 'leave',
                text: '离开',
                description: '继续前进',
                rewards: []
            }
        ]
    },
    
    event_camp_survivor_camp: {
        id: 'event_camp_survivor_camp',
        name: '幸存者营地',
        type: EventType.CAMP,
        rarity: EventRarity.RARE,
        description: '一群幸存者建立的营地，他们愿意分享资源...',
        icon: 'icon_camp',
        weight: 20,
        options: [
            {
                id: 'trade',
                text: '交易',
                description: '与幸存者交易物品',
                rewards: [
                    { type: 'item', rarity: ItemRarity.RARE }
                ],
                cost: { type: 'gold', value: 40 }
            },
            {
                id: 'help',
                text: '帮助他们',
                description: '帮助幸存者修理防御设施',
                rewards: [
                    { type: 'experience', value: 50 },
                    { type: 'stat_boost', statType: 'defense', statValue: 3, isPercentage: false }
                ],
                cost: { type: 'time_fragment', value: 5 }
            },
            {
                id: 'rest',
                text: '休息',
                description: '在营地休息恢复',
                rewards: [
                    { type: 'heal', value: 70 }
                ]
            },
            {
                id: 'leave',
                text: '离开',
                description: '继续旅程',
                rewards: []
            }
        ]
    },
    
    event_camp_meditation_room: {
        id: 'event_camp_meditation_room',
        name: '冥想室',
        type: EventType.CAMP,
        rarity: EventRarity.EPIC,
        description: '一个安静的冥想室，可以在这里提升精神力量...',
        icon: 'icon_meditation',
        weight: 15,
        minLevel: 5,
        options: [
            {
                id: 'meditate',
                text: '冥想',
                description: '进入深度冥想，提升精神力量',
                rewards: [
                    { type: 'stat_boost', statType: 'critRate', statValue: 0.03, isPercentage: true },
                    { type: 'stat_boost', statType: 'critDamage', statValue: 0.15, isPercentage: true }
                ]
            },
            {
                id: 'focus',
                text: '专注训练',
                description: '专注于攻击训练',
                rewards: [
                    { type: 'stat_boost', statType: 'attack', statValue: 15, isPercentage: false }
                ],
                cost: { type: 'hp', value: 10 }
            },
            {
                id: 'heal_mind',
                text: '治愈心灵',
                description: '恢复精神力量',
                rewards: [
                    { type: 'heal', value: 100 },
                    { type: 'time_fragment', value: 5 }
                ]
            },
            {
                id: 'leave',
                text: '离开',
                description: '不需要冥想',
                rewards: []
            }
        ]
    }
};

/**
 * 根据ID获取事件数据
 */
export function getEventById(id: string): EventData | null {
    return EVENTS[id] || null;
}

/**
 * 根据类型获取事件列表
 */
export function getEventsByType(type: EventType): EventData[] {
    return Object.values(EVENTS).filter(event => event.type === type);
}

/**
 * 根据稀有度获取事件列表
 */
export function getEventsByRarity(rarity: EventRarity): EventData[] {
    return Object.values(EVENTS).filter(event => event.rarity === rarity);
}

/**
 * 获取所有事件
 */
export function getAllEvents(): EventData[] {
    return Object.values(EVENTS);
}

/**
 * 获取符合条件的事件（根据等级和已触发列表）
 */
export function getAvailableEvents(
    playerLevel: number, 
    triggeredEvents: string[]
): EventData[] {
    return Object.values(EVENTS).filter(event => {
        // 检查等级限制
        if (event.minLevel && playerLevel < event.minLevel) return false;
        if (event.maxLevel && playerLevel > event.maxLevel) return false;
        
        // 检查是否一次性事件
        if (event.oneTime && triggeredEvents.includes(event.id)) return false;
        
        return true;
    });
}

/**
 * 随机选择一个事件（基于权重）
 */
export function getRandomEvent(
    playerLevel: number,
    triggeredEvents: string[],
    typeWeights?: Record<string, number>
): EventData | null {
    const availableEvents = getAvailableEvents(playerLevel, triggeredEvents);
    
    if (availableEvents.length === 0) return null;
    
    // 应用类型权重
    const weights = typeWeights || {
        merchant: 25,
        trap: 20,
        shrine: 20,
        roulette: 20,
        camp: 15
    };
    
    // 计算总权重
    const totalWeight = availableEvents.reduce((sum, event) => {
        return sum + event.weight * (weights[event.type] || 1) / 100;
    }, 0);
    
    // 随机选择
    let random = Math.random() * totalWeight;
    
    for (const event of availableEvents) {
        const eventWeight = event.weight * (weights[event.type] || 1) / 100;
        random -= eventWeight;
        
        if (random <= 0) {
            return event;
        }
    }
    
    return availableEvents[0];
}

/**
 * 获取事件类型名称
 */
export function getEventTypeName(type: EventType): string {
    const names: Record<EventType, string> = {
        [EventType.MERCHANT]: '商人',
        [EventType.TRAP]: '陷阱',
        [EventType.SHRINE]: '神龛',
        [EventType.ROULETTE]: '转盘',
        [EventType.CAMP]: '营地'
    };
    return names[type] || '未知';
}

/**
 * 获取事件类型颜色
 */
export function getEventTypeColor(type: EventType): number {
    const colors: Record<EventType, number> = {
        [EventType.MERCHANT]: 0xffaa00,  // 金色
        [EventType.TRAP]: 0xff4444,      // 红色
        [EventType.SHRINE]: 0x44ff44,    // 绿色
        [EventType.ROULETTE]: 0xff44ff,  // 紫色
        [EventType.CAMP]: 0x44aaff       // 蓝色
    };
    return colors[type] || 0xffffff;
}

/**
 * 获取事件稀有度颜色
 */
export function getEventRarityColor(rarity: EventRarity): number {
    const colors: Record<EventRarity, number> = {
        [EventRarity.COMMON]: 0x888888,
        [EventRarity.RARE]: 0x4488ff,
        [EventRarity.EPIC]: 0xaa44ff,
        [EventRarity.LEGENDARY]: 0xffaa00
    };
    return colors[rarity] || 0xffffff;
}
