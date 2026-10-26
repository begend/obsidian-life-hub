import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { lessLoader } from "esbuild-plugin-less";
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { compressI18n, compressCatalog } from "./vendor/qiaomu-ai-rss/scripts/compress-i18n.mjs";

const banner = `/*
Life Hub — GPL-3.0-only
Qiaomu Home / Qiaomu AI RSS © 向阳乔木
LifeOS © YiBing Lin (MIT, included in this GPL combined work)
Source: https://github.com/begend/obsidian-life-hub
*/`;

function applyPatch(dir, file) {
  if (!fs.existsSync(file)) return;
  const check = spawnSync("git", ["apply", "--check", "--directory", dir, file], { encoding: "utf8" });
  if (check.status === 0) {
    const applied = spawnSync("git", ["apply", "--directory", dir, file], { encoding: "utf8" });
    if (applied.status !== 0) console.warn(applied.stderr);
  }
}
applyPatch("vendor/qiaomu-home", "patches/qiaomu-home.patch");
applyPatch("vendor/lifeos", "patches/lifeos.patch");

const watch = process.argv.includes("--watch");
const require = createRequire(import.meta.url);
const speechWebSocket = {
  name: "desktop-speech-websocket",
  setup(build) {
    build.onResolve({ filter: /^ws$/ }, () => ({
      path: require.resolve("ws", { paths: [require.resolve("@qiaomu/speech/speech")] }).replace(/index\.js$/, "lib/websocket.js"),
    }));
    build.onLoad({ filter: /node_modules[\\/]ws[\\/].*\.js$/ }, ({ path: filePath }) => ({
      contents: fs.readFileSync(filePath, "utf8").replace(/require\('(events|https|http|net|tls|crypto|stream|url|buffer|zlib|util)'\)/g, "require('node:$1')"),
      loader: "js",
    }));
  },
};
const rssCompress = {
  name: "rss-compress",
  setup(build) {
    build.onLoad({ filter: /qiaomu-ai-rss[\\/]src[\\/]i18n\.ts$/ }, ({ path: filePath }) =>
      compressI18n(fs.readFileSync(filePath, "utf8")),
    );
    build.onLoad({ filter: /qiaomu-ai-rss[\\/]src[\\/]data[\\/](independent-blogs|tidings)\.json$/ }, ({ path: filePath }) =>
      compressCatalog(fs.readFileSync(filePath, "utf8")),
    );
  },
};
const cssConcat = {
  name: "css-concat",
  setup(build) {
    build.onEnd(() => {
      const chunks = ["vendor/qiaomu-home/styles.css", "vendor/qiaomu-ai-rss/styles.css"];
      const generated = ["main.css", "src/main.css"].map((p) => path.resolve(p)).find((p) => fs.existsSync(p));
      const parts = chunks.map((p) => fs.readFileSync(p, "utf8"));
      if (generated) parts.push(fs.readFileSync(generated, "utf8"));
      fs.writeFileSync("styles.css", parts.join("\n"));
      if (generated && generated.endsWith("main.css") && fs.existsSync("main.css")) fs.unlinkSync("main.css");
    });
  },
};

const ctx = await esbuild.context({
  banner: { js: banner },
  entryPoints: ["src/main.ts"],
  bundle: true,
  minify: !watch,
  charset: "utf8",
  loader: { ".woff2": "dataurl", ".md": "text", ".py": "text" },
  plugins: [speechWebSocket, rssCompress, lessLoader({ javascriptEnabled: true }), cssConcat],
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
    ...builtins.map((name) => `node:${name}`),
  ],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: watch ? "inline" : false,
  treeShaking: true,
  outfile: "main.js",
});

if (watch) await ctx.watch();
else {
  await ctx.rebuild();
  await ctx.dispose();
}
