# Life Hub

Obsidian 融合插件：把 [Qiaomu Home](https://github.com/joeseesun/qiaomu-home) 和 [LifeOS](https://github.com/quanru/obsidian-lifeos) 收成一个入口，并接上个人日/周模板。

[Qiaomu AI RSS](https://github.com/joeseesun/qiaomu-ai-rss) 保持独立安装。首页阅读页通过乔木协议发现它，不必打进本仓库。

这不是官方乔木或 LifeOS 发行版。许可证为 GPL-3.0-only，见 `LICENSE` 与 `NOTICE.md`。

系统分层、数据模型和验收标准见 [docs/design.md](docs/design.md)（来自库内《重构的tpl-v1.md》）。首页板块、命令入口和布局版本门见 [docs/home-ia.md](docs/home-ia.md)。

## 安装

1. 构建：`npm install && npm run build`
2. 把 `main.js`、`manifest.json`、`styles.css`、`templates/`、`assets/` 拷到库的 `.obsidian/plugins/life-hub/`
3. 启用 Life Hub，关掉 `qiaomu-home`、`periodic-para`
4. 若要用阅读页 RSS，继续启用独立的 `qiaomu-ai-rss`

## 模板与默认路径

- 日记 / 周记：`010-tpl`（查询指向 `10-Projects`）
- 月记 / 季记 / 年记：LifeOS 周期复盘模板
- PARA：`10-Projects` / `20-Areas` / `30-Resources` / `40-Archives`
- 周期笔记：`PeriodicNotes`，周格式 `gggg-[W]WW`（ISO 周，周一）
- 首次启用只补缺文件，不覆盖已有模板

## 首页

驾驶舱合同见 [docs/home-ia.md](docs/home-ia.md)：主页是索引，日程放时间切片，项目放项目下一步，周期按钮只走 LifeOS 命令。实现用 `hub.layoutVersion` 只迁移一次，避免每次启用把模块叠回去。
