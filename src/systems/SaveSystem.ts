/**
 * 存档系统
 * 使用 LocalStorage 实现游戏进度保存和加载
 */

export interface SaveData {
    version: string;           // 存档版本
    timestamp: number;         // 保存时间戳
    player: {
        x: number;
        y: number;
        hp: number;
        maxHp: number;
        level: number;
        experience: number;
        killCount: number;
        ownedSkills: Map<string, { level: number; cooldownEndTime: number }>;
        weaponSlots: (string | null)[];
        activeWeaponSlot: number;
    };
    stats: {
        attack: number;
        defense: number;
        attackSpeed: number;
        critRate: number;
        critDamage: number;
        moveSpeed: number;
    };
    gameTime: number;          // 游戏时间（秒）
}

export interface SaveSlot {
    id: number;
    data: SaveData | null;
    isEmpty: boolean;
    lastSaved: string;
}

/**
 * 存档管理类
 */
export class SaveSystem {
    private static readonly SAVE_KEY_PREFIX = 'cyberpunk_roguelite_save_';
    private static readonly CURRENT_VERSION = '1.0.0';
    private static readonly MAX_SLOTS = 3;

    /**
     * 保存游戏到指定槽位
     */
    public static save(slotId: number, data: SaveData): boolean {
        try {
            const key = this.getSlotKey(slotId);
            data.version = this.CURRENT_VERSION;
            data.timestamp = Date.now();
            
            // 将 Map 转换为普通对象以便 JSON 序列化
            const serializedData = this.serializeSaveData(data);
            
            localStorage.setItem(key, JSON.stringify(serializedData));
            console.log(`[SaveSystem] 游戏已保存到槽位 ${slotId}`);
            return true;
        } catch (error) {
            console.error('[SaveSystem] 保存失败:', error);
            return false;
        }
    }

    /**
     * 从指定槽位加载游戏
     */
    public static load(slotId: number): SaveData | null {
        try {
            const key = this.getSlotKey(slotId);
            const savedString = localStorage.getItem(key);
            
            if (!savedString) {
                console.log(`[SaveSystem] 槽位 ${slotId} 没有存档`);
                return null;
            }

            const data = JSON.parse(savedString);
            const deserializedData = this.deserializeSaveData(data);
            
            console.log(`[SaveSystem] 已加载槽位 ${slotId} 的存档`);
            return deserializedData;
        } catch (error) {
            console.error('[SaveSystem] 加载失败:', error);
            return null;
        }
    }

    /**
     * 删除指定槽位的存档
     */
    public static delete(slotId: number): boolean {
        try {
            const key = this.getSlotKey(slotId);
            localStorage.removeItem(key);
            console.log(`[SaveSystem] 已删除槽位 ${slotId} 的存档`);
            return true;
        } catch (error) {
            console.error('[SaveSystem] 删除失败:', error);
            return false;
        }
    }

    /**
     * 获取所有存档槽位信息
     */
    public static getAllSlots(): SaveSlot[] {
        const slots: SaveSlot[] = [];
        
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            const data = this.load(i);
            slots.push({
                id: i,
                data: data,
                isEmpty: data === null,
                lastSaved: data ? this.formatTimestamp(data.timestamp) : '空'
            });
        }
        
        return slots;
    }

    /**
     * 检查是否有存档
     */
    public static hasSave(slotId: number): boolean {
        const key = this.getSlotKey(slotId);
        return localStorage.getItem(key) !== null;
    }

    /**
     * 获取最新存档
     */
    public static getLatestSave(): { slotId: number; data: SaveData } | null {
        let latestSlot = -1;
        let latestTime = 0;
        
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            const data = this.load(i);
            if (data && data.timestamp > latestTime) {
                latestTime = data.timestamp;
                latestSlot = i;
            }
        }
        
        if (latestSlot >= 0) {
            return { slotId: latestSlot, data: this.load(latestSlot)! };
        }
        
        return null;
    }

    /**
     * 自动保存
     */
    public static autoSave(data: SaveData): void {
        const autoSaveKey = this.SAVE_KEY_PREFIX + 'auto';
        
        data.version = this.CURRENT_VERSION;
        data.timestamp = Date.now();
        
        const serializedData = this.serializeSaveData(data);
        localStorage.setItem(autoSaveKey, JSON.stringify(serializedData));
        
        console.log('[SaveSystem] 自动保存完成');
    }

    /**
     * 加载自动存档
     */
    public static loadAutoSave(): SaveData | null {
        const autoSaveKey = this.SAVE_KEY_PREFIX + 'auto';
        const savedString = localStorage.getItem(autoSaveKey);
        
        if (!savedString) {
            return null;
        }
        
        try {
            const data = JSON.parse(savedString);
            return this.deserializeSaveData(data);
        } catch (error) {
            console.error('[SaveSystem] 加载自动存档失败:', error);
            return null;
        }
    }

    /**
     * 清除所有存档
     */
    public static clearAll(): void {
        for (let i = 0; i < this.MAX_SLOTS; i++) {
            this.delete(i);
        }
        localStorage.removeItem(this.SAVE_KEY_PREFIX + 'auto');
        console.log('[SaveSystem] 已清除所有存档');
    }

    // ========== 私有方法 ==========

    private static getSlotKey(slotId: number): string {
        return this.SAVE_KEY_PREFIX + slotId;
    }

    /**
     * 序列化存档数据（处理 Map 等特殊类型）
     */
    private static serializeSaveData(data: SaveData): any {
        return {
            ...data,
            player: {
                ...data.player,
                ownedSkills: Array.from(data.player.ownedSkills.entries())
            }
        };
    }

    /**
     * 反序列化存档数据
     */
    private static deserializeSaveData(data: any): SaveData {
        return {
            ...data,
            player: {
                ...data.player,
                ownedSkills: new Map(data.player.ownedSkills || [])
            }
        };
    }

    /**
     * 格式化时间戳
     */
    private static formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
}
