import { Plugin } from "obsidian";
import { applyHomeLayout } from "./extras/home-layout";
import { bootHosted, removePluginAliases, stopHosted, type Hosted } from "./host";
import { applyVaultDefaults, migrateOldPluginData, seedTemplates } from "./seed";

export default class LifeHubPlugin extends Plugin {
  hosted: Hosted | null = null;

  async onload(): Promise<void> {
    await migrateOldPluginData(this);
    this.hosted = await bootHosted(this);
    const rssHome = (this.hosted.rss as unknown as { qiaomuHome?: unknown }).qiaomuHome;
    if (rssHome) (this as unknown as { qiaomuHome?: unknown }).qiaomuHome = rssHome;
    await applyVaultDefaults(this.hosted.lifeos);
    if (applyHomeLayout(this.hosted.home)) await this.hosted.home.saveSettings();
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
