/**
 * 装备管理系统
 * 管理玩家的装备槽位、套装效果和装备属性
 */

import { 
    Weapon, 
    Armor, 
    ArmorSet, 
    EquipmentSlots, 
    CombatStats, 
    ItemStats,
    SetEffect,
    SetEffectType 
} from '../core/Types';
import { getArmorSetById } from '../data/Armors';

export class EquipmentSystem {
    private equipmentSlots: EquipmentSlots;
    private activeSetEffects: Map<string, SetEffect[]> = new Map(); // 套装ID -> 激活的效果列表
    private onEquipmentChanged?: () => void; // 装备变更回调

    constructor() {
        this.equipmentSlots = {
            weapon: null,
            helmet: null,
            chestplate: null,
            leggings: null,
            accessory: null
        };
    }

    /**
     * 设置装备变更回调
     */
    public setOnEquipmentChanged(callback: () => void): void {
        this.onEquipmentChanged = callback;
    }

    /**
     * 装备武器
     */
    public equipWeapon(weapon: Weapon): Weapon | null {
        const previousWeapon = this.equipmentSlots.weapon;
        this.equipmentSlots.weapon = weapon;
        
        // 触发装备变更
        this.onEquipmentChanged?.();
        
        return previousWeapon;
    }

    /**
     * 装备防具
     */
    public equipArmor(armor: Armor): Armor | null {
        const slot = armor.slot;
        const previousArmor = this.equipmentSlots[slot];
        this.equipmentSlots[slot] = armor;
        
        // 更新套装效果
        this.updateSetEffects();
        
        // 触发装备变更
        this.onEquipmentChanged?.();
        
        return previousArmor;
    }

    /**
     * 卸下武器
     */
    public unequipWeapon(): Weapon | null {
        const weapon = this.equipmentSlots.weapon;
        this.equipmentSlots.weapon = null;
        
        this.onEquipmentChanged?.();
        
        return weapon;
    }

    /**
     * 卸下防具
     */
    public unequipArmor(slot: keyof Omit<EquipmentSlots, 'weapon'>): Armor | null {
        const armor = this.equipmentSlots[slot];
        this.equipmentSlots[slot] = null;
        
        // 更新套装效果
        this.updateSetEffects();
        
        this.onEquipmentChanged?.();
        
        return armor;
    }

    /**
     * 获取装备槽位
     */
    public getEquipmentSlots(): EquipmentSlots {
        return { ...this.equipmentSlots };
    }

    /**
     * 获取当前武器
     */
    public getCurrentWeapon(): Weapon | null {
        return this.equipmentSlots.weapon;
    }

    /**
     * 获取指定槽位的防具
     */
    public getArmorBySlot(slot: keyof Omit<EquipmentSlots, 'weapon'>): Armor | null {
        return this.equipmentSlots[slot];
    }

    /**
     * 计算所有装备提供的属性加成
     */
    public calculateTotalStats(): ItemStats {
        const totalStats: ItemStats = {};

        // 武器属性（武器属性单独处理，不在这里计算）
        // 防具属性
        const armorSlots: (keyof Omit<EquipmentSlots, 'weapon'>)[] = ['helmet', 'chestplate', 'leggings', 'accessory'];
        
        for (const slot of armorSlots) {
            const armor = this.equipmentSlots[slot];
            if (armor) {
                this.addStats(totalStats, armor.stats);
            }
        }

        // 套装效果属性加成
        this.activeSetEffects.forEach((effects) => {
            effects.forEach(effect => {
                this.applySetEffectStats(totalStats, effect);
            });
        });

        return totalStats;
    }

    /**
     * 应用属性加成
     */
    private addStats(total: ItemStats, addition: ItemStats): void {
        for (const key in addition) {
            const statKey = key as keyof ItemStats;
            if (addition[statKey] !== undefined) {
                if (total[statKey] === undefined) {
                    total[statKey] = addition[statKey];
                } else {
                    (total[statKey] as number) += addition[statKey] as number;
                }
            }
        }
    }

    /**
     * 应用套装效果属性加成
     */
    private applySetEffectStats(total: ItemStats, effect: SetEffect): void {
        // 某些套装效果会提供属性加成
        switch (effect.type) {
            case 'shield':
                // 护盾效果增加生命值
                if (total.maxHp === undefined) {
                    total.maxHp = 0;
                }
                total.maxHp += effect.value;
                break;
            case 'regeneration':
                // 生命恢复效果（在战斗系统中处理）
                break;
            // 其他效果在战斗系统中处理
        }
    }

    /**
     * 更新套装效果
     */
    private updateSetEffects(): void {
        this.activeSetEffects.clear();

        // 统计每个套装的装备数量
        const setPieceCounts: Map<string, number> = new Map();

        const armorSlots: (keyof Omit<EquipmentSlots, 'weapon'>)[] = ['helmet', 'chestplate', 'leggings', 'accessory'];
        
        for (const slot of armorSlots) {
            const armor = this.equipmentSlots[slot];
            if (armor && armor.setId) {
                const count = setPieceCounts.get(armor.setId) || 0;
                setPieceCounts.set(armor.setId, count + 1);
            }
        }

        // 检查并激活套装效果
        setPieceCounts.forEach((count, setId) => {
            const setData = getArmorSetById(setId);
            if (!setData) return;

            const activeEffects: SetEffect[] = [];

            // 2件套效果
            if (count >= 2) {
                activeEffects.push(setData.twoPieceBonus);
            }

            // 4件套效果
            if (count >= 4) {
                activeEffects.push(setData.fourPieceBonus);
            }

            if (activeEffects.length > 0) {
                this.activeSetEffects.set(setId, activeEffects);
            }
        });
    }

    /**
     * 获取激活的套装效果
     */
    public getActiveSetEffects(): Map<string, SetEffect[]> {
        return new Map(this.activeSetEffects);
    }

    /**
     * 检查是否有指定的套装效果
     */
    public hasSetEffect(effectType: SetEffectType): boolean {
        for (const effects of this.activeSetEffects.values()) {
            if (effects.some(e => e.type === effectType)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取指定套装效果的数值
     */
    public getSetEffectValue(effectType: SetEffectType): number {
        let totalValue = 0;
        
        for (const effects of this.activeSetEffects.values()) {
            for (const effect of effects) {
                if (effect.type === effectType) {
                    totalValue += effect.value;
                }
            }
        }
        
        return totalValue;
    }

    /**
     * 获取套装效果描述列表
     */
    public getSetEffectDescriptions(): string[] {
        const descriptions: string[] = [];
        
        this.activeSetEffects.forEach((effects, setId) => {
            const setData = getArmorSetById(setId);
            if (setData) {
                descriptions.push(`【${setData.name}套装】`);
                effects.forEach(effect => {
                    descriptions.push(`  - ${effect.description}`);
                });
            }
        });
        
        return descriptions;
    }

    /**
     * 应用装备属性到玩家属性
     */
    public applyEquipmentStats(baseStats: CombatStats): CombatStats {
        const equipmentStats = this.calculateTotalStats();
        const result = { ...baseStats };

        // 应用防具属性加成
        if (equipmentStats.attack) result.attack += equipmentStats.attack;
        if (equipmentStats.defense) result.defense += equipmentStats.defense;
        if (equipmentStats.maxHp) {
            result.maxHp += equipmentStats.maxHp;
            // 如果当前生命值低于最大值，也相应提升
            if (result.hp < result.maxHp) {
                result.hp = Math.min(result.hp + equipmentStats.maxHp, result.maxHp);
            }
        }
        if (equipmentStats.hp) result.hp = Math.min(result.hp + equipmentStats.hp, result.maxHp);
        if (equipmentStats.attackSpeed) result.attackSpeed += equipmentStats.attackSpeed;
        if (equipmentStats.critRate) result.critRate += equipmentStats.critRate;
        if (equipmentStats.critDamage) result.critDamage += equipmentStats.critDamage;
        if (equipmentStats.moveSpeed) result.moveSpeed += equipmentStats.moveSpeed;
        if (equipmentStats.maxMana) {
            result.maxMana = (result.maxMana || 0) + equipmentStats.maxMana;
        }
        if (equipmentStats.mana) {
            result.mana = (result.mana || 0) + equipmentStats.mana;
        }

        return result;
    }

    /**
     * 处理特殊效果触发
     * 返回触发的特殊效果列表
     */
    public processSpecialEffects(context: {
        isAttacking?: boolean;
        isTakingDamage?: boolean;
        damageDealt?: number;
        damageTaken?: number;
        isCritical?: boolean;
        currentHp?: number;
        maxHp?: number;
    }): Array<{ type: string; value: number; description: string }> {
        const triggeredEffects: Array<{ type: string; value: number; description: string }> = [];

        // 检查防具特殊效果
        const armorSlots: (keyof Omit<EquipmentSlots, 'weapon'>)[] = ['helmet', 'chestplate', 'leggings', 'accessory'];
        
        for (const slot of armorSlots) {
            const armor = this.equipmentSlots[slot];
            if (armor && armor.specialEffect) {
                // 这里可以根据特殊效果描述触发相应逻辑
                // 实际触发逻辑在战斗系统中处理
            }
        }

        // 检查套装效果
        this.activeSetEffects.forEach((effects) => {
            effects.forEach(effect => {
                // 套装效果的实际触发在战斗系统中处理
                // 这里只是返回激活的效果信息
                triggeredEffects.push({
                    type: effect.type,
                    value: effect.value,
                    description: effect.description
                });
            });
        });

        return triggeredEffects;
    }

    /**
     * 获取装备信息摘要
     */
    public getEquipmentSummary(): {
        weapon: Weapon | null;
        armors: { slot: string; armor: Armor | null }[];
        activeSets: { name: string; pieces: number; effects: string[] }[];
    } {
        const armors: { slot: string; armor: Armor | null }[] = [
            { slot: '头盔', armor: this.equipmentSlots.helmet },
            { slot: '胸甲', armor: this.equipmentSlots.chestplate },
            { slot: '护腿', armor: this.equipmentSlots.leggings },
            { slot: '饰品', armor: this.equipmentSlots.accessory }
        ];

        const activeSets: { name: string; pieces: number; effects: string[] }[] = [];
        
        this.activeSetEffects.forEach((effects, setId) => {
            const setData = getArmorSetById(setId);
            if (setData) {
                // 统计该套装的装备数量
                let pieces = 0;
                const armorSlots: (keyof Omit<EquipmentSlots, 'weapon'>)[] = ['helmet', 'chestplate', 'leggings', 'accessory'];
                for (const slot of armorSlots) {
                    const armor = this.equipmentSlots[slot];
                    if (armor && armor.setId === setId) {
                        pieces++;
                    }
                }

                activeSets.push({
                    name: setData.name,
                    pieces: pieces,
                    effects: effects.map(e => e.description)
                });
            }
        });

        return {
            weapon: this.equipmentSlots.weapon,
            armors: armors,
            activeSets: activeSets
        };
    }

    /**
     * 清空所有装备
     */
    public clearAll(): void {
        this.equipmentSlots = {
            weapon: null,
            helmet: null,
            chestplate: null,
            leggings: null,
            accessory: null
        };
        this.activeSetEffects.clear();
        this.onEquipmentChanged?.();
    }

    /**
     * 获取存档数据
     */
    public getSaveData(): any {
        return {
            weapon: this.equipmentSlots.weapon?.id || null,
            helmet: this.equipmentSlots.helmet?.id || null,
            chestplate: this.equipmentSlots.chestplate?.id || null,
            leggings: this.equipmentSlots.leggings?.id || null,
            accessory: this.equipmentSlots.accessory?.id || null
        };
    }

    /**
     * 加载存档数据
     */
    public loadSaveData(data: any, getWeaponById: (id: string) => Weapon | undefined, getArmorById: (id: string) => Armor | undefined): void {
        if (data.weapon) {
            const weapon = getWeaponById(data.weapon);
            if (weapon) this.equipmentSlots.weapon = weapon;
        }
        if (data.helmet) {
            const armor = getArmorById(data.helmet);
            if (armor) this.equipmentSlots.helmet = armor;
        }
        if (data.chestplate) {
            const armor = getArmorById(data.chestplate);
            if (armor) this.equipmentSlots.chestplate = armor;
        }
        if (data.leggings) {
            const armor = getArmorById(data.leggings);
            if (armor) this.equipmentSlots.leggings = armor;
        }
        if (data.accessory) {
            const armor = getArmorById(data.accessory);
            if (armor) this.equipmentSlots.accessory = armor;
        }

        // 更新套装效果
        this.updateSetEffects();
    }
}
