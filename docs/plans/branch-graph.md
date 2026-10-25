# 计划：彩色提交图与分支操作

状态：**提案，待确认** · 日期：2026-10-25 · 目标版本：0.3.0

## 目标

把现在的一条线性「轨道」升级成 **多 lane 的彩色提交图**：

- 每条分支有自己的颜色和轨道；
- 分叉（branch）、合并（merge）、当前 HEAD、分支/远程/tag 引用都能从图上直接看出；
- 合并显示方向：哪个分支**迁入**目标、从哪个分支**迁出**；
- 颜色、节点形状、线型三者配合，不只靠颜色区分；
- 仍然只读、无新依赖、不增加网络请求。

## 先确认「迁入迁出」的含义

Git 的 commit 历史**不记录** checkout / switch / pull / push。它能证明的只有：

| 想展示的 | 数据来源 | 能否进历史图 |
|---|---|---|
| 分叉 / 分支创建 | 提交的父子关系 + 分支 ref | ✅ |
| 合并（merge） | 提交有 2 个以上 parent | ✅ |
| 合并方向（迁入 / 迁出） | parent 顺序：第一 parent = 目标，其余 = 来源 | ✅（需推断分支名） |
| checkout / switch | `git reflog`（仅本地） | ⚠️ 只能做「本地操作」层 |
| pull / push / fetch | reflog / 网络日志（仅本地） | ⚠️ 同上 |
| rebase / cherry-pick | reflog 或提交特征 | ⚠️ 不可靠 |

**建议**：v1 的「迁入迁出」按**合并方向**实现——合并节点画两条彩色边，第一 parent 是「迁入目标」，第二 parent 是「迁出源」。如果用户要的是 checkout/pull/push 这种**操作时间线**，单独做一个基于 reflog 的「本地操作」视图，明确标注「只在本机、不随仓库分发」，不混进历史图。

## 建议决策

| 问题 | 建议 | 理由 |
|---|---|---|
| 颜色代表什么 | **分支身份**（每条 lane 一个颜色） | 标准 git graph 做法；合并边继承来源分支色，方向自然可读 |
| 操作类型怎么表示 | 节点形状 + 线型 + 徽标 + tooltip | 颜色已被分支占用；避免「红色=错误」之类的语义冲突 |
| 合并方向 | 第一 parent = 迁入（实线）；第二及以后 = 迁出（虚线 + 来源色） | parent 顺序是 git 的稳定语义 |
| 行高 | **固定 54px**，subject 单行省略，meta 单行省略 | SVG 轨道必须与行严格对齐；完整文本进 tooltip |
| 远程分支 | lane 用同色但**虚线/低饱和**，chip 标 `origin/` | 与本地分支区分，又不引入第二套颜色 |
| 图例 | 提交区顶部可折叠「颜色 = 分支」，只列可见分支 | 颜色不是唯一信息，但需要可查 |
| 依赖 | **纯函数布局，无第三方库** | 80 条提交、几条 lane，自己算足够 |
| 历史图 / 操作层 | v1 只做历史图；reflog 操作层放 0.4 可选 | 避免把「本机临时操作」伪装成仓库历史 |

## 视觉设计

```text
最近提交 · [所有分支 ▾]                         12
┌ 颜色 = 分支 ──────────────────────────────┐
│ ● develop   ● main   ● origin/feature     │
└───────────────────────────────────────────┘

◉─┬─●  feat: add scope selector            （merge 节点）
  │ ╲
  │  ○  feat: branch work
  ●  │  docs: update README
  │  │
  ●──┘  chore: merge feature into develop
```

- lane 间距 14px，线宽 2px；节点直径 9–11px。
- **普通提交**：实心小圆，lane 色。
- **合并提交**：双环节点；第一 parent 实线，第二 parent 虚线并向来源 lane 弯出。
- **分叉点**：一个小菱形/空心点，标记「branch point」。
- **HEAD / 当前分支 tip**：外圈光晕 + 分支 chip。
- **tag**：小旗标 chip，颜色中性，不占 lane。
- **悬停**：显示提交标题、完整 SHA、parents、操作说明（如 `merge: main ← feature`）。
- **分页截断**：第 80 条之后仍有 parent 时，底部画「继续」开口，不假装历史结束。

### 颜色

- 8 色分类色板，按分支名稳定哈希分配；同一分支在不同会话/刷新后颜色一致。
- 色板需要同时通过暗色 `#151517` 和亮色 `#f9fafb` 的对比度检查；不直接用状态色（红/绿/黄）以免和错误/成功混淆。
- 这是对「只用 `--dsw-alias-*`」的一处**有意识例外**：DSH 没有分类色板，而图需要 8 个可区分色。色板放在插件自己的 CSS 变量 `--gr-lane-1..8` 中，其余 UI 仍只用主题令牌。
- 颜色不是唯一编码：lane 位置、节点形状、线型、chip 文本、tooltip 都要能独立说明含义；至少做一次灰度/色盲检查。

## 布局算法（纯函数）

```text
layoutGraph(commits, branches, options) -> {
  lanes: [{ index, colorIndex, label }],
  nodes: [{ sha, row, lane, kind, refs }],
  edges: [{ from:{row,lane}, to:{row,lane}, kind, colorIndex }],
  height, width
}
```

输入按 `--topo-order` 的新到旧顺序（Host 已这样返回）。

1. 建立 `activeLanes[]`：每个 lane 记录「下一个期待的 sha」。
2. 逐条提交：
   - 如果 sha 已在某个 lane，使用该 lane；否则新建/复用最左空闲 lane（分支 tip）。
   - 节点 lane 记录颜色：优先该提交上的分支 ref；否则继承 lane 颜色。
   - 第一 parent：继续当前 lane；若 parent 已在别的 lane，走已存在的 lane。
   - 其余 parent：若已在 active lane，接到该 lane；否则分配新 lane，并标记为 merge 来源。
   - 没有 parent 的提交：关闭 lane。
3. 每个相邻行生成边：
   - 同 lane：竖线。
   - 换 lane：三次贝塞尔曲线，控制点在行间中点。
   - 合并来源：虚线，颜色取来源 lane。
4. 被 80 条截断的 parent：生成 `kind: 'dangling'` 的开口边，不创建不存在的节点。
5. 颜色分配：`hash(branchName) % 8`；同一提交有多个分支时优先当前 scope 的分支，其次本地分支，最后远程分支。

### 需要覆盖的测试

- 线性 3 提交。
- 两分支分叉（A-B-C，B-D）。
- 一次 merge（M parents A、B）。
- octopus merge（3 parents）。
- 两个 root / 多 root。
- lane 复用：分支结束后空出的 lane 被新分支使用。
- 80 条截断：dangling edge。
- 同一提交多个 ref（HEAD + develop + origin/develop）。
- 颜色稳定性：同一分支名多次布局结果相同。
- 空仓库 / 单提交。

## 操作语义与标签

| 图形 | 判定 | 文本 |
|---|---|---|
| 合并节点 | `parents.length > 1` | `合并：main ← feature`（能从 lane/ref 推断时），否则 `合并（N 个父提交）` |
| 迁入边 | 第一 parent | 实线，目标 lane 色 |
| 迁出边 | 第二及以后 parent | 虚线，来源 lane 色 |
| 分叉点 | 一个提交在可见范围内有多个 child，或新 lane 从某提交开始 | `从 <branch> 分出` |
| 分支 tip | ref 指向该提交 | 分支 chip，lane 色 |
| HEAD | refs 含 `HEAD ->` | 外圈光晕 |
| tag | refs 含 `tag:` | 中性 chip，不改变 lane |

合并方向的分支名推断顺序：

1. parent 是该分支 tip → 直接用分支名；
2. parent 所在 lane 有 label → 用 lane label；
3. 都没有 → 只显示「合并」，不猜名字。

**不做**：把 commit subject 里的 "Merge branch 'x' into 'y'" 当作结构化数据来解析（只能作为 fallback 文本）。

## 数据与 Host

当前 Host 已经返回足够的数据，**v1 不需要新端点**：

- `commits[].parents`：完整 parent SHA 列表；
- `commits[].refs`：分支 / tag / HEAD 装饰；
- `branches.locals/remotes[].refname`、`name`、`sha`：建立 tip → 分支名/颜色映射。

需要补的只有客户端的纯函数和渲染。以下情况才考虑 Host 变更：

- 如果要在截断处精确判断「是否还有更多历史」，可增加 `hasMore`；
- 如果要做 reflog 操作层，新增 `GET /dsh-plugin-gitrail/operations?session=`，只读 `git reflog`，明确标注本地性。

## 渲染

- 一个绝对定位的 `<svg>` 覆盖提交列表左侧，宽度 = `lanes * 14 + 8`，高度 = `rows * 54`；列表行同步 `padding-left`。
- SVG 只画线和节点；文本、chips、按钮仍是 DOM，保持可选中/可聚焦。
- 行高固定 54px，subject 与 meta 单行省略；完整内容进 `title`/tooltip。
- `prefers-reduced-motion` 下不做路径动画。
- 80 行 × 几 lane 的 SVG 很小；不引入 canvas，不做虚拟化（先测 200 行）。

## 无障碍

- 每个提交行有可读的 `aria-label`：`<short> <subject>，合并自 <source>`。
- 图例是真实 DOM 列表，不是纯视觉。
- 颜色不是唯一编码；灰度模式下仍能靠 lane 位置、节点形状、虚线、chip 文本区分。
- 合并/分叉徽标有文本 tooltip。

## 文件改动

| 文件 | 改动 |
|---|---|
| `client.js` | 新增 `layoutGraph`、SVG 渲染、图例、行高/省略、颜色变量 |
| `lib/git.js` | v1 不改；后续可选 `hasMore` / reflog |
| `index.js` | v1 不改 |
| `test/graph.test.mjs` | 纯函数布局测试（新增） |
| `docs/architecture.md` | 图布局、颜色例外、行高约束 |
| `docs/roadmap.md` | M1 拆成范围（已完成）+ 彩色图 |
| `docs/plans/branch-graph.md` | 本文件 |
| `README.md` | 新截图与图例说明 |
| `CHANGELOG.md` | 0.3.0 |

## 实施顺序

1. **纯函数**：`layoutGraph` + 9 组单测（先不接 UI）。
2. **静态 SVG**：固定行高，渲染 linear / fork / merge 三种 fixture。
3. **接真实数据**：颜色、refs、tip chips、dangling。
4. **操作语义**：合并/分叉徽标、方向 tooltip、图例。
5. **窄栏与主题**：暗/亮对比、54px 行高、长 refs 截断。
6. **文档与截图**：0.3.0，更新 README。

## 验收

- 两条分支 + 一次 merge 的仓库：lane 不错位，合并边从来源 lane 正确弯入。
- 所有分支 / 单分支切换后图仍正确；单分支时只有一条 lane。
- 颜色稳定；灰度下仍能区分合并/分叉/tip。
- 80 条截断有开口提示，不出现悬空节点。
- 暗色 / 亮色、宽栏 / 窄栏都不裁切。
- 现有 21 项测试 + 新增图形测试全绿；无新依赖。

## 待确认

1. **「迁入迁出」**是指合并方向（推荐按 parent 顺序实现），还是 checkout / pull / push 这类本地操作？后者需要 reflog，且只在本机成立。
2. 颜色按**分支**（推荐）还是按**操作类型**（分叉/合并/迁入/迁出各一色）？
3. 固定 54px 行高、subject 单行省略是否可以接受？如果不能，需要允许两行但 lane 对齐会更复杂。
4. 远程分支是否进入图（推荐：进入，但虚线/低饱和），还是只在 chip 里显示？
