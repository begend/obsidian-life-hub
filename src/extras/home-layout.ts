import type QiaomuHomePlugin from "../../vendor/qiaomu-home/src/main";
import type { HomePage, HomeSettings, ModuleOptions } from "../../vendor/qiaomu-home/src/settings";
import type { Shortcut, ShortcutGroup } from "../../vendor/qiaomu-home/src/shortcuts";

/**
 * 驾驶舱布局契约（docs/home-ia.md 第 5/6 节）：
 * v2 迁移对托管页做一次性 SET，之后 layoutVersion === 2 时整段跳过。
 * 用户手动改过的布局不会被下次启动加回来；要再改布局必须升版本写针对性迁移。
 */
export const CURRENT_LAYOUT_VERSION = 2;

export interface HubData {
  layoutVersion?: number;
  settingsVersion?: number;
}

const TASK_FOLDER = "10-Projects";

/** 托管快捷组白名单：迁移时只会替换这些 id，用户自建组不动。 */
const MANAGED_GROUP_IDS = ["life-hub-nav", "life-hub-period", "life-hub-projects", "life-hub-knowledge", "life-hub-reading"];

/** 迁移时删除的旧组（Home 默认入口、旧系统入口、日程笔记、项目链接）。 */
const REMOVED_GROUP_IDS = ["home-shortcuts", "life-hub-entry", "schedule-notes", "project-links"];

/** 主页不再出现的模块：隐藏并从 moduleOrder 拿掉。 */
const HIDDEN_ON_HOME = ["todo", "inbox-preview", "focus-timer", "due-today", "start-today", "in-progress", "overdue", "project-next"];

/**
 * 项目侧创建走 QuickAdd，命令 id 取决于 QuickAdd Choice 配置。
 * 如果你的 QuickAdd 命令 id 不同，改这里即可。
 */
const QUICKADD_NEW_PROJECT = "quickadd:新建项目";
const QUICKADD_NEW_TASK = "quickadd:新建任务";
const QUICKADD_CHORE = "quickadd:记一件杂事";

const PERIOD_SHORTCUTS: Shortcut[] = [
  { id: "daily-note", kind: "command", target: "periodic-para:periodic-para-create-daily-note", name: "今日日记", icon: "calendar" },
  { id: "weekly-note", kind: "command", target: "periodic-para:periodic-para-create-weekly-note", name: "本周周记", icon: "calendar" },
  { id: "monthly-note", kind: "command", target: "periodic-para:periodic-para-create-monthly-note", name: "本月月记", icon: "calendar" },
  { id: "quarterly-note", kind: "command", target: "periodic-para:periodic-para-create-quarterly-note", name: "本季度季记", icon: "calendar" },
  { id: "yearly-note", kind: "command", target: "periodic-para:periodic-para-create-yearly-note", name: "本年年度复盘", icon: "calendar" },
  { id: "quick-record", kind: "command", target: "periodic-para:periodic-para-quick-record", name: "记一条", icon: "pencil" },
];

const NAV_SHORTCUTS: Shortcut[] = [
  { id: "daily-note", kind: "command", target: "periodic-para:periodic-para-create-daily-note", name: "今日日记", icon: "calendar" },
  { id: "today-tasks", kind: "file", target: "90-System/Dashboards/今日任务.md", name: "今日任务", icon: "list-checks" },
  { id: "project-hub", kind: "file", target: "90-System/Dashboards/项目中心.md", name: "项目中心", icon: "briefcase" },
  { id: "knowledge-hub", kind: "file", target: "90-System/Dashboards/知识中心.md", name: "知识中心", icon: "library" },
  { id: "reading-hub", kind: "file", target: "90-System/Dashboards/阅读中心.md", name: "阅读中心", icon: "book-open" },
];

const PROJECT_SHORTCUTS: Shortcut[] = [
  { id: "project-hub", kind: "file", target: "90-System/Dashboards/项目中心.md", name: "项目中心", icon: "briefcase" },
  { id: "projects-board", kind: "file", target: "90-System/Bases/Projects.base", name: "项目看板", icon: "square-kanban" },
  { id: "projects-folder", kind: "folder", target: "10-Projects", name: "项目文件夹", icon: "folder" },
  { id: "today-tasks", kind: "file", target: "90-System/Dashboards/今日任务.md", name: "今日任务", icon: "list-checks" },
  { id: "new-project", kind: "command", target: QUICKADD_NEW_PROJECT, name: "新建项目", icon: "plus" },
  { id: "new-task", kind: "command", target: QUICKADD_NEW_TASK, name: "新建任务", icon: "list-plus" },
  { id: "quick-chore", kind: "command", target: QUICKADD_CHORE, name: "记一件杂事", icon: "pencil" },
];

function group(id: string, name: string, items: Shortcut[]): ShortcutGroup {
  return { id, name, items };
}

function findPage(settings: HomeSettings, id: string): HomePage | undefined {
  return settings.pages.find((item) => item.id === id);
}

function ensurePage(settings: HomeSettings, id: string, name: string): HomePage {
  let existing = findPage(settings, id);
  if (!existing) {
    existing = {
      id,
      name,
      moduleOptions: {},
      moduleOrder: [],
      shortcutGroups: [],
      defaultVisible: true,
      showRecommendations: false,
    };
    settings.pages.push(existing);
  }
  return existing;
}

/** SET moduleOrder + options：先写目标顺序，再把不该出现的模块隐藏并移出 order。 */
function setModules(page: HomePage, order: Array<{ id: string; options?: Partial<ModuleOptions> }>, hidden: string[] = []): void {
  const nextOptions: Record<string, ModuleOptions> = { ...page.moduleOptions };
  const nextOrder: string[] = [];
  for (const entry of order) {
    nextOptions[entry.id] = { visible: true, limit: 8, ...nextOptions[entry.id], ...entry.options };
    nextOrder.push(entry.id);
  }
  for (const id of hidden) {
    if (nextOrder.includes(id)) continue;
    nextOptions[id] = { ...nextOptions[id], visible: false };
  }
  page.moduleOptions = nextOptions;
  page.moduleOrder = nextOrder;
}

/** 替换托管组（按 id），删除旧组，用户自建组保留。 */
function setGroups(page: HomePage, managed: ShortcutGroup[]): void {
  const kept = page.shortcutGroups.filter(
    (item) => !REMOVED_GROUP_IDS.includes(item.id) && !MANAGED_GROUP_IDS.includes(item.id),
  );
  page.shortcutGroups = [...kept, ...managed];
  for (const item of managed) {
    const moduleId = `shortcut:${item.id}`;
    page.moduleOptions[moduleId] = { visible: true, limit: 3, ...page.moduleOptions[moduleId] };
  }
  // 被删组的快捷模块也移出 order / 隐藏
  for (const id of REMOVED_GROUP_IDS) {
    const moduleId = `shortcut:${id}`;
    if (page.moduleOptions[moduleId]) page.moduleOptions[moduleId] = { ...page.moduleOptions[moduleId], visible: false };
  }
}

function taskOptions(limit = 8): Partial<ModuleOptions> {
  return { folder: TASK_FOLDER, limit };
}

/**
 * layoutVersion < 2 时的一次性迁移（home-ia.md 第 5/6 节）。
 * 四页互斥：时间切片只在日程；项目下一步只在项目页；主页是索引。
 */
export function applyHomeLayout(home: QiaomuHomePlugin): boolean {
  const settings = home.settings;

  // —— Home 级设置 ——
  settings.captureTarget = "daily";
  if (!settings.captureInboxPath || settings.captureInboxPath === "Inbox.md") {
    settings.captureInboxPath = "00-Inbox/Inbox.md";
  }
  settings.homeShortcutsSeeded = true;
  if (!settings.hiddenActions.includes("builtin:daily")) settings.hiddenActions.push("builtin:daily");

  // —— 主页（索引）——
  const homePage = ensurePage(settings, "home", "首页");
  setGroups(homePage, [group("life-hub-nav", "Life Hub 导航", NAV_SHORTCUTS)]);
  setModules(
    homePage,
    [
      { id: "shortcut:life-hub-nav" },
      { id: "daily-focus" },
      { id: "quick-capture" },
      { id: "recent" },
    ],
    HIDDEN_ON_HOME,
  );

  // —— 日程（什么时候做）：唯一放时间切片的页 ——
  const schedulePage = ensurePage(settings, "schedule", "日程中心");
  setGroups(schedulePage, [group("life-hub-period", "周期笔记", PERIOD_SHORTCUTS)]);
  setModules(
    schedulePage,
    [
      { id: "overdue", options: taskOptions() },
      { id: "due-today", options: taskOptions() },
      { id: "start-today", options: taskOptions() },
      { id: "in-progress", options: taskOptions() },
    ],
    ["project-next", "focus-timer", "day-progress"],
  );

  // —— 项目（做什么）：项目下一步 + 进行中 ——
  const projectsPage = ensurePage(settings, "projects", "项目中心");
  setGroups(projectsPage, [group("life-hub-projects", "项目入口", PROJECT_SHORTCUTS)]);
  setModules(
    projectsPage,
    [
      { id: "project-next", options: taskOptions() },
      { id: "in-progress", options: taskOptions() },
      { id: "shortcut:life-hub-projects" },
    ],
    ["due-today", "start-today", "overdue"],
  );

  // —— 专注（把一件事做完）——
  const focusPage = ensurePage(settings, "focus", "专注");
  setGroups(focusPage, []);
  setModules(
    focusPage,
    [
      { id: "focus-timer" },
      { id: "ambient-sound" },
      { id: "in-progress", options: taskOptions(1) },
    ],
    ["due-today", "start-today", "overdue", "day-progress"],
  );

  // —— 知识 / 阅读：各留一个中心笔记入口 ——
  const knowledgePage = ensurePage(settings, "knowledge", "知识中心");
  setGroups(knowledgePage, [
    group("life-hub-knowledge", "知识入口", [
      { id: "knowledge-hub", kind: "file", target: "90-System/Dashboards/知识中心.md", name: "知识中心", icon: "library" },
    ]),
  ]);
  const readingPage = ensurePage(settings, "reading", "阅读中心");
  setGroups(readingPage, [
    group("life-hub-reading", "阅读入口", [
      { id: "reading-hub", kind: "file", target: "90-System/Dashboards/阅读中心.md", name: "阅读中心", icon: "book-open" },
    ]),
  ]);

  return true;
}
