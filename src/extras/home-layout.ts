import type QiaomuHomePlugin from "../../vendor/qiaomu-home/src/main";
import type { HomePage, ModuleOptions } from "../../vendor/qiaomu-home/src/settings";
import type { Shortcut, ShortcutGroup } from "../../vendor/qiaomu-home/src/shortcuts";

const TASK_FOLDER = "10-Projects";
const TASK_MODULES = ["due-today", "start-today", "in-progress", "overdue", "project-next"];

function ensureModule(page: HomePage, id: string, extra: Partial<ModuleOptions> = {}): boolean {
  let changed = false;
  if (!page.moduleOptions[id]) {
    page.moduleOptions[id] = { visible: true, limit: 8, ...extra };
    changed = true;
  }
  if (!page.moduleOrder.includes(id)) {
    page.moduleOrder.push(id);
    changed = true;
  }
  if (TASK_MODULES.includes(id) && page.moduleOptions[id].folder !== TASK_FOLDER) {
    page.moduleOptions[id].folder = TASK_FOLDER;
    changed = true;
  }
  return changed;
}

function ensureGroup(page: HomePage, group: ShortcutGroup): boolean {
  const existing = page.shortcutGroups.find((item) => item.id === group.id);
  const moduleId = `shortcut:${group.id}`;
  let changed = false;
  if (!existing) {
    page.shortcutGroups.push(group);
    changed = true;
  } else {
    for (const item of group.items) {
      if (!existing.items.some((entry) => entry.id === item.id)) {
        existing.items.push(item);
        changed = true;
      }
    }
  }
  if (!page.moduleOptions[moduleId]) {
    page.moduleOptions[moduleId] = { visible: true, limit: 3 };
    changed = true;
  }
  if (!page.moduleOrder.includes(moduleId)) {
    page.moduleOrder.push(moduleId);
    changed = true;
  }
  return changed;
}

function page(id: string, name: string, modules: string[]): HomePage {
  return {
    id,
    name,
    moduleOptions: Object.fromEntries(modules.map((moduleId) => [moduleId, { visible: true, limit: 8 }])),
    moduleOrder: [...modules],
    shortcutGroups: [],
    defaultVisible: true,
    showRecommendations: false,
  };
}

const PERIOD_SHORTCUTS: Shortcut[] = [
  { id: "daily-note", kind: "command", target: "periodic-para:periodic-para-create-daily-note", name: "今日日记", icon: "calendar" },
  { id: "weekly-note", kind: "command", target: "periodic-para:periodic-para-create-weekly-note", name: "本周周记", icon: "calendar" },
  { id: "monthly-note", kind: "command", target: "periodic-para:periodic-para-create-monthly-note", name: "本月月记", icon: "calendar" },
  { id: "quarterly-note", kind: "command", target: "periodic-para:periodic-para-create-quarterly-note", name: "本季度季记", icon: "calendar" },
  { id: "yearly-note", kind: "command", target: "periodic-para:periodic-para-create-yearly-note", name: "本年年度复盘", icon: "calendar" },
  { id: "quick-record", kind: "command", target: "periodic-para:periodic-para-quick-record", name: "快速记录", icon: "pencil" },
  { id: "quick-task", kind: "command", target: "periodic-para:periodic-para-quick-task", name: "快速任务", icon: "list-checks" },
];

const HUB_SHORTCUTS: Shortcut[] = [
  { id: "today-tasks", kind: "file", target: "90-System/Dashboards/今日任务.md", name: "今日任务", icon: "list-checks" },
  { id: "project-hub", kind: "file", target: "90-System/Dashboards/项目中心.md", name: "项目中心", icon: "briefcase" },
  { id: "knowledge-hub", kind: "file", target: "90-System/Dashboards/知识中心.md", name: "知识中心", icon: "library" },
  { id: "reading-hub", kind: "file", target: "90-System/Dashboards/阅读中心.md", name: "阅读中心", icon: "book-open" },
  { id: "projects-folder", kind: "folder", target: "10-Projects", name: "项目文件夹", icon: "folder" },
];

export function applyHomeLayout(home: QiaomuHomePlugin): boolean {
  const settings = home.settings;
  let changed = false;
  if (!settings.captureInboxPath || settings.captureInboxPath === "Inbox.md") {
    settings.captureInboxPath = "00-Inbox/Inbox.md";
    changed = true;
  }
  if (!settings.pages.find((item) => item.id === "schedule")) {
    settings.pages.push(page("schedule", "日程中心", ["due-today", "start-today", "in-progress", "overdue", "focus-timer", "daily-calendar"]));
    changed = true;
  }
  if (!settings.pages.find((item) => item.id === "projects")) {
    settings.pages.push(page("projects", "项目中心", ["due-today", "overdue", "project-next", "start-today", "in-progress"]));
    changed = true;
  }
  for (const item of settings.pages) {
    if (item.id === "home") {
      changed = ensureModule(item, "quick-capture") || changed;
      changed = ensureModule(item, "inbox-preview") || changed;
      changed = ensureModule(item, "todo") || changed;
      changed = ensureModule(item, "daily-focus") || changed;
      changed = ensureModule(item, "focus-timer") || changed;
      changed = ensureModule(item, "recent") || changed;
      changed = ensureModule(item, "due-today") || changed;
      changed = ensureModule(item, "start-today") || changed;
      changed = ensureModule(item, "in-progress") || changed;
      changed = ensureGroup(item, { id: "life-hub-entry", name: "系统入口", items: HUB_SHORTCUTS }) || changed;
      changed = ensureGroup(item, { id: "life-hub-period", name: "周期笔记", items: PERIOD_SHORTCUTS }) || changed;
    }
    if (item.id === "focus" || item.id === "schedule" || item.id === "projects") {
      changed = ensureModule(item, "due-today") || changed;
      changed = ensureModule(item, "start-today") || changed;
      changed = ensureModule(item, "in-progress") || changed;
      changed = ensureModule(item, "overdue") || changed;
    }
    if (item.id === "schedule") {
      changed = ensureGroup(item, { id: "life-hub-period", name: "周期笔记", items: PERIOD_SHORTCUTS }) || changed;
    }
    if (item.id === "projects") {
      changed = ensureModule(item, "project-next") || changed;
      changed = ensureGroup(item, { id: "life-hub-projects", name: "项目入口", items: HUB_SHORTCUTS.filter((entry) => ["today-tasks", "project-hub", "projects-folder"].includes(entry.id)) }) || changed;
    }
    if (item.id === "knowledge") {
      changed = ensureModule(item, "recently-modified") || changed;
      changed = ensureModule(item, "review-note") || changed;
      changed = ensureModule(item, "tag-cloud") || changed;
      changed = ensureModule(item, "orphan-notes") || changed;
      changed = ensureGroup(item, { id: "life-hub-knowledge", name: "知识入口", items: [{ id: "knowledge-hub", kind: "file", target: "90-System/Dashboards/知识中心.md", name: "知识中心", icon: "library" }] }) || changed;
    }
    if (item.id === "reading") {
      changed = ensureGroup(item, { id: "life-hub-reading", name: "阅读入口", items: [{ id: "reading-hub", kind: "file", target: "90-System/Dashboards/阅读中心.md", name: "阅读中心", icon: "book-open" }] }) || changed;
    }
  }
  return changed;
}
