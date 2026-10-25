# 架构

## 1. 表面选择：右侧栏的 page type

DSH Web 的右侧栏（`@deepseek-ai/dsh-client-ui-sidebar-right`）是**按 Session 隔离的 docking 面板**，内置 Files / Browser / Terminal 都以 tab type 的方式接入：

- `ctx.sidebarRightTabs.register(definition)` 声明一个类型；
- 该类型的 body 注册在 keyed 槽位 `sidebar.right.pane.tab`，key 为 `definition.id`；
- 同一个 id 可注册 chip 标题 `sidebar.right.pane.tab.title`（可选）；
- `guide` 数组让类型出现在右侧栏的 guide 页，用户从那里打开它。

Gitrail 提供两个表面：

- **右侧栏 tab type**（快捷视图）：`ctx.sidebarRightTabs.register(definition)` 声明类型；body 注册在 keyed 槽位 `sidebar.right.pane.tab`，key 为 `definition.id`；`guide` 数组让类型出现在右侧栏 guide 页。
- **全宽 main panel**（完整图谱）：`sidebar.panellist` 注册入口，同一个 id 注册根级 `main` keyed 槽位；页面用客户端 `sessions` 服务找到当前 Session，左侧画彩色图谱、右侧显示提交信息。图谱需要宽度，所以没有把它硬塞进窄侧栏。

不采用的其他路径：

| 备选 | 不选的原因 |
|---|---|
| `conversation.composer.dock` / `shell.overlay` | 装饰性槽位，不合适承载可滚动、可并排的仓库视图 |
| 宿主返回 HTML + iframe | 拿不到宿主主题令牌、语言与布局，违反 DSH UI 约定 |

右侧栏页面类型用 `priority: 'extension'`，kind 为 `gitrail`，id 与包名一致：`dsh-plugin-gitrail`。全宽面板 id 为 `gitrail-graph`，入口和 `main` key 共用它。

## 2. 两半与数据流

```text
右侧栏 guide
   └─ 用户打开 gitrail tab
        └─ GitrailBody 挂载（React）
             └─ GET /dsh-plugin-gitrail/repo?session=<sessionId>
                  └─ index.js：校验 loopback、解析 Session 工作区
                       └─ lib/git.js：git -C <cwd> ...（只读、参数数组）
                            └─ JSON { ok, repo }
                                 └─ GitrailBody 渲染分支 / 提交 / 状态

全宽入口（同一个 bundle）
sidebar.panellist「Gitrail 图谱」
   └─ layout.selectPanel('gitrail-graph')
        └─ 根级 main keyed slot → GitrailPage
             └─ 客户端 sessions 服务选当前 Session
                  └─ 同一个 GET /dsh-plugin-gitrail/repo
                       └─ 左侧 SVG 图谱 + 右侧提交信息
```

- **Host**（`index.js` + `lib/git.js`）拥有文件系统与 git。浏览器永远不提交路径。
- **Client**（`client.js`）只拥有视图与一次 `fetch`；不 import 任何 DSH Client 包，只 `require('react')`。两个表面共用 `layoutGraph()`、`useRepo()` 与 `GraphSvg`。
- 没有共享状态、没有后台轮询、没有 socket。刷新是显式动作。

## 3. HTTP 契约

### `GET /dsh-plugin-gitrail/repo?session=<id>[&scope=all|branch|refs][&ref=<refname>][&local=<refname>&remote=<refname>…]`

只允许 loopback 的 `Host`；只允许 GET。`session` 必须匹配 `^[A-Za-z0-9._:-]{1,200}$`。

- `scope` 缺省为 `all`（所有本地 + 远程跟踪分支）。
- `scope=branch` 时 `ref` 缺省为 `HEAD`；只接受 `HEAD` 或仓库中实际存在的完整 refname（`refs/heads/…`、`refs/remotes/…`）。
- `scope=refs` 使用重复的 `local=` / `remote=` 参数；两组取并集，允许其中一组或两组为空。每个 ref 必须属于对应组（local 只能 `refs/heads/*`，remote 只能 `refs/remotes/*`），最多 100 个。
- 同时提供 `ref` 但省略 `scope` 时按 `branch` 处理；`scope=all` 时忽略 `ref`。
- 单分支日志为 `git log <ref> --`；所有分支为 `git log --branches --remotes`；显式 refs 为 `git log <local…> <remote…> --`，都带 `--topo-order`。
- 空 refs（`scope=refs` 且没有 local/remote）不运行 `git log`，直接返回空提交列表。

成功（200）：

```json
{
  "ok": true,
  "repo": {
    "root": "D:\\work\\demo",
    "name": "demo",
    "head": "a35fef6",
    "branch": "main",
    "upstream": "origin/main",
    "detached": false,
    "unborn": false,
    "ahead": 2,
    "behind": 0,
    "changes": 3,
    "selection": {
      "scope": "branch",
      "ref": "refs/heads/main",
      "detached": false
    },
    "branches": {
      "locals": [
        {
          "refname": "refs/heads/main",
          "name": "main",
          "sha": "a35fef6",
          "upstream": "origin/main",
          "date": "2026-10-21T00:30:05+08:00",
          "subject": "chore: initialize Gitrail",
          "current": true
        }
      ],
      "remotes": [
        {
          "refname": "refs/remotes/origin/main",
          "name": "origin/main",
          "sha": "a35fef6",
          "upstream": "",
          "date": "2026-10-21T00:30:05+08:00",
          "subject": "chore: initialize Gitrail",
          "current": false
        }
      ]
    },
    "commits": [
      {
        "sha": "a35fef677f77ac004292919b6063545338db9076",
        "short": "a35fef6",
        "parents": ["…"],
        "author": "Ada",
        "email": "ada@example.invalid",
        "date": "2026-10-21T00:30:05+08:00",
        "subject": "chore: initialize Gitrail",
        "refs": ["HEAD -> main", "origin/main"]
      }
    ],
    "generatedAt": "2026-10-21T00:31:00.000Z"
  }
}
```

失败统一为 `{ ok: false, code, message }`：

| HTTP | code | 含义 |
|---|---|---|
| 400 | `request/bad-session` | session id 缺失或格式非法 |
| 400 | `request/bad-scope` | `scope` 不是 `all` / `branch` |
| 400 | `request/bad-ref` | ref 格式非法（以 `-` 开头、含空白/控制字符、超长） |
| 400 | `request/bad-sha` | commit SHA 不是 7–40 位十六进制 |
| 403 | `http/forbidden` | `Host` 不是 loopback |
| 404 | `session/not-found` | 会话不存在（live 与索引都查不到） |
| 404 | `http/not-found` | 未知子路径 |
| 404 | `git/commit-not-found` | SHA 合法但仓库里没有该提交 |
| 405 | `http/method-not-allowed` | 非 GET |
| 409 | `session/no-cwd` | 会话存在但没有工作目录 |
| 409 | `git/not-a-repo` | 工作目录不是 git 仓库 |
| 409 | `git/unknown-ref` | ref 格式合法但已不在仓库中（分支被删/远程已 prune） |
| 500 | `git/failed` / `server/failed` | git 或宿主内部失败 |
| 503 | `git/unavailable` | 找不到 `git` 可执行文件 |
| 504 | `git/timeout` | 10s 超时 |

### `GET /dsh-plugin-gitrail/commit?session=<id>&sha=<sha>`

提交详情：完整 message、作者/提交者、parents、refs、`--numstat` 文件列表，以及有上限的 unified diff（merge 用 `-m --first-parent`）。

```json
{
  "ok": true,
  "commit": {
    "sha": "…",
    "parents": ["…"],
    "author": { "name": "…", "email": "…", "date": "…" },
    "committer": { "name": "…", "email": "…", "date": "…" },
    "subject": "…",
    "refs": ["HEAD -> develop"],
    "body": "…",
    "bodyTruncated": false
  },
  "files": [{ "path": "src/a.ts", "oldPath": null, "additions": 12, "deletions": 3, "binary": false }],
  "filesTruncated": false,
  "patch": "diff --git …",
  "patchTruncated": false,
  "patchUnavailable": false
}
```

上限：message 16 KiB、文件 200 个、patch 512 KiB。二进制文件只给 stat；rename 带 `oldPath`。客户端详情面板展示 message、文件 `+/-` 与按行着色的 diff；文件行在 `sidebarRight.openResource` 可用时打开 `dsh-resource://file/...` 预览。

## 4. Session → 工作区

优先级：

1. `ctx.sessions.get(sessionId)`（live Session）→ `session.header.cwd` / `session.meta.cwd`；
2. `ctx.sessionQuery.listSessions()`（session 索引）→ 对应记录的 `header.cwd`；
3. 都没有：`session/not-found`；有会话但无 cwd：`session/no-cwd`。

`lib/git.js` 再用 `git rev-parse --show-toplevel` 处理「会话 cwd 是仓库子目录」的情况；后续所有命令都以仓库根为 `-C`。

## 5. 只读与安全

- 命令白名单由代码固定：`rev-parse`、`status`、`for-each-ref`、`log`、`show`、`cat-file`；没有写命令。
- `execFile('git', ['-C', cwd, ...args])`，不经 shell；参数不允许来自请求。
- 环境：`GIT_OPTIONAL_LOCKS=0`、`GIT_TERMINAL_PROMPT=0`、`GIT_PAGER=cat`、`LC_ALL=C`；不设置凭据。
- 输出：10s 超时、12 MiB 上限、80 条提交、每类 200 个分支；提交详情 message 16 KiB、文件 200 个、patch 512 KiB。
- `Host` 头校验阻止 LAN / 代理访问；响应 `Cache-Control: no-store`、`nosniff`。
- 不记录仓库内容；日志只记错误类别与简短原因。

## 6. UI 约定

- 样式全部以 `.gr-root` 门控，注入一个 `<style data-plugin="dsh-plugin-gitrail">`，随组件卸载移除。
- 只用 `--dsw-alias-*` 主题令牌，不写死颜色；宽度、间距、字号模仿宿主行模式。
- 不向 `document.body` 追加节点；不读取其他插件的 DOM。
- 文案走 `ctx.locale`（`gitrail` 命名空间），相对时间用 `Intl.RelativeTimeFormat`。
- 刷新按钮有 `aria-label`、`title`，忙碌时 `aria-busy`；尊重 `prefers-reduced-motion`。
- 提交范围默认「本地全部 + 远程全部」；`最近提交` 旁有两个多选 listbox（`aria-multiselectable`），分别选择 local / remote，两组并集渲染。远程分支列表默认展开；分支行点击切换本组选中态，空选择显示空态。
- 客户端只发送 `session` + `scope=refs` + 重复 `local` / `remote`，不发送路径；Host 用 `for-each-ref` 结果做白名单，再拼 `git log` 参数。
- **提交图**：`layoutGraph()` 是纯函数，输入 `commits[].parents` + `branches`，输出每行 lane/边/节点；渲染为一个绝对定位 SVG，提交行固定 64px，subject 最多两行。lane 颜色按分支名稳定哈希到 8 色板，合并来源边继承来源色；远程 lane 虚线。颜色是分类数据可视化的唯一例外，其余 UI 仍只用 `--dsw-alias-*`。
- **分支 rail**：选中分支 tip 是另一选中 tip 的祖先时（`main` 落后 `develop`），较新分支的线性链整体移到新 lane，旧 tip 到链首的边保留为斜线，表达「分支在这里创建」。
- **共享选中**：`apply()` 创建插件级 selection store（`{sessionId, sha}`），右侧栏与全宽页都通过 slot `inject` 读取；侧栏点击先 `selection.select()` 再 `layout.selectPanel('gitrail-graph')`。全宽页详情通过 `/commit` 拉取 message / 文件 / diff。

## 7. 文件地图

```text
index.js                  Host 入口：路由、Session 解析、错误映射
lib/git.js                只读 git 适配器与输出解析
client.js                 浏览器入口：类型、guide、body、样式、文案
cordis.patch.yml          bundle 插入行
locale/{en,zh}.json       Plugin Manager 元数据
icon.svg                  插件图标
test/git.test.mjs         解析器 + 临时仓库集成测试
test/host.test.mjs        路由 / loopback / Session 解析 / 错误码测试
test/graph.test.mjs       纯函数 layoutGraph 的图形测试
test-support/git.mjs      临时仓库测试工具
scripts/check.mjs         清单 / 模块格式 / 本地化 / 图标一致性
docs/                     架构、路线图、命名
```

## 8. 后续扩展点

- **提交详情 / diff**：新增 Host 只读命令（`show --stat`、`show --format=`），以及一个新的 tab type 或在 Gitrail 内部展开；不要用 `patterns` 劫持 `dsh-resource://file/**` 的文件预览。
- **本地操作层（可选）**：checkout / pull / push 不在 commit 历史里；如果要做，单独读 `git reflog`，明确标注仅本机、不随仓库分发，不要混进历史图。
- **写操作**：必须是显式用户动作 + 确认 + 失败回显；不要默认暴露给 agent 工具。遵守 DSH 的 `user-actions` 约定：UI 与工具共用同一个 Host 方法。
- **自动刷新**：优先在 `window` 聚焦、tab 重新可见时刷新，而不是常驻轮询；注意多窗口与性能。
