# 架构

## 1. 表面选择：右侧栏的 page type

DSH Web 的右侧栏（`@deepseek-ai/dsh-client-ui-sidebar-right`）是**按 Session 隔离的 docking 面板**，内置 Files / Browser / Terminal 都以 tab type 的方式接入：

- `ctx.sidebarRightTabs.register(definition)` 声明一个类型；
- 该类型的 body 注册在 keyed 槽位 `sidebar.right.pane.tab`，key 为 `definition.id`；
- 同一个 id 可注册 chip 标题 `sidebar.right.pane.tab.title`（可选）；
- `guide` 数组让类型出现在右侧栏的 guide 页，用户从那里打开它。

Gitrail 选择这条路径，而不是：

| 备选 | 不选的原因 |
|---|---|
| `sidebar.panellist` + 根级 `main` 面板 | 那是全局页面，不随 Session 切换，也不共享右侧栏的布局、分屏与恢复 |
| `conversation.composer.dock` / `shell.overlay` | 装饰性槽位，不合适承载可滚动、可并排的仓库视图 |
| 宿主返回 HTML + iframe | 拿不到宿主主题令牌、语言与布局，违反 DSH UI 约定 |

页面类型用 `priority: 'extension'`，kind 为 `gitrail`，id 与包名一致：`dsh-plugin-gitrail`。id 同时是 body 槽位的 key，因此类型、body、chip 标题天然对齐。

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
```

- **Host**（`index.js` + `lib/git.js`）拥有文件系统与 git。浏览器永远不提交路径。
- **Client**（`client.js`）只拥有视图与一次 `fetch`；不 import 任何 DSH Client 包，只 `require('react')`。
- 没有共享状态、没有后台轮询、没有 socket。刷新是显式动作。

## 3. HTTP 契约

### `GET /dsh-plugin-gitrail/repo?session=<id>[&scope=all|branch][&ref=<refname>]`

只允许 loopback 的 `Host`；只允许 GET。`session` 必须匹配 `^[A-Za-z0-9._:-]{1,200}$`。

- `scope` 缺省为 `all`（所有本地 + 远程跟踪分支）。
- `scope=branch` 时 `ref` 缺省为 `HEAD`；只接受 `HEAD` 或仓库中实际存在的完整 refname（`refs/heads/…`、`refs/remotes/…`）。
- 同时提供 `ref` 但省略 `scope` 时按 `branch` 处理；`scope=all` 时忽略 `ref`。
- 单分支日志为 `git log <ref> --`；所有分支为 `git log --branches --remotes`，两者都带 `--topo-order`。

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
| 403 | `http/forbidden` | `Host` 不是 loopback |
| 404 | `session/not-found` | 会话不存在（live 与索引都查不到） |
| 404 | `http/not-found` | 未知子路径 |
| 405 | `http/method-not-allowed` | 非 GET |
| 409 | `session/no-cwd` | 会话存在但没有工作目录 |
| 409 | `git/not-a-repo` | 工作目录不是 git 仓库 |
| 409 | `git/unknown-ref` | ref 格式合法但已不在仓库中（分支被删/远程已 prune） |
| 500 | `git/failed` / `server/failed` | git 或宿主内部失败 |
| 503 | `git/unavailable` | 找不到 `git` 可执行文件 |
| 504 | `git/timeout` | 10s 超时 |

## 4. Session → 工作区

优先级：

1. `ctx.sessions.get(sessionId)`（live Session）→ `session.header.cwd` / `session.meta.cwd`；
2. `ctx.sessionQuery.listSessions()`（session 索引）→ 对应记录的 `header.cwd`；
3. 都没有：`session/not-found`；有会话但无 cwd：`session/no-cwd`。

`lib/git.js` 再用 `git rev-parse --show-toplevel` 处理「会话 cwd 是仓库子目录」的情况；后续所有命令都以仓库根为 `-C`。

## 5. 只读与安全

- 命令白名单由代码固定：`rev-parse`、`status`、`for-each-ref`、`log`；没有写命令。
- `execFile('git', ['-C', cwd, ...args])`，不经 shell；参数不允许来自请求。
- 环境：`GIT_OPTIONAL_LOCKS=0`、`GIT_TERMINAL_PROMPT=0`、`GIT_PAGER=cat`、`LC_ALL=C`；不设置凭据。
- 输出：10s 超时、4 MiB 上限、80 条提交、每类 200 个分支。
- `Host` 头校验阻止 LAN / 代理访问；响应 `Cache-Control: no-store`、`nosniff`。
- 不记录仓库内容；日志只记错误类别与简短原因。

## 6. UI 约定

- 样式全部以 `.gr-root` 门控，注入一个 `<style data-plugin="dsh-plugin-gitrail">`，随组件卸载移除。
- 只用 `--dsw-alias-*` 主题令牌，不写死颜色；宽度、间距、字号模仿宿主行模式。
- 不向 `document.body` 追加节点；不读取其他插件的 DOM。
- 文案走 `ctx.locale`（`gitrail` 命名空间），相对时间用 `Intl.RelativeTimeFormat`。
- 刷新按钮有 `aria-label`、`title`，忙碌时 `aria-busy`；尊重 `prefers-reduced-motion`。
- 提交范围默认「所有分支」；下拉是 `role="listbox"`，支持方向键 / Home / End / Enter / Escape，分支行同时可点选（`role="button"` + `aria-current`）。
- 客户端只发送 `scope` / `ref`，不发送路径；Host 用 `for-each-ref` 结果做白名单，再拼 `git log` 参数。
- **提交图**：`layoutGraph()` 是纯函数，输入 `commits[].parents` + `branches`，输出每行 lane/边/节点；渲染为一个绝对定位 SVG，提交行固定 64px，subject 最多两行。lane 颜色按分支名稳定哈希到 8 色板，合并来源边继承来源色；远程 lane 虚线。颜色是分类数据可视化的唯一例外，其余 UI 仍只用 `--dsw-alias-*`。

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
test-support/git.mjs      临时仓库测试工具
scripts/check.mjs         清单 / 模块格式 / 本地化 / 图标一致性
docs/                     架构、路线图、命名
```

## 8. 后续扩展点

- **提交详情 / diff**：新增 Host 只读命令（`show --stat`、`show --format=`），以及一个新的 tab type 或在 Gitrail 内部展开；不要用 `patterns` 劫持 `dsh-resource://file/**` 的文件预览。
- **本地操作层（可选）**：checkout / pull / push 不在 commit 历史里；如果要做，单独读 `git reflog`，明确标注仅本机、不随仓库分发，不要混进历史图。
- **写操作**：必须是显式用户动作 + 确认 + 失败回显；不要默认暴露给 agent 工具。遵守 DSH 的 `user-actions` 约定：UI 与工具共用同一个 Host 方法。
- **自动刷新**：优先在 `window` 聚焦、tab 重新可见时刷新，而不是常驻轮询；注意多窗口与性能。
