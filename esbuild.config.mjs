import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { lessLoader } from "esbuild-plugin-less";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";

const banner = `/*
Life Hub — GPL-3.0-only
Qiaomu Home © 向阳乔木
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
const cssConcat = {
  name: "css-concat",
  setup(build) {
    build.onEnd(() => {
      const chunks = ["vendor/qiaomu-home/styles.css"];
      const generated = ["main.css", "src/main.css"].map((p) => path.resolve(p)).find((p) => fs.existsSync(p));
      const parts = chunks.filter((p) => fs.existsSync(p)).map((p) => fs.readFileSync(p, "utf8"));
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
  plugins: [lessLoader({ javascriptEnabled: true }), cssConcat],
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
