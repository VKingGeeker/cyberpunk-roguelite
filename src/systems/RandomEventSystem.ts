/**
 * 随机事件系统
 * 管理游戏中随机事件的触发、处理和奖励发放
 */

import { 
    EventData, 
    EventOption, 
    EventResult, 
    EventReward, 
    EventRisk,
    EventState,
    EventType,
    EventRarity,
    ItemRarity,
    EnemyType
} from '../core/Types';
import { EVENT_CONFIG, GAME_CONFIG } from '../core/Config';
import { 
    getRandomEvent, 
    getEventById,
    getEventRarityColor 
} from '../data/Events';
import Player from '../entities/Player';

/**
 * 随机事件系统类
 */
export class RandomEventSystem {
    private scene: Phaser.Scene;
    private state: EventState;
    private player: Player | null = null;
    private currentEvent: EventData | null = null;
    
    // 回调函数
    private onEventTriggered?: (event: EventData) => void;
    private onEventCompleted?: (result: EventResult) => void;
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.state = {
            triggeredEvents: [],
            lastEventTime: 0,
            eventCooldown: EVENT_CONFIG.trigger.cooldown
        };
    }
    
    /**
     * 设置玩家引用
     */
    public setPlayer(player: Player): void {
        this.player = player;
    }
    
    /**
     * 设置回调函数
     */
    public setCallbacks(
        onTriggered?: (event: EventData) => void,
        onCompleted?: (result: EventResult) => void
    ): void {
        this.onEventTriggered = onTriggered;
        this.onEventCompleted = onCompleted;
    }
    
    /**
     * 检查是否可以触发事件
     */
    public canTriggerEvent(currentTime: number, killCount: number, playerLevel: number): boolean {
        // 检查冷却时间
        if (currentTime - this.state.lastEventTime < this.state.eventCooldown) {
            return false;
        }
        
        // 检查最小击杀数
        if (killCount < EVENT_CONFIG.trigger.minKillCount) {
            return false;
        }
        
        // 计算触发概率
        const baseChance = EVENT_CONFIG.trigger.baseChance;
        const levelBonus = playerLevel * EVENT_CONFIG.trigger.levelBonus;
        const totalChance = Math.min(baseChance + levelBonus, 0.5); // 最大50%概率
        
        return Math.random() < totalChance;
    }
    
    /**
     * 尝试触发随机事件
     */
    public tryTriggerEvent(currentTime: number, killCount: number, playerLevel: number): EventData | null {
        if (!this.canTriggerEvent(currentTime, killCount, playerLevel)) {
            return null;
        }
        
        // 获取随机事件
        const event = getRandomEvent(
            playerLevel, 
            this.state.triggeredEvents,
            EVENT_CONFIG.typeWeights
        );
        
        if (!event) {
            return null;
        }
        
        // 记录触发
        this.state.lastEventTime = currentTime;
        this.currentEvent = event;
        
        // 如果是一次性事件，添加到已触发列表
        if (event.oneTime) {
            this.state.triggeredEvents.push(event.id);
        }
        
        // 触发回调
        if (this.onEventTriggered) {
            this.onEventTriggered(event);
        }
        
        return event;
    }
    
    /**
     * 处理事件选项
     */
    public processEventOption(optionId: string): EventResult {
        if (!this.currentEvent) {
            return {
                success: false,
                rewards: [],
                message: '没有当前事件'
            };
        }
        
        // 查找选项
        const option = this.currentEvent.options.find(opt => opt.id === optionId);
        
        if (!option) {
            return {
                success: false,
                rewards: [],
                message: '无效的选项'
            };
        }
        
        // 检查需求条件
        if (option.requirement && !this.checkRequirement(option.requirement)) {
            return {
                success: false,
                rewards: [],
                message: '不满足条件'
            };
        }
        
        // 检查代价
        if (option.cost && !this.checkCost(option.cost)) {
            return {
                success: false,
                rewards: [],
                message: '资源不足'
            };
        }
        
        // 支付代价
        if (option.cost) {
            this.payCost(option.cost);
        }
        
        // 处理奖励
        const rewards = this.generateRewards(option);
        
        // 检查风险
        let risk: EventRisk | undefined;
        if (option.risk && Math.random() < (option.riskChance || 0)) {
            risk = option.risk;
            this.applyRisk(risk);
        }
        
        // 应用奖励
        this.applyRewards(rewards);
        
        // 构建结果消息
        const message = this.buildResultMessage(rewards, risk);
        
        const result: EventResult = {
            success: true,
            rewards,
            risk,
            message
        };
        
        // 清除当前事件
        this.currentEvent = null;
        
        // 触发回调
        if (this.onEventCompleted) {
            this.onEventCompleted(result);
        }
        
        return result;
    }
    
    /**
     * 检查需求条件
     */
    private checkRequirement(requirement: NonNullable<EventOption['requirement']>): boolean {
        if (!this.player) return false;
        
        switch (requirement.type) {
            case 'level':
                return this.player.getLevel() >= requirement.value;
            case 'gold':
                // 金币系统暂未实现，默认返回true
                return true;
            case 'hp':
                return this.player.getStats().hp >= requirement.value;
            case 'item':
                // 物品检查暂未实现
                return true;
            default:
                return true;
        }
    }
    
    /**
     * 检查代价是否足够
     */
    private checkCost(cost: NonNullable<EventOption['cost']>): boolean {
        if (!this.player) return false;
        
        switch (cost.type) {
            case 'gold':
                // 金币系统暂未实现，默认返回true
                return true;
            case 'hp':
                return this.player.getStats().hp > cost.value;
            case 'time_fragment':
                // 需要从TimeRewindSystem获取
                return true;
            case 'item':
                // 物品检查暂未实现
                return true;
            default:
                return true;
        }
    }
    
    /**
     * 支付代价
     */
    private payCost(cost: NonNullable<EventOption['cost']>): void {
        if (!this.player) return;
        
        switch (cost.type) {
            case 'hp':
                this.player.takeDamage(cost.value);
                break;
            case 'time_fragment':
                // 通过事件系统扣除时空碎片
                this.scene.events.emit('consume-time-fragments', cost.value);
                break;
            case 'gold':
            case 'item':
                // 暂未实现
                break;
        }
    }
    
    /**
     * 生成奖励
     */
    private generateRewards(option: EventOption): EventReward[] {
        const rewards: EventReward[] = [];
        
        for (const reward of option.rewards) {
            // 根据奖励类型生成具体奖励
            switch (reward.type) {
                case 'gold':
                    rewards.push({
                        type: 'gold',
                        value: reward.value || Math.floor(Math.random() * 50 + 20)
                    });
                    break;
                    
                case 'experience':
                    rewards.push({
                        type: 'experience',
                        value: reward.value || Math.floor(Math.random() * 30 + 10)
                    });
                    break;
                    
                case 'item':
                    rewards.push({
                        type: 'item',
                        rarity: reward.rarity || this.getRandomRarity()
                    });
                    break;
                    
                case 'weapon':
                    rewards.push({
                        type: 'weapon',
                        rarity: reward.rarity || ItemRarity.RARE
                    });
                    break;
                    
                case 'skill':
                    rewards.push({
                        type: 'skill',
                        skillId: reward.skillId || 'random'
                    });
                    break;
                    
                case 'heal':
                    rewards.push({
                        type: 'heal',
                        value: reward.value || 30
                    });
                    break;
                    
                case 'stat_boost':
                    if (reward.statType && reward.statValue) {
                        rewards.push({
                            type: 'stat_boost',
                            statType: reward.statType,
                            statValue: reward.statValue,
                            isPercentage: reward.isPercentage || false
                        });
                    }
                    break;
                    
                case 'time_fragment':
                    rewards.push({
                        type: 'time_fragment',
                        value: reward.value || Math.floor(Math.random() * 10 + 5)
                    });
                    break;
                    
                case 'nothing':
                    rewards.push({ type: 'nothing' });
                    break;
            }
        }
        
        // 特殊处理：转盘事件
        if (this.currentEvent?.type === EventType.ROULETTE) {
            return this.generateRouletteRewards(option.id);
        }
        
        return rewards;
    }
    
    /**
     * 生成转盘奖励
     */
    private generateRouletteRewards(optionId: string): EventReward[] {
        const isPremium = optionId === 'spin_premium';
        const isBig = optionId === 'play_big';
        
        // 转盘奖励池
        const rewardPool: { weight: number; reward: EventReward }[] = [
            { weight: 30, reward: { type: 'gold', value: isPremium ? 100 : 50 } },
            { weight: 25, reward: { type: 'experience', value: isPremium ? 80 : 40 } },
            { weight: 20, reward: { type: 'heal', value: isPremium ? 50 : 25 } },
            { weight: 15, reward: { type: 'item', rarity: isPremium ? ItemRarity.RARE : ItemRarity.COMMON } },
            { weight: 8, reward: { type: 'stat_boost', statType: 'attack', statValue: isPremium ? 10 : 5, isPercentage: false } },
            { weight: 2, reward: { type: 'weapon', rarity: isPremium ? ItemRarity.EPIC : ItemRarity.RARE } }
        ];
        
        // 头奖概率
        if (Math.random() < EVENT_CONFIG.roulette.jackpotChance) {
            return [
                { type: 'weapon', rarity: ItemRarity.LEGENDARY },
                { type: 'time_fragment', value: 20 },
                { type: 'experience', value: 200 }
            ];
        }
        
        // 随机选择奖励
        const totalWeight = rewardPool.reduce((sum, r) => sum + r.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const { weight, reward } of rewardPool) {
            random -= weight;
            if (random <= 0) {
                return [reward];
            }
        }
        
        return [{ type: 'gold', value: 10 }];
    }
    
    /**
     * 应用奖励
     */
    private applyRewards(rewards: EventReward[]): void {
        if (!this.player) return;
        
        for (const reward of rewards) {
            switch (reward.type) {
                case 'gold':
                    // 金币系统暂未实现
                    this.showRewardText(`+${reward.value} 金币`);
                    break;
                    
                case 'experience':
                    if (reward.value) {
                        this.player.addExperience(reward.value);
                        this.showRewardText(`+${reward.value} 经验`);
                    }
                    break;
                    
                case 'item':
                    // 随机物品
                    this.player.grantRandomWeapon();
                    this.showRewardText(`获得物品！`);
                    break;
                    
                case 'weapon':
                    // 随机武器
                    this.player.grantRandomWeapon();
                    this.showRewardText(`获得武器！`);
                    break;
                    
                case 'skill':
                    // 随机技能
                    this.player.grantRandomWeapon(); // 暂用武器代替
                    this.showRewardText(`获得技能！`);
                    break;
                    
                case 'heal':
                    if (reward.value) {
                        this.player.heal(reward.value);
                        this.showRewardText(`+${reward.value} 生命`);
                    }
                    break;
                    
                case 'stat_boost':
                    if (reward.statType && reward.statValue) {
                        // 使用属性加成系统
                        this.player.applyAttributeBoost(
                            `event_${reward.statType}`,
                            reward.statValue,
                            reward.isPercentage || false
                        );
                        this.showRewardText(`${reward.statType} +${reward.statValue}`);
                    }
                    break;
                    
                case 'time_fragment':
                    if (reward.value) {
                        this.scene.events.emit('add-time-fragments', reward.value);
                        this.showRewardText(`+${reward.value} 时空碎片`);
                    }
                    break;
            }
        }
    }
    
    /**
     * 应用风险
     */
    private applyRisk(risk: EventRisk): void {
        if (!this.player) return;
        
        switch (risk.type) {
            case 'damage':
                if (risk.value) {
                    this.player.takeDamage(risk.value);
                }
                break;
                
            case 'debuff':
                // 减益效果暂未实现
                break;
                
            case 'lose_gold':
                // 金币系统暂未实现
                break;
                
            case 'lose_item':
                // 物品丢失暂未实现
                break;
                
            case 'spawn_enemy':
                if (risk.enemyType && risk.enemyCount) {
                    this.scene.events.emit('spawn-event-enemies', {
                        type: risk.enemyType,
                        count: risk.enemyCount
                    });
                }
                break;
                
            case 'nothing':
                // 无效果
                break;
        }
    }
    
    /**
     * 构建结果消息
     */
    private buildResultMessage(rewards: EventReward[], risk?: EventRisk): string {
        const messages: string[] = [];
        
        if (rewards.length > 0 && rewards[0].type !== 'nothing') {
            messages.push('获得了奖励！');
        }
        
        if (risk && risk.type !== 'nothing') {
            messages.push(risk.description);
        }
        
        return messages.join(' 但是');
    }
    
    /**
     * 显示奖励文本
     */
    private showRewardText(text: string): void {
        if (!this.player) return;
        
        const rewardText = this.scene.add.text(
            this.player.x,
            this.player.y - 80,
            text,
            {
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#00ffff',
                fontFamily: 'Courier New, monospace',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        rewardText.setOrigin(0.5);
        rewardText.setDepth(300);
        
        this.scene.tweens.add({
            targets: rewardText,
            y: rewardText.y - 40,
            alpha: 0,
            duration: 1500,
            onComplete: () => rewardText.destroy()
        });
    }
    
    /**
     * 获取随机稀有度
     */
    private getRandomRarity(): ItemRarity {
        const weights = EVENT_CONFIG.rewardRarityWeights;
        const totalWeight = weights.common + weights.rare + weights.epic + weights.legendary;
        const random = Math.random() * totalWeight;
        
        if (random < weights.legendary) return ItemRarity.LEGENDARY;
        if (random < weights.legendary + weights.epic) return ItemRarity.EPIC;
        if (random < weights.legendary + weights.epic + weights.rare) return ItemRarity.RARE;
        return ItemRarity.COMMON;
    }
    
    /**
     * 获取当前事件
     */
    public getCurrentEvent(): EventData | null {
        return this.currentEvent;
    }
    
    /**
     * 获取事件状态
     */
    public getState(): EventState {
        return { ...this.state };
    }
    
    /**
     * 加载事件状态
     */
    public loadState(state: EventState): void {
        this.state = { ...state };
    }
    
    /**
     * 重置事件系统
     */
    public reset(): void {
        this.state = {
            triggeredEvents: [],
            lastEventTime: 0,
            eventCooldown: EVENT_CONFIG.trigger.cooldown
        };
        this.currentEvent = null;
    }
    
    /**
     * 强制触发指定事件（用于测试）
     */
    public forceTriggerEvent(eventId: string): EventData | null {
        const event = getEventById(eventId);
        if (event) {
            this.currentEvent = event;
            if (this.onEventTriggered) {
                this.onEventTriggered(event);
            }
        }
        return event;
    }
}
