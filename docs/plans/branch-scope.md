# 计划：提交范围选择（所有分支 / 单个分支）

状态：**提案，待确认** · 日期：2026-10-25 · 目标版本：0.2.0

## 目标

让「最近提交」不再固定跟随 `HEAD`，而是可以查看：

- **所有分支**：本地分支 + 远程跟踪分支的合并历史；
- **单个分支**：任意本地分支，或任意远程跟踪分支（如 `origin/develop`）；
- **当前分支**：保持现有行为，作为默认值。

分支列表、dirty / ahead / behind 仍然显示整个仓库的状态，不受范围选择影响。

## 非目标

- 不做 tag / stash / reflog 的独立范围（v1 的「所有分支」不含它们）。
- 不做分支搜索、排序偏好、多选。
- 不在这一版做写操作（checkout / fetch）。
- 不把刷新变成轮询。

## 建议决策

| 问题 | 建议 | 理由 |
|---|---|---|
| 默认范围 | **当前分支**（`HEAD`） | 不改变现有行为；用户明确选择后才看全量 |
| 「所有分支」包含 | 本地 + 远程跟踪分支，**不含 tag/stash** | 与侧栏「分支」列表口径一致 |
| 单分支参数 | 只接受完整 refname（`refs/heads/…` / `refs/remotes/…`）或 `HEAD` | 白名单校验，杜绝把用户输入拼进 git 参数 |
| 控制方式 | 提交区标题右侧的紧凑下拉（自定义 listbox）+ 分支行可点选 | 与宿主暗色主题一致；窄栏可用；键盘可达 |
| 选中状态 | 组件内状态，不持久化（v1） | 实现小；如需要，后续存 per-session localStorage |
| 接口 | 仍用 `/repo`，增加 `scope` / `ref` 查询参数 | 一次返回分支、状态、commits，payload 很小；暂不拆 `/commits` |

## API 变更

### 请求

```text
GET /dsh-plugin-gitrail/repo?session=<id>                         # 默认：当前分支
GET /dsh-plugin-gitrail/repo?session=<id>&scope=all               # 所有分支
GET /dsh-plugin-gitrail/repo?session=<id>&scope=branch&ref=refs/heads/develop
GET /dsh-plugin-gitrail/repo?session=<id>&scope=branch&ref=refs/remotes/origin/main
GET /dsh-plugin-gitrail/repo?session=<id>&scope=branch&ref=HEAD
```

- `scope`：`all` 或 `branch`；缺省 `branch`。
- `ref`：仅 `scope=branch` 时使用；缺省 `HEAD`。
- `ref` 必须是本次仓库实际存在的 refname（或 `HEAD`），否则 400。
- `scope=all` 时忽略 `ref`。

### 响应新增

```json
{
  "ok": true,
  "repo": {
    "selection": {
      "scope": "branch",
      "ref": "refs/heads/develop",
      "detached": false
    },
    "branches": {
      "locals":  [{ "refname": "refs/heads/develop", "name": "develop", "…": "…" }],
      "remotes": [{ "refname": "refs/remotes/origin/main", "name": "origin/main", "…": "…" }]
    },
    "commits": ["…"]
  }
}
```

`selection.scope === "all"` 时不带 `ref`。`branches.*[].refname` 是新增字段，供选择器和 Host 白名单共用；旧客户端忽略它即可。

### 错误

| HTTP | code | 场景 |
|---|---|---|
| 400 | `request/bad-scope` | `scope` 不是 `all` / `branch` |
| 400 | `request/bad-ref` | ref 不在白名单、以 `-` 开头、含空白/控制字符，或格式非法 |
| 409 | `git/unknown-ref` | ref 格式合法但已不存在（分支被删/远程已 prune） |

客户端遇到 `git/unknown-ref` 时回退到 `HEAD`，提示「该分支已不存在」，并刷新分支列表。

## Host 设计（`lib/git.js` + `index.js`）

1. **`parseRefs` 增加 `refname`**
   - 本地：`refs/heads/<name>`；远程：`refs/remotes/<name>`。
   - 继续过滤符号引用 `refs/remotes/<remote>/HEAD`（`%(refname:short)` 会返回 `<remote>`，必须按 refname 判断）。

2. **`readRepoState(cwd, options)`**
   - 新增 `options.scope`（`all` | `branch`）与 `options.ref`（默认 `HEAD`）。
   - 先并行取 root / status / refs / head；再校验 ref；最后执行一次 log。
   - 白名单：
     ```text
     HEAD
     + 所有 refs/heads/*（来自 for-each-ref）
     + 所有 refs/remotes/* 且不以 /HEAD 结尾
     ```
   - log 参数：
     ```text
     branch: git log --max-count=80 --date=iso-strict --topo-order <ref> -- <format>
     all:    git log --max-count=80 --date=iso-strict --topo-order --branches --remotes <format>
     ```
     `--` 放在 ref 之后，避免 ref 被当成路径；`--topo-order` 让多分支顺序可读。
   - 返回 `selection`，并保持 `commits` 最多 80 条。
   - 空仓库：`commits = []`，`selection` 仍然返回；`HEAD` 合法。

3. **路由（`index.js`）**
   - 解析 `scope` / `ref`，拒绝未知 scope；ref 长度上限（如 300）与字符检查先做，再交给仓库白名单。
   - `GitError('request/bad-ref')` → 400；`git/unknown-ref` → 409；其余沿用现有映射。

4. **边界**
   - detached HEAD：默认 `HEAD` 正常；`selection.detached = true`。分支列表仍可用。
   - 远程分支：只读取本地已有的 remote-tracking ref，不联网 fetch。
   - 分支被删：返回 `git/unknown-ref`，客户端回退。
   - 所有分支无提交：`commits = []`，UI 显示空态。

## Client 设计（`client.js`）

### 状态与请求

- 新增 `scope` 状态：`{ kind: 'branch', ref: 'HEAD' }` 或 `{ kind: 'all' }`。
- `useRepo(sessionId, scope, nonce)` 把 scope 拼进 query；effect 依赖 `sessionId`、`scope.kind`、`scope.ref`、`nonce`。
- 切换 session 时重置为 `HEAD`；刷新保留 scope。
- 请求中保留旧 commits（现有行为），顶部显示进度条；使用 AbortController 取消过期请求。

### 控件

提交区标题行：

```text
最近提交 · [所有分支 ▾]                         42
```

展开的 listbox：

```text
┌─────────────────────────────┐
│ 所有分支                  ✓ │
│ 当前分支 (develop)          │
│ ── 本地分支 ──              │
│ develop                     │
│ main                        │
│ ── 远程分支 ──              │
│ origin/develop              │
│ origin/main                 │
└─────────────────────────────┘
```

- 按钮：`aria-haspopup="listbox"`、`aria-expanded`、当前范围文本 + `▾`。
- 菜单：`role="listbox"`，选项 `role="option"` + `aria-selected`；分组用 `role="group"` + `aria-label`。
- 键盘：`ArrowUp/Down`、`Home/End`、`Enter/Space` 选择、`Escape` 关闭并还焦点；点击外部关闭。
- 禁用态：`status === 'loading' && !repo` 时不渲染；空仓库只保留 `所有分支` / `当前分支`。
- 视觉：复用 `--dsw-alias-*`，与 header 下拉同一层级；菜单 `z-index` 高于提交列表，父容器不能 `overflow: hidden` 裁掉。

### 分支行联动

- 分支行改为可点击（`button` 或带 `role` 的可聚焦行），点击即切换 scope 到该分支。
- 当前分支（git 的 `current`）仍用实心点表示；当前**查看范围**用行背景 + 右侧 `✓` 表示，两者不要混用。
- 键盘可达（Enter/Space）。

### 文案

新增 `scope.all`、`scope.current`、`scope.localGroup`、`scope.remoteGroup`、`scope.unknown`、`scope.hint`；中英同步。提交区标题显示范围名，例如：

- `最近提交 · 所有分支`
- `最近提交 · develop`
- `最近提交 · origin/main`

### 加载 / 错误 / 空态

- 切换范围：列表不闪空，旧数据保留 + 顶部进度条。
- `git/unknown-ref`：回退 `HEAD`，显示一条可关闭的提示，并触发一次刷新。
- 所有分支无提交：`所有分支还没有提交`。
- 单分支无提交：`该分支还没有提交`。

## 测试

### 单元 / 集成（Host）

- [ ] `parseRefs` 返回 `refname`，符号 remote HEAD 仍被过滤。
- [ ] `readRepoState` 默认范围只含 HEAD 历史。
- [ ] 单本地分支只含该分支提交。
- [ ] 单远程跟踪分支可用（临时 bare remote + fetch）。
- [ ] `scope=all` 含两个分支的提交，merge commit 不重复。
- [ ] 非法 ref（`--all`、`main; rm`、空白、超长）→ `request/bad-ref`。
- [ ] 已删除分支 → `git/unknown-ref`。
- [ ] 路由：`scope=all` 返回 `selection.scope = all`；默认请求仍兼容旧行为。
- [ ] 空仓库 / detached HEAD 不回归。

### 客户端

- [ ] `node --check`、manifest check。
- [ ] 手动：切换所有/单分支，提交数量与 `git log` 对照。
- [ ] 键盘：Tab 进入、方向键、Enter、Escape。
- [ ] 暗色主题 + 窄栏；菜单不被裁切。
- [ ] 刷新保留 scope；切换 session 重置。

## 文件改动

| 文件 | 改动 |
|---|---|
| `lib/git.js` | `refname`、scope 校验、log 参数、`selection` |
| `index.js` | 解析 `scope`/`ref`、错误映射 |
| `client.js` | scope 状态、下拉 listbox、分支行点击、文案、CSS |
| `test/git.test.mjs` | 解析器 + 多分支集成测试 |
| `test/host.test.mjs` | 参数校验 / 错误码 / selection |
| `docs/architecture.md` | API 契约、selection、错误表 |
| `docs/roadmap.md` | M1 拆分出「范围选择」 |
| `CHANGELOG.md` | Unreleased → 0.2.0 |
| `README.md` | 用法 + 新截图（范围下拉） |

## 实施顺序

1. Host：`parseRefs.refname` + `readRepoState` scope + 单测（先让数据正确）。
2. Host 路由：参数与错误码 + 集成测试。
3. Client：请求带 scope + 切换后列表更新（先不做下拉，用两个临时按钮验证数据链路）。
4. Client：下拉 listbox + 键盘 + 分支行联动 + 样式。
5. 文档、截图、版本号；`npm run check && npm test`。
6. 本机 preview 更新（复制到 profile + HMR 重载），实机检查暗色/窄栏。

## 风险

- **ref 注入**：绝不把请求字符串直接交给 git；白名单 + `--` 终止符。
- **所有分支的顺序**：必须 `--topo-order`，否则多分支交错难读；lane 仍待 M1 后续。
- **窄栏裁切**：下拉可能被 `.gr-section` / `.gr-body` 的 overflow 裁掉；先做最小 DOM 验证。
- **快捷键冲突**：Escape 可能被 DSH 全局快捷键处理；在菜单内 `stopPropagation` 并测试。
- **性能**：`--branches --remotes` 在超大仓库仍需 10s 超时兜底；输出上限不变。

## 验收

- 默认打开仍是当前分支，行为不回归。
- 「所有分支」能看到其它分支的提交，refs 徽标准确。
- 单选本地/远程分支只显示该分支历史。
- 非法 ref 被拒绝，不执行任意 git 参数。
- 下拉可用键盘操作，暗色/窄栏不裁切。
- `npm run check`、全部测试通过；版本与文档同步。

## 待确认

1. 默认范围用**当前分支**（建议）还是「所有分支」？
2. 单分支选项是否要包含**远程跟踪分支**（建议包含）？
3. 范围选择是否需要**跨会话记住**（建议 v1 不持久化）？
4. 控件用**自定义下拉**（建议）还是原生 `<select>` / 仅点击分支行？
