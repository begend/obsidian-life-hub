# Life Hub 首页与入口契约

本文是驾驶舱合同：首页怎么排、按钮走哪条命令、布局改完如何不被下次启用叠回去。PARA 目录、frontmatter、周期模板仍以 [design.md](design.md) 为准。

实现落在 `src/extras/home-layout.ts`、`src/main.ts`、`src/seed.ts`。**不改** Home / LifeOS vendor 源码（已有「今日开始 / 进行中」补丁保留）。

当前仓库代码尚未按本文迁移。`hub.layoutVersion` 升到 2 时一次性 SET；之后这份文档改了，实现必须升版本，禁止再 `ensure` 叠加。

---

## 1. 现状：为什么会重复

首页不是「设一次就停」，而是每次启用都往上叠。

- `applyHomeLayout` 的 `ensureModule` / `ensureGroup` 只增不换，所以会出现两组「周期笔记」、两组「入口」。
- `LifeHubPlugin.onload` 每次都跑 `applyHomeLayout`。
- Home 在 `homeShortcutsSeeded !== true` 时会把默认「常用入口」灌回去（`kind: daily`、X、谷歌）。
- `applyVaultDefaults` 每次强制写 PARA 路径和周格式，没有版本门。

入口也不止按钮重复，是四条创建管线：

```text
kind: daily  ──►  Home todayPath  ──►  核心 Daily Notes
builtin:daily ─►  Home openTodayNote ─►  同上
LifeOS create-*-note ──►  createPeriodicFile
QuickAdd 周记/月记 ──►  QuickAdd 自己的路径
```

日记路径现在碰巧对齐：

- 核心 Daily Notes：`PeriodicNotes` + `YYYY/[Daily]/MM/YYYY-MM-DD` + 模板 `PeriodicNotes/Templates/Daily`
- LifeOS：`periodicLocation` 日路径相同

**周记已经分叉**：LifeOS 用 ISO 周年（`gggg-[W]WW` / `isoWeekYear`），QuickAdd 用日历年。所以统一必须落在命令与创建函数，不能只靠「现在打开的是同一篇」。

---

## 2. 唯一周期入口

意图只对应一条命令，UI 只渲染这条命令。

| 意图 | 命令 | 行为 |
|---|---|---|
| 今日日记 | `periodic-para:periodic-para-create-daily-note` | `createPeriodicFile`；已有则打开 |
| 本周周记 | `periodic-para:periodic-para-create-weekly-note` | 同上，ISO 周 |
| 本月月记 | `periodic-para:periodic-para-create-monthly-note` | 同上 |
| 本季度季记 | `periodic-para:periodic-para-create-quarterly-note` | 同上 |
| 本年年度复盘 | `periodic-para:periodic-para-create-yearly-note` | 同上 |
| 记一条 | `periodic-para:periodic-para-quick-record` | 写入今日日记 `## 日常记录` |

禁止作为用户按钮出现：

- Home 快捷方式 `kind: daily`
- Home 动作 `builtin:daily`（放进 `hiddenActions`，避免 + 菜单再走 `openTodayNote`）
- `periodic-para:periodic-para-open-today-records`（与今日日记同一文件）
- `periodic-para:periodic-para-create-notes`（任意日期创建器；需要时用命令面板）
- QuickAdd 打开周记 / 月记

项目侧创建仍走 QuickAdd，**只放项目页**，不和日记管线混用：

- 新建项目
- 新建任务
- 记一件杂事

---

## 3. Home 内部读今日路径：对齐，不 fork

`vendor/qiaomu-home/src/today.ts` 的 `todayPath` 仍给「今日重点 / 习惯 / 捕获写日记」用。本轮不改 vendor。

保护手段：

1. 核心 Daily Notes 必须与 LifeOS 日路径、日模板一致。
2. `hub.layoutVersion` 从小于 2 升到 2 时校验这三项；不一致则写一次 `.obsidian/daily-notes.json`。版本已到则不再写。
3. 不把 `kind: daily` 当作用户按钮。内部读写可以继续走 `todayPath`，用户点击一律 LifeOS 命令。

周 / 月没有核心插件对等物，只允许 LifeOS。

---

## 4. 捕获落点

- 主页保留一个 Home「快速记录」框：`captureTarget = daily`，写进同一篇今日日记。Home 是文件末尾追加；LifeOS「记一条」插入 `## 日常记录`。同一文件、两种插入位置，本轮不补 vendor 标题插入。
- `captureInboxPath` 不再作为主页捕获默认。`00-Inbox/` 留给以后 GTD 澄清，不跟驾驶舱抢入口。
- 「快速任务」`periodic-para-quick-task` 不放主页、不放日程；升格待办走项目页「新建任务」。

---

## 5. 四页互斥布局（v2 SET）

原则：每张任务卡只出现在一个标签；每个命令按钮只出现一次；主页是索引，不是把其他页粘过来。

时间切片（逾期 / 今日到期 / 今日开始 / 进行中）只放日程。同一条任务可以同时出现在两张时间卡上，这是切片重叠，不是 bug。

「项目下一步」不是时间切片：每篇项目笔记的第一件未完成行内任务。只放项目页。

### 主页（索引）

可见模块：`daily-focus`、`quick-capture`、`recent`

快捷组 `life-hub-nav`：

- 今日日记（LifeOS 日命令）
- `90-System/Dashboards/今日任务.md`
- `90-System/Dashboards/项目中心.md`
- `90-System/Dashboards/知识中心.md`
- `90-System/Dashboards/阅读中心.md`

隐藏并从 `moduleOrder` 拿掉：`todo`、`inbox-preview`、`focus-timer`、`due-today`、`start-today`、`in-progress`、`overdue`、`project-next`、组 `home-shortcuts`、组 `life-hub-period`。

### 日程（什么时候做）

快捷组 `life-hub-period`：今日日记、本周周记、本月月记、本季度季记、本年年度复盘、记一条。

卡片顺序：`overdue` → `due-today` → `start-today` → `in-progress`，可选 `day-progress`。

删除整组 `schedule-notes`。不要：今日任务、项目下一步、LifeOS 创建器、快速任务、今日记录。

### 项目（做什么、属于哪个项目）

快捷组 `life-hub-projects`：项目中心、项目看板（`90-System/Bases/Projects.base`）、项目文件夹（`10-Projects`）、今日任务、新建项目、新建任务、记一件杂事。

卡片：`project-next`、`in-progress`。

删除组 `project-links`、模块 `quickadd-actions`，以及到期 / 逾期 / 今日开始。

### 专注（把一件事做完）

模块：`focus-timer`、`ambient-sound`，最多一张 `in-progress`。

去掉：到期、逾期、今日开始、`day-progress`（日程已有）。

### 知识 / 阅读

各留一个中心笔记入口（组 `life-hub-knowledge` / `life-hub-reading`）。不改搜索、标签云、Reader、RSS 等职责。

娱乐 / 探索：本契约不改。

---

## 6. 用版本门保护这次重构

根级 `data.json` 增加 `hub` 段，与 `home` / `lifeos` 并列：

```json
{
  "hub": { "layoutVersion": 2, "settingsVersion": 1 },
  "home": {},
  "lifeos": {}
}
```

常量 `CURRENT_LAYOUT_VERSION = 2`。

- `layoutVersion < 2`：对托管页做 SET（写死 `moduleOrder`、托管 `shortcutGroups`、不该出现的模块 `visible: false` 并从 order 拿掉），然后写成 `2`。
- `layoutVersion === 2`：整段跳过 `applyHomeLayout`。用户之后自己藏卡片、改顺序，下次启动不得加回来。
- 以后要再改布局：升到 3，写针对性迁移。禁止再发明 `ensure` 叠层。

托管组 ID 白名单：

- `life-hub-nav`
- `life-hub-period`
- `life-hub-projects`
- `life-hub-knowledge`
- `life-hub-reading`

迁移时删掉或清空：`home-shortcuts`、`schedule-notes`、`project-links`。用户自建的非托管组保留。

同时把 `home.homeShortcutsSeeded = true`，防止 Home 自己的默认入口回种。

`applyVaultDefaults` 使用 `hub.settingsVersion`：只在空值或已知上游默认（如 `1. Projects`）时写入 PARA / 周格式 / 周期根目录。版本已到则不再每 onload 强制覆盖。

---

## 7. 旧插件冲突

启用时若 `qiaomu-home` 或 `periodic-para` 仍在 `community-plugins.json` 且处于 enabled：Notice 警告并拒绝 `bootHosted`，避免两套 `plugins.plugins` 抢同一 id。不自动改社区插件列表。

`qiaomu-ai-rss` 与 `qiaomu-reader` 保持独立启用。

---

## 8. 明确不做

- 不改 Home / LifeOS vendor 源码（已有任务卡补丁除外）
- 不统一 Tasks 查询范围（`10-Projects` vs `timeManage` vs `type: task`）
- 不把 Home 捕获改成插入 `## 日常记录`
- 不搬 `timeManage/`、`Day Planners/` 等存量目录
- 不把 [design.md](design.md) 整篇改写成首页方案
- 不把整个 Obsidian 库提交进本仓库

---

## 9. 实现顺序

1. 本文进仓库（本步）。
2. 重写 `applyHomeLayout` 为 SET + `hub.layoutVersion`。
3. 周期入口只挂第 2 节命令表；隐藏 `kind: daily` / `builtin:daily` / QuickAdd 周月。
4. `settingsVersion` 门禁 `applyVaultDefaults`；layout v2 迁移时校验 Daily Notes。
5. 构建装进库后人工点四页：无重复组、今日日记只开一篇、周记走 ISO 路径。
