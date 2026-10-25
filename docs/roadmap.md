# 路线图

## M0 — 仓库与第一条纵向切片（已完成）

- [x] 单包 bundle 骨架：`package.json`、`cordis.patch.yml`、locale、icon、LICENSE
- [x] Host：`/dsh-plugin-gitrail/repo`，Session → cwd → 仓库根
- [x] 只读 git 适配器：分支、当前分支、dirty、ahead/behind、最近 80 条提交
- [x] Client：`gitrail` tab type + guide entry + `sidebar.right.pane.tab` body
- [x] 错误态、空仓库、detached HEAD、刷新
- [x] `npm run check`、53 项 `npm test`

**已完成**：desktop profile 本机 preview 安装与暗色视觉验证；亮色主题、窄栏待检查。

---

## M1 — 提交范围、彩色图与导航手感

**目标**：先让提交列表能按分支聚焦，再把「rail」做成可读、有操作语义的彩色多 lane 图。

- [x] **提交范围选择**：当前分支 / 所有分支 / 单个本地或远程分支；Host 增加 `scope` + `ref` 白名单校验。详见 [plans/branch-scope.md](plans/branch-scope.md)。
- [x] 分支行点击 → 切换范围；提交区标题显示当前范围。
- [x] **彩色提交图**：纯函数 lane 布局、分支色、分叉/合并/HEAD 节点；无第三方依赖 + 单测。详见 [plans/branch-graph.md](plans/branch-graph.md)。
- [x] **合并方向**：第一 parent 实线（迁入），第二及以后 parent 虚线（迁出）；能从 lane/ref 推断时显示 `main ← feature`。
- [x] 图例、颜色稳定性和灰度可读；轨道使用插件自有分类色板（亮/暗都校验），其余 UI 仍用 `--dsw-alias-*`。
- [x] **全宽 Gitrail Graph 主面板**：`sidebar.panellist` 入口 + root `main` 页面，左侧图谱、右侧提交信息；分支 tip 交接颜色/标签，行底色按 lane 色。
- [x] 分支列表色圈与 lane 色一致（本地/远程同名同色，远程虚线环）；提交标题 600 字重。详见 [plans/branch-colors-and-commit-details.md](plans/branch-colors-and-commit-details.md)。
- [x] 右侧栏点击提交 → 打开全宽页并选中；全宽页点击提交 → 右侧详情。
- [x] **本地 / 远程双多选筛选**：两个下拉独立组合，远程分支默认展开，分支行点选同步；Host 支持 `scope=refs` + 重复 ref 参数。
- [x] **分支斜向 rail**：选中分支 tip 是另一分支祖先时，新分支单独 lane，斜线从旧 tip 向上接入（本仓库 `main`/`develop`）。
- [x] **提交搜索与加载更多**：message/author/SHA/refs 搜索，窗口 500；limit 80→500 分页；固定行高 + `content-visibility`。
- [x] **筛选同步与记忆**：插件级 view store，按 session 持久化本地/远程筛选；分支菜单支持搜索。
- [x] **自动刷新**：窗口 focus / tab visible 时 800ms 防抖刷新。
- [x] **按文件 diff 与复制 SHA**：patch 按 `diff --git` 分节，文件行选中只看该文件；SHA 复制按钮。
- [x] **分支对比**：base/head 选择、ahead/behind、numstat 文件与 bounded patch。
- [x] **tag 作为图 tip**：轻量/annotated tag peel 到 commit，图上行内 tag pill。
- [x] **多落后分支 rail**：遍历所有落后 tip，非重叠线性链各自分配 lane。
- [ ] refs 装饰（分支 / tag / remote）与 lane 对齐，过长截断；固定行高保证 SVG 对齐。
- [ ] 窗口重新聚焦 / tab 重新可见时静默刷新；保留手动刷新。
- [ ] 长列表：虚拟化或分段加载（先测 500 条提交的渲染成本）。

**验收**：在含至少两条分支、一次 merge 的仓库里，范围切换与 lane 都正确；合并边从来源 lane 弯入；灰度下仍能区分合并/分叉/tip；亮/暗主题下可辨；提交 500 条时滚动不卡。

---

## M2 — 提交详情与 diff 预览

**目标**：让全宽页右侧从「只有 metadata」变成可读的提交详情；diff 分两步。

- [x] 方案：**全宽页右侧「提交信息」**（不新增 tab，不挤压图谱列表）。
- [x] **D1**：Host `GET /commit?session=&sha=` 返回完整 message、作者/提交者、时间、parents、refs、`--numstat` 文件列表；SHA 校验与上限。
- [x] **D1**：右侧详情渲染 message、作者、时间、文件 `+/-`、binary/rename；加载/空态/截断。
- [x] **D2**：文件 diff 预览，限制 512 KiB；文件行在可用时打开 `dsh-resource://file/...` 预览。
- [x] 右侧栏点提交：打开全宽页并选中。

**验收**：merge、rename、二进制文件都有明确呈现；大 patch 不会卡死面板；非法/不存在的 SHA 被拒绝。

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
