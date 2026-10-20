# 命名决策：Gitrail

记录 2026-10-21 的取名过程，避免以后反复讨论。

## 约束

1. **npm 包名可用**：发布前应能 404 查到或由作者占用。
2. **DSH 插件惯例**：第三方插件优先 `dsh-plugin-*` 前缀；现存 `dsh-plugin-git` 可作参照。
3. **与相邻产品拉开距离**：不能让人误以为是通用 git 集成、review 或 push 面板。
4. **不得与知名商标冲突**：特别是 VS Code 的 GitLens。
5. **可念、可记、logo 好做**：中文也要顺口。

## 候选

| 候选 | 评价 |
|---|---|
| **`dsh-plugin-gitrail` / Gitrail** | ✅ 选中。`rail` = 铁轨（分支轨道、提交图）+ 侧边栏；短、可念；logo 是一条分叉轨道 |
| `dsh-plugin-git-graph` | 最直白、SEO 友好，但平庸，且把功能锁死在 graph 上 |
| `dsh-plugin-sidegit` | 强调侧栏，但读起来像 side-git（半拉子 git） |
| `GitSight` / `dsh-plugin-gitsight` | 「看见 git」，名字空着，但气质偏产品名而非工程名 |
| `dsh-plugin-gitlens` | ❌ 与 VS Code GitLens 商标冲突 |
| `dsh-plugin-git` | ❌ npm 已被 `dsh-plugin-git@0.1.1`（waw1w1）占用，且功能相邻（workspace / review / commit / push） |

## 决定

- **包名**：`dsh-plugin-gitrail`
- **仓库名**：`gitrail`
- **中文名**：Gitrail 侧栏 / 「轨」
- **一句话**：Rail for your repo — git 分支与提交的侧栏视图

与 `dsh-plugin-git@0.1.1` 的差异要主动说清楚：Gitrail 是**可视化的侧栏视图**，不是通用 git 集成；v0.1 只读，不做 review / commit / push。

## 品牌元素

- 图标：圆角方形底 + 白色分叉轨道与三个节点（[icon.svg](../icon.svg)）。
- 主色：沿用宿主 `--dsw-alias-brand-primary`，图标固定蓝底以保证在任意主题下可辨认。
- 语气：短句、工程化，不用「魔法」「一键」这类营销词。

## 发布前检查

- [ ] 在 npm 再次确认 `dsh-plugin-gitrail` 可用。
- [ ] 移除 `package.json` 的 `private: true`，补 `repository` / `homepage` / `author`。
- [ ] `npm pack --dry-run` 核对文件列表（`files` 不会过滤本地目录安装，但会过滤发布包）。
- [ ] 确认没有与 `dsh-plugin-git` 混淆的描述或关键词堆砌。
