/**
 * 测试菜单场景
 * 提供完整的测试功能：场景切换、敌人生成、属性调整、事件触发、技能测试
 * 仅在开发环境生效
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../core/Config';
import { getSkillById, getAllAvailableSkills } from '../data/Skills';
import { MVP_ENEMIES, getEnemyTemplate } from '../data/Enemies';
import { EVENTS } from '../data/Events';
import { testLogger, PlayerStateSnapshot } from '../utils/TestLogger';
import { EnemyType } from '../core/Types';
import Player from '../entities/Player';

type TestTab = 'player' | 'enemies' | 'events' | 'skills' | 'scenes';

export default class TestMenuScene extends Phaser.Scene {
    private player!: Player;
    private container!: Phaser.GameObjects.Container;
    private tabContainer!: Phaser.GameObjects.Container;
    private contentContainer!: Phaser.GameObjects.Container;
    private currentTab: TestTab = 'player';
    private scrollOffset: number = 0;
    private readonly scrollStep: number = 80;

    constructor() {
        super({ key: 'TestMenuScene', active: false });
    }

    /**
     * 创建场景
     */
    create(data: { player: Player }): void {
        // 仅在开发环境生效
        if (!import.meta.env.DEV) {
            console.warn('[TestMenuScene] 仅在开发环境可用');
            this.scene.stop();
            return;
        }

        this.player = data.player;

        // 创建主容器
        this.container = this.add.container(0, 0);
        this.container.setDepth(3000);

        // 创建半透明背景
        this.createOverlay();

        // 创建标题
        this.createTitle();

        // 创建标签页导航
        this.createTabs();

        // 显示默认标签页
        this.showTab('player');

        // 记录日志
        testLogger.logAction('测试菜单已打开');

        // 监听键盘事件
        this.input.keyboard!.on('keydown-ESC', () => {
            this.closeMenu();
        });

        // 滚轮事件
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            if (deltaY > 0) {
                this.scrollContent(1);
            } else if (deltaY < 0) {
                this.scrollContent(-1);
            }
        });
    }

    /**
     * 创建半透明背景
     */
    private createOverlay(): void {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.container.add(overlay);

        // 点击背景关闭
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, this.cameras.main.height), Phaser.Geom.Rectangle.Contains);
        overlay.on('pointerdown', () => {
            this.closeMenu();
        });
    }

    /**
     * 创建标题
     */
    private createTitle(): void {
        const centerX = this.cameras.main.width / 2;

        // 标题背景
        const titleBg = this.add.graphics();
        titleBg.fillStyle(0x0a0a2a, 1);
        titleBg.fillRoundedRect(centerX - 250, 10, 500, 45, 8);
        titleBg.lineStyle(2, 0xff00ff, 1);
        titleBg.strokeRoundedRect(centerX - 250, 10, 500, 45, 8);
        this.container.add(titleBg);

        // 标题文字
        const title = this.add.text(centerX, 32, '>> 测试控制台 <<', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ff00ff',
            fontFamily: 'Courier New, monospace',
            stroke: '#000000',
            strokeThickness: 2
        });
        title.setOrigin(0.5);
        this.container.add(title);

        // 开发环境提示
        const devHint = this.add.text(centerX, 65, '[ 仅开发环境可用 | ESC关闭 | 滚轮滚动 ]', {
            fontSize: '11px',
            color: '#888888',
            fontFamily: 'Courier New, monospace'
        });
        devHint.setOrigin(0.5);
        this.container.add(devHint);
    }

    /**
     * 创建标签页导航
     */
    private createTabs(): void {
        const tabs: { key: TestTab; label: string; color: number }[] = [
            { key: 'player', label: '玩家属性', color: 0x00ffff },
            { key: 'enemies', label: '敌人测试', color: 0xff4444 },
            { key: 'events', label: '事件触发', color: 0xffaa00 },
            { key: 'skills', label: '技能测试', color: 0x44ff44 },
            { key: 'scenes', label: '场景切换', color: 0xaa44ff }
        ];

        const startX = 50;
        const tabWidth = 140;
        const tabHeight = 35;

        this.tabContainer = this.add.container(0, 85);
        this.container.add(this.tabContainer);

        tabs.forEach((tab, index) => {
            const x = startX + index * (tabWidth + 10);

            // 标签背景
            const tabBg = this.add.graphics();
            tabBg.fillStyle(0x1a1a2e, 1);
            tabBg.fillRoundedRect(0, 0, tabWidth, tabHeight, 6);
            tabBg.lineStyle(2, tab.color, 0.6);
            tabBg.strokeRoundedRect(0, 0, tabWidth, tabHeight, 6);
            tabBg.x = x;
            tabBg.setName(`tabBg_${tab.key}`);
            this.tabContainer.add(tabBg);

            // 标签文字
            const tabText = this.add.text(x + tabWidth / 2, tabHeight / 2, tab.label, {
                fontSize: '13px',
                fontStyle: 'bold',
                color: `#${tab.color.toString(16).padStart(6, '0')}`,
                fontFamily: 'Courier New, monospace'
            });
            tabText.setOrigin(0.5);
            tabText.setName(`tabText_${tab.key}`);
            this.tabContainer.add(tabText);

            // 交互区域
            const hitArea = this.add.rectangle(x, 0, tabWidth, tabHeight, 0x000000, 0);
            hitArea.setOrigin(0, 0);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.on('pointerdown', () => {
                this.showTab(tab.key);
            });
            this.tabContainer.add(hitArea);
        });
    }

    /**
     * 显示指定标签页
     */
    private showTab(tab: TestTab): void {
        const isFirstTime = this.currentTab !== tab;
        this.currentTab = tab;
        
        // 只有第一次进入标签时才重置滚动位置
        if (isFirstTime) {
            this.scrollOffset = 0;
        }

        // 更新标签页样式
        const tabs: TestTab[] = ['player', 'enemies', 'events', 'skills', 'scenes'];
        const tabColors: Record<TestTab, number> = {
            'player': 0x00ffff,
            'enemies': 0xff4444,
            'events': 0xffaa00,
            'skills': 0x44ff44,
            'scenes': 0xaa44ff
        };

        tabs.forEach(t => {
            const tabBg = this.tabContainer.getByName(`tabBg_${t}`) as Phaser.GameObjects.Graphics;
            if (tabBg) {
                tabBg.clear();
                tabBg.fillStyle(t === tab ? 0x2a2a4e : 0x1a1a2e, 1);
                tabBg.fillRoundedRect(0, 0, 140, 35, 6);
                tabBg.lineStyle(2, tabColors[t], t === tab ? 1 : 0.6);
                tabBg.strokeRoundedRect(0, 0, 140, 35, 6);
            }
        });

        // 清空内容区域
        if (this.contentContainer) {
            this.contentContainer.destroy(true);
        }

        // 创建内容区域
        this.contentContainer = this.add.container(0, 130);
        this.container.add(this.contentContainer);

        // 根据标签页显示内容
        switch (tab) {
            case 'player':
                this.createPlayerTab();
                break;
            case 'enemies':
                this.createEnemiesTab();
                break;
            case 'events':
                this.createEventsTab();
                break;
            case 'skills':
                this.createSkillsTab();
                break;
            case 'scenes':
                this.createScenesTab();
                break;
        }
    }

    /**
     * 创建玩家属性标签页
     */
    private createPlayerTab(): void {
        const startX = 50;
        const startY = 10;

        // 左侧：等级控制
        this.createSection(startX, startY, 350, 180, '等级控制', 0x00ffff, (x, y) => {
            const currentLevel = this.player.getLevel();

            // 当前等级显示
            this.createText(x + 10, y + 10, `当前等级: ${currentLevel}`, '#ffffff', 14);

            // 快速升级按钮
            this.createButton(x + 10, y + 45, '+1', 0x44ff44, () => this.quickLevelUp(1), 50, 28);
            this.createButton(x + 70, y + 45, '+5', 0x44ff44, () => this.quickLevelUp(5), 50, 28);
            this.createButton(x + 130, y + 45, '+10', 0x44ff44, () => this.quickLevelUp(10), 50, 28);
            this.createButton(x + 190, y + 45, 'MAX', 0xffaa00, () => this.setLevelToMax(), 60, 28);

            // 等级输入
            this.createText(x + 10, y + 90, '目标等级:', '#aaaaaa', 12);
            const inputHtml = `<input type="number" min="1" max="99" value="${currentLevel}" style="width: 60px; height: 25px; font-size: 14px; background: #1a1a2e; color: #00ffff; border: 2px solid #00ffff; border-radius: 4px; text-align: center; font-family: Courier New, monospace;">`;
            const levelInput = this.add.dom(x + 100, y + 100).createFromHTML(inputHtml);
            levelInput.setOrigin(0, 0.5);
            levelInput.setName('levelInput');
            this.contentContainer.add(levelInput);

            this.createButton(x + 180, y + 100, '设置', 0x00ffff, () => this.setLevel(), 70, 28);
        });

        // 右侧：属性调整
        this.createSection(startX + 370, startY, 350, 180, '属性调整', 0xffaa00, (x, y) => {
            const stats = this.player.getStats();

            const attrLines = [
                { label: '生命值', value: Math.floor(stats.hp), max: stats.maxHp, key: 'hp' },
                { label: '攻击力', value: stats.attack, key: 'attack' },
                { label: '防御力', value: stats.defense, key: 'defense' },
                { label: '移动速度', value: stats.moveSpeed, key: 'moveSpeed' }
            ];

            attrLines.forEach((attr, i) => {
                const lineY = y + 10 + i * 35;
                this.createText(x + 10, lineY, `${attr.label}:`, '#aaaaaa', 12);
                this.createText(x + 90, lineY, attr.max ? `${attr.value}/${attr.max}` : String(attr.value), '#ffffff', 14);

                this.createButton(x + 200, lineY, '+10', 0x44ff44, () => this.adjustAttribute(attr.key, 10), 45, 22);
                this.createButton(x + 250, lineY, '-10', 0xff4444, () => this.adjustAttribute(attr.key, -10), 45, 22);
            });
        });

        // 下方：状态显示
        this.createSection(startX, startY + 200, 670, 200, '角色状态', 0x888888, (x, y) => {
            const stats = this.player.getStats();
            const level = this.player.getLevel();
            const exp = this.player.getExperience();
            const maxExp = this.player.getMaxExperience();
            const kills = this.player.getKillCount();
            const skills = this.player.getOwnedSkillIds();

            const stateText = `等级: ${level}    经验: ${exp}/${maxExp}
生命: ${Math.floor(stats.hp)}/${stats.maxHp}    攻击: ${stats.attack}    防御: ${stats.defense}
速度: ${stats.moveSpeed}    暴击率: ${(stats.critRate * 100).toFixed(1)}%    暴击伤害: ${(stats.critDamage * 100).toFixed(0)}%
击杀数: ${kills}    已学技能: ${skills.length}`;

            this.createText(x + 15, y + 10, stateText, '#ffffff', 13, 8);
        });

        // 底部按钮
        this.createButton(startX + 100, startY + 420, '恢复满血', 0x44ff44, () => this.healPlayer(), 100, 30);
        this.createButton(startX + 220, startY + 420, '重置属性', 0xffaa00, () => this.resetStats(), 100, 30);
        this.createButton(startX + 340, startY + 420, '玩家无敌', 0xff4444, () => this.toggleInvincible(), 100, 30);
        this.createButton(startX + 460, startY + 420, '导出日志', 0x00ffff, () => testLogger.downloadLogs(), 100, 30);
        this.createButton(startX + 580, startY + 420, '打印统计', 0x888888, () => testLogger.printStatistics(), 100, 30);
    }

    /**
     * 创建敌人测试标签页
     */
    private createEnemiesTab(): void {
        const startX = 50;
        const startY = 10;

        // 敌人类型列表 - 增加高度以容纳所有内容
        this.createSection(startX, startY, 670, 280, '敌人生成 (点击生成对应敌人)', 0xff4444, (x, y) => {
            const enemyTypes = [
                { type: EnemyType.COMMON, name: '普通敌人', color: '#888888' },
                { type: EnemyType.ELITE, name: '精英敌人', color: '#ffaa00' },
                { type: EnemyType.RANGED, name: '远程敌人', color: '#ff44ff' },
                { type: EnemyType.SUMMONER, name: '召唤师', color: '#aa44ff' },
                { type: EnemyType.SPLITTER, name: '分裂体', color: '#44ffff' },
                { type: EnemyType.BOSS_MECH_BEAST, name: '机械巨兽', color: '#ff4444' },
                { type: EnemyType.BOSS_DATA_GHOST, name: '数据幽灵', color: '#44ff44' },
                { type: EnemyType.BOSS, name: 'BOSS', color: '#ff0000' }
            ];

            // 使用固定列宽确保按钮对齐
            const colWidth = 160;
            const rowHeight = 55;
            const startBtnX = x + 15;
            const startBtnY = y + 15;

            enemyTypes.forEach((enemy, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const btnX = startBtnX + col * colWidth + 70; // 70是按钮宽度的一半，使createButton的中心点对齐
                const btnY = startBtnY + row * rowHeight + 20;

                this.createButton(btnX, btnY, enemy.name, 0xff4444, () => this.spawnEnemy(enemy.type), 140, 35, enemy.color);
            });
        });

        // 批量生成区域 - 单独一个区块
        this.createSection(startX, startY + 295, 670, 90, '批量生成', 0xff6666, (x, y) => {
            const btnY = y + 35;
            this.createButton(x + 90, btnY, '生成10个普通敌人', 0xff6666, () => this.spawnMultipleEnemies(EnemyType.COMMON, 10), 180, 32);
            this.createButton(x + 335, btnY, '生成5个精英敌人', 0xffaa00, () => {
                const types = [EnemyType.ELITE, EnemyType.RANGED, EnemyType.SUMMONER];
                for (let i = 0; i < 5; i++) {
                    this.spawnEnemy(types[i % types.length]);
                }
            }, 180, 32);
            this.createButton(x + 550, btnY, '生成BOSS', 0xff0000, () => this.spawnEnemy(EnemyType.BOSS), 100, 32);
        });

        // 敌人控制
        this.createSection(startX, startY + 400, 670, 80, '敌人控制', 0xff6666, (x, y) => {
            const btnY = y + 40;
            const spacing = 155;
            const startBtnX = x + 77;
            this.createButton(startBtnX, btnY, '清除所有敌人', 0xff4444, () => this.clearAllEnemies(), 140, 32);
            this.createButton(startBtnX + spacing, btnY, '击杀所有敌人', 0xffaa00, () => this.killAllEnemies(), 140, 32);
            this.createButton(startBtnX + spacing * 2, btnY, '敌人生命-50%', 0x44ff44, () => this.damageAllEnemies(0.5), 140, 32);
            this.createButton(startBtnX + spacing * 3, btnY, '敌人速度x0.5', 0x00ffff, () => this.slowAllEnemies(), 140, 32);
        });
    }

    /**
     * 创建事件触发标签页
     */
    private createEventsTab(): void {
        const startX = 50;
        const startY = 10;

        this.createSection(startX, startY, 670, 450, '随机事件触发 (点击触发对应事件)', 0xffaa00, (x, y) => {
            const eventList = Object.values(EVENTS);
            const eventTypes = ['merchant', 'combat', 'treasure', 'story', 'special'];

            const typeNames: Record<string, string> = {
                'merchant': '商人事件',
                'combat': '战斗事件',
                'treasure': '宝藏事件',
                'story': '剧情事件',
                'special': '特殊事件'
            };

            // 按类型分组显示
            let currentY = y;
            eventTypes.forEach((type) => {
                const typeEvents = eventList.filter(e => e.type === type);
                if (typeEvents.length === 0) return;

                // 类型标题
                this.createText(x + 10, currentY, typeNames[type] || type, '#ffaa00', 14, 0, true);
                currentY += 25;

                // 按钮行 - 使用固定列宽确保对齐
                const btnWidth = 150;
                const btnSpacing = 10;
                const colWidth = btnWidth + btnSpacing;
                const startBtnX = x + 20 + btnWidth / 2;

                typeEvents.slice(0, 4).forEach((event, i) => {
                    const btnX = startBtnX + i * colWidth;
                    this.createButton(btnX, currentY, event.name, 0xffaa00, () => this.triggerEvent(event.id), btnWidth, 28);
                });

                currentY += 50; // 为下一组事件留出间距
            });
        });
    }

    /**
     * 创建技能测试标签页
     */
    private createSkillsTab(): void {
        const startX = 50;
        const startY = 10;

        // 技能操作
        this.createSection(startX, startY, 670, 80, '技能操作', 0x44ff44, (x, y) => {
            this.createButton(x + 50, y + 25, '学习所有技能', 0x44ff44, () => this.learnAllSkills(), 140, 30);
            this.createButton(x + 220, y + 25, '满级所有技能', 0xffaa00, () => this.maxAllSkills(), 140, 30);
            this.createButton(x + 390, y + 25, '清除所有技能', 0xff4444, () => this.clearAllSkills(), 140, 30);
            this.createButton(x + 560, y + 25, '随机技能组合', 0x00ffff, () => this.randomSkills(), 140, 30);
        });

        // 技能列表 - 增加高度并优化布局
        this.createSection(startX, startY + 100, 670, 400, '技能列表 (点击学习/升级 | 滚轮滚动 | 拖动滚动条)', 0x44ff44, (x, y) => {
            // 使用函数获取技能列表，确保获取完整数据
            const allSkills = getAllAvailableSkills();
            const ownedSkillIds = this.player.getOwnedSkillIds();
            const skillLevels = this.player.getSkillLevels();

            // 创建滚动容器
            const contentHeight = allSkills.length * 45;
            const visibleHeight = 350;
            const maxScrollOffset = Math.max(0, contentHeight - visibleHeight);
            
            // 更新滚动偏移量
            this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, 0, maxScrollOffset);

            // 绘制滚动条背景
            const scrollbarX = x + 650;
            const scrollbarY = y;
            const scrollbarHeight = visibleHeight;
            const scrollbarBg = this.add.graphics();
            scrollbarBg.fillStyle(0x222233, 0.8);
            scrollbarBg.fillRect(scrollbarX, scrollbarY, 10, scrollbarHeight);
            this.contentContainer.add(scrollbarBg);

            // 计算滚动条滑块参数
            let thumbHeight = 30;
            let thumbY = scrollbarY;
            
            if (maxScrollOffset > 0) {
                const scrollRatio = this.scrollOffset / maxScrollOffset;
                thumbHeight = Math.max(40, (visibleHeight / contentHeight) * visibleHeight);
                thumbY = scrollbarY + scrollRatio * (scrollbarHeight - thumbHeight);
            }

            // 绘制滚动条滑块
            const scrollThumb = this.add.graphics();
            if (maxScrollOffset > 0) {
                scrollThumb.fillStyle(0x44ff44, 0.9);
                scrollThumb.fillRoundedRect(scrollbarX, thumbY, 10, thumbHeight, 4);
            }
            this.contentContainer.add(scrollThumb);

            // 创建滚动条轨道交互区域（可点击跳转）
            const scrollTrack = this.add.rectangle(scrollbarX + 5, scrollbarY + scrollbarHeight / 2, 10, scrollbarHeight, 0x000000, 0.01);
            scrollTrack.setInteractive({ useHandCursor: true });
            scrollTrack.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                // 计算点击位置相对于滚动条轨道的比例
                // contentContainer的y位置是130，section在contentContainer中的y是startY + 100 = 110
                // 所以section的绝对y位置是130 + 110 = 240
                const sectionAbsY = 130 + startY + 100;
                const localY = pointer.y - sectionAbsY - y;
                const clickRatio = Phaser.Math.Clamp((localY - scrollbarY) / scrollbarHeight, 0, 1);
                this.scrollOffset = Phaser.Math.Clamp(clickRatio * maxScrollOffset, 0, maxScrollOffset);
                this.refreshCurrentTab();
            });
            this.contentContainer.add(scrollTrack);

            // 创建滑块拖动交互（如果内容超出可视区域）
            if (maxScrollOffset > 0) {
                // 创建一个更大的透明拖动区域覆盖滑块
                const dragHandle = this.add.rectangle(scrollbarX + 5, thumbY + thumbHeight / 2, 30, Math.max(thumbHeight, 40), 0x44ff44, 0.01);
                dragHandle.setInteractive({ useHandCursor: true, draggable: true });
                
                // 记录拖动开始时的状态
                let dragStartScrollOffset = 0;
                let dragStartPointerY = 0;
                const currentThumbHeight = thumbHeight;
                const currentScrollbarHeight = scrollbarHeight;
                const currentMaxScrollOffset = maxScrollOffset;
                const currentScrollbarY = scrollbarY;
                const currentScrollbarX = scrollbarX;
                
                // 拖动开始
                dragHandle.on('dragstart', (pointer: Phaser.Input.Pointer) => {
                    dragStartScrollOffset = this.scrollOffset;
                    dragStartPointerY = pointer.y;
                    dragHandle.setFillStyle(0x44ff44, 0.3);
                    scrollThumb.clear();
                    scrollThumb.fillStyle(0x66ff66, 1);
                    scrollThumb.fillRoundedRect(currentScrollbarX, dragHandle.y - currentThumbHeight / 2, 10, currentThumbHeight, 4);
                });
                
                // 拖动中 - 根据指针Y位置计算滚动位置
                dragHandle.on('drag', (pointer: Phaser.Input.Pointer) => {
                    // 计算指针在滚动条轨道中的相对位置
                    const sectionAbsY = 130 + startY + 100;
                    const trackTopY = sectionAbsY + y + currentScrollbarY;
                    const pointerRelativeY = pointer.y - trackTopY;
                    
                    // 计算滑块可移动范围
                    const thumbMoveRange = currentScrollbarHeight - currentThumbHeight;
                    
                    // 计算指针位置对应的滚动比例
                    const targetThumbY = Phaser.Math.Clamp(pointerRelativeY - currentThumbHeight / 2, 0, thumbMoveRange);
                    const scrollRatio = targetThumbY / thumbMoveRange;
                    
                    // 更新滚动偏移量
                    this.scrollOffset = Phaser.Math.Clamp(
                        scrollRatio * currentMaxScrollOffset, 
                        0, 
                        currentMaxScrollOffset
                    );
                    
                    // 更新拖动区域位置（跟随指针）
                    dragHandle.y = trackTopY + targetThumbY + currentThumbHeight / 2 - (sectionAbsY + y);
                    
                    // 重新渲染标签页
                    this.refreshCurrentTab();
                });
                
                // 拖动结束
                dragHandle.on('dragend', () => {
                    dragHandle.setFillStyle(0x44ff44, 0.01);
                });
                
                this.contentContainer.add(dragHandle);
            }

            allSkills.forEach((skill, index) => {
                const rowY = y + index * 45 - this.scrollOffset;
                
                // 只渲染可见区域内的技能
                if (rowY < y - 50 || rowY > y + visibleHeight + 50) return;

                const isOwned = ownedSkillIds.includes(skill.id);
                const level = skillLevels.get(skill.id) || 0;
                const isMaxLevel = level >= skill.maxLevel;

                // 技能项背景
                const itemBg = this.add.graphics();
                itemBg.fillStyle(isOwned ? 0x1a3a1a : 0x0a0a1a, 0.9);
                itemBg.fillRoundedRect(x, rowY, 640, 40, 4);
                itemBg.lineStyle(1, isOwned ? (isMaxLevel ? 0xffaa00 : 0x44ff44) : 0x333344, 0.8);
                itemBg.strokeRoundedRect(x, rowY, 640, 40, 4);
                this.contentContainer.add(itemBg);

                // 技能名称
                this.createText(x + 10, rowY + 20, skill.name, isOwned ? '#ffffff' : '#888888', 14, 0, false, 0.5);

                // 等级
                this.createText(x + 180, rowY + 20, `Lv.${level}/${skill.maxLevel}`, isMaxLevel ? '#ffaa00' : '#44ff44', 12, 0, false, 0.5);

                // 分支
                const branchNames: Record<string, string> = { 'offense': '攻击', 'defense': '防御', 'utility': '辅助' };
                const branchColors: Record<string, string> = { 'offense': '#ff4444', 'defense': '#44ff44', 'utility': '#4444ff' };
                this.createText(x + 280, rowY + 20, branchNames[skill.branch] || skill.branch, branchColors[skill.branch] || '#888888', 11, 0, false, 0.5);

                // 技能描述（简短版）
                const shortDesc = skill.description.length > 20 ? skill.description.substring(0, 20) + '...' : skill.description;
                this.createText(x + 350, rowY + 20, shortDesc, '#888888', 10, 0, false, 0.5);

                // 操作按钮
                const statusText = isMaxLevel ? '已满级' : (isOwned ? '升级' : '学习');
                const statusColor = isMaxLevel ? 0xffaa00 : (isOwned ? 0x44ff44 : 0x00ffff);

                if (!isMaxLevel) {
                    this.createButton(x + 560, rowY + 20, statusText, statusColor, () => this.handleSkillClick(skill.id, isOwned), 80, 28);
                } else {
                    this.createText(x + 560, rowY + 20, '已满级', '#ffaa00', 12, 0, false, 0.5);
                }
            });
            
            // 滚动提示
            if (contentHeight > visibleHeight) {
                const currentPage = Math.floor(this.scrollOffset / 45) + 1;
                const totalPages = allSkills.length;
                const scrollHint = this.add.text(x + 320, y + visibleHeight + 10, 
                    `滚动查看更多技能 (${currentPage}/${totalPages})`, {
                    fontSize: '11px',
                    color: '#666666',
                    fontFamily: 'Courier New, monospace'
                });
                scrollHint.setOrigin(0.5);
                this.contentContainer.add(scrollHint);
            }
        });
    }

    /**
     * 创建场景切换标签页
     */
    private createScenesTab(): void {
        const startX = 50;
        const startY = 10;

        this.createSection(startX, startY, 670, 200, '场景切换', 0xaa44ff, (x, y) => {
            const scenes = [
                { key: 'MenuScene', name: '主菜单', color: 0xaa44ff },
                { key: 'ClassSelectScene', name: '职业选择', color: 0x00ffff },
                { key: 'GameScene', name: '游戏场景', color: 0x44ff44 },
                { key: 'CraftingScene', name: '合成界面', color: 0xffaa00 },
                { key: 'SkillTreeScene', name: '技能树', color: 0x44ffff },
                { key: 'SaveScene', name: '存档界面', color: 0xff44ff }
            ];

            // 网格布局参数
            const buttonWidth = 200;
            const buttonHeight = 45;
            const colCount = 3;
            const availableWidth = 650; // 区块宽度减去边距
            const colSpacing = availableWidth / colCount; // 均匀分布列
            const rowSpacing = 60;
            const startBtnX = x + colSpacing / 2; // 第一列的中心位置
            const startBtnY = y + 35;

            scenes.forEach((scene, index) => {
                const row = Math.floor(index / colCount);
                const col = index % colCount;
                const btnX = startBtnX + col * colSpacing;
                const btnY = startBtnY + row * rowSpacing;
                this.createButton(btnX, btnY, scene.name, scene.color, () => this.switchScene(scene.key), buttonWidth, buttonHeight);
            });
        });

        this.createSection(startX, startY + 220, 670, 150, '游戏控制', 0xff6666, (x, y) => {
            this.createButton(x + 50, y + 30, '重新开始游戏', 0x44ff44, () => this.restartGame(), 150, 35);
            this.createButton(x + 230, y + 30, '返回主菜单', 0xffaa00, () => this.returnToMenu(), 150, 35);
            this.createButton(x + 410, y + 30, '关闭测试菜单', 0xff00ff, () => this.closeMenu(), 150, 35);
        });
    }

    // ========== 辅助方法 ==========

    /**
     * 创建区块
     */
    private createSection(x: number, y: number, width: number, height: number, title: string, color: number, contentCallback: (x: number, y: number) => void): void {
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a1a, 0.95);
        bg.fillRoundedRect(x, y, width, height, 8);
        bg.lineStyle(2, color, 0.8);
        bg.strokeRoundedRect(x, y, width, height, 8);
        this.contentContainer.add(bg);

        // 标题
        const titleText = this.add.text(x + 10, y + 5, title, {
            fontSize: '14px',
            fontStyle: 'bold',
            color: `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        this.contentContainer.add(titleText);

        // 内容
        contentCallback(x + 10, y + 25);
    }

    /**
     * 创建文本
     */
    private createText(x: number, y: number, text: string, color: string, size: number = 12, lineSpacing: number = 0, bold: boolean = false, originY: number = 0): Phaser.GameObjects.Text {
        const textObj = this.add.text(x, y, text, {
            fontSize: `${size}px`,
            fontStyle: bold ? 'bold' : undefined,
            color: color,
            fontFamily: 'Courier New, monospace',
            lineSpacing: lineSpacing
        });
        textObj.setOrigin(0, originY);
        this.contentContainer.add(textObj);
        return textObj;
    }

    /**
     * 创建按钮
     */
    private createButton(x: number, y: number, text: string, color: number, callback: () => void, width: number = 100, height: number = 30, textColor?: string): void {
        const btn = this.add.graphics();
        btn.fillStyle(0x1a1a2e, 1);
        btn.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
        btn.lineStyle(2, color, 1);
        btn.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
        btn.x = x;
        btn.y = y;
        this.contentContainer.add(btn);

        const btnText = this.add.text(x, y, text, {
            fontSize: `${Math.min(14, height - 8)}px`,
            fontStyle: 'bold',
            color: textColor || `#${color.toString(16).padStart(6, '0')}`,
            fontFamily: 'Courier New, monospace'
        });
        btnText.setOrigin(0.5);
        this.contentContainer.add(btnText);

        const hitArea = this.add.rectangle(x, y, width, height, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        this.contentContainer.add(hitArea);

        hitArea.on('pointerover', () => {
            btn.clear();
            btn.fillStyle(0x2a2a4e, 1);
            btn.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
            btn.lineStyle(2, color, 1);
            btn.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
        });

        hitArea.on('pointerout', () => {
            btn.clear();
            btn.fillStyle(0x1a1a2e, 1);
            btn.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
            btn.lineStyle(2, color, 1);
            btn.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
        });

        hitArea.on('pointerdown', () => callback());
    }

    /**
     * 滚动内容
     */
    private scrollContent(direction: number): void {
        // 根据当前标签页调整滚动距离
        let scrollDistance = this.scrollStep;
        
        if (this.currentTab === 'skills') {
            // 技能标签页使用更小的滚动步长
            scrollDistance = 45;
        }
        
        // 计算最大滚动距离
        let maxOffset = 500;
        if (this.currentTab === 'skills') {
            const allSkills = getAllAvailableSkills();
            const contentHeight = allSkills.length * 45;
            const visibleHeight = 350;
            maxOffset = Math.max(0, contentHeight - visibleHeight);
        }
        
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + direction * scrollDistance, 0, maxOffset);
        this.showTab(this.currentTab);
    }

    // ========== 玩家功能 ==========

    private quickLevelUp(count: number): void {
        const oldLevel = this.player.getLevel();
        for (let i = 0; i < count; i++) {
            this.player.addExperience(this.player.getMaxExperience() * 2);
        }
        testLogger.logLevelChange(oldLevel, this.player.getLevel(), this.getPlayerState());
        this.refreshCurrentTab();
    }

    private setLevelToMax(): void {
        const oldLevel = this.player.getLevel();
        for (let i = oldLevel; i < 99; i++) {
            this.player.addExperience(this.player.getMaxExperience() * 2);
        }
        testLogger.logLevelChange(oldLevel, 99, this.getPlayerState());
        this.refreshCurrentTab();
    }

    private setLevel(): void {
        const levelInput = this.contentContainer.getByName('levelInput') as Phaser.GameObjects.DOMElement;
        if (!levelInput) return;

        const input = levelInput.node as HTMLInputElement;
        const targetLevel = parseInt(input.value, 10);

        if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 99) return;

        const oldLevel = this.player.getLevel();
        if (targetLevel > oldLevel) {
            for (let i = oldLevel; i < targetLevel; i++) {
                this.player.addExperience(this.player.getMaxExperience() * 2);
            }
        } else {
            this.player.setTestLevel(targetLevel);
        }

        testLogger.logLevelChange(oldLevel, this.player.getLevel(), this.getPlayerState());
        this.refreshCurrentTab();
    }

    private adjustAttribute(attr: string, amount: number): void {
        const stats = this.player.getStats();
        switch (attr) {
            case 'hp':
                this.player['stats'].hp = Math.max(1, Math.min(stats.maxHp, stats.hp + amount));
                break;
            case 'attack':
                this.player['stats'].attack = Math.max(1, stats.attack + amount);
                break;
            case 'defense':
                this.player['stats'].defense = Math.max(0, stats.defense + amount);
                break;
            case 'moveSpeed':
                this.player['stats'].moveSpeed = Math.max(50, stats.moveSpeed + amount);
                break;
        }
        testLogger.logAttributeChange(attr, stats[attr as keyof typeof stats] as number, this.player.getStats()[attr as keyof typeof stats] as number, this.getPlayerState());
        this.refreshCurrentTab();
    }

    private healPlayer(): void {
        const stats = this.player.getStats();
        this.player['stats'].hp = stats.maxHp;
        testLogger.logAction('恢复满血', this.getPlayerState());
        this.refreshCurrentTab();
    }

    private resetStats(): void {
        this.player.recalculateStats();
        testLogger.logAction('重置属性', this.getPlayerState());
        this.refreshCurrentTab();
    }

    private toggleInvincible(): void {
        const currentState = this.player.isTestInvincible();
        this.player.setTestInvincible(!currentState);
        testLogger.logAction(!currentState ? '开启玩家无敌' : '关闭玩家无敌', this.getPlayerState());
        this.refreshCurrentTab();
    }

    // ========== 敌人功能 ==========

    private spawnEnemy(type: EnemyType): void {
        const gameScene = this.scene.get('GameScene') as any;
        if (gameScene && gameScene.spawnTestEnemy) {
            gameScene.spawnTestEnemy(type);
            testLogger.logAction(`生成敌人: ${type}`);
        } else {
            // 直接在玩家附近生成
            this.scene.get('GameScene').events.emit('test-spawn-enemy', type);
            testLogger.logAction(`请求生成敌人: ${type}`);
        }
    }

    private spawnMultipleEnemies(type: EnemyType, count: number): void {
        for (let i = 0; i < count; i++) {
            this.spawnEnemy(type);
        }
        testLogger.logAction(`批量生成敌人: ${count}个 ${type}`);
    }

    private clearAllEnemies(): void {
        this.scene.get('GameScene').events.emit('test-clear-enemies');
        testLogger.logAction('清除所有敌人');
    }

    private killAllEnemies(): void {
        this.scene.get('GameScene').events.emit('test-kill-enemies');
        testLogger.logAction('击杀所有敌人');
    }

    private damageAllEnemies(percent: number): void {
        this.scene.get('GameScene').events.emit('test-damage-enemies', percent);
        testLogger.logAction(`敌人生命减少 ${percent * 100}%`);
    }

    private slowAllEnemies(): void {
        this.scene.get('GameScene').events.emit('test-slow-enemies');
        testLogger.logAction('敌人减速');
    }

    // ========== 事件功能 ==========

    private triggerEvent(eventId: string): void {
        const event = EVENTS[eventId];
        if (event) {
            this.scene.get('GameScene').events.emit('test-trigger-event', eventId);
            testLogger.logAction(`触发事件: ${event.name}`);
        }
    }

    // ========== 技能功能 ==========

    private handleSkillClick(skillId: string, isOwned: boolean): void {
        const skill = getSkillById(skillId);
        if (!skill) return;

        const oldLevel = this.player.getSkillLevels().get(skillId) || 0;

        if (isOwned) {
            this.player.upgradeSkill(skillId);
            testLogger.logSkillChange('upgrade', skillId, skill.name, oldLevel + 1, this.getPlayerState());
        } else {
            this.player.learnSkill(skillId);
            testLogger.logSkillChange('learn', skillId, skill.name, 1, this.getPlayerState());
        }

        this.refreshCurrentTab();
        this.scene.get('GameScene').events.emit('skill-changed');
    }

    private learnAllSkills(): void {
        const allSkills = getAllAvailableSkills();
        allSkills.forEach(skill => {
            if (!this.player.getOwnedSkillIds().includes(skill.id)) {
                this.player.learnSkill(skill.id);
            }
        });
        testLogger.logAction('学习所有技能', this.getPlayerState());
        this.refreshCurrentTab();
        this.scene.get('GameScene').events.emit('skill-changed');
    }

    private maxAllSkills(): void {
        const allSkills = getAllAvailableSkills();
        allSkills.forEach(skill => {
            if (!this.player.getOwnedSkillIds().includes(skill.id)) {
                this.player.learnSkill(skill.id);
            }
            const currentLevel = this.player.getSkillLevels().get(skill.id) || 0;
            for (let i = currentLevel; i < skill.maxLevel; i++) {
                this.player.upgradeSkill(skill.id);
            }
        });
        testLogger.logAction('满级所有技能', this.getPlayerState());
        this.refreshCurrentTab();
        this.scene.get('GameScene').events.emit('skill-changed');
    }

    private clearAllSkills(): void {
        this.player.clearAllSkills();
        testLogger.logAction('清除所有技能', this.getPlayerState());
        this.refreshCurrentTab();
        this.scene.get('GameScene').events.emit('skill-changed');
    }

    private randomSkills(): void {
        this.player.clearAllSkills();
        const count = Phaser.Math.Between(3, 8);
        const allSkills = getAllAvailableSkills();
        const shuffled = Phaser.Utils.Array.Shuffle([...allSkills]);
        shuffled.slice(0, count).forEach(skill => {
            this.player.learnSkill(skill.id);
            const levels = Phaser.Math.Between(1, skill.maxLevel);
            for (let i = 1; i < levels; i++) {
                this.player.upgradeSkill(skill.id);
            }
        });
        testLogger.logAction(`随机技能组合: ${count}个技能`, this.getPlayerState());
        this.refreshCurrentTab();
        this.scene.get('GameScene').events.emit('skill-changed');
    }

    // ========== 场景功能 ==========

    private switchScene(sceneKey: string): void {
        // 先暂停游戏场景（而不是停止），这样技能树/合成页面关闭时可以恢复
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.scene.pause();
        }
        
        this.scene.stop('TestMenuScene');
        
        // 传递玩家数据给目标场景
        const sceneData = { player: this.player };
        this.scene.start(sceneKey, sceneData);
        testLogger.logAction(`切换场景: ${sceneKey}`);
    }

    private restartGame(): void {
        this.scene.stop('TestMenuScene');
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('ClassSelectScene');
        testLogger.logAction('重新开始游戏');
    }

    private returnToMenu(): void {
        this.scene.stop('TestMenuScene');
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
        testLogger.logAction('返回主菜单');
    }

    // ========== 通用方法 ==========

    private refreshCurrentTab(): void {
        this.showTab(this.currentTab);
    }

    private closeMenu(): void {
        testLogger.logAction('测试菜单已关闭');
        this.scene.stop();
        this.scene.get('GameScene').scene.resume();
    }

    private getPlayerState(): PlayerStateSnapshot {
        const stats = this.player.getStats();
        return {
            level: this.player.getLevel(),
            experience: this.player.getExperience(),
            maxExperience: this.player.getMaxExperience(),
            hp: stats.hp,
            maxHp: stats.maxHp,
            attack: stats.attack,
            defense: stats.defense,
            moveSpeed: stats.moveSpeed,
            critRate: stats.critRate,
            critDamage: stats.critDamage,
            skills: this.player.getOwnedSkillIds(),
            killCount: this.player.getKillCount()
        };
    }
}
