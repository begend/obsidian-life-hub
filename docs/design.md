# Obsidian 个人系统最终方案 v1.0

## 一、总体定位

最终形成四层架构：

```text
Qiaomu Home
  = 统一入口 / 驾驶舱 / 搜索 / 捕获 / 导航

LifeOS
  = 数据层 / 周期笔记 / PARA 主题索引 / 任务聚合 / 复盘

Bases
  = 项目、任务、知识、阅读的可视化浏览层

Dataview + Tasks
  = 动态计算与任务执行层
```

核心原则：

1. **Qiaomu Home 不存数据**
2. **LifeOS 是唯一的周期笔记与任务聚合中心**
3. **Bases 只负责浏览、筛选、排序和看板展示**
4. **Dataview 保留，不整体替换**
5. **简单任务用行内任务，复杂任务用任务笔记**
6. **先标准化属性，再迁移目录**

---

# 二、最终目录结构

目标目录：

```text
00-Inbox/
10-Projects/
20-Areas/
30-Resources/
40-Archives/
90-System/
    Bases/
    Dashboards/
    Templates/
PeriodicNotes/
attachment/
Excalidraw/
Books/
copilot/
```

说明：

- `PeriodicNotes` 保持不动，避免影响 LifeOS
- `attachment` 保持不动，避免破坏附件引用
- `Excalidraw`、`Books`、`copilot` 作为系统或资源目录保留
- 旧数据通过分批迁移进入标准目录

## 现有目录迁移目标

| 现有目录 | 最终位置 | 处理方式 |
|---|---|---|
| `Inbox` | `00-Inbox` | 先保留，逐步整理 |
| `Inbox_v1` | `00-Inbox/Legacy` | 历史收件箱 |
| `timeManage/project` | `10-Projects` | 真实项目迁移 |
| `project` | 拆分 | 真项目进 `10-Projects`，主题知识进 `30-Resources` |
| `个人` | `20-Areas/个人` | 长期领域 |
| `工作` | `20-Areas/工作` | 长期领域 |
| `业务` | `20-Areas/业务` | 长期领域 |
| `医药` | `20-Areas/医药` | 视内容判断 |
| `思考` | `30-Resources/思考` | 知识资源 |
| `计算机` | `30-Resources/技术` | 知识资源 |
| `week` | `30-Resources/读书笔记` | 读书内容 |
| `微信阅读` | `30-Resources/微信读书` | 读书笔记 |
| `Evernote` | `30-Resources/Evernote` | 先保留，后按内容拆分 |
| `booknote` | `40-Archives/booknote` | 旧阅读工具数据 |
| `历史` | `30-Resources/历史` | 主题资料 |
| `总结` | `40-Archives/个人复盘` | 历史总结 |
| `Day Planners` | 迁移进 `PeriodicNotes` 或归档 | 旧日记系统 |
| `010-tpl` | `90-System/Templates` | 系统模板 |
| `Taskido` | 删除 | 空目录 |

---

# 三、标准数据模型

## 1. 项目笔记

```yaml
---
type: project
status: active
priority: P1
area: work
start: 2026-10-01
due: 2026-12-31
progress: 40
tags:
  - project/payment-platform
---
```

字段定义：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | 文本 | 固定为 `project` |
| `status` | 文本 | `backlog/planned/active/paused/done` |
| `priority` | 文本 | `P0/P1/P2/P3` |
| `area` | 文本或链接 | 所属领域 |
| `start` | 日期 | 开始日期 |
| `due` | 日期 | 截止日期 |
| `progress` | 数字 | 0–100 |
| `tags` | 标签 | `project/xxx` |

---

## 2. 任务笔记

用于需要优先级、起止时间、子任务和 Bases 管理的重要任务。

```yaml
---
type: task
status: todo
priority: P1
description: 完成支付平台接口设计
project: "[[10-Projects/支付平台/支付平台]]"
parent_task: ""
start: 2026-10-20
due: 2026-10-30
estimate: 8
tags:
  - task
---
```

字段定义：

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | 文本 | 固定为 `task` |
| `status` | 文本 | `todo/doing/blocked/done/cancelled` |
| `priority` | 文本 | `P0/P1/P2/P3` |
| `description` | 文本 | 简短任务描述 |
| `project` | 链接 | 所属项目 |
| `parent_task` | 链接 | 父任务，用于子任务 |
| `start` | 日期 | 开始日期 |
| `due` | 日期 | 截止日期 |
| `estimate` | 数字 | 预计工时 |

---

## 3. 子任务

子任务也是任务笔记，区别在于：

```yaml
type: task
parent_task: "[[Tasks/父任务]]"
project: "[[10-Projects/项目]]"
```

Bases 通过 `parent_task` 字段识别子任务。

---

## 4. 行内轻量任务

简单任务继续使用 Markdown 任务：

```markdown
- [ ] 回复客户邮件 #project/payment-platform
```

规则：

- 一天内能完成、不需要复杂字段的任务 → 行内任务
- 需要优先级、起止时间、子任务、看板管理 → 任务笔记
- 项目推进中的关键交付 → 任务笔记

---

# 四、Bases 最终设计

## 1. Projects.base

路径：

```text
90-System/Bases/Projects.base
```

包含视图：

### 项目总表

- 类型：Table
- 过滤：`type == "project"`
- 列：项目、状态、优先级、领域、开始、截止、进度
- 分组：`status`

### 项目看板

- 类型：Kanban
- 过滤：`type == "project"`
- 分组：`status`

### 任务总表

- 类型：Table
- 过滤：`type == "task"`
- 列：任务、项目、父任务、状态、优先级、开始、截止、描述
- 分组：`project`

### 任务看板

- 类型：Kanban
- 过滤：`type == "task"`
- 分组：`status`
- 卡片展示：任务、优先级、截止时间、所属项目

### 今日任务

- 类型：List 或 Table
- 过滤：
  - `type == "task"`
  - `status != "done"`
  - `due` 等于今天

### 逾期任务

- 类型：Table
- 过滤：
  - `type == "task"`
  - `status != "done"`
  - `due < today`

### 子任务

- 类型：Table
- 过滤：
  - `type == "task"`
  - `parent_task` 非空
- 列：子任务、父任务、项目、状态、优先级、截止

---

## 2. Knowledge.base

路径：

```text
90-System/Bases/Knowledge.base
```

视图：

- 全部知识
- 按领域
- 按主题标签
- 最近修改
- 孤立笔记
- 待整理笔记

---

## 3. Reading.base

路径：

```text
90-System/Bases/Reading.base
```

字段：

- 书名
- 作者
- 阅读状态
- 开始时间
- 完成时间
- 评分
- 笔记数量

视图：

- 在读
- 想读
- 已读
- 按主题

---

# 五、Qiaomu Home 最终页面

首页标签、按钮命令、任务卡互斥和 `hub.layoutVersion` 以 [home-ia.md](home-ia.md) 为准。下面只保留仪表盘笔记里嵌 Bases 的部分，避免和驾驶舱合同两套清单。

## 1. 首页 / 日程 / 专注

见 [home-ia.md](home-ia.md) 第 2 节（唯一周期入口）和第 5 节（四页互斥布局）。

## 2. 项目中心（Dashboard 笔记）

Qiaomu Home 不直接嵌入完整 Base，而是提供入口：

```text
项目中心 → 90-System/Dashboards/项目中心.md
```

项目中心笔记内嵌：

```markdown
# 项目中心

## 项目总表
![[Projects.base#项目总表]]

## 项目看板
![[Projects.base#项目看板]]

## 任务总表
![[Projects.base#任务总表]]

## 任务看板
![[Projects.base#任务看板]]

## 逾期任务
![[Projects.base#逾期任务]]
```

Home 项目页上的卡片与按钮见 [home-ia.md](home-ia.md) 第 5 节，不在这里再列一套。

## 3. 知识中心

入口：

- Vault 搜索
- Vault Index 语义搜索
- Knowledge.base
- 标签云
- 最近修改
- 回顾一篇
- 孤立笔记

## 4. 阅读中心

- Qiaomu Reader
- Qiaomu AI RSS
- 微信读书
- Reading.base

---

# 六、LifeOS 配置

- 周期笔记根目录：`PeriodicNotes`
- PARA 路径迁移后更新为：
  - Projects：`10-Projects`
  - Areas：`20-Areas`
  - Resources：`30-Resources`
  - Archives：`40-Archives`
- `dailyRecordHeader`：`日常记录`
- `habitHeader`：`日常习惯`
- 主题索引样式：`README.md`
- 主题标签：`project/xxx`、`area/xxx`、`resource/xxx`

每个主题目录建立：

```text
README.md
```

示例：

```yaml
---
tags:
  - project/payment-platform
---
```

---

# 七、存量数据迁移顺序

## 阶段 0：备份与索引

- 全量备份
- 统计所有 Markdown 文件
- 生成重复文件报告
- 生成无标签、无属性、孤立笔记报告
- 记录所有待迁移目录

## 阶段 1：建立新骨架

创建：

```text
00-Inbox/
10-Projects/
20-Areas/
30-Resources/
40-Archives/
90-System/Bases/
90-System/Dashboards/
90-System/Templates/
```

此阶段不移动旧文件。

## 阶段 2：标准化属性

优先处理：

- 项目笔记
- 领域笔记
- 资源笔记
- 书籍笔记

补齐：

- `type`
- `status`
- `priority`
- `tags`
- `start`
- `due`
- `project`
- `parent_task`

## 阶段 3：建立 LifeOS 主题索引

为以下目录生成 README：

- `project/理财`
- `project/历史`
- `个人/家人`
- `个人/沟通表达`
- `思考` 下的关键主题
- `总结/个人复盘`

## 阶段 4：迁移项目数据

- 把真实项目从 `project` 和 `timeManage/project` 迁入 `10-Projects`
- 项目主题资料迁入 `30-Resources`
- 已完成项目迁入 `40-Archives`

## 阶段 5：迁移知识数据

- `思考` → `30-Resources/思考`
- `计算机` → `30-Resources/技术`
- `week` → `30-Resources/读书笔记`
- `微信阅读` → `30-Resources/微信读书`
- `Evernote` 按主题拆分或整体放 `30-Resources`
- `历史` → `30-Resources/历史`

## 阶段 6：迁移日期数据

- 旧 `Day Planners` 日记按日期映射到 `PeriodicNotes/YYYY/Daily/MM/`
- 周记映射到 `PeriodicNotes/YYYY/Weekly/`
- 先检测重复日期和重复内容
- 使用 Obsidian 内部移动，保留双链
- 迁移前保留旧目录只读副本
- 无法确认归属的旧日记放 `40-Archives/Legacy/DayPlanners`

## 阶段 7：归档

- `Inbox_v1` → `00-Inbox/Legacy`
- `总结` → `40-Archives/个人复盘`
- `booknote` → `40-Archives/booknote`
- 空目录和失效目录清理

## 阶段 8：建立 Bases 与 Qiaomu Home 入口

- 创建 `Projects.base`
- 创建 `Knowledge.base`
- 创建 `Reading.base`
- 创建 `90-System/Dashboards/项目中心.md`
- 创建 `90-System/Dashboards/知识中心.md`
- 在 Qiaomu Home 加上对应快捷入口

---

# 八、Dataview 与 Bases 的最终分工

```text
Properties
  = 数据契约

Bases
  = 项目、任务、知识、阅读的浏览和看板

Dataview
  = LifeOS 主题索引、跨文件计算、复杂统计

DataviewJS
  = 日记内的习惯统计、工作统计

Tasks
  = 行内任务、轻量任务、任务完成状态

LifeOS
  = 日周月季年周期笔记、复盘、PARA 聚合
```

明确不做的：

- 不用 Bases 完全替换 Dataview
- 不把 daily-tpl 整个改写成 Bases
- 不把所有行内任务都改成独立任务文件
- 不让 Qiaomu Home 承担数据库存储

---

# 九、验收标准

最终系统满足：

1. Qiaomu Home 可以一键进入：
   - 今日日记
   - 周记、月记、季记、年记
   - 项目中心
   - 知识中心
   - 阅读中心
   - 全局搜索和语义搜索

2. LifeOS：
   - 日周月季年笔记正常创建
   - 主题选择器能识别 README 索引
   - 日记中的任务、记录、文件能被主题聚合
   - 周月季年复盘正常

3. Bases：
   - 项目总表和项目看板正常
   - 任务总表和任务看板正常
   - 任务可关联项目和父任务
   - 可按优先级、状态、开始时间、截止时间过滤排序

4. Tasks：
   - 行内任务仍可正常勾选
   - 今日任务、逾期任务正常显示

5. 数据：
   - 无重复日记
   - 无双套周记
   - 旧笔记链接不断
   - 所有迁移有备份和迁移日志

---

# 十、执行原则

1. 每阶段先备份
2. 先建属性，再动目录
3. 先迁项目，再迁知识，最后迁日期
4. 所有移动使用 Obsidian 内部移动以保留双链
5. Bases 先做 3 个核心库：项目、知识、阅读
6. Qiaomu Home 先做入口，不做重型嵌入
7. LifeOS 和 Dataview 保持现有能力，不冒险替换

这就是最终方案。下一步可以按阶段 1 开始落地：创建标准目录、Bases 骨架、项目中心 Dashboard 和 Qiaomu Home 页面入口。