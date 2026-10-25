# Gitrail

> **Rail for your repo** — 把仓库的分支与提交放进 DeepSeek Harness 的右侧栏。

`dsh-plugin-gitrail` 是一个 DSH Web 插件：在右侧栏新增一个 **Gitrail** 页面，读取当前会话工作区的 git 仓库，展示当前分支、本地/远程分支和最近提交。

- **只读**：不 checkout、不 fetch、不写配置，也不碰凭据。
- **不联网**：所有数据来自本机 `git`，浏览器只访问回环地址上的宿主路由。
- **单包、无构建**：宿主编排在 `index.js` / `lib/git.js`，浏览器半边是纯 JS 的 `client.js`，没有 JSX、打包器或运行时依赖。
- **贴着宿主长**：右侧栏 tab type + guide entry，使用 `--dsw-alias-*` 主题令牌，亮/暗主题一致。

![Gitrail 右侧栏](docs/assets/gitrail-sidebar.png)

*右侧栏中的 Gitrail（本机 preview，暗色主题）。*

> 状态：**v0.1.0 / early**。仓库骨架与第一条纵向切片已完成；已通过 `npm run check` 和 17 项 `npm test`，并已在 desktop profile 的右侧栏打开验证（暗色主题）；亮色主题与窄栏表现仍待检查。

---

## 为什么叫 Gitrail

| 项 | 值 |
|---|---|
| 包名 | `dsh-plugin-gitrail`（npm 上尚未占用） |
| 仓库名 | `gitrail` |
| 中文名 | Gitrail 侧栏 / 「轨」 |
| 一句话 | Rail for your repo — git 分支与提交的侧栏视图 |

`rail` 同时指**铁轨**（分支轨道、提交图的视觉隐喻）和 **rail / sidebar**（侧边栏）；短、好念、logo 也好做——一条分叉的轨道。

命名上的取舍记录在 [docs/naming.md](docs/naming.md)：避开 `dsh-plugin-git`（npm 上已有同名包，功能相邻）、`gitlens`（与 VS Code 插件商标冲突）和只强调侧栏的 `sidegit`。

---

## 现在能做什么（v0.1）

在右侧栏的 guide 里打开「仓库」后：

- 显示仓库名、绝对路径、当前分支（含 detached HEAD / 空仓库状态）。
- 显示工作区改动数、相对上游的 ahead / behind。
- 列出本地分支（当前分支高亮、显示上游与短 SHA），远程分支折叠在次级区域。
- 列出最近 80 条提交：短 SHA、作者、相对时间、refs（分支 / tag）、提交标题，并用一条垂直「轨道」串起来。
- 手动刷新；读取中保留旧数据，不闪空屏。
- 错误按原因给出可操作的文案：会话不存在、没有工作目录、不是 git 仓库、找不到 git、超时。

**还没有**：提交图的 lane 布局、diff / stat 预览、任何写操作。见 [docs/roadmap.md](docs/roadmap.md)。

---

## 安装

前置条件：DSH Web（`desktop` profile 或等价组合）、右侧栏（`@deepseek-ai/dsh-client-ui-sidebar-right`）已启用、`git` 在 `PATH` 中、Node.js ≥ 22。

### 用 `plugin_manager` 安装（推荐）

在任意 DSH 会话里，把本目录作为本地 bundle 安装：

```text
plugin_manager  action: install_bundle
target: D:\Documents\deepseek\dsh-plugin-gitrail
```

安装会写入当前 profile 的 bundle 选择与依赖，不需要手动改 `package.json` 或 `cordis.patch.yml`。若页面没有立刻出现「仓库」入口，重启 DSH 后刷新页面；替换已安装包时，新的浏览器模块需要重启才能生效。

### 安装后验证

1. 打开一个位于 git 仓库中的会话。
2. 右侧栏顶部的 `+` / guide 中应出现「仓库」卡片。
3. 打开后应看到当前分支与提交列表；切到暗色主题再检查一次对比度。
4. 若面板报错，先看错误码：`git/not-a-repo`、`git/unavailable`、`session/no-cwd` 分别对应不同的环境问题。

> 本仓库只提供 bundle，不自动修改 profile。不要手工复制到 `$DSH_HOME` 或编辑 profile 的 `cordis.patch.yml`，除非你明确知道自己在做什么。

---

## 开发

没有构建步骤。改完 `client.js` 就是改完浏览器产物；样式使用宿主主题令牌，不引入 CSS 框架。

```powershell
npm run check   # node --check + 清单/本地化/图标一致性
npm test        # 17 项测试：解析器、路由与临时 git 仓库集成测试
```

| 路径 | 职责 |
|---|---|
| `index.js` | Host 半边：注册 `/dsh-plugin-gitrail/repo`，把 Session 解析为工作区目录，返回 JSON |
| `lib/git.js` | 只读 git 适配器：参数数组、超时、输出上限、稳定的 `GitError` 错误码 |
| `client.js` | 浏览器半边：注册 `gitrail` tab type、guide entry 和 `sidebar.right.pane.tab` 内容 |
| `cordis.patch.yml` | bundle 的插入行（id 与包名一致） |
| `locale/en.json`、`locale/zh.json` | Plugin Manager 读取的 `meta.title` / `meta.description` |
| `icon.svg` | 导出的插件图标（分叉轨道） |
| `test/git.test.mjs` | 解析器 + 真实临时仓库的集成测试 |
| `test/host.test.mjs` | 路由、loopback、Session 解析与错误码测试 |
| `test-support/git.mjs` | 测试用临时仓库工具 |
| `docs/` | 架构、路线图、命名决策 |

### 客户端模块约定

- `window.__ModuleLoader__.load({ id, factory })`，`id` 必须等于包名 `dsh-plugin-gitrail`。
- 只 `require('react')`；不 `require` 任何 `@deepseek-ai/dsh-client-*` 包。
- 通过 `ctx.sidebarRightTabs.register()` 注册页面类型，通过 `ctx.slots.register()` 注册该类型的 body。
- 所有可见文案走 `ctx.locale`；颜色只用 `--dsw-alias-*` 令牌。
- 不向 `document.body` 追加节点，不读取其他插件的 DOM。

### 宿主模块约定

- `export const name` / `export const inject = ['webServer']` / `export function apply(ctx)`。
- 注册资源一律包在 `ctx.effect()` 里，返回 disposer。
- 只接受 `session` id，**绝不接受浏览器传来的文件系统路径**；工作区路径由宿主从 Session 解析。
- git 只用参数数组调用，禁用交互提示与 optional locks，设置超时与输出上限。

---

## 数据与安全边界

| 边界 | 做法 |
|---|---|
| 读取范围 | 只读当前 Session 的工作区仓库；`git rev-parse --show-toplevel` 决定根 |
| 网络 | Host 只注册本机回环路由；Handler 拒绝非 loopback 的 `Host` |
| 客户端权限 | 浏览器不能指定路径、不能执行 git、不能读文件 |
| 命令注入 | `execFile('git', ['-C', cwd, ...args])`，不经过 shell；所有参数在代码里固定 |
| 写操作 | 无。没有 checkout / fetch / pull / commit / config 写入口 |
| 凭据 | 不读取、不传递、不记录 |
| 资源上限 | 10s 超时、4 MiB stdout、80 条提交、每类 200 个分支 |
| 错误信息 | 稳定错误码 + 简短原因；不返回仓库内容或完整 stderr |

HTTP 契约与错误码见 [docs/architecture.md](docs/architecture.md)。

---

## 已知限制

- **没有提交图 lane**：当前按 `HEAD` 的线性历史渲染一条轨道，父提交已随数据返回，lane 布局是下一步。
- **没有 diff**：提交行只展示摘要，点开文件 / 看 patch 尚未实现。
- **没有自动刷新**：需要点刷新按钮；不会轮询。
- **单仓库**：一个 Session 的工作区对应一个仓库；多仓库 / 子模块视图未设计。
- **视觉未验证**：本机尚未安装到运行中的 DSH，亮/暗主题与窄栏表现仍待真机检查。
- **未发布 npm**：`package.json` 仍是 `private: true`，发布前需移除并核对 `files`。

---

## 路线图

| 里程碑 | 内容 |
|---|---|
| **M0（已完成）** | 仓库骨架、右侧栏 tab type、Host 只读 git 读取、分支/提交列表、测试 |
| **M1** | 提交图 lane、分支聚焦、窗口重新聚焦时刷新、空态与长列表打磨 |
| **M2** | 提交详情与 diff / stat 预览（新的 tab 或资源类型，不劫持文件预览） |
| **M3** | 显式用户操作：checkout / fetch（确认 + 失败回显；默认不暴露给 agent） |
| **M4** | npm 发布、英文 README、CI、安装文档截图 |

细节与开放问题见 [docs/roadmap.md](docs/roadmap.md)。

---

## License

[MIT](LICENSE) © 2026 Gitrail contributors
