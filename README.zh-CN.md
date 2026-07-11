# @condorhero/git-xray

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

> 在打开任何代码之前，先用 5 条 git 命令诊断一个新代码库。

`git-xray` 复刻了博客
[The Git Commands I Run Before Reading Any Code](https://piechowski.io/post/git-commands-before-reading-code/)
中的 5 个 `git log` 诊断命令，并将结果同时呈现为：

- 🖥️ **终端彩色摘要** —— 一眼看清项目健康度
- 📄 **自包含 HTML 报告** —— 暗/亮主题、中英文切换、可调字号/行距，所有图表内联

## 快速开始

```bash
# 直接通过 npx 使用，无需安装
npx -y @condorhero/git-xray

# 指定仓库路径
npx -y @condorhero/git-xray ./path/to/repo

# 生成 HTML 报告并在浏览器打开
npx -y @condorhero/git-xray . --html git-xray-report.html --open

# 中文报告，仅看最近 6 个月
npx -y @condorhero/git-xray . --since "6 months ago" --lang zh
```

## 命令行

> `npm i -g @condorhero/git-xray` 后直接调用 `git-xray`。

```
用法：
  git-xray [目录] [选项]

参数：
  dir                  Git 仓库路径（默认：当前目录）

选项：
  --html [路径]        生成 HTML 报告，可指定输出路径（默认 ./git-xray-report.html）
  --no-html            跳过 HTML 报告，仅输出终端摘要
  --since <时间范围>   分析窗口（默认 "1 year ago"，如 "6 months ago"）
  --top <n>            高频变更 / Bug 列表的文件数（默认 20）
  --no-color           关闭终端彩色输出
  --lang <zh|en>       HTML 报告语言（默认根据系统 locale 自动）
  --open               生成 HTML 后自动在默认浏览器打开
  -h, --help           显示帮助
  -v, --version        显示版本
```

## 五大分析模块

| # | 模块 | 对应 git 命令 |
|---|------|--------------|
| 1 | 高频变更文件 | `git log --format=format: --name-only --since="1 year ago"` |
| 2 | 谁构建了它（Bus Factor） | `git shortlog -sn --no-merges` + 6 个月窗口对比 |
| 3 | Bug 聚集地 | `git log -i -E --grep="fix\|bug\|broken" --name-only` |
| 4 | 加速还是衰退 | `git log --format='%ad' --date=format:'%Y-%m'` |
| 5 | 救火频率 | `git log -i -E --grep="revert\|hotfix\|emergency\|rollback"` |

外加一个 **交叉风险模块**：将高频变更与 Bug 列表取交集，标出最高风险的文件
（同时出现在两份列表上的文件）。

每个模块附带一个 A / B / C 健康度评级：

- **Bus Factor**：头部贡献者占比 > 60% 评为 C
- **Velocity**：最近 6 个月均提交 < 前 6 个月均提交的 50% 评为 C
- **Firefighting**：> 1 次/月 评为 C

## HTML 报告特性

- 🌒 **暗色 / ☀️ 亮色**主题切换（默认暗色）
- 🌐 **English / 中文** 一键切换
- 🔠 **字号档位**（A− / A / A+），整体缩放
- ↕ **行距档位**（紧凑 / 标准 / 宽松），通过 CSS 变量驱动
- 📊 **内联 SVG 图表**，无任何外部资源，单文件可分享
- 🚨 **Critical / Warning** 风险徽章，对交叉命中的文件高亮
- 🎯 **文件类型图标**（📘 📜 ⚙️ …）
- ✨ 入场动画、卡片悬停交互、表格搜索友好

生成的 `.html` 文件完全自包含：可以本地打开、邮件发送、丢进任何静态服务器，
不依赖 CDN、不依赖网络。

## 编程式 API

```ts
import { writeFile } from 'node:fs/promises'
import { renderHtml, renderTerminal, runReport } from '@condorhero/git-xray'

const report = await runReport({
  cwd: './my-project',
  since: '1 year ago',
  toolVersion: '1.0.0',
})

// 终端输出
console.log(renderTerminal(report))

// 或者自己写 HTML
await writeFile('git-xray-report.html', renderHtml(report, 'zh'), 'utf8')
```

也可以只使用单个模块：

```ts
import { analyzeChurn, analyzeContributors } from '@condorhero/git-xray'

const churn = await analyzeChurn('./repo', { since: '6 months ago', top: 10 })
const contributors = await analyzeContributors('./repo')
```

## 许可

[MIT](https://github.com/condorheroblog/git-xray/blob/main/LICENSE) License © [Condor Hero](https://github.com/condorheroblog)

<!-- 徽章 -->

[npm-version-src]: https://img.shields.io/npm/v/@condorhero/git-xray?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/@condorhero/git-xray
[npm-downloads-src]: https://img.shields.io/npm/dm/@condorhero/git-xray?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/@condorhero/git-xray
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@condorhero/git-xray?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@condorhero/git-xray
[license-src]: https://img.shields.io/github/license/condorheroblog/git-xray.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/condorheroblog/git-xray/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/@condorhero/git-xray
