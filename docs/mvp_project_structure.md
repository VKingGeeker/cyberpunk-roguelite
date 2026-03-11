# 赛博朋克肉鸽游戏 MVP 开发计划

## MVP 范围界定

### 包含内容
- **1个职业**：街头武士
- **1个关卡**：10分钟流程（出生点 → 随机事件 → 精英怪 → 传送门）
- **3种敌人**：普通怪（街头混混）、精英怪（赛博保镖）、BOSS（区域首领）
- **基础战斗系统**：移动、攻击、技能释放（3个主动技能）
- **简化物品系统**：4把武器、2套防具、3种消耗品
- **基础合成系统**：同品级升级（2灰→1蓝、2蓝→1紫）
- **本地单人模式**：自动存档、手动存档

### 暂不包含
- 联机功能
- 时间回溯机制
- 随机事件系统（简化为固定商人）
- 多职业系统
- 完整技能树（仅实现3个主动技能）

---

## 技术栈选择

### 前端框架
- **游戏引擎**：Phaser 3（轻量级、适合2D网页游戏）
- **构建工具**：Vite（快速开发、热更新）
- **语言**：TypeScript（类型安全、便于维护）

### 为什么选择 Phaser 3
- 专为2D游戏设计，内置物理引擎、碰撞检测
- 丰富的插件生态系统
- 社区活跃，文档完善
- 支持Canvas和WebGL渲染

### 项目结构
```
cyberpunk-roguelite-mvp/
├── src/
│   ├── core/              # 核心系统
│   │   ├── Game.ts        # 游戏入口
│   │   ├── Config.ts      # 游戏配置
│   │   ├── StateManager.ts # 状态管理
│   │   └── AssetLoader.ts # 资源加载器
│   ├── scenes/            # 场景
│   │   ├── BootScene.ts   # 启动场景
│   │   ├── MenuScene.ts   # 主菜单场景
│   │   ├── GameScene.ts   # 游戏主场景
│   │   └── UIScene.ts     # UI场景
│   ├── entities/          # 实体
│   │   ├── Player.ts      # 玩家实体
│   │   ├── Enemy.ts       # 敌人实体
│   │   ├── Item.ts        # 物品实体
│   │   └── Merchant.ts    # 商人实体
│   ├── systems/           # 系统模块
│   │   ├── CombatSystem.ts    # 战斗系统
│   │   ├── InventorySystem.ts # 物品系统
│   │   ├── SkillSystem.ts     # 技能系统
│   │   ├── CraftingSystem.ts  # 合成系统
│   │   └── LevelSystem.ts     # 关卡系统
│   ├── ui/                # UI组件
│   │   ├── HealthBar.ts   # 生命条
│   │   ├── SkillBar.ts    # 技能栏
│   │   ├── InventoryUI.ts # 背包UI
│   │   └── CraftingUI.ts # 合成UI
│   ├── data/              # 数据定义
│   │   ├── Items.ts       # 物品数据
│   │   ├── Skills.ts      # 技能数据
│   │   └── Enemies.ts     # 敌人数据
│   └── utils/             # 工具函数
│       ├── MathUtils.ts   # 数学工具
│       └── CollisionUtils.ts # 碰撞检测工具
├── public/
│   ├── assets/            # 游戏资源
│   │   ├── images/        # 图片资源
│   │   ├── audio/         # 音频资源
│   │   └── data/          # 数据文件
│   └── index.html         # HTML入口
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 核心系统设计

### 1. 战斗系统 (CombatSystem)

#### 功能
- 玩家移动（WASD或方向键）
- 普通攻击（鼠标左键）
- 技能释放（数字键1-3）
- 敌人AI（巡逻、追击、攻击）

#### 数据结构
```typescript
interface CombatStats {
    hp: number;              // 当前生命值
    maxHp: number;           // 最大生命值
    attack: number;          // 攻击力
    defense: number;         // 防御力
    attackSpeed: number;     // 攻击速度（次/秒）
    critRate: number;        // 暴击率（0-1）
    critDamage: number;      // 暴击伤害倍率
    moveSpeed: number;       // 移动速度
}

interface CombatState {
    isAttacking: boolean;    // 是否正在攻击
    isStunned: boolean;      // 是否被眩晕
    lastAttackTime: number;  // 上次攻击时间
    comboCount: number;      // 连击数
}
```

#### 伤害计算
```typescript
function calculateDamage(attacker: CombatStats, defender: CombatStats): number {
    let damage = attacker.attack - defender.defense * 0.5;
    damage = Math.max(damage, 10); // 最小伤害10

    // 暴击计算
    if (Math.random() < attacker.critRate) {
        damage *= attacker.critDamage;
    }

    return Math.floor(damage);
}
```

### 2. 物品系统 (InventorySystem)

#### 功能
- 物品获取（掉落、购买）
- 物品装备（武器、防具）
- 物品使用（消耗品）
- 背包管理

#### 数据结构
```typescript
interface Item {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'consumable';
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'ultimate';
    stats?: ItemStats;       // 装备属性
    effect?: ConsumableEffect; // 消耗品效果
    icon: string;            // 图标资源路径
    description: string;     // 描述
}

interface ItemStats {
    attack?: number;
    defense?: number;
    attackSpeed?: number;
    critRate?: number;
    critDamage?: number;
    moveSpeed?: number;
    hp?: number;
    maxHp?: number;
}

interface ConsumableEffect {
    type: 'heal' | 'mana' | 'speed' | 'shield';
    value: number;
    duration?: number;       // 持续时间（秒）
}

interface InventorySlot {
    item: Item | null;
    quantity: number;
}
```

#### MVP 物品列表
```typescript
const MVP_ITEMS: Item[] = [
    // 武器
    {
        id: 'weapon_common_vibroblade',
        name: '振动短刀',
        type: 'weapon',
        rarity: 'common',
        stats: { attack: 25, attackSpeed: 1.2 },
        icon: 'vibroblade.png',
        description: '基础武器，无视10%护甲'
    },
    {
        id: 'weapon_rare_heatkatana',
        name: '热能武士刀',
        type: 'weapon',
        rarity: 'rare',
        stats: { attack: 45, attackSpeed: 0.9 },
        icon: 'heatkatana.png',
        description: '攻击有20%概率造成燃烧'
    },
    {
        id: 'weapon_epic_highfreqblade',
        name: '高频振刃',
        type: 'weapon',
        rarity: 'epic',
        stats: { attack: 80, attackSpeed: 1.5 },
        icon: 'highfreqblade.png',
        description: '满振动槽后下次攻击必定暴击'
    },
    {
        id: 'weapon_legendary_thunderaxe',
        name: '雷电战斧',
        type: 'weapon',
        rarity: 'legendary',
        stats: { attack: 150, attackSpeed: 0.7 },
        icon: 'thunderaxe.png',
        description: '对机械敌人造成双倍伤害'
    },
    // 防具
    {
        id: 'armor_common_jacket',
        name: '皮夹克',
        type: 'armor',
        rarity: 'common',
        stats: { defense: 15 },
        icon: 'jacket.png',
        description: '基础护甲'
    },
    {
        id: 'armor_rare_kevlar',
        name: '凯夫拉护甲',
        type: 'armor',
        rarity: 'rare',
        stats: { defense: 30 },
        icon: 'kevlar.png',
        description: '受到近战伤害减少15%'
    },
    // 消耗品
    {
        id: 'consumable_nanobot',
        name: '医疗纳米机器人',
        type: 'consumable',
        rarity: 'common',
        effect: { type: 'heal', value: 30 },
        icon: 'nanobot.png',
        description: '立即回复30%生命值'
    },
    {
        id: 'consumable_battery',
        name: '能量电池',
        type: 'consumable',
        rarity: 'common',
        effect: { type: 'mana', value: 50 },
        icon: 'battery.png',
        description: '立即回复50%法力值'
    },
    {
        id: 'consumable_teleport',
        name: '闪现装置',
        type: 'consumable',
        rarity: 'rare',
        effect: { type: 'speed', value: 5, duration: 0.5 },
        icon: 'teleport.png',
        description: '瞬移至前方5米处'
    }
];
```

### 3. 技能系统 (SkillSystem)

#### 功能
- 技能槽管理（3个主动技能）
- 技能释放（法力值消耗、冷却时间）
- 技能效果实现

#### 数据结构
```typescript
interface Skill {
    id: string;
    name: string;
    description: string;
    icon: string;
    manaCost: number;        // 法力消耗
    cooldown: number;       // 冷却时间（秒）
    lastUsedTime: number;   // 上次使用时间
    level: number;          // 技能等级（0-3）
    effect: SkillEffect;     // 技能效果
}

interface SkillEffect {
    type: 'slash' | 'spin' | 'dash' | 'heal' | 'shield';
    damage?: number;         // 伤害倍率（武器攻击力的倍数）
    range?: number;          // 范围（像素）
    duration?: number;       // 持续时间（秒）
    healValue?: number;     // 治疗量
    shieldValue?: number;   // 护盾值
}
```

#### MVP 技能列表（街头武士）
```typescript
const MVP_SKILLS: Skill[] = [
    {
        id: 'skill_slash',
        name: '横扫斩',
        description: '前方扇形范围斩击，造成150%武器伤害',
        icon: 'slash.png',
        manaCost: 20,
        cooldown: 5,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: 'slash',
            damage: 1.5,
            range: 150
        }
    },
    {
        id: 'skill_spin',
        name: '旋风斩',
        description: '原地旋转攻击，持续2秒，造成200%武器伤害/秒',
        icon: 'spin.png',
        manaCost: 40,
        cooldown: 10,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: 'spin',
            damage: 2.0,
            duration: 2
        }
    },
    {
        id: 'skill_dash',
        name: '闪现突袭',
        description: '瞬移至目标敌人身后，造成100%武器伤害',
        icon: 'dash.png',
        manaCost: 15,
        cooldown: 3,
        lastUsedTime: 0,
        level: 0,
        effect: {
            type: 'dash',
            damage: 1.0,
            range: 200
        }
    }
];
```

### 4. 合成系统 (CraftingSystem)

#### 功能
- 物品合成（同品级升级）
- 合成配方查询
- 材料检查

#### 数据结构
```typescript
interface CraftingRecipe {
    ingredients: { itemId: string; quantity: number }[];
    result: { itemId: string; quantity: number };
}

interface CraftingState {
    isCrafting: boolean;
    currentRecipe: CraftingRecipe | null;
}
```

#### MVP 合成配方
```typescript
const MVP_RECIPES: CraftingRecipe[] = [
    {
        ingredients: [
            { itemId: 'weapon_common_vibroblade', quantity: 2 }
        ],
        result: { itemId: 'weapon_rare_heatkatana', quantity: 1 }
    },
    {
        ingredients: [
            { itemId: 'weapon_rare_heatkatana', quantity: 2 },
            { itemId: 'material_gear', quantity: 5 }
        ],
        result: { itemId: 'weapon_epic_highfreqblade', quantity: 1 }
    },
    {
        ingredients: [
            { itemId: 'weapon_epic_highfreqblade', quantity: 2 },
            { itemId: 'material_chip', quantity: 3 }
        ],
        result: { itemId: 'weapon_legendary_thunderaxe', quantity: 1 }
    },
    {
        ingredients: [
            { itemId: 'armor_common_jacket', quantity: 2 }
        ],
        result: { itemId: 'armor_rare_kevlar', quantity: 1 }
    }
];
```

### 5. 关卡系统 (LevelSystem)

#### 功能
- 关卡生成（基于瓦片的随机地图）
- 敌人生成（按数量和类型）
- 商人生成（固定位置）
- 传送门生成（击败精英怪后）

#### 数据结构
```typescript
interface LevelConfig {
    width: number;           // 地图宽度（瓦片数）
    height: number;          // 地图高度（瓦片数）
    tileSize: number;        // 瓦片大小（像素）
    enemyCount: number;      // 敌人数量
    eliteCount: number;      // 精英怪数量
    merchantPosition: { x: number; y: number }; // 商人位置
    portalPosition: { x: number; y: number } | null; // 传送门位置（击败精英怪后生成）
}

interface LevelState {
    enemiesDefeated: number;
    eliteDefeated: boolean;
    merchantVisited: boolean;
    portalSpawned: boolean;
    timeElapsed: number;     // 已用时间（秒）
}
```

#### MVP 关卡配置
```typescript
const MVP_LEVEL_CONFIG: LevelConfig = {
    width: 50,
    height: 50,
    tileSize: 32,
    enemyCount: 10,
    eliteCount: 1,
    merchantPosition: { x: 25, y: 25 },
    portalPosition: null
};
```

---

## 开发里程碑

### 第1周：项目搭建 + 核心框架
- [ ] 项目初始化（Phaser 3 + Vite + TypeScript）
- [ ] 核心系统架构搭建
- [ ] 场景切换系统
- [ ] 资源加载系统
- [ ] 基础UI框架

### 第2周：战斗系统
- [ ] 玩家实体（移动、动画）
- [ ] 敌人实体（AI、动画）
- [ ] 碰撞检测系统
- [ ] 伤害计算系统
- [ ] 基础攻击和技能释放

### 第3周：物品系统
- [ ] 物品数据定义
- [ ] 物品掉落系统
- [ ] 背包UI系统
- [ ] 装备系统
- [ ] 消耗品使用系统

### 第4周：合成系统
- [ ] 合成配方定义
- [ ] 合成UI系统
- [ ] 材料检查逻辑
- [ ] 合成动画效果

### 第5周：关卡系统
- [ ] 地图生成系统
- [ ] 敌人生成系统
- [ ] 商人实体
- [ ] 传送门系统

### 第6周：打磨与测试
- [ ] 音效和特效
- [ ] 数值平衡调整
- [ ] Bug修复
- [ ] 性能优化

### 第7周：上线准备
- [ ] 打包部署
- [ ] 文档编写
- [ ] 用户测试反馈收集

---

## 核心代码实现示例

### 1. 游戏入口 (Game.ts)
```typescript
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import { GAME_CONFIG } from './core/Config';

class CyberpunkRogueliteGame {
    private game: Phaser.Game;

    constructor() {
        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            width: GAME_CONFIG.width,
            height: GAME_CONFIG.height,
            parent: 'game-container',
            backgroundColor: '#000000',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: [BootScene, MenuScene, GameScene, UIScene]
        });
    }
}

new CyberpunkRogueliteGame();
```

### 2. 游戏配置 (Config.ts)
```typescript
export const GAME_CONFIG = {
    width: 1280,
    height: 720,
    tileSize: 32,
    maxInventorySlots: 20,
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
    level: {
        duration: 600, // 10分钟
        enemyRespawnTime: 10
    },
    crafting: {
        commonToRare: 2,
        rareToEpic: 3,
        epicToLegendary: 4
    }
};
```

### 3. 玩家实体 (Player.ts)
```typescript
import Phaser from 'phaser';
import { CombatStats, CombatState } from '../systems/CombatSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { SkillSystem } from '../systems/SkillSystem';

export default class Player extends Phaser.GameObjects.Sprite {
    private stats: CombatStats;
    private state: CombatState;
    private inventory: InventorySystem;
    private skills: SkillSystem;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 初始化属性
        this.stats = {
            hp: 100,
            maxHp: 100,
            attack: 10,
            defense: 5,
            attackSpeed: 1.2,
            critRate: 0.05,
            critDamage: 1.5,
            moveSpeed: 200
        };

        this.state = {
            isAttacking: false,
            isStunned: false,
            lastAttackTime: 0,
            comboCount: 0
        };

        this.inventory = new InventorySystem(20);
        this.skills = new SkillSystem();

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);
    }

    update(time: number, delta: number): void {
        if (this.state.isStunned) return;

        // 移动控制
        const cursors = this.scene.input.keyboard.createCursorKeys();
        const velocity = new Phaser.Math.Vector2(0, 0);

        if (cursors.left.isDown) velocity.x = -1;
        if (cursors.right.isDown) velocity.x = 1;
        if (cursors.up.isDown) velocity.y = -1;
        if (cursors.down.isDown) velocity.y = 1;

        velocity.normalize().scale(this.stats.moveSpeed);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(velocity.x, velocity.y);

        // 攻击控制
        if (this.scene.input.activePointer.isDown && !this.state.isAttacking) {
            this.performAttack(time);
        }

        // 技能控制
        if (this.scene.input.keyboard.checkDown(Phaser.Input.Keyboard.KeyCodes.ONE, 250)) {
            this.skills.useSkill(0, time);
        }
        if (this.scene.input.keyboard.checkDown(Phaser.Input.Keyboard.KeyCodes.TWO, 250)) {
            this.skills.useSkill(1, time);
        }
        if (this.scene.input.keyboard.checkDown(Phaser.Input.Keyboard.KeyCodes.THREE, 250)) {
            this.skills.useSkill(2, time);
        }

        // 法力值恢复
        this.stats.mana += this.stats.manaRegenPerSecond * (delta / 1000);
        this.stats.mana = Math.min(this.stats.mana, this.stats.maxMana);
    }

    private performAttack(time: number): void {
        const attackInterval = 1000 / this.stats.attackSpeed;

        if (time - this.state.lastAttackTime < attackInterval) {
            return;
        }

        this.state.lastAttackTime = time;
        this.state.isAttacking = true;

        // 播放攻击动画
        this.anims.play('player_attack');

        // 检测攻击范围内的敌人
        const enemies = this.scene.children.getMatching('type', 'enemy') as Phaser.GameObjects.Sprite[];
        enemies.forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < 50) {
                // 造成伤害
                const enemyStats = (enemy as any).stats;
                const damage = this.calculateDamage(this.stats, enemyStats);
                (enemy as any).takeDamage(damage);
            }
        });

        // 攻击动画结束后恢复
        this.once('animationcomplete', () => {
            this.state.isAttacking = false;
        });
    }

    private calculateDamage(attacker: CombatStats, defender: CombatStats): number {
        let damage = attacker.attack - defender.defense * 0.5;
        damage = Math.max(damage, 10);

        if (Math.random() < attacker.critRate) {
            damage *= attacker.critDamage;
        }

        return Math.floor(damage);
    }

    public takeDamage(damage: number): void {
        this.stats.hp -= damage;
        this.stats.hp = Math.max(this.stats.hp, 0);

        // 更新UI
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);

        if (this.stats.hp <= 0) {
            this.scene.scene.start('MenuScene');
        }
    }

    public heal(value: number): void {
        this.stats.hp += value;
        this.stats.hp = Math.min(this.stats.hp, this.stats.maxHp);

        // 更新UI
        this.scene.events.emit('updateHealth', this.stats.hp, this.stats.maxHp);
    }

    public getStats(): CombatStats {
        return this.stats;
    }

    public getInventory(): InventorySystem {
        return this.inventory;
    }
}
```

### 4. 敌人实体 (Enemy.ts)
```typescript
import Phaser from 'phaser';
import { CombatStats, CombatState } from '../systems/CombatSystem';

export default class Enemy extends Phaser.GameObjects.Sprite {
    private stats: CombatStats;
    private state: CombatState;
    private aiState: 'patrol' | 'chase' | 'attack' | 'stunned';
    private player: Player;
    private patrolTarget: Phaser.Math.Vector2;

    constructor(scene: Phaser.Scene, x: number, y: number, enemyType: 'common' | 'elite' | 'boss') {
        super(scene, x, y, `enemy_${enemyType}_idle`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 初始化属性
        this.initStats(enemyType);

        this.state = {
            isAttacking: false,
            isStunned: false,
            lastAttackTime: 0,
            comboCount: 0
        };

        this.aiState = 'patrol';
        this.player = scene.children.getMatching('type', 'player')[0] as Player;
        this.patrolTarget = new Phaser.Math.Vector2(x, y);

        // 添加刚体
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);
    }

    private initStats(enemyType: 'common' | 'elite' | 'boss'): void {
        switch (enemyType) {
            case 'common':
                this.stats = {
                    hp: 50,
                    maxHp: 50,
                    attack: 15,
                    defense: 5,
                    attackSpeed: 0.8,
                    critRate: 0.02,
                    critDamage: 1.2,
                    moveSpeed: 100
                };
                break;
            case 'elite':
                this.stats = {
                    hp: 150,
                    maxHp: 150,
                    attack: 30,
                    defense: 15,
                    attackSpeed: 0.6,
                    critRate: 0.05,
                    critDamage: 1.3,
                    moveSpeed: 120
                };
                break;
            case 'boss':
                this.stats = {
                    hp: 5000,
                    maxHp: 5000,
                    attack: 80,
                    defense: 40,
                    attackSpeed: 0.5,
                    critRate: 0.08,
                    critDamage: 1.5,
                    moveSpeed: 80
                };
                break;
        }
    }

    update(time: number, delta: number): void {
        if (this.state.isStunned) return;

        // AI行为
        this.updateAI(time, delta);

        // 法力值恢复（如果需要）
    }

    private updateAI(time: number, delta: number): void {
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.player.x, this.player.y
        );

        switch (this.aiState) {
            case 'patrol':
                this.patrol(delta);
                if (distanceToPlayer < 200) {
                    this.aiState = 'chase';
                }
                break;
            case 'chase':
                this.chase(delta);
                if (distanceToPlayer < 50) {
                    this.aiState = 'attack';
                }
                if (distanceToPlayer > 300) {
                    this.aiState = 'patrol';
                }
                break;
            case 'attack':
                this.attack(time);
                if (distanceToPlayer > 50) {
                    this.aiState = 'chase';
                }
                break;
        }
    }

    private patrol(delta: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const direction = new Phaser.Math.Vector2(
            this.patrolTarget.x - this.x,
            this.patrolTarget.y - this.y
        );

        if (direction.length() < 10) {
            // 随机选择新的巡逻目标
            this.patrolTarget.setTo(
                Phaser.Math.Between(100, 1100),
                Phaser.Math.Between(100, 600)
            );
        } else {
            direction.normalize().scale(this.stats.moveSpeed * 0.5);
            body.setVelocity(direction.x, direction.y);
        }
    }

    private chase(delta: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const direction = new Phaser.Math.Vector2(
            this.player.x - this.x,
            this.player.y - this.y
        );
        direction.normalize().scale(this.stats.moveSpeed);
        body.setVelocity(direction.x, direction.y);
    }

    private attack(time: number): void {
        const attackInterval = 1000 / this.stats.attackSpeed;

        if (time - this.state.lastAttackTime < attackInterval) {
            return;
        }

        this.state.lastAttackTime = time;
        this.state.isAttacking = true;

        // 播放攻击动画
        this.anims.play(`enemy_${this.getType()}_attack`);

        // 对玩家造成伤害
        const playerStats = this.player.getStats();
        const damage = this.calculateDamage(this.stats, playerStats);
        this.player.takeDamage(damage);

        // 攻击动画结束后恢复
        this.once('animationcomplete', () => {
            this.state.isAttacking = false;
        });
    }

    private calculateDamage(attacker: CombatStats, defender: CombatStats): number {
        let damage = attacker.attack - defender.defense * 0.5;
        damage = Math.max(damage, 10);

        if (Math.random() < attacker.critRate) {
            damage *= attacker.critDamage;
        }

        return Math.floor(damage);
    }

    private getType(): 'common' | 'elite' | 'boss' {
        if (this.stats.maxHp === 50) return 'common';
        if (this.stats.maxHp === 150) return 'elite';
        return 'boss';
    }

    public takeDamage(damage: number): void {
        this.stats.hp -= damage;
        this.stats.hp = Math.max(this.stats.hp, 0);

        // 播放受伤动画
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    private die(): void {
        // 掉落物品
        this.scene.events.emit('enemyDefeated', this);

        // 播放死亡动画
        this.anims.play(`enemy_${this.getType()}_death`);

        // 动画结束后销毁
        this.once('animationcomplete', () => {
            this.destroy();
        });
    }

    public getStats(): CombatStats {
        return this.stats;
    }
}
```

---

## MVP 验收标准

### 功能验收
- [ ] 玩家可以移动和攻击
- [ ] 敌人会巡逻、追击、攻击
- [ ] 玩家可以使用3个技能
- [ ] 物品可以掉落、装备、使用
- [ ] 可以进行基础合成（2灰→1蓝）
- [ ] 可以击败精英怪并进入传送门
- [ ] 游戏有明确的开始和结束流程

### 性能验收
- [ ] 帧率稳定在60fps
- [ ] 加载时间 < 5秒
- [ ] 内存占用 < 500MB

### 体验验收
- [ ] 操作流畅，无明显卡顿
- [ ] 视觉反馈清晰（受伤、暴击、死亡）
- [ ] 音效和特效配合得当
- [ ] UI简洁易懂

---

## 下一步扩展方向

### 短期扩展（MVP后）
- 时间回溯机制
- 随机事件系统
- 多职业系统（数据黑客、生化改造者、暗影刺客）
- 联机功能

### 长期扩展
- 更多关卡和BOSS
- 更复杂的合成系统（隐藏技能解锁）
- 技能树系统
- 成就系统
- 排行榜和PVP

---

这份MVP开发计划提供了完整的技术架构、核心系统设计和代码示例。你可以基于这个框架直接开始开发，预计7周可以完成一个可玩的MVP版本。
