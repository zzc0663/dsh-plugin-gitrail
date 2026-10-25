# 计划：分支色圈、加粗标题与提交详情

状态：**已实现（0.5.0，D1+D2 合并；0.6.0 补双筛选；0.7.0 补分支 rail）** · 日期：2026-10-25 · 目标版本：0.7.0

## 0.7.0 补充：分支斜向 rail

- 当一个选中 tip 是另一个选中 tip 的祖先（本仓库 `main` 落后于 `develop`）时，给较新的分支分配独立 lane。
- 从旧 tip 到新分支第一个 commit 画一条斜线，表达「分支从这里创建」，而不是一条直线。
- 仅处理单子、无 merge 的线性链；真实 fork/merge 仍由原 lane 分配器处理。

## 0.6.0 补充：本地 / 远程双筛选

- 远程分支列表默认展开。
- `最近提交` 旁拆成两个多选下拉：**本地** 与 **远程**；各自可全选/部分/清空，两组取并集。
- 分支行点击切换本组选中态；空选择显示「未选择任何分支」。
- Host `scope=refs` + 重复 `local=` / `remote=`，逐组白名单校验；空 refs 返回空列表。
- 右侧组菜单右对齐，键盘滚动只滚菜单，不滚动整页。

## 目标

这一轮只做三个体验点，和参考图的「图谱 + 提交信息」形态对齐：

1. **分支列表直接用 lane 色**：`develop` / `main` / `origin/*` 每一行的圆点变成该分支在图谱里的颜色，颜色圈直接出现在现有「分支」框里。
2. **提交描述加粗**：提交行标题使用 semibold；SHA、作者、时间、refs 保持次要字重。
3. **点提交看详情**：
   - 右侧栏点击提交行 → 打开全宽 Gitrail 图谱并选中该提交；
   - 全宽页点击行 → 右侧「提交信息」显示完整详情；
   - 详情第一版包含完整 message、作者/提交者、时间、parents、refs、**文件变更统计**；diff 作为下一阶段。

## 当前差距

| 点 | 现状 |
|---|---|
| 分支圆点 | 当前分支用 `--dsw-alias-brand-primary`，其它分支用 label-secondary；颜色和图谱 lane 不一致 |
| 提交标题 | `.gr-subject` 是 normal 字重 |
| 点提交 | 右侧栏行不可点；全宽页行可点，但右侧只有 metadata，没有 message body / 文件统计 |
| 分支列表入口 | 分支列表只在右侧栏；全宽页只有范围下拉 |

## 决策

| 问题 | 建议 |
|---|---|
| 色圈来源 | 复用 `laneColor()`；本地/远程同名分支共享颜色（`origin/develop` 与 `develop` 同色） |
| 色圈样式 | 8px 空心圆 + 2px 分支色；当前分支中心填色；远程分支用虚线环/低透明度；选中范围仍用 `✓` 与行底色 |
| 分支列表容器 | 保留现有边框；在列表顶部加一行「颜色 = 分支」提示，不新开图例 |
| 标题字重 | `.gr-subject` 600；两行 clamp 不变；详情页标题 600/15px |
| 点右侧栏提交 | 打开 `main` 面板（`layout.selectPanel('gitrail-graph')`）并选中 SHA；不在一行里塞展开区 |
| 点全宽页提交 | 保持当前选中 → 右侧详情；键盘 Enter/Space 同样 |
| 详情第一版 | 完整 message + 文件 `--numstat`（路径、+/-、binary、rename），不做 patch |
| diff | 单独 D2：限制 patch 大小、文件行点击复用 `dsh-resource://file/...` |

## 1. 分支色圈

### 纯函数

从 `client.js` 抽出：

```js
branchColor(name, remote) -> 0..7
```

- 本地：`laneColor(name)`；
- 远程：`laneColor(remoteColorKey(name))`，与同名本地色一致；
- 与 `layoutGraph` 使用同一个函数，禁止两套映射。

### 结构 / 样式

```text
┌ 分支 ───────────────────────────── 2 ┐
│ ● develop  origin/develop      b645920 │  ← 实心 = 当前分支
│ ○ main     origin/main         b645920 │  ← 空心 = 普通分支
│ ─ 远程分支 ─────────────────────── 2 ─ │
│ ◌ origin/develop                       │  ← 虚线环
└────────────────────────────────────────┘
```

- `.gr-branch-dot`：`width/height 8px`，`border: 2px solid laneStroke(color)`，`background: transparent`。
- 当前分支：`background: laneStroke(color)`。
- 远程：`border-style: dashed`，`opacity: .65`。
- 选中范围：行右侧 `✓` + 行底色；不要用色圈代替选中态。
- 色圈加 `title`/`aria-label`，例如 `develop，颜色 #2aa7b8` 不暴露原始 hex，只写「分支颜色」。

### 测试

- 本地 `develop` 与远程 `origin/develop` 得到同一个 colorIndex。
- 不同分支名稳定映射。
- `layoutGraph` 与分支列表使用同一个函数（单元测试直接调用导出函数）。

## 2. 提交描述加粗

- `.gr-subject`：`font-weight: 600`；行高、两行 clamp 不变。
- `.gr-detail-subject`：`font-weight: 600`。
- `.gr-meta` / `.gr-sha` / `.gr-time`：保持 400，避免整行都在抢注意力。
- 选中行可加 `font-weight: 650`（如果字体支持）或保持 600 + 行底色。
- 视觉验证：暗/亮主题、两行长标题、窄栏。

## 3. 点提交看详情

### 3.1 共享选中状态

右侧栏与全宽页是两棵不同的 slot 树，不能直接共享 React state。新增一个插件级小 store：

```js
createCommitSelectionStore() -> {
  getSnapshot(): { sessionId, sha } | null,
  subscribe(listener),
  select(sessionId, sha),
  clear()
}
```

- 在 `apply()` 里创建一次，通过 slot `inject` 同时传给 `GitrailBody` 和 `GitrailPage`。
- 全宽页 `useSyncExternalStore` 读取；sidebar 点击时 `select(sessionId, sha)`，再 `ctx.layout.selectPanel(PANEL_ID)`。
- 页面打开时如果 store 的 sessionId 与当前 Session 一致，就选中该 SHA；否则选第一条提交。
- 切换 Session / 范围时清除或校正；避免把 A 会话的提交选到 B 会话。

### 3.2 右侧栏行为

- 提交行变为可点（`role="button"`、Tab/Enter/Space），hover 显示可点态。
- 点击：
  1. `selection.select(sessionId, sha)`；
  2. `layout.selectPanel(PANEL_ID)`（`layout` 不可用时只记录选中，不导航）。
- 不新增行内展开，避免在窄侧栏里挤压图谱。

### 3.3 Host：提交详情接口

```text
GET /dsh-plugin-gitrail/commit?session=<id>&sha=<sha>
```

校验：

- `sha` 匹配 `^[0-9a-f]{7,40}$`；
- `git cat-file -e <sha>^{commit}` 确认是提交；
- 仍只读、loopback、session → cwd → repo root。

命令（一次或两次）：

```text
git show -s --format=%H%x00%an%x00%ae%x00%aI%x00%cn%x00%ce%x00%cI%x00%s%x00%b <sha>
git show --numstat --format= --find-renames <sha>
```

响应：

```json
{
  "ok": true,
  "commit": {
    "sha": "…",
    "subject": "…",
    "body": "…",
    "author": { "name": "…", "email": "…", "date": "…" },
    "committer": { "name": "…", "email": "…", "date": "…" },
    "parents": ["…"],
    "refs": ["…"]
  },
  "files": [
    { "path": "src/a.ts", "oldPath": null, "additions": 12, "deletions": 3, "binary": false }
  ],
  "truncated": false
}
```

边界：

- body 最多 16 KiB；文件最多 200 个；超过则 `truncated: true`。
- binary 文件 `additions/deletions` 为 0，`binary: true`。
- rename 记录 `oldPath`。
- 错误码：`request/bad-sha` 400、`git/commit-not-found` 404、其余沿用现有映射。

### 3.4 全宽页详情 UI

```text
提交信息
feat: label merge and fork commits            ← 600/15px
合并: develop ← demo-feature                  ← 操作徽标
提交    a4fcd14…                              ← 完整 SHA
作者    zzc <…>
时间    2026-10-25 16:57
父提交  9f7d127
引用    HEAD, origin/develop

改动文件  3 个  +42 −7
┌ src/client.js                    +35 −5 ┐
│ docs/…                            +7 −2  │
└ lib/…                             +0 −0  ┘

[查看 diff（M2/D2）]
```

- 完整 message body 渲染为段落/`white-space: pre-wrap`；长 body 折叠。
- 文件列表最多 200 行，显示 `+/-`；点击文件在 D2 打开 diff。
- 加载中保留旧详情；切换提交显示 skeleton。
- 错误/截断有明确提示。

## 4. 分阶段

| 阶段 | 内容 | 版本 |
|---|---|---|
| **D1** | 分支色圈、标题加粗、共享选中、Host `/commit`、message + 文件统计 | 0.5.0 |
| **D2** | 文件 diff 预览、限制 512 KiB、文件行打开 `dsh-resource://file/...` | 0.6.0 |
| **D3**（可选） | 提交详情独立 tab / 分屏，支持并排比较 | 后续 |

## 5. 文件改动

| 文件 | 改动 |
|---|---|
| `client.js` | `branchColor`/色圈、bold、selection store、sidebar 点击导航、详情 body/files |
| `lib/git.js` | `readCommitDetail(cwd, sha)`、numstat 解析、上限 |
| `index.js` | `GET /commit`、sha 校验、错误映射 |
| `test/git.test.mjs` | numstat/merge/rename/binary 解析 |
| `test/host.test.mjs` | `/commit` 成功/非法 sha/不存在 |
| `test/graph.test.mjs` | branch color 一致性 |
| `docs/architecture.md` | `/commit` 契约、selection store |
| `docs/roadmap.md` | M1 补色圈/加粗；M2 更新为 D1/D2 |
| `README.md` | 新截图、操作说明 |
| `CHANGELOG.md` | 0.5.0 |

## 6. 验收

- 分支列表的圆点颜色与图谱 lane 一一对应；`origin/develop` 与 `develop` 同色，远程环为虚线。
- 提交标题为 600 字重，两行不溢出，meta 仍为次要字重。
- 右侧栏点击提交 → 全宽页打开并选中该提交；错误/无 layout 时不崩。
- 全宽页点击提交 → 右侧显示完整 message、作者/提交者、时间、parents、refs、文件统计。
- 非法/不存在的 SHA 被拒绝；大 body/大量文件有上限与 `truncated`。
- 暗/亮主题、窄栏、merge/rename/binary 都有呈现。
- `npm run check` + 全部测试通过；无新依赖。

## 7. 待确认

1. 「详细信息」这一版是否接受 **message + 文件统计**，diff 放到 D2？还是这次就要 diff？
2. 右侧栏点提交：**打开全宽页并选中**（建议），还是右侧栏内展开详情？
3. 分支色圈：远程分支用**虚线环**（建议）还是实线环？
4. 是否需要在全宽页也放一个**分支列表**（目前只有范围下拉），还是保持参考图的「全部分支」下拉即可？
