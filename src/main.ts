import { Notice, Plugin } from "obsidian";
import { applyHomeLayout, CURRENT_LAYOUT_VERSION, type HubData } from "./extras/home-layout";
import { bootHosted, removePluginAliases, stopHosted, type Hosted } from "./host";
import { applyVaultDefaults, migrateOldPluginData, seedTemplates, validateDailyNotes } from "./seed";

const SETTINGS_VERSION = 1;

/** 独立的 qiaomu-home / periodic-para 仍在启用时拒绝托管启动，避免两套 plugins 抢同一 id。 */
async function hasStandaloneConflict(plugin: Plugin): Promise<boolean> {
  const path = `${plugin.app.vault.configDir}/community-plugins.json`;
  try {
    if (!(await plugin.app.vault.adapter.exists(path))) return false;
    const enabled = JSON.parse(await plugin.app.vault.adapter.read(path));
    return Array.isArray(enabled) && (enabled.includes("qiaomu-home") || enabled.includes("periodic-para"));
  } catch {
    return false;
  }
}

export default class LifeHubPlugin extends Plugin {
  hosted: Hosted | null = null;

  async onload(): Promise<void> {
    await migrateOldPluginData(this);
    if (await hasStandaloneConflict(this)) {
      new Notice(
        "Life Hub：检测到独立的 Qiaomu Home / LifeOS 插件仍在启用，为避免两套插件互踩，本次不启动托管实例。请停用其中一个后重新启用 Life Hub。",
        10000,
      );
      return;
    }

    const data = ((await this.loadData()) as Record<string, unknown> | null) ?? {};
    const hub: HubData = (data.hub as HubData) ?? {};
    let hubChanged = false;

    this.hosted = await bootHosted(this);

    // 布局：仅当 layoutVersion 落后时做一次 SET 迁移，之后不再叠加。
    if ((hub.layoutVersion ?? 0) < CURRENT_LAYOUT_VERSION) {
      applyHomeLayout(this.hosted.home);
      await this.hosted.home.saveSettings();
      await validateDailyNotes(this);
      hub.layoutVersion = CURRENT_LAYOUT_VERSION;
      hubChanged = true;
    }

    // Vault 默认值：settingsVersion 到位后不再每次 onload 强制覆盖。
    if ((hub.settingsVersion ?? 0) < SETTINGS_VERSION) {
      await applyVaultDefaults(this.hosted.lifeos);
      hub.settingsVersion = SETTINGS_VERSION;
      hubChanged = true;
    }

    if (hubChanged) {
      // 子插件可能已写回 data.json，重读合并避免覆盖 home/lifeos 段。
      const fresh = ((await this.loadData()) as Record<string, unknown> | null) ?? {};
      await this.saveData({ ...fresh, hub });
    }

    await seedTemplates(this, this.hosted.lifeos);
    this.addCommand({
      id: "open-home",
      name: "打开 Life Hub 首页",
      callback: () => void this.hosted?.home.openHome(),
    });
  }

  onunload(): void {
    removePluginAliases(this);
    if (this.hosted) stopHosted(this.hosted);
  }
}
