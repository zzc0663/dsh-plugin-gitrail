# 路线图

## M0 — 仓库与第一条纵向切片（已完成）

- [x] 单包 bundle 骨架：`package.json`、`cordis.patch.yml`、locale、icon、LICENSE
- [x] Host：`/dsh-plugin-gitrail/repo`，Session → cwd → 仓库根
- [x] 只读 git 适配器：分支、当前分支、dirty、ahead/behind、最近 80 条提交
- [x] Client：`gitrail` tab type + guide entry + `sidebar.right.pane.tab` body
- [x] 错误态、空仓库、detached HEAD、刷新
- [x] `npm run check`、17 项 `npm test`

**未完成**：安装到运行中的 DSH 并做视觉验证。

---

## M1 — 提交图与导航手感

**目标**：让「rail」真正成为一条可读的分支轨道，而不只是线性列表。

- [ ] 根据 `commits[].parents` 计算 lane（无第三方依赖，纯函数 + 单测）。
- [ ] 在提交行左侧画多列轨道：分叉、合并、当前 HEAD 节点；颜色只用主题令牌。
- [ ] refs 装饰（分支 / tag / remote）与 lane 对齐，过长截断。
- [ ] 分支行点击 → 只读地聚焦该分支历史；Host 增加可选的 `ref` 参数（仍只读，校验 ref 名）。
- [ ] 窗口重新聚焦 / tab 重新可见时静默刷新；保留手动刷新。
- [ ] 长列表：虚拟化或分段加载（先测 500 条提交的渲染成本）。

**验收**：在含至少两条分支、一次 merge 的仓库里，lane 不交叉错位；亮/暗主题下轨道可辨；提交 500 条时滚动不卡。

---

## M2 — 提交详情与 diff 预览

**目标**：从「看见提交」到「看见改动」，但不做完整编辑器。

- 方案 A：Gitrail 内部展开选中提交，Host 返回 `git show --stat` 与 patch 摘要。
- 方案 B：新增 `gitrail-commit` tab type，通过 `ctx.sidebarRight.openTab(kind, { params })` 打开详情页。
- [ ] 决定方案（倾向 B：可利用右侧栏分屏，且不挤压列表）。
- [ ] Host：`GET /dsh-plugin-gitrail/commit?session=&sha=`，sha 必须匹配 `^[0-9a-f]{7,40}$`。
- [ ] 限制 patch 大小（例如 512 KiB）并给出截断提示；二进制文件只显示 stat。
- [ ] 文件行点击 → 复用 `dsh-resource://file/...` 打开现有文件预览，而不是自己渲染源码。

**验收**：merge commit、重命名、二进制文件都有明确呈现；大 patch 不会卡死面板。

---

## M3 — 显式写操作（保持克制）

**目标**：只做用户明确要求、且可回显失败的轻量操作。

- [ ] checkout 本地分支、fetch 当前 remote。
- [ ] 操作前确认（尤其 dirty 工作区）；操作后刷新状态。
- [ ] 失败保留 stderr 摘要，不吞错。
- [ ] 是否暴露为 agent 工具：默认**不**；若暴露，必须与 UI 共用同一个 Host 方法，并遵守 `user-actions` 约定。
- [ ] 不在本期做：commit、push、rebase、reset、stash 管理。

**验收**：dirty 工作区 checkout 会被阻止并说明原因；fetch 失败可见；没有静默写操作。

---

## M4 — 发布与可维护性

- [ ] 移除 `private: true`，补 `repository` / `homepage` / `author`。
- [ ] `npm pack --dry-run` 核对包内容；确认 `files` 覆盖所有运行时文件。
- [ ] `README.en.md`；截图（安装后真机）。
- [ ] CI：`npm run check && npm test`（Windows + Linux）。
- [ ] 版本策略：0.x 期间 breaking change 升 minor；DSH API 变更在 CHANGELOG 标注。
- [ ] 在 npm 再次确认包名并发布 0.1.x。

---

## 非目标

- 完整 git 客户端（rebase 交互、冲突解决、submodule 管理）。
- 托管平台集成（PR / issue / CI 状态）。
- 凭据管理、后台网络同步、遥测。
- 在浏览器里直接读文件系统或执行命令。

## 开放问题

1. **自动刷新**：聚焦刷新足够，还是需要在 `git` 目录变化时 watch？后者跨平台成本高，暂缓。
2. **多仓库 / 子模块**：一个 Session 目前只对应一个仓库根；是否需要在 guide 里列出多个仓库？
3. **超宽仓库**：分支数千时，列表上限 200 是否够用？是否需要搜索？
4. **提交详情承载方式**：M2 的方案 A/B 需要先用真实右侧栏宽度评估。
