# 赛博朋克肉鸽游戏 MVP 开发计划

## MVP 实现状态概览

### 已完成内容 ✅
- **1个职业**：赛博朋克女战士
- **大世界地图**：3200x2400像素，相机跟随玩家
- **3种敌人类型**：普通怪、精英怪、BOSS
- **完整战斗系统**：移动、攻击、伤害计算、暴击、连击
- **被动技能系统**：17种技能，自动触发，升级3选1
- **武器系统**：12种武器（4个稀有度），3槽位切换
- **合成系统**：基础武器合成升级
- **完整UI系统**：生命条、武器栏、技能栏、合成界面

### 暂未实现 ❌
- 时间回溯机制
- 随机事件系统
- 多职业系统
- 联机功能
- 完整技能树（职业专属）
- 存档/读档系统
- 音效和背景音乐

---

## 技术栈选择

### 前端框架
- **游戏引擎**：Phaser 3.90.0（轻量级、适合2D网页游戏）
- **构建工具**：Vite 5.4（快速开发、热更新）
- **语言**：TypeScript 5.9（类型安全、便于维护）
- **包管理器**：pnpm

### 为什么选择 Phaser 3
- 专为2D游戏设计，内置物理引擎、碰撞检测
- 丰富的插件生态系统
- 社区活跃，文档完善
- 支持Canvas和WebGL渲染

---

## 项目结构

```
cyberpunk-roguelite-mvp/
├── public/                 # 静态资源
│   └── index.html         # HTML入口
├── src/
│   ├── core/              # 核心系统
│   │   ├── Config.ts      # 游戏配置（属性、颜色、枚举定义）
│   │   └── Types.ts       # 类型定义（接口、类型别名）
│   ├── data/              # 数据定义
│   │   ├── Items.ts       # 物品数据
│   │   ├── Skills.ts      # 技能数据（17种被动技能）
│   │   ├── Weapons.ts     # 武器数据（12种武器）
│   │   ├── Enemies.ts     # 敌人数据
│   │   └── Crafting.ts    # 合成配方数据
│   ├── systems/           # 系统模块
│   │   ├── CombatSystem.ts    # 战斗系统（伤害计算、暴击判定）
│   │   ├── InventorySystem.ts # 物品系统（背包管理）
│   │   ├── SkillSystem.ts     # 技能系统（被动技能触发）
│   │   └── CraftingSystem.ts  # 合成系统（配方检查、合成执行）
│   ├── entities/          # 游戏实体
│   │   ├── Player.ts      # 玩家实体（武器切换、技能管理）
│   │   ├── Enemy.ts       # 敌人实体（AI行为、追踪攻击）
│   │   ├── PowerUp.ts     # 升级道具实体（经验球）
│   │   └── Merchant.ts    # 商人实体（预留）
│   ├── scenes/            # 场景
│   │   ├── BootScene.ts   # 启动场景（程序生成纹理）
│   │   ├── MenuScene.ts   # 主菜单场景
│   │   ├── GameScene.ts   # 游戏主场景（战斗、敌人生成）
│   │   ├── UIScene.ts     # UI场景（生命条、技能栏、武器栏）
│   │   ├── SkillSelectScene.ts  # 技能选择场景（升级3选1）
│   │   └── CraftingScene.ts     # 合成场景（武器合成界面）
│   ├── utils/             # 工具函数
│   │   └── MathUtils.ts   # 数学工具（距离计算、随机数）
│   └── main.ts            # 游戏入口
├── docs/                  # 设计文档
│   ├── cyberpunk_roguelite_game_prompt.md
│   ├── cyberpunk_roguelite_systems_detail.md
│   └── mvp_project_structure.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 核心系统设计

### 1. 战斗系统 (CombatSystem)

#### 功能
- 玩家移动（WASD或方向键）
- 普通攻击（鼠标左键，使用当前武器）
- 伤害计算（基础攻击 + 武器加成 - 防御）
- 暴击判定（暴击率 × 暴击伤害）
- 连击系统（连击数统计和显示）

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
    mana?: number;           // 当前法力值
    maxMana?: number;        // 最大法力值
}

interface CombatState {
    isAttacking: boolean;    // 是否正在攻击
    isStunned: boolean;      // 是否被眩晕
    lastAttackTime: number;  // 上次攻击时间
    comboCount: number;      // 连击数
    lastComboTime: number;   // 上次连击时间
}
```

#### 伤害计算
```typescript
function calculateDamage(attacker: CombatStats, defender: CombatStats): DamageResult {
    // 基础伤害 = 攻击力 - 防御 × 0.5
    let damage = attacker.attack - defender.defense * 0.5;
    damage = Math.max(damage, 10); // 最小伤害10

    // 暴击判定
    const isCrit = Math.random() < attacker.critRate;
    if (isCrit) {
        damage *= attacker.critDamage;
    }

    return { damage: Math.floor(damage), isCrit };
}
```

### 2. 物品系统 (InventorySystem)

#### 功能
- 物品获取（掉落、购买）
- 物品装备（武器、防具）
- 物品使用（消耗品）
- 背包管理（20格）

#### 数据结构
```typescript
interface Item {
    id: string;
    name: string;
    type: 'weapon' | 'armor' | 'consumable' | 'material';
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'ultimate';
    stats?: ItemStats;       // 装备属性
    effect?: ConsumableEffect; // 消耗品效果
    icon: string;            // 图标资源路径
    description: string;     // 描述
    specialEffect?: string;  // 特殊效果
}

interface InventorySlot {
    item: Item | null;
    quantity: number;
}
```

### 3. 技能系统 (SkillSystem)

#### 功能
- 被动技能自动触发（无手动操作）
- 冷却时间管理
- 技能升级（最高5级）
- 升级时3选1选择

#### 数据结构
```typescript
interface Skill {
    id: string;
    name: string;
    description: string;
    icon: string;
    branch: 'offense' | 'defense' | 'utility'; // 技能分支
    manaCost: number;       // 法力消耗（MVP为0）
    cooldown: number;       // 冷却时间（秒）
    lastUsedTime: number;   // 上次使用时间
    level: number;          // 技能等级（0-5）
    maxLevel: number;       // 最大等级（5）
    effect: SkillEffect;    // 技能效果
}

interface SkillEffect {
    type: SkillType;        // 技能类型
    damage?: number;        // 伤害倍率
    range?: number;         // 范围（像素）
    duration?: number;      // 持续时间（秒）
    healValue?: number;     // 治疗量
    chains?: number;        // 连锁次数
    stunDuration?: number;  // 眩晕时间
}
```

#### 技能自动触发逻辑
```typescript
// Player.ts 中的技能触发
private handlePassiveSkills(time: number): void {
    const enemies = this.getEnemiesInRange(300);
    if (enemies.length === 0) return;

    this.ownedSkills.forEach((data, skillId) => {
        const skill = PASSIVE_SKILLS.find(s => s.id === skillId);
        if (!skill || time < data.cooldownEndTime) return;

        // 触发技能效果
        this.triggerSkill(skillId, skill, enemies, time);
        
        // 设置冷却
        const cooldownReduction = 1 - (data.level - 1) * 0.1; // 每级减少10%冷却
        data.cooldownEndTime = time + skill.cooldown * 1000 * cooldownReduction;
    });
}
```

### 4. 武器系统

#### 功能
- 武器装备和切换
- 3个武器槽位
- 武器属性加成
- 武器合成升级

#### 数据结构
```typescript
interface Weapon {
    id: string;
    name: string;
    type: 'sword' | 'blade' | 'staff' | 'hammer' | 'dagger';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    attack: number;          // 基础攻击力
    attackSpeed: number;     // 攻击速度
    critRate: number;        // 暴击率
    critDamage: number;      // 暴击伤害
    range: number;           // 攻击范围
    specialEffect?: string;  // 特殊效果描述
    icon: string;
    description: string;
}
```

#### 武器切换逻辑
```typescript
// Player.ts
public switchWeapon(slotIndex: number): void {
    if (!this.weaponSlots[slotIndex]) return;
    
    this.activeWeaponSlot = slotIndex;
    this.currentWeapon = this.weaponSlots[slotIndex]!;
    this.applyWeaponStats();
    
    // 更新UI
    this.scene.events.emit('weaponSwitched', {
        slot: slotIndex,
        weapon: this.currentWeapon
    });
}

private applyWeaponStats(): void {
    if (!this.currentWeapon) return;
    
    // 武器属性叠加到基础属性
    this.stats.attack = this.baseStats.attack + this.currentWeapon.attack;
    this.stats.attackSpeed = this.baseStats.attackSpeed * this.currentWeapon.attackSpeed;
    this.stats.critRate = this.baseStats.critRate + this.currentWeapon.critRate;
    this.stats.critDamage = this.baseStats.critDamage * this.currentWeapon.critDamage;
}
```

### 5. 合成系统 (CraftingSystem)

#### 功能
- 武器合成（同品质升级）
- 配方检查
- 合成执行

#### 数据结构
```typescript
interface CraftingRecipe {
    id: string;
    name: string;
    ingredients: { itemId: string; quantity: number }[];
    result: { itemId: string; quantity: number };
    category: 'upgrade' | 'fusion' | 'enhance';
}

interface CraftingState {
    isCrafting: boolean;
    currentRecipe: CraftingRecipe | null;
    progress: number;
}
```

#### 合成配方
```typescript
const CRAFTING_RECIPES: CraftingRecipe[] = [
    // 普通升级到稀有
    {
        id: 'common_to_rare',
        name: '普通武器升级',
        ingredients: [
            { itemId: 'any_common_weapon', quantity: 2 }
        ],
        result: { itemId: 'random_rare_weapon', quantity: 1 },
        category: 'upgrade'
    },
    // 稀有升级到史诗
    {
        id: 'rare_to_epic',
        name: '稀有武器升级',
        ingredients: [
            { itemId: 'any_rare_weapon', quantity: 2 }
        ],
        result: { itemId: 'random_epic_weapon', quantity: 1 },
        category: 'upgrade'
    },
    // 史诗升级到传说
    {
        id: 'epic_to_legendary',
        name: '史诗武器升级',
        ingredients: [
            { itemId: 'any_epic_weapon', quantity: 2 }
        ],
        result: { itemId: 'random_legendary_weapon', quantity: 1 },
        category: 'upgrade'
    }
];
```

### 6. 关卡系统

#### 功能
- 大世界地图（3200x2400）
- 相机跟随玩家
- 敌人动态生成
- 经验球掉落

#### 配置
```typescript
const LEVEL_CONFIG = {
    worldWidth: 3200,        // 世界宽度
    worldHeight: 2400,       // 世界高度
    enemySpawnInterval: 800, // 敌人生成间隔（毫秒）
    maxEnemies: 80,          // 最大敌人数量
    spawnRadius: 400,        // 玩家周围生成半径
    spawnMinDistance: 200    // 最小生成距离
};
```

#### 敌人生成逻辑
```typescript
// GameScene.ts
private spawnEnemy(): void {
    if (this.enemies.length >= GAME_CONFIG.level.maxEnemies) return;

    // 在玩家周围环形区域生成
    const angle = Math.random() * Math.PI * 2;
    const distance = GAME_CONFIG.level.spawnRadius * (0.5 + Math.random() * 0.5);
    
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;
    
    // 确保在世界范围内
    const clampedX = Phaser.Math.Clamp(x, 50, GAME_CONFIG.worldWidth - 50);
    const clampedY = Phaser.Math.Clamp(y, 50, GAME_CONFIG.worldHeight - 50);

    const enemy = new Enemy(this, clampedX, clampedY, EnemyType.COMMON);
    this.enemies.push(enemy);
}
```

---

## 开发里程碑（已完成）

### 第1周：项目搭建 + 核心框架 ✅
- [x] 项目初始化（Phaser 3 + Vite + TypeScript）
- [x] 核心系统架构搭建
- [x] 场景切换系统
- [x] 程序生成纹理系统（无需外部资源）
- [x] 基础UI框架

### 第2周：战斗系统 ✅
- [x] 玩家实体（移动、动画、武器切换）
- [x] 敌人实体（AI追踪、近战攻击）
- [x] 碰撞检测系统
- [x] 伤害计算系统
- [x] 暴击和连击显示

### 第3周：技能系统 ✅
- [x] 被动技能数据定义（17种）
- [x] 技能自动触发系统
- [x] 技能升级选择界面
- [x] 技能冷却管理

### 第4周：武器系统 ✅
- [x] 武器数据定义（12种）
- [x] 武器槽位和切换
- [x] 武器属性加成
- [x] 武器栏UI

### 第5周：合成系统 ✅
- [x] 合成配方定义
- [x] 合成UI系统
- [x] 材料检查逻辑
- [x] 合成执行

### 第6周：打磨与优化 ✅
- [x] UI美化（赛博朋克风格）
- [x] 数值平衡调整
- [x] Bug修复

---

## 核心代码实现示例

### 1. 游戏入口 (main.ts)
```typescript
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import SkillSelectScene from './scenes/SkillSelectScene';
import CraftingScene from './scenes/CraftingScene';
import { GAME_CONFIG } from './core/Config';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        MenuScene,
        GameScene,
        UIScene,
        SkillSelectScene,
        CraftingScene
    ]
};

new Phaser.Game(config);
```

### 2. 玩家实体 (Player.ts) 关键代码
```typescript
export default class Player extends Phaser.GameObjects.Sprite {
    private stats: CombatStats;
    private state: CombatState;
    private ownedSkills: Map<string, SkillData>;
    private weaponSlots: (Weapon | null)[];
    private currentWeapon: Weapon | null;
    private activeWeaponSlot: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player_idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 初始化属性
        this.stats = {
            hp: GAME_CONFIG.player.baseHp,
            maxHp: GAME_CONFIG.player.baseHp,
            attack: GAME_CONFIG.player.baseAttack,
            defense: GAME_CONFIG.player.baseDefense,
            attackSpeed: GAME_CONFIG.player.baseAttackSpeed,
            critRate: GAME_CONFIG.player.baseCritRate,
            critDamage: GAME_CONFIG.player.baseCritDamage,
            moveSpeed: GAME_CONFIG.player.baseMoveSpeed
        };

        // 初始化武器槽位
        this.weaponSlots = [null, null, null];
        this.activeWeaponSlot = 0;
        
        // 初始化技能
        this.ownedSkills = new Map();
    }

    update(time: number, delta: number): void {
        if (this.state.isStunned) return;

        // 移动控制
        this.handleMovement();
        
        // 攻击控制
        this.handleAttack(time);
        
        // 被动技能触发
        this.handlePassiveSkills(time);
    }

    private handleMovement(): void {
        const cursors = this.scene.input.keyboard.createCursorKeys();
        const velocity = new Phaser.Math.Vector2(0, 0);

        if (cursors.left.isDown) velocity.x = -1;
        if (cursors.right.isDown) velocity.x = 1;
        if (cursors.up.isDown) velocity.y = -1;
        if (cursors.down.isDown) velocity.y = 1;

        velocity.normalize().scale(this.stats.moveSpeed);
        (this.body as Phaser.Physics.Arcade.Body).setVelocity(velocity.x, velocity.y);
    }

    private handlePassiveSkills(time: number): void {
        const enemies = this.getEnemiesInRange(300);
        if (enemies.length === 0) return;

        this.ownedSkills.forEach((data, skillId) => {
            const skill = PASSIVE_SKILLS.find(s => s.id === skillId);
            if (!skill || time < data.cooldownEndTime) return;

            this.triggerSkill(skillId, skill, enemies, time);
            data.cooldownEndTime = time + skill.cooldown * 1000;
        });
    }

    public grantRandomSkill(): void {
        // 随机选择3个技能供玩家选择
        const availableSkills = PASSIVE_SKILLS.filter(s => {
            const owned = this.ownedSkills.get(s.id);
            return !owned || owned.level < s.maxLevel;
        });

        const choices = Phaser.Utils.Array.Shuffle(availableSkills).slice(0, 3);
        this.scene.scene.launch('SkillSelectScene', { choices, player: this });
    }
}
```

### 3. 敌人实体 (Enemy.ts) 关键代码
```typescript
export default class Enemy extends Phaser.GameObjects.Sprite {
    private stats: CombatStats;
    private aiState: 'patrol' | 'chase' | 'attack';
    private player: Player;

    constructor(scene: Phaser.Scene, x: number, y: number, enemyType: EnemyType) {
        super(scene, x, y, `enemy_${enemyType}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.initStats(enemyType);
        this.aiState = 'chase';
        this.player = scene.children.getMatching('type', 'player')[0] as Player;
    }

    private initStats(enemyType: EnemyType): void {
        switch (enemyType) {
            case EnemyType.COMMON:
                this.stats = { hp: 40, maxHp: 40, attack: 15, defense: 5, ... };
                break;
            case EnemyType.ELITE:
                this.stats = { hp: 150, maxHp: 150, attack: 30, defense: 15, ... };
                break;
            case EnemyType.BOSS:
                this.stats = { hp: 1000, maxHp: 1000, attack: 80, defense: 40, ... };
                break;
        }
    }

    update(time: number, delta: number): void {
        if (this.stats.hp <= 0) return;

        // 简单追踪AI
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y, this.player.x, this.player.y
        );

        if (distance > 40) {
            // 追踪玩家
            const angle = Phaser.Math.Angle.Between(
                this.x, this.y, this.player.x, this.player.y
            );
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                Math.cos(angle) * this.stats.moveSpeed,
                Math.sin(angle) * this.stats.moveSpeed
            );
        } else {
            // 近战攻击
            this.performAttack(time);
        }
    }

    private performAttack(time: number): void {
        if (time - this.lastAttackTime < 1000 / this.stats.attackSpeed) return;
        
        this.lastAttackTime = time;
        this.player.takeDamage(this.stats.attack);
    }
}
```

### 4. 技能选择场景 (SkillSelectScene.ts)
```typescript
export default class SkillSelectScene extends Phaser.Scene {
    private choices: Skill[];
    private player: Player;

    create(data: { choices: Skill[], player: Player }): void {
        this.choices = data.choices;
        this.player = data.player;

        // 半透明背景
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);

        // 标题
        this.add.text(640, 100, '选择技能升级', { fontSize: '32px', color: '#00ffff' })
            .setOrigin(0.5);

        // 3个技能选项
        this.choices.forEach((skill, index) => {
            const x = 240 + index * 400;
            this.createSkillOption(skill, x, 360);
        });
    }

    private createSkillOption(skill: Skill, x: number, y: number): void {
        const owned = this.player.ownedSkills.get(skill.id);
        const isUpgrade = owned !== undefined;
        const level = owned?.level || 0;

        // 背景卡片
        const card = this.add.rectangle(x, y, 300, 400, 0x1a1a2e)
            .setStrokeStyle(2, 0x00ffff)
            .setInteractive({ useHandCursor: true });

        // 技能图标
        this.add.rectangle(x, y - 100, 80, 80, 0x00ffff);

        // 技能名称
        this.add.text(x, y, skill.name, { fontSize: '20px', color: '#ffffff' })
            .setOrigin(0.5);

        // 描述
        this.add.text(x, y + 50, skill.description, { fontSize: '14px', color: '#888888' })
            .setOrigin(0.5);

        // 等级显示
        if (isUpgrade) {
            this.add.text(x, y + 100, `等级 ${level} → ${level + 1}`, { fontSize: '16px', color: '#ffff00' })
                .setOrigin(0.5);
        }

        // 点击选择
        card.on('pointerdown', () => {
            this.selectSkill(skill);
        });
    }

    private selectSkill(skill: Skill): void {
        this.player.learnSkill(skill);
        this.scene.stop();
        this.scene.resume('GameScene');
    }
}
```

---

## 正式版开发计划（后续）

### 第1阶段：核心机制完善
- [ ] 时间回溯机制
- [ ] 存档/读档系统
- [ ] 随机事件系统
- [ ] 音效和背景音乐

### 第2阶段：内容扩展
- [ ] 多职业系统（4个职业）
- [ ] 职业专属技能树
- [ ] 更多武器和装备
- [ ] 更多敌人类型

### 第3阶段：联机功能
- [ ] Socket.io 后端搭建
- [ ] 玩家匹配系统
- [ ] 状态同步
- [ ] 联机专属内容

### 第4阶段：打磨上线
- [ ] 数值平衡调整
- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 部署上线

---

## 数值平衡参考表

### 玩家成长曲线
| 等级 | 生命值 | 攻击力 | 经验需求 |
|------|--------|--------|---------|
| 1 | 100 | 10 | 0 |
| 5 | 140 | 18 | 500 |
| 10 | 200 | 30 | 2000 |
| 15 | 260 | 42 | 5000 |
| 20 | 320 | 54 | 10000 |

### 武器属性范围
| 稀有度 | 攻击力 | 攻速 | 暴击率 | 暴击伤害 |
|--------|--------|------|--------|---------|
| 普通 | 6-10 | 1.0-2.0 | 5-12% | 150-180% |
| 稀有 | 10-20 | 0.8-2.5 | 6-18% | 160-220% |
| 史诗 | 18-35 | 0.6-2.0 | 8-20% | 200-300% |
| 传说 | 20-40 | 1.6-3.5 | 22-30% | 280-400% |

### 敌人属性
| 类型 | 生命值 | 攻击力 | 移动速度 | 经验值 |
|------|--------|--------|---------|--------|
| 普通 | 30-50 | 10-15 | 80-100 | 10-20 |
| 精英 | 100-150 | 25-35 | 100-120 | 50-100 |
| BOSS | 500-1000 | 50-80 | 60-80 | 200-500 |

### 技能冷却参考
| 技能类型 | 冷却范围 | 伤害倍率 | 范围 |
|---------|---------|---------|------|
| 快速 | 2-3秒 | 110-150% | 小 |
| 中等 | 4-6秒 | 160-200% | 中 |
| 强力 | 7-10秒 | 220-280% | 大 |
| 终极 | 12-15秒 | 300%+ | 全屏 |
