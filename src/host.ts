import type { Plugin, PluginManifest } from "obsidian";
import QiaomuHomePlugin from "../vendor/qiaomu-home/src/main";
import QiaomuRssPlugin from "../vendor/qiaomu-ai-rss/src/main";
import LifeOS from "../vendor/lifeos/src/main";

type DataBag = Record<string, unknown>;
type PluginCtor<T extends Plugin> = new (app: Plugin["app"], manifest: PluginManifest) => T;

function childManifest(host: Plugin, id: string, name: string): PluginManifest {
  return { ...host.manifest, id, name };
}

function namespaced<T extends Plugin>(host: Plugin, key: string, Child: PluginCtor<T>, manifest: PluginManifest): T {
  class Wrapped extends (Child as unknown as PluginCtor<T>) {
    async loadData(): Promise<unknown> {
      const all = ((await host.loadData()) as DataBag | null) ?? {};
      return all[key] ?? null;
    }
    async saveData(data: unknown): Promise<void> {
      const all = ((await host.loadData()) as DataBag | null) ?? {};
      all[key] = data;
      await host.saveData(all);
    }
  }
  return new Wrapped(host.app, manifest);
}

async function start(plugin: Plugin): Promise<void> {
  const loaded = plugin as Plugin & { load?: () => Promise<void> };
  if (typeof loaded.load === "function") await loaded.load();
  else await plugin.onload();
}

function stop(plugin: Plugin): void {
  const loaded = plugin as Plugin & { unload?: () => void };
  try {
    if (typeof loaded.unload === "function") loaded.unload();
    else plugin.onunload();
  } catch {
    plugin.onunload();
  }
}

export interface Hosted {
  home: QiaomuHomePlugin;
  rss: QiaomuRssPlugin;
  lifeos: LifeOS;
}

export async function bootHosted(host: Plugin): Promise<Hosted> {
  const home = namespaced(host, "home", QiaomuHomePlugin, childManifest(host, "qiaomu-home", "Qiaomu Home"));
  const rss = namespaced(host, "rss", QiaomuRssPlugin, childManifest(host, "qiaomu-ai-rss", "Qiaomu AI RSS"));
  const lifeos = namespaced(host, "lifeos", LifeOS, childManifest(host, "periodic-para", "LifeOS"));
  injectPluginAliases(host, { home, rss, lifeos });
  await start(rss);
  await start(home);
  await start(lifeos);
  return { home, rss, lifeos };
}

export function injectPluginAliases(host: Plugin, hosted: Hosted): void {
  const bag = (host.app as unknown as { plugins?: { plugins?: Record<string, Plugin> } }).plugins?.plugins;
  if (!bag) return;
  bag["qiaomu-home"] = hosted.home;
  bag["qiaomu-ai-rss"] = hosted.rss;
  bag["periodic-para"] = hosted.lifeos;
}

export function removePluginAliases(host: Plugin): void {
  const bag = (host.app as unknown as { plugins?: { plugins?: Record<string, Plugin> } }).plugins?.plugins;
  if (!bag) return;
  if (bag["qiaomu-home"] && bag["qiaomu-home"] !== host) delete bag["qiaomu-home"];
  if (bag["qiaomu-ai-rss"] && bag["qiaomu-ai-rss"] !== host) delete bag["qiaomu-ai-rss"];
  if (bag["periodic-para"] && bag["periodic-para"] !== host) delete bag["periodic-para"];
}

export function stopHosted(hosted: Hosted): void {
  stop(hosted.rss);
  stop(hosted.lifeos);
  stop(hosted.home);
}
