# Life Hub

Obsidian 融合插件：把 [Qiaomu Home](https://github.com/joeseesun/qiaomu-home)、[LifeOS](https://github.com/quanru/obsidian-lifeos) 和 [Qiaomu AI RSS](https://github.com/joeseesun/qiaomu-ai-rss) 收成一个入口，并接上个人日/周模板。

这不是官方乔木或 LifeOS 发行版。许可证为 GPL-3.0-only，见 `LICENSE` 与 `NOTICE.md`。

系统分层、数据模型和验收标准见 [docs/design.md](docs/design.md)（来自库内《重构的tpl-v1.md》）。

## 安装

1. 构建：`npm install && npm run build`
2. 把 `main.js`、`manifest.json`、`styles.css`、`templates/`、`assets/` 拷到库的 `.obsidian/plugins/life-hub/`
3. 启用 Life Hub，关掉 `qiaomu-home`、`periodic-para`、`qiaomu-ai-rss`

## 模板与默认路径

- 日记 / 周记：`010-tpl`（查询指向 `10-Projects`）
- 月记 / 季记 / 年记：LifeOS 周期复盘模板
- PARA：`10-Projects` / `20-Areas` / `30-Resources` / `40-Archives`
- 周期笔记：`PeriodicNotes`，周格式 `gggg-[W]WW`（ISO 周，周一）
- 首次启用只补缺文件，不覆盖已有模板

## 首页

日程页带「今日开始」「进行中」；快捷入口指向 LifeOS 周期命令、项目中心和今日任务。
