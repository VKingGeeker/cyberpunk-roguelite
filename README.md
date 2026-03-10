# Cyberpunk Roguelite - MVP

一款基于 Phaser 3 开发的赛博朋克肉鸽游戏 MVP 版本。

## 项目概述

这是一个单人开发的 2D 网页肉鸽游戏，采用 TypeScript + Phaser 3 技术栈。MVP 版本实现了核心游戏循环，包括战斗、技能、物品、武器、合成等基础系统。

**核心特色**：
- 赛博朋克视觉风格（霓虹色彩、电路纹理、全息效果）
- 割草式战斗体验（大量敌人、被动技能自动释放）
- 17种被动技能，升级时随机3选1
- 12种武器，支持装备切换和合成升级
- 大世界地图（3200x2400），相机跟随玩家

## 技术栈

- **游戏引擎**: Phaser 3.90.0
- **构建工具**: Vite 5.4.x
- **编程语言**: TypeScript 5.9.x
- **包管理器**: pnpm

## 功能特性

### 已实现功能

#### 核心系统
- ✅ 战斗系统（攻击、伤害计算、暴击、连击）
- ✅ 物品系统（获取、装备、使用、背包）
- ✅ **被动技能系统**（自动触发、冷却管理、升级机制）
- ✅ **武器系统**（装备、切换、属性加成）
- ✅ **合成系统**（武器合成、升级、材料管理）
- ✅ 关卡系统（大世界地图、敌人生成、相机跟随）

#### 游戏内容
- ✅ 1个职业（赛博朋克女战士）
- ✅ **17种被动技能**（攻击/防御/辅助三大分支）
- ✅ **12种武器**（普通/稀有/史诗/传说四个稀有度）
- ✅ 3种敌人类型（普通、精英、BOSS）
- ✅ 程序生成角色动画（Idle/Run/Attack）
- ✅ 敌人在玩家周围环形区域生成

#### UI系统
- ✅ 生命条（赛博朋克风格）
- ✅ **武器栏**（显示3个槽位和当前武器属性）
- ✅ **技能栏**（最多显示6个已学技能）
- ✅ 经验条和等级显示
- ✅ 击杀计数器
- ✅ **合成界面**（配方列表、材料需求、结果预览）
- ✅ 伤害数字显示（支持暴击高亮）

### 暂未实现功能

- [ ] 时间回溯机制
- [ ] 随机事件系统
- [ ] 多职业系统
- [ ] 联机功能
- [ ] 完整技能树
- [ ] 存档/读档系统
- [ ] 音效和背景音乐
- [ ] 更复杂的地图生成

## 项目结构

```
cyberpunk-roguelite-mvp/
├── public/                 # 静态资源
│   └── index.html         # HTML入口
├── src/
│   ├── core/              # 核心系统
│   │   ├── Config.ts      # 游戏配置
│   │   └── Types.ts       # 类型定义
│   ├── data/              # 数据定义
│   │   ├── Items.ts       # 物品数据
│   │   ├── Skills.ts      # 技能数据（17种技能）
│   │   ├── Weapons.ts     # 武器数据（12种武器）
│   │   ├── Enemies.ts     # 敌人数据
│   │   └── Crafting.ts    # 合成数据
│   ├── systems/           # 系统模块
│   │   ├── CombatSystem.ts    # 战斗系统
│   │   ├── InventorySystem.ts # 物品系统
│   │   ├── SkillSystem.ts     # 技能系统
│   │   └── CraftingSystem.ts  # 合成系统
│   ├── entities/          # 游戏实体
│   │   ├── Player.ts      # 玩家实体（含武器系统）
│   │   ├── Enemy.ts       # 敌人实体
│   │   └── PowerUp.ts     # 升级道具实体
│   ├── scenes/            # 场景
│   │   ├── BootScene.ts   # 启动场景（纹理生成）
│   │   ├── MenuScene.ts   # 主菜单场景
│   │   ├── GameScene.ts   # 游戏主场景
│   │   ├── UIScene.ts     # UI场景
│   │   ├── SkillSelectScene.ts  # 技能选择场景
│   │   └── CraftingScene.ts     # 合成场景
│   ├── utils/             # 工具函数
│   │   └── MathUtils.ts   # 数学工具
│   └── main.ts            # 游戏入口
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

浏览器将自动打开 `http://localhost:5000`

### 构建生产版本

```bash
pnpm build
```

构建后的文件将输出到 `dist/` 目录

## 游戏操作

### 移动
- **WASD** 或 **方向键**

### 攻击
- **鼠标左键**：普通攻击（使用当前武器）
- 技能自动释放（被动技能）

### 武器切换
- **1/2/3**：切换到对应槽位的武器
- **Q**：循环切换武器

### 合成界面
- **C**：打开合成界面
- **ESC**：关闭合成界面

## 核心系统说明

### 被动技能系统

技能改为被动自动触发，无需手动操作和能量消耗。

**技能分支**：
- **攻击型**：霓虹斩击、等离子漩涡、连锁闪电、激光射线、等离子球、能量新星、音爆冲击、烈焰波、虚空裂缝、冰霜碎片
- **防御型**：纳米护盾、EMP冲击
- **辅助型**：超频驱动、全息幻影、时间扭曲、纳米虫群、能量汲取

**升级机制**：
- 升级时随机出现3个技能供选择
- 已学会的技能可选择升级（最高5级）
- 升级后技能伤害提升、范围扩大、冷却减少

```typescript
// 技能自动触发逻辑
private handlePassiveSkills(time: number): void {
    this.ownedSkills.forEach((data, skillId) => {
        if (time < data.cooldownEndTime) return;
        if (enemies.length === 0) return;
        this.triggerSkill(skillId, skill, enemies, time);
    });
}
```

### 武器系统

**武器类型**：
- **剑 (Sword)**：平衡型，适合新手
- **刀刃 (Blade)**：快速攻击，高暴击
- **法杖 (Staff)**：远程攻击，大范围
- **锤 (Hammer)**：高伤害，可眩晕
- **匕首 (Dagger)**：极速攻击，高暴击

**武器稀有度**：
| 稀有度 | 颜色 | 数量 |
|--------|------|------|
| 普通 | 灰色 | 3 |
| 稀有 | 蓝色 | 3 |
| 史诗 | 紫色 | 3 |
| 传说 | 橙色 | 3 |

**武器槽位**：
- 最多3个武器槽位
- 按键1/2/3快速切换
- 武器属性直接影响攻击力、攻速、暴击等

```typescript
// 武器切换
public switchWeapon(slotIndex: number): void {
    if (!this.weaponSlots[slotIndex]) return;
    this.activeWeaponSlot = slotIndex;
    this.currentWeapon = this.weaponSlots[slotIndex]!;
    this.applyWeaponStats();
}
```

### 合成系统

**合成配方**：
- 基础武器合成（免费获得基础武器）
- 武器升级（2把低级武器合成1把高级武器）
- 武器融合（不同类型武器合成新武器）

**合成界面**：
- 左侧：配方列表（显示武器名称、属性、分类）
- 右上：材料需求（显示拥有/所需数量）
- 右下：结果预览（显示武器详细属性）

```typescript
// 执行合成
private performCraft(recipe: CraftingRecipe): void {
    // 移除材料
    for (const material of recipe.ingredients) {
        // 从背包移除指定数量的武器
    }
    // 添加结果武器
    const resultWeapon = getWeaponById(recipe.result.itemId);
    this.player.equipWeapon(resultWeapon);
}
```

### 战斗系统

战斗系统 (`CombatSystem.ts`) 负责处理伤害计算、暴击判定、连击加成等核心战斗逻辑。

```typescript
// 计算伤害
const damageResult = CombatSystem.calculateDamage(attacker.stats, defender.stats);
// damageResult 包含：damage, isCrit, isBlocked, elementalBonus

// 计算技能伤害
const skillDamage = CombatSystem.calculateSkillDamage(attacker.stats, defender.stats, damageMultiplier);
```

### 敌人生成系统

**生成策略**：
- 初始生成30个敌人
- 每800ms生成新敌人
- 最大敌人数量：80个
- 在玩家周围400-800像素环形区域生成
- 定期清理距离玩家超过1200像素的敌人

```typescript
// 敌人生成位置计算
const angle = Math.random() * Math.PI * 2;
const distance = GAME_CONFIG.enemy.minSpawnDistance + 
    Math.random() * (GAME_CONFIG.enemy.maxSpawnDistance - GAME_CONFIG.enemy.minSpawnDistance);
const x = playerX + Math.cos(angle) * distance;
const y = playerY + Math.sin(angle) * distance;
```

## 数值平衡

### 伤害计算公式

```
基础伤害 = 攻击力 - 防御力 * 0.5
最小伤害 = max(基础伤害, 1)
最终伤害 = 最小伤害 * 暴击倍率（如果暴击）
```

### 武器属性范围

| 稀有度 | 攻击力 | 攻速 | 暴击率 | 暴击伤害 |
|--------|--------|------|--------|----------|
| 普通 | 6-10 | 1.0-2.0 | 5%-12% | 150%-180% |
| 稀有 | 10-20 | 0.8-2.5 | 6%-18% | 160%-220% |
| 史诗 | 18-35 | 0.6-2.0 | 8%-20% | 200%-300% |
| 传说 | 20-40 | 1.6-3.5 | 22%-30% | 280%-400% |

### 技能冷却

| 技能类型 | 基础冷却 | 升级减少 |
|----------|----------|----------|
| 攻击型 | 3-5秒 | 每级-0.3秒 |
| 防御型 | 8-12秒 | 每级-0.5秒 |
| 辅助型 | 6-10秒 | 每级-0.4秒 |

### 地图配置

- 世界大小：3200 x 2400 像素
- 相机跟随玩家
- 霓虹网格地板
- 电路板纹理
- 随机霓虹光点

## 已知问题

1. 资源图片使用程序生成占位图
2. 商人交互功能较为简单
3. 缺少音效和背景音乐
4. 地图生成较为简单，缺少复杂地形
5. 部分技能特效可以进一步优化

## 后续计划

### 短期（1-2周）
- [ ] 添加更多武器类型
- [ ] 实现存档/读档功能
- [ ] 添加音效和背景音乐
- [ ] 优化技能特效

### 中期（3-4周）
- [ ] 实现时间回溯机制
- [ ] 添加更多技能和物品
- [ ] 完善随机事件系统
- [ ] 优化AI行为

### 长期（1-2月）
- [ ] 添加更多职业
- [ ] 实现联机功能
- [ ] 开发完整技能树
- [ ] 添加更多关卡和BOSS

## 贡献指南

这是一个个人项目，目前不接受外部贡献。但欢迎提出问题和建议。

## 许可证

本项目仅供学习和研究使用。

## 致谢

感谢以下开源项目：
- [Phaser 3](https://phaser.io/) - 强大的2D游戏引擎
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

---

**祝游戏愉快！🎮**
