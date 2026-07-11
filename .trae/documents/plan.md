# git-xray 命令设计与实现计划

## Summary

将 `@condorhero/git-xray` 从占位库改造为一个 CLI + 报告生成工具，复刻博客 [The Git Commands I Run Before Reading Any Code](https://piechowski.io/post/git-commands-before-reading-code/) 中 5 个诊断命令，并通过 `npx @condorhero/git-xray`（别名 `npx xray`）调用。CLI 既能在终端输出彩色摘要，也能在终端不友好的场景下生成一份自包含的 HTML 报告（暗/亮色主题、中英文切换、可调字号/行距组件、SVG/CSS 自绘图表）。

技术栈与依赖选择（已与用户确认）：
- CLI 入口：package.json 新增 `bin` 字段
- 数据采集：`child_process.spawn` 直接调用 git 命令（贴近博客原文、零依赖）
- 可视化：纯 CSS + 内联 SVG 自绘柱状图/饼图/折线图，无外部图表库
- 首版范围：完整 MVP（5 模块 + 终端 + 完整 HTML 报告）

---

## Current State Analysis

[package.json](file:///Users/david/i/git-xray/package.json) 当前 `version: 0.0.0`、`description: "_description_"`、`bin` 字段缺失，[src/index.ts](file:///Users/david/i/git-xray/src/index.ts) 仅占位 `export const one = 1`。`tsdown` 构建配置见 [tsdown.config.ts](file:///Users/david/i/git-xray/tsdown.config.ts)，仅产出 `src/index.ts` 一个 entry，`dts/exports/publint` 已开启。

工作区为 pnpm + catalog 模式（[pnpm-workspace.yaml](file:///Users/david/i/git-xray/pnpm-workspace.yaml)），使用 `tsx` 运行 TS，`vitest` + `tsnapi` 做 API 快照（[test/api-snapshot.test.ts](file:///Users/david/i/git-xray/test/api-snapshot.test.ts)）。

由于 `tsnapi` 会基于 entry 抓取 API 快照，新增的 CLI 入口 `src/cli.ts` 会一并纳入快照校验，需要在 tsdown 中声明新 entry。

### 博客提炼的 5 个分析模块

| # | 模块 | git 命令核心 | 报告可视化 |
|---|------|-------------|----------|
| 1 | 高频变更文件（Churn Hotspots） | `git log --format=format: --name-only --since="1 year ago" \| sort \| uniq -c \| sort -nr \| head -20` | 横向条形图 + 文件路径表 |
| 2 | 谁构建了它（Bus Factor） | `git shortlog -sn --no-merges`（含 6 个月窗口对照） | 贡献者排行榜 + 活跃/流失占比环图 + Bus Factor 风险标签 |
| 3 | Bug 聚集地 | `git log -i -E --grep="fix\|bug\|broken" --name-only --format='' \| sort \| uniq -c \| sort -nr \| head -20` | 横向条形图 + 与 Churn 模块交叉高亮（双重命中风险文件） |
| 4 | 加速还是衰退 | `git log --format='%ad' --date=format:'%Y-%m' \| sort \| uniq -c` | 月度折线/柱状图 + 健康度评级（A/B/C） |
| 5 | 救火频率 | `git log --oneline --since="1 year ago" \| grep -iE 'revert\|hotfix\|emergency\|rollback'` | 救火事件列表 + 按月分布柱状图 + 频率评级 |

---

## Proposed Changes

### 1. CLI 入口与 package.json 改造

文件：[package.json](file:///Users/david/i/git-xray/package.json)

- 新增 `bin` 字段：`"bin": { "xray": "./dist/cli.mjs" }`，并新增 `"xray": "dist/cli.mjs"` 到 `exports`，使 `npx @condorhero/git-xray` 和 `npx xray`（通过 bin 名）等价
- 补全 `description`、`keywords`（如 `git`, `codebase`, `audit`, `cli`）
- `files` 字段无需改，`dist/` 已包含

### 2. tsdown 构建配置

文件：[tsdown.config.ts](file:///Users/david/i/git-xray/tsdown.config.ts)

- 将 `entry` 从单文件改为数组 `['src/index.ts', 'src/cli.ts']`
- 新增 `src/cli.ts` 需生成可执行文件：tsdown 默认 shebang 处理为 `#!/usr/bin/env node`，需在 entry 项中通过 `banner` 注入 shebang（tsdown 支持 `platform: 'node'` + `shims` 默认注入，但建议显式配置 `platform: 'node'`）

### 3. 源码结构

新建以下文件（仅新增，不修改现有逻辑）：

```
src/
├── index.ts                # 保留原有导出（库 API），新增 re-export 公共类型
├── cli.ts                  # CLI 入口，#!shebang，解析 argv
├── core/
│   ├── git.ts              # spawn git 命令的封装，统一 exec/parse
│   ├── repo.ts             # 仓库元信息：name、HEAD commit、生成日期
│   ├── analyze/
│   │   ├── churn.ts        # 模块 1：高频变更
│   │   ├── contributors.ts # 模块 2：Bus Factor
│   │   ├── bugs.ts         # 模块 3：Bug 聚集
│   │   ├── velocity.ts     # 模块 4：加速/衰退
│   │   └── firefighting.ts # 模块 5：救火频率
│   ├── cross.ts            # Churn × Bugs 交叉风险表
│   └── types.ts            # 报告数据 schema（ReportData）
├── report/
│   ├── terminal.ts         # 终端彩色输出（picocolors 内置或 ANSI）
│   ├── html.ts             # 生成自包含 HTML 字符串
│   ├── template.ts         # HTML 模板（i18n 字符串字典）
│   └── styles.css.ts       # 内联 CSS（暗/亮主题、字号行距 CSS 变量）
└── utils/
    ├── path.ts             # 路径安全/相对化（过滤 lockfile、CHANGELOG）
    └── date.ts             # 月份聚合、相对时间
```

各模块要点：

- [src/core/git.ts](file:///Users/david/i/git-xray/src/core/git.ts)：导出 `runGit(args: string[], cwd: string): Promise<string>` 与 `runShellPipe(args: string[][]): Promise<string>`，支持取消、超时（10s）、错误透传
- [src/core/repo.ts](file:///Users/david/i/git-xray/src/core/repo.ts)：读取 `package.json`（若存在）、HEAD commit hash、仓库名、当前日期（ISO + 本地化）
- [src/core/analyze/churn.ts](file:///Users/david/i/git-xray/src/core/analyze/churn.ts)：执行 `git log --format=format: --name-only --since="1 year ago"`，按行解析、过滤（lockfile、generated、CHANGELOG、.min.），返回 `{ file, count }[]`
- [src/core/analyze/contributors.ts](file:///Users/david/i/git-xray/src/core/analyze/contributors.ts)：`git shortlog -sn --no-merges` + 6 个月窗口对比，识别 Top1 占比、流失贡献者
- [src/core/analyze/bugs.ts](file:///Users/david/i/git-xray/src/core/analyze/bugs.ts)：同 churn 但带 grep；交叉高亮来自 cross.ts
- [src/core/analyze/velocity.ts](file:///Users/david/i/git-xray/src/core/analyze/velocity.ts)：月度聚合、最近 6 个月趋势对比，输出健康度评级（连续下滑 → C，平稳 → A）
- [src/core/analyze/firefighting.ts](file:///Users/david/i/git-xray/src/core/analyze/firefighting.ts)：正则匹配 revert|hotfix|emergency|rollback，按月聚合
- [src/core/cross.ts](file:///Users/david/i/git-xray/src/core/cross.ts)：计算 churn ∩ bugs，给每个文件打 risk 标签（critical/warning/normal）

### 4. CLI 命令设计

[src/cli.ts](file:///Users/david/i/git-xray/src/cli.ts) 解析 argv：

```
npx xray [dir] [options]

选项：
  --html [path]         生成 HTML 报告，可选自定义输出路径（默认 ./git-xray-report.html）
  --since <duration>    覆盖默认 1 year ago（如 "6 months ago"、"2 years"）
  --no-color            禁用终端彩色输出
  --lang <zh|en>        HTML 报告语言（默认跟随终端 locale）
  --open                生成后自动在浏览器打开（macOS open / Windows start / Linux xdg-open）
  -h, --help            帮助
  -v, --version         版本
```

无参数时：默认生成终端摘要 + HTML 报告到 `./git-xray-report.html`。

### 5. 终端输出

[src/report/terminal.ts](file:///Users/david/i/git-xray/src/report/terminal.ts)

- 5 个模块各输出一个色块（chalk 风格 ANSI 转义或 `picocolors` 内置零依赖手写）
- 顶部打印仓库基本信息卡片（名称、HEAD、生成时间）
- 底部给出"交叉风险文件 Top 5"总结
- 非 TTY 环境（如 pipe）自动关闭颜色

### 6. HTML 报告（核心交付）

[src/report/html.ts](file:///Users/david/i/git-xray/src/report/html.ts) + [src/report/styles.css.ts](file:///Users/david/i/git-xray/src/report/styles.css.ts)

**基础模块（Header）**：
- 项目名称、HEAD commit（短 hash）、生成日期（本地化）、生成耗时、工具版本
- 主题切换按钮（☀️/🌙）、语言切换（EN/中）、字号档位（A−/A/A+）、行距档位（紧凑/标准/宽松）— 均通过顶部悬浮工具栏组件控制

**5 个分析模块（与博客一一对应）**：

| 模块 | 可视化组件 |
|------|----------|
| Churn Hotspots | SVG 横向条形图 + 文件路径表，max 20 行 |
| Bus Factor | 贡献者排行榜（柱形）+ 活跃 vs 流失环图（SVG 圆环）+ 风险徽章（🟢/🟡/🔴） |
| Bug Cluster | SVG 横向条形图，交叉命中行用红色高亮 + 风险标签 |
| Velocity | SVG 折线 + 柱状混合图（每月提交数），底部评级条 |
| Firefighting | 救火事件时间线列表 + 月度柱状图 + 频率评级 |

**交互动画与图标**：
- 文件类型图标（基于扩展名的 emoji 映射：.ts→📘、.js→📜、.json→⚙️ 等）
- 风险等级图标（🚨/⚠️/✅）
- 模块卡片悬停上浮、图表入场动画（CSS `@keyframes`）
- 表格行排序、搜索过滤（纯 JS，约 30 行）

**i18n 与样式**：
- [src/report/template.ts](file:///Users/david/i/git-xray/src/report/template.ts) 维护 `dict: Record<'zh'|'en', Record<string, string>>`，所有 UI 文案从字典取
- CSS 变量驱动主题：`--bg`, `--fg`, `--accent`, `--muted` 等；`:root` 暗色、`:root[data-theme="light"]` 亮色
- 字号：`--font-scale`（0.9 / 1.0 / 1.1 / 1.2），通过 `document.documentElement.style.setProperty` 切换
- 行距：`--line-height`（1.4 / 1.6 / 1.8）

**自包含**：
- 所有 CSS 内联到 `<style>` 标签
- 所有 SVG 内联生成（无 `<img src>`）
- JS 仅约 50 行（主题/语言/字号/排序），无外部脚本
- 单一 `.html` 文件可直接发邮件/拖入浏览器

### 7. 单元测试

新增 [test/core.test.ts](file:///Users/david/i/git-xray/test/core.test.ts)：
- 用 `node:fs` 在临时目录初始化一个假 git 仓库（`git init` + 若干 `git commit` 脚本），验证各分析模块的解析结果
- 用快照测试 HTML 输出结构（不锁死时间戳等动态字段）

[test/api-snapshot.test.ts](file:///Users/david/i/git-xray/test/api-snapshot.test.ts) 无需改，`tsnapi` 自动扫描新 entry。

### 8. README 更新

[README.md](file:///Users/david/i/git-xray/README.md)：
- 替换占位 `_description_` 为真实描述
- 新增 Usage 章节：`npx xray`、`npx xray ./my-project --html git-xray-report.html`
- 截图占位（项目徽章 + 简短功能介绍）

---

## Assumptions & Decisions

- **目标 Node 版本**：>=18（`child_process.spawn`、`fs.promises`、`Intl`）
- **不引入新运行时依赖**：终端色块用 ANSI 转义手写、HTML 模板用模板字符串、所有图表 SVG 自绘。保持包体积可控、零依赖安装体验
- **git 命令路径**：依赖用户 `PATH` 中存在 git，非 Windows Git Bash 场景以外均工作
- **HTML 默认输出路径**：CLI 当前目录下 `./git-xray-report.html`；可通过 `--html <path>` 覆盖
- **i18n 首版**只支持 zh / en 两套文案；预留 `dict` 结构方便扩展
- **跨模块"风险文件"交叉**：churn Top 5 × bugs Top 5 取交集，标 critical（双重命中）；仅 churn Top 20 命中 bugs → warning
- **健康度评级规则**（可在 `core/analyze/*` 内集中定义）：
  - Velocity：最近 6 个月平均 vs 此前 6 个月平均，<50% → C，<80% → B，否则 A
  - Firefighting：>1 次/月 → C，>1 次/季 → B，否则 A
  - Bus Factor：Top1 >60% → C，>40% → B，否则 A
- **不实现的功能**（避免过度工程）：
  - 不做实时 git watch / 增量更新
  - 不做远程对比（`git fetch` 远程分支以补充本地）
  - 不做 commit message LLM 分类（保持简单正则）

---

## Verification Steps

1. `pnpm run build` 成功，产出 `dist/index.mjs`、`dist/cli.mjs`（含 shebang）
2. `pnpm run typecheck` 通过
3. 在仓库根目录运行 `node dist/cli.mjs . --html ./test-output.html`：
   - 终端输出 5 个模块摘要 + 交叉风险 Top 5
   - `./test-output.html` 生成，可在浏览器打开验证：
     - 暗/亮主题切换有效
     - 中/英切换文案全部更新
     - 字号 A−/A/A+ 整体缩放生效
     - 行距三档生效
     - 5 个模块 SVG 图表正常渲染
     - 文件图标、风险徽章显示正常
4. `pnpm run test` 通过（含新增的 core.test 与原有 api-snapshot）
5. `pnpm run lint` 通过
6. 在另一个真实 git 仓库（如本仓库本身）跑一遍 `npx .`，交叉验证与博客方法论的一致性
