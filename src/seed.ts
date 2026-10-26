import { normalizePath, type Plugin } from "obsidian";
import { getBasicTemplatePlans } from "../vendor/lifeos/src/onboarding/templates";
import type LifeOS from "../vendor/lifeos/src/main";

const VAULT_LIFEOS = {
  locale: "zh-cn",
  periodicNotesPath: "PeriodicNotes",
  projectsPath: "10-Projects",
  areasPath: "20-Areas",
  resourcesPath: "30-Resources",
  archivesPath: "40-Archives",
  weekStart: 1,
  weeklyNoteFormat: "gggg-[W]WW",
  dailyRecordHeader: "日常记录",
  habitHeader: "日常习惯",
  onboardingVersion: 1,
  usePARANotes: true,
  usePeriodicNotes: true,
};

const FOLDERS = [
  "00-Inbox",
  "10-Projects",
  "20-Areas",
  "30-Resources",
  "40-Archives",
  "90-System/Bases",
  "90-System/Dashboards",
  "90-System/Templates",
  "90-System/Scripts",
  "PeriodicNotes/Templates",
];

const PLUGIN_SEEDS: Array<[string, string]> = [
  ["templates/Daily.md", "PeriodicNotes/Templates/Daily.md"],
  ["templates/Weekly.md", "PeriodicNotes/Templates/Weekly.md"],
  ["templates/Monthly.md", "PeriodicNotes/Templates/Monthly.md"],
  ["templates/Quarterly.md", "PeriodicNotes/Templates/Quarterly.md"],
  ["templates/Yearly.md", "PeriodicNotes/Templates/Yearly.md"],
  ["assets/scripts/period-tasks.js", "90-System/Scripts/period-tasks.js"],
  ["assets/scripts/period-review.js", "90-System/Scripts/period-review.js"],
  ["assets/system/Templates/project.md", "90-System/Templates/project.md"],
  ["assets/system/Templates/task.md", "90-System/Templates/task.md"],
  ["assets/system/Dashboards/项目中心.md", "90-System/Dashboards/项目中心.md"],
  ["assets/system/Dashboards/今日任务.md", "90-System/Dashboards/今日任务.md"],
  ["assets/system/Dashboards/知识中心.md", "90-System/Dashboards/知识中心.md"],
  ["assets/system/Dashboards/阅读中心.md", "90-System/Dashboards/阅读中心.md"],
  ["assets/system/Bases/Projects.base", "90-System/Bases/Projects.base"],
  ["assets/system/Bases/Knowledge.base", "90-System/Bases/Knowledge.base"],
  ["assets/system/Bases/Reading.base", "90-System/Bases/Reading.base"],
];

export async function migrateOldPluginData(host: Plugin): Promise<void> {
  const existing = await host.loadData();
  if (existing && Object.keys(existing).length) return;
  const read = async (id: string) => {
    const path = `${host.app.vault.configDir}/plugins/${id}/data.json`;
    try {
      if (await host.app.vault.adapter.exists(path)) {
        return JSON.parse(await host.app.vault.adapter.read(path));
      }
    } catch {
      return null;
    }
    return null;
  };
  const home = await read("qiaomu-home");
  const lifeos = await read("periodic-para");
  if (!home && !lifeos) return;
  await host.saveData({ home, lifeos });
}

export async function applyVaultDefaults(lifeos: LifeOS): Promise<void> {
  const settings = lifeos.settings as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(VAULT_LIFEOS)) {
    const current = settings[key];
    if (current === undefined || current === "" || current === "1. Projects" || current === "2. Areas" || current === "3. Resources" || current === "4. Archives") {
      settings[key] = value;
    }
  }
  settings.locale = settings.locale || "zh-cn";
  settings.dailyRecordHeader = settings.dailyRecordHeader || "日常记录";
  settings.habitHeader = settings.habitHeader || "日常习惯";
  await lifeos.saveSettings(lifeos.settings);
}

/**
 * 核心 Daily Notes 必须与 LifeOS 日路径对齐（home-ia.md 第 3 节）。
 * 仅在 layout v2 迁移时调用一次：不一致则写 daily-notes.json，之后不再动。
 */
export async function validateDailyNotes(plugin: Plugin): Promise<void> {
  const adapter = plugin.app.vault.adapter;
  const path = `${plugin.app.vault.configDir}/daily-notes.json`;
  const expected = {
    folder: "PeriodicNotes/{{DATE:YYYY}}/[Daily]/{{DATE:MM}}",
    format: "YYYY-MM-DD",
    template: "PeriodicNotes/Templates/Daily",
  };
  let current: Record<string, unknown> = {};
  try {
    if (await adapter.exists(path)) {
      current = JSON.parse(await adapter.read(path));
    }
  } catch {
    current = {};
  }
  if (current.folder === expected.folder && current.format === expected.format && current.template === expected.template) return;
  await adapter.write(path, JSON.stringify({ ...current, ...expected }, null, 2));
}

async function ensureDir(plugin: Plugin, folder: string): Promise<void> {
  const path = normalizePath(folder);
  if (!path) return;
  const parts = path.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!(await plugin.app.vault.adapter.exists(current))) {
      await plugin.app.vault.adapter.mkdir(current);
    }
  }
}

async function writeIfMissing(plugin: Plugin, vaultPath: string, content: string): Promise<void> {
  const path = normalizePath(vaultPath);
  if (await plugin.app.vault.adapter.exists(path)) return;
  const folder = path.split("/").slice(0, -1).join("/");
  if (folder) await ensureDir(plugin, folder);
  await plugin.app.vault.adapter.write(path, content);
}

async function readPluginFile(plugin: Plugin, rel: string): Promise<string> {
  const dir = plugin.manifest.dir ?? `${plugin.app.vault.configDir}/plugins/${plugin.manifest.id}`;
  const full = `${dir}/${rel}`;
  if (await plugin.app.vault.adapter.exists(full)) return plugin.app.vault.adapter.read(full);
  return "";
}

export async function seedTemplates(plugin: Plugin, lifeos: LifeOS): Promise<void> {
  for (const folder of FOLDERS) await ensureDir(plugin, folder);
  for (const [from, to] of PLUGIN_SEEDS) {
    const content = await readPluginFile(plugin, from);
    if (content) await writeIfMissing(plugin, to, content);
  }
  const plans = getBasicTemplatePlans(lifeos.settings, "para", "zh-cn", { includeGuide: false, includeExample: false });
  for (const plan of plans) {
    if (/\/(Daily|Weekly)\.md$/.test(plan.path)) continue;
    if (plan.path.endsWith("/Template.md") && /^(10-Projects|20-Areas|30-Resources|40-Archives)\//.test(plan.path)) {
      await writeIfMissing(plugin, plan.path, plan.content);
    }
  }
}
