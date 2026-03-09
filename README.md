# Cyberpunk Roguelite - MVP

一款基于 Phaser 3 开发的赛博朋克肉鸽游戏 MVP 版本。

## 项目概述

这是一个单人开发的 2D 网页肉鸽游戏，采用 TypeScript + Phaser 3 技术栈。MVP 版本实现了核心游戏循环，包括战斗、技能、物品、合成等基础系统。

## 技术栈

- **游戏引擎**: Phaser 3.80.1
- **构建工具**: Vite 5.0.11
- **编程语言**: TypeScript 5.3.3
- **包管理器**: npm

## 功能特性

### 已实现功能

#### 核心系统
- ✅ 战斗系统（攻击、伤害计算、暴击、连击）
- ✅ 物品系统（获取、装备、使用、背包）
- ✅ 技能系统（释放、冷却、法力消耗）
- ✅ 合成系统（物品升级、配方管理）
- ✅ 关卡系统（地图生成、敌人生成、时间限制）

#### 游戏内容
- ✅ 1个职业（街头武士）
- ✅ 3个主动技能（横扫斩、旋风斩、闪现突袭）
- ✅ 4把武器（普通到传说）
- ✅ 2套防具
- ✅ 5种消耗品
- ✅ 3种敌人类型（普通、精英、BOSS）
- ✅ 简单的AI系统（巡逻、追击、攻击）

#### UI系统
- ✅ 生命条/法力条
- ✅ 技能栏和冷却显示
- ✅ 经验条和等级显示
- ✅ 时间显示
- ✅ 伤害数字显示

### 暂未实现功能

- [ ] 时间回溯机制
- [ ] 随机事件系统（简化为固定商人）
- [ ] 多职业系统（数据黑客、生化改造者、暗影刺客）
- [ ] 联机功能
- [ ] 完整技能树
- [ ] 存档/读档系统
- [ ] 音效和背景音乐
- [ ] 更复杂的地图生成

## 项目结构

```
cyberpunk-roguelite-mvp/
├── public/                 # 静态资源
│   ├── assets/            # 游戏资源（图片、音频等）
│   └── index.html         # HTML入口
├── src/
│   ├── core/              # 核心系统
│   │   ├── Config.ts      # 游戏配置
│   │   └── Types.ts       # 类型定义
│   ├── data/              # 数据定义
│   │   ├── Items.ts       # 物品数据
│   │   ├── Skills.ts      # 技能数据
│   │   ├── Enemies.ts     # 敌人数据
│   │   └── Crafting.ts    # 合成数据
│   ├── systems/           # 系统模块
│   │   ├── CombatSystem.ts    # 战斗系统
│   │   ├── InventorySystem.ts # 物品系统
│   │   ├── SkillSystem.ts     # 技能系统
│   │   └── CraftingSystem.ts  # 合成系统
│   ├── entities/          # 游戏实体
│   │   ├── Player.ts      # 玩家实体
│   │   ├── Enemy.ts       # 敌人实体
│   │   └── Merchant.ts    # 商人实体
│   ├── scenes/            # 场景
│   │   ├── BootScene.ts   # 启动场景
│   │   ├── MenuScene.ts   # 主菜单场景
│   │   ├── GameScene.ts   # 游戏主场景
│   │   └── UIScene.ts     # UI场景
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
npm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器将自动打开 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist/` 目录

## 游戏操作

### 移动
- WASD 或 方向键

### 攻击
- 鼠标左键：普通攻击
- 数字键 1-3：释放技能
  - 1：横扫斩（扇形AOE）
  - 2：旋风斩（持续旋转伤害）
  - 3：闪现突袭（瞬移攻击）

### 物品管理
- I 键：打开/关闭背包（暂未实现）

## 开发文档

### 设计文档

详细的游戏设计文档：
- `cyberpunk_roguelite_game_prompt.md` - 游戏设计提示词
- `cyberpunk_roguelite_systems_detail.md` - 物品/技能/合成/技能树详细设计
- `mvp_project_structure.md` - MVP 开发计划和项目结构

### 代码文档

代码中使用 TypeScript 类型注释，所有类和函数都有清晰的文档注释。

## 核心系统说明

### 战斗系统

战斗系统 (`CombatSystem.ts`) 负责处理伤害计算、暴击判定、连击加成等核心战斗逻辑。

```typescript
// 计算伤害
const damageResult = CombatSystem.calculateDamage(attacker.stats, defender.stats);
// damageResult 包含：damage, isCrit, isBlocked, elementalBonus
```

### 物品系统

物品系统 (`InventorySystem.ts`) 管理背包、装备、物品使用等功能。

```typescript
// 添加物品
inventory.addItem('weapon_rare_heatkatana');

// 装备武器
inventory.equipWeapon(slotIndex);

// 使用消耗品
inventory.useConsumable(slotIndex);
```

### 技能系统

技能系统 (`SkillSystem.ts`) 管理技能释放、冷却时间、技能升级等功能。

```typescript
// 使用技能
const skill = skillSystem.useSkill(slotIndex, currentTime);

// 检查技能冷却
const cooldown = skillSystem.getSkillCooldown(slotIndex, currentTime);
```

### 合成系统

合成系统 (`CraftingSystem.ts`) 管理物品合成、配方解锁、材料检查等功能。

```typescript
// 检查是否可以合成
const canCraft = craftingSystem.canCraft(recipe);

// 执行合成
const success = craftingSystem.craft(recipeId);
```

## 数值平衡

### 伤害计算公式

```
基础伤害 = 攻击力 - 防御力 * 0.5
最小伤害 = max(基础伤害, 10)
最终伤害 = 最小伤害 * 暴击倍率（如果暴击）
```

### 技能冷却

- 横扫斩：5秒
- 旋风斩：10秒
- 闪现突袭：3秒

### 关卡时间

- 单局时间：10分钟（600秒）
- 时间耗尽：游戏结束

## 已知问题

1. 资源图片使用占位图，需要替换为实际素材
2. 背包UI暂未实现完整
3. 商人交互功能较为简单
4. 缺少音效和背景音乐
5. 地图生成较为简单，缺少复杂地形

## 后续计划

### 短期（1-2周）
- [ ] 完善背包UI系统
- [ ] 实现存档/读档功能
- [ ] 添加音效和背景音乐
- [ ] 优化地图生成算法

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

## 联系方式

如有问题或建议，欢迎通过以下方式联系：
- 提交 Issue
- 发送邮件

## 致谢

感谢以下开源项目：
- [Phaser 3](https://phaser.io/) - 强大的2D游戏引擎
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集

---

**祝游戏愉快！🎮**
