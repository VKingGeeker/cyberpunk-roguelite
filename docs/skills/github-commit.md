# GitHub 提交技能

## 技能描述
每次代码更新后，自动提交并推送到 GitHub 仓库。

## 仓库信息
- **仓库地址**: https://github.com/VKingGeeker/cyberpunk-roguelite

## 使用方式

### 1. 配置远程仓库（带 token）
```bash
# Token 存储在本地文件中，请查看 docs/.credentials.local
git remote set-url origin https://<TOKEN>@github.com/VKingGeeker/cyberpunk-roguelite.git
```

### 2. 提交代码
```bash
# 查看变更
git status

# 添加所有变更
git add -A

# 提交（使用语义化提交信息）
git commit -m "type: 简短描述"

# 推送到 GitHub
git push origin main
```

### 3. 强制推送（如需重写历史）
```bash
git push origin main --force
```

## 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加教程系统` |
| `fix` | Bug 修复 | `fix: 修复敌人AI卡住问题` |
| `docs` | 文档更新 | `docs: 更新 README` |
| `style` | 代码格式（不影响功能） | `style: 格式化代码` |
| `refactor` | 重构 | `refactor: 重构技能系统` |
| `perf` | 性能优化 | `perf: 优化敌人生成逻辑` |
| `test` | 测试相关 | `test: 添加单元测试` |
| `chore` | 构建/工具相关 | `chore: 更新依赖版本` |

## 完整工作流

```bash
# 1. 查看当前状态
git status

# 2. 查看变更内容
git diff

# 3. 添加变更
git add -A

# 4. 提交变更
git commit -m "feat: 新功能描述"

# 5. 推送到 GitHub
git push origin main

# 6. 验证推送成功
git log --oneline -3
```

## 注意事项

1. **敏感信息**：Token 存储在 `docs/.credentials.local`，已加入 `.gitignore`
2. **推送保护**：GitHub 会检测 Token，不要将 Token 提交到仓库
3. **Token 有效期**：定期检查 Token 是否过期
4. **冲突处理**：推送前先 `git pull origin main` 解决冲突

## 快捷命令

```bash
# 一键提交推送
git add -A && git commit -m "update: 代码更新" && git push origin main

# 查看最近提交
git log --oneline -5

# 查看远程仓库状态
git remote -v
```
