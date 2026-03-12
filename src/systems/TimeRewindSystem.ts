/**
 * 时间回溯系统
 * 赛博朋克肉鸽游戏的核心机制 - 玩家可以消耗时空碎片回溯到之前的状态
 */

import Phaser from 'phaser';

/**
 * 时间快照数据结构
 */
export interface TimeSnapshot {
    id: string;
    timestamp: number;
    gameTime: number;
    playerData: {
        x: number;
        y: number;
        hp: number;
        maxHp: number;
        level: number;
        experience: number;
        maxExperience: number;
        killCount: number;
        weapons: string[];
        activeWeaponSlot: number;
        skills: string[];
        ownedSkills: [string, { level: number; cooldownEndTime: number }][]; // 完整技能数据
        stats: {
            attack: number;
            defense: number;
            attackSpeed: number;
            critRate: number;
            critDamage: number;
            moveSpeed: number;
        };
    };
    worldData: {
        enemiesDefeated: number;
        gameTime: number;
    };
    metadata: {
        isCheckpoint: boolean;
        label: string;
    };
}

/**
 * 回溯惩罚配置
 */
export interface RewindPenalty {
    hpLossPercent: number;      // HP损失百分比
    experienceLossPercent: number; // 经验损失百分比
    timeFragmentCost: number;   // 时空碎片消耗
}

/**
 * 时间回溯配置
 */
export const TIME_REWIND_CONFIG = {
    // 时空碎片
    initialTimeFragments: 3,
    maxTimeFragments: 10,
    fragmentDropRate: 0.15,     // 击杀敌人掉落概率
    fragmentDropAmount: 1,      // 每次掉落数量
    
    // 快照
    maxSnapshots: 5,            // 最大快照数量
    autoSnapshotInterval: 60000, // 自动快照间隔（毫秒）
    checkpointSnapshotInterval: 120000, // 检查点快照间隔
    
    // 回溯惩罚
    rewindPenalty: {
        hpLossPercent: 20,      // 损失20%最大生命值
        experienceLossPercent: 10, // 损失10%当前经验
        timeFragmentCost: 1     // 消耗1个时空碎片
    } as RewindPenalty,
    
    // 检查点
    checkpoints: [
        { gameTime: 60, label: '1分钟' },
        { gameTime: 180, label: '3分钟' },
        { gameTime: 300, label: '5分钟' },
        { gameTime: 600, label: '10分钟' },
    ]
};

/**
 * 时间回溯系统类
 */
export class TimeRewindSystem {
    private scene: Phaser.Scene;
    private snapshots: TimeSnapshot[] = [];
    private timeFragments: number = TIME_REWIND_CONFIG.initialTimeFragments;
    private autoSnapshotTimer: Phaser.Time.TimerEvent | null = null;
    private onSnapshotCreate: ((snapshot: TimeSnapshot) => void) | null = null;
    private onRewind: ((snapshot: TimeSnapshot) => void) | null = null;
    private onFragmentsChange: ((count: number) => void) | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 获取当前时空碎片数量
     */
    public getTimeFragments(): number {
        return this.timeFragments;
    }

    /**
     * 添加时空碎片
     */
    public addTimeFragments(amount: number): void {
        this.timeFragments = Math.min(
            this.timeFragments + amount,
            TIME_REWIND_CONFIG.maxTimeFragments
        );
        if (this.onFragmentsChange) {
            this.onFragmentsChange(this.timeFragments);
        }
        console.log(`[TimeRewind] 获得时空碎片 +${amount}，当前: ${this.timeFragments}`);
    }

    /**
     * 消耗时空碎片
     */
    public consumeTimeFragments(amount: number): boolean {
        if (this.timeFragments < amount) {
            return false;
        }
        this.timeFragments -= amount;
        if (this.onFragmentsChange) {
            this.onFragmentsChange(this.timeFragments);
        }
        return true;
    }

    /**
     * 创建快照
     */
    public createSnapshot(
        playerData: TimeSnapshot['playerData'],
        worldData: TimeSnapshot['worldData'],
        isCheckpoint: boolean = false,
        label: string = ''
    ): TimeSnapshot {
        const snapshot: TimeSnapshot = {
            id: `snapshot_${Date.now()}`,
            timestamp: Date.now(),
            gameTime: worldData.gameTime,
            playerData: { ...playerData },
            worldData: { ...worldData },
            metadata: {
                isCheckpoint,
                label: label || this.generateLabel(worldData.gameTime)
            }
        };

        // 添加到快照列表
        this.snapshots.unshift(snapshot);

        // 限制快照数量
        if (this.snapshots.length > TIME_REWIND_CONFIG.maxSnapshots) {
            this.snapshots = this.snapshots.slice(0, TIME_REWIND_CONFIG.maxSnapshots);
        }

        console.log(`[TimeRewind] 创建快照: ${snapshot.metadata.label}`);
        
        if (this.onSnapshotCreate) {
            this.onSnapshotCreate(snapshot);
        }

        return snapshot;
    }

    /**
     * 生成快照标签
     */
    private generateLabel(gameTime: number): string {
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        return `${minutes}分${seconds}秒`;
    }

    /**
     * 获取所有快照
     */
    public getSnapshots(): TimeSnapshot[] {
        return [...this.snapshots];
    }

    /**
     * 获取最新快照
     */
    public getLatestSnapshot(): TimeSnapshot | null {
        return this.snapshots.length > 0 ? this.snapshots[0] : null;
    }

    /**
     * 检查是否可以回溯
     */
    public canRewind(): boolean {
        return this.snapshots.length > 0 && 
               this.timeFragments >= TIME_REWIND_CONFIG.rewindPenalty.timeFragmentCost;
    }

    /**
     * 执行时间回溯
     */
    public rewind(snapshotId: string): TimeSnapshot | null {
        const snapshot = this.snapshots.find(s => s.id === snapshotId);
        if (!snapshot) {
            console.error('[TimeRewind] 找不到快照:', snapshotId);
            return null;
        }

        // 消耗时空碎片
        if (!this.consumeTimeFragments(TIME_REWIND_CONFIG.rewindPenalty.timeFragmentCost)) {
            console.error('[TimeRewind] 时空碎片不足');
            return null;
        }

        console.log(`[TimeRewind] 回溯到: ${snapshot.metadata.label}`);
        
        if (this.onRewind) {
            this.onRewind(snapshot);
        }

        return snapshot;
    }

    /**
     * 应用回溯惩罚
     * 注意：此方法会修改传入的 playerData 对象
     */
    public applyPenalty(playerData: TimeSnapshot['playerData']): TimeSnapshot['playerData'] {
        const penalty = TIME_REWIND_CONFIG.rewindPenalty;
        
        // 应用HP损失（最低保留1点HP）
        const hpLoss = Math.floor(playerData.maxHp * (penalty.hpLossPercent / 100));
        playerData.hp = Math.max(1, playerData.hp - hpLoss);
        
        // 应用经验损失（最低保留0点经验）
        const expLoss = Math.floor(playerData.experience * (penalty.experienceLossPercent / 100));
        playerData.experience = Math.max(0, playerData.experience - expLoss);

        console.log(`[TimeRewind] 应用惩罚: HP-${hpLoss}, 经验-${expLoss}`);
        
        return playerData;
    }

    /**
     * 删除快照
     */
    public deleteSnapshot(snapshotId: string): void {
        const index = this.snapshots.findIndex(s => s.id === snapshotId);
        if (index !== -1) {
            this.snapshots.splice(index, 1);
            console.log(`[TimeRewind] 删除快照: ${snapshotId}`);
        }
    }

    /**
     * 清空所有快照
     */
    public clearSnapshots(): void {
        this.snapshots = [];
        console.log('[TimeRewind] 清空所有快照');
    }

    /**
     * 启动自动快照
     */
    public startAutoSnapshot(
        getPlayerData: () => TimeSnapshot['playerData'],
        getWorldData: () => TimeSnapshot['worldData']
    ): void {
        this.autoSnapshotTimer = this.scene.time.addEvent({
            delay: TIME_REWIND_CONFIG.autoSnapshotInterval,
            callback: () => {
                this.createSnapshot(getPlayerData(), getWorldData());
            },
            loop: true
        });
        console.log('[TimeRewind] 启动自动快照');
    }

    /**
     * 停止自动快照
     */
    public stopAutoSnapshot(): void {
        if (this.autoSnapshotTimer) {
            this.autoSnapshotTimer.destroy();
            this.autoSnapshotTimer = null;
        }
    }

    /**
     * 暂停自动快照
     */
    public pause(): void {
        if (this.autoSnapshotTimer) {
            this.autoSnapshotTimer.paused = true;
        }
    }

    /**
     * 恢复自动快照
     */
    public resume(): void {
        if (this.autoSnapshotTimer) {
            this.autoSnapshotTimer.paused = false;
        }
    }

    /**
     * 设置回调
     */
    public setCallbacks(
        onSnapshotCreate?: (snapshot: TimeSnapshot) => void,
        onRewind?: (snapshot: TimeSnapshot) => void,
        onFragmentsChange?: (count: number) => void
    ): void {
        if (onSnapshotCreate) this.onSnapshotCreate = onSnapshotCreate;
        if (onRewind) this.onRewind = onRewind;
        if (onFragmentsChange) this.onFragmentsChange = onFragmentsChange;
    }

    /**
     * 获取回溯惩罚信息
     */
    public getPenaltyInfo(): RewindPenalty {
        return { ...TIME_REWIND_CONFIG.rewindPenalty };
    }

    /**
     * 获取存档数据
     */
    public getSaveData(): { timeFragments: number; snapshots: TimeSnapshot[] } {
        return {
            timeFragments: this.timeFragments,
            snapshots: this.snapshots.slice(0, 3) // 只保存最近3个快照
        };
    }

    /**
     * 加载存档数据
     */
    public loadSaveData(data: { timeFragments: number; snapshots: TimeSnapshot[] }): void {
        this.timeFragments = data.timeFragments || TIME_REWIND_CONFIG.initialTimeFragments;
        this.snapshots = data.snapshots || [];
        
        if (this.onFragmentsChange) {
            this.onFragmentsChange(this.timeFragments);
        }
    }
}
