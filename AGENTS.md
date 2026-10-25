# AGENTS.md — 在这个仓库里工作

面向后续接手的人或 agent。先读 [README.md](README.md) 和 [docs/architecture.md](docs/architecture.md)。

## 硬约束

1. **单包、无构建**。`client.js` 就是浏览器产物，不要引入 JSX、打包器或 `@deepseek-ai/dsh-client-*` 运行时 import。
2. **client 模块 id = 包名 = patch 行 name**。三者是 `dsh-plugin-gitrail`，改一个就要改全部。
3. **浏览器不碰文件系统**。只允许 `session` id；路径由 Host 从 Session 解析。
4. **git 只读 + 参数数组**。不要加 shell 字符串、不要加写命令，除非任务明确要求并更新路线图。
5. **主题只用 `--dsw-alias-*` 令牌**。不要写死颜色；不要读取其他插件的 DOM 或样式。唯一例外是提交图 lane 的分类色板 `--gr-lane-1..8`（数据可视化需要多色，必须亮/暗都校验），其余 UI 仍用主题令牌。
6. **文案走 `ctx.locale`**。新增可见文本时同时补 `zh` 和 `en` 字典。
7. **注册即 effect**。`ctx.sidebarRightTabs.register`、`ctx.slots.register`、`webServer.register` 都包在 `ctx.effect()` 里并返回 disposer。

## 验证

```powershell
npm run check   # node --check + 清单/本地化/图标
npm test        # 53 项：解析器、路由、limit、搜索、patch、对比、tag、双组范围、rail、图形与提交详情
```

- 视觉验证只能在安装后的 DSH 页面里做；不要写 mock 页面、截图脚本或自定义渲染器来「证明」UI。
- 安装用 DSH 的 `plugin_manager`（`install_bundle`，target 为本目录绝对路径），不要手工改 profile。
- 若只能做静态验证，报告「视觉未验证」，不要把安装成功当成 UI 成功。

## 代码地图

| 文件 | 说明 |
|---|---|
| `index.js` | 路由 `/dsh-plugin-gitrail/repo`、loopback 校验、Session → cwd、错误码 |
| `lib/git.js` | 只读 git 适配器；`GitError.code` 是对外契约 |
| `client.js` | tab type + guide + body + CSS + 本地化字典 |
| `test/git.test.mjs` | 解析器单测与真实仓库集成测试 |
| `test/host.test.mjs` | 路由、loopback、Session 解析与错误码测试 |
| `test/graph.test.mjs` | 纯函数 `layoutGraph` 的线性/分叉/合并/远程/dangling 测试 |
| `test-support/git.mjs` | 测试用临时仓库工具 |
| `scripts/check.mjs` | 清单与模块格式检查 |
| `docs/` | 架构、路线图、命名决策 |

## 提交习惯

- 提交信息用 `feat:` / `fix:` / `docs:` / `test:` / `chore:` 前缀，一句话说清行为变化。
- 改动 Host 契约或错误码时，同步更新 `docs/architecture.md`。
- 改动用户可见行为时，同步更新 `CHANGELOG.md` 与相关文档。
- 不要把 `.tmp/`、临时仓库或测试产物提交进仓库。
