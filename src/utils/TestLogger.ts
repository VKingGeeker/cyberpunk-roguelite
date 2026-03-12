/**
 * 测试日志记录器
 * 记录测试操作、角色状态变化等数据
 * 仅在开发环境生效
 */

export interface TestLogEntry {
    timestamp: string;
    type: 'level_change' | 'skill_change' | 'attribute_change' | 'action' | 'state';
    action: string;
    data: any;
    playerState?: PlayerStateSnapshot;
}

export interface PlayerStateSnapshot {
    level: number;
    experience: number;
    maxExperience: number;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    moveSpeed: number;
    critRate: number;
    critDamage: number;
    skills: string[];
    killCount: number;
}

/**
 * 测试日志管理器
 */
export class TestLogger {
    private static instance: TestLogger | null = null;
    private logs: TestLogEntry[] = [];
    private enabled: boolean = false;
    private startTime: number = 0;

    private constructor() {
        // 仅在开发环境启用
        this.enabled = import.meta.env.DEV;
        if (this.enabled) {
            this.startTime = Date.now();
            console.log('[TestLogger] 测试日志记录器已启用');
        }
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): TestLogger {
        if (!TestLogger.instance) {
            TestLogger.instance = new TestLogger();
        }
        return TestLogger.instance;
    }

    /**
     * 记录日志
     */
    public log(
        type: TestLogEntry['type'],
        action: string,
        data: any,
        playerState?: PlayerStateSnapshot
    ): void {
        if (!this.enabled) return;

        const entry: TestLogEntry = {
            timestamp: this.getTimestamp(),
            type,
            action,
            data,
            playerState
        };

        this.logs.push(entry);

        // 控制台输出
        console.log(`[TestLogger] ${entry.timestamp} [${type.toUpperCase()}] ${action}`, data);
    }

    /**
     * 记录等级变化
     */
    public logLevelChange(
        oldLevel: number,
        newLevel: number,
        playerState?: PlayerStateSnapshot
    ): void {
        this.log('level_change', `等级变更: ${oldLevel} -> ${newLevel}`, {
            oldLevel,
            newLevel,
            diff: newLevel - oldLevel
        }, playerState);
    }

    /**
     * 记录技能变化
     */
    public logSkillChange(
        action: 'learn' | 'upgrade' | 'replace' | 'remove',
        skillId: string,
        skillName: string,
        level: number,
        playerState?: PlayerStateSnapshot
    ): void {
        this.log('skill_change', `技能${action === 'learn' ? '学习' : action === 'upgrade' ? '升级' : action === 'replace' ? '替换' : '移除'}: ${skillName}`, {
            action,
            skillId,
            skillName,
            level
        }, playerState);
    }

    /**
     * 记录属性变化
     */
    public logAttributeChange(
        attributeType: string,
        oldValue: number,
        newValue: number,
        playerState?: PlayerStateSnapshot
    ): void {
        this.log('attribute_change', `属性变更: ${attributeType}`, {
            attributeType,
            oldValue,
            newValue,
            diff: newValue - oldValue
        }, playerState);
    }

    /**
     * 记录操作
     */
    public logAction(action: string, data: any = {}): void {
        this.log('action', action, data);
    }

    /**
     * 记录状态快照
     */
    public logState(description: string, playerState: PlayerStateSnapshot): void {
        this.log('state', description, { snapshot: playerState }, playerState);
    }

    /**
     * 获取所有日志
     */
    public getLogs(): TestLogEntry[] {
        return [...this.logs];
    }

    /**
     * 获取特定类型的日志
     */
    public getLogsByType(type: TestLogEntry['type']): TestLogEntry[] {
        return this.logs.filter(log => log.type === type);
    }

    /**
     * 导出日志为JSON
     */
    public exportLogs(): string {
        return JSON.stringify({
            exportTime: this.getTimestamp(),
            totalLogs: this.logs.length,
            sessionDuration: Date.now() - this.startTime,
            logs: this.logs
        }, null, 2);
    }

    /**
     * 清空日志
     */
    public clearLogs(): void {
        this.logs = [];
        this.startTime = Date.now();
        this.logAction('日志已清空');
    }

    /**
     * 下载日志文件
     */
    public downloadLogs(): void {
        if (!this.enabled) return;

        const data = this.exportLogs();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-logs-${this.getDateString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.logAction('日志已导出下载');
    }

    /**
     * 获取时间戳字符串
     */
    private getTimestamp(): string {
        const now = new Date();
        return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    }

    /**
     * 获取日期字符串
     */
    private getDateString(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * 打印统计信息
     */
    public printStatistics(): void {
        if (!this.enabled) return;

        const levelChanges = this.getLogsByType('level_change');
        const skillChanges = this.getLogsByType('skill_change');
        const attributeChanges = this.getLogsByType('attribute_change');

        console.log('========== 测试统计 ==========');
        console.log(`会话时长: ${((Date.now() - this.startTime) / 1000).toFixed(1)}秒`);
        console.log(`总日志数: ${this.logs.length}`);
        console.log(`等级变更次数: ${levelChanges.length}`);
        console.log(`技能变更次数: ${skillChanges.length}`);
        console.log(`属性变更次数: ${attributeChanges.length}`);
        console.log('==============================');
    }

    /**
     * 是否启用
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
}

// 导出单例
export const testLogger = TestLogger.getInstance();
