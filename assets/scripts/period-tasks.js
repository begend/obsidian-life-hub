const moment = window.moment;
const SKIP_PATH = /(PeriodicNotes\/Templates|90-System\/|010-tpl\/|Day Planners\/daily\/)/;
const HABIT_RE = /#daily\/habit|日常习惯/;
const INTERRUPT_RE = /#daily\/work\/interupt|#daily\/work\/interrupt/;

try {
  const fileName = (dv.current()?.file?.name || "").replace(/\.md$/, "");
  const period = parsePeriod(fileName);
  const S = period.start.clone().startOf("day");
  const E = period.end.clone().startOf("day");
  const kind = period.kind;

  const pages = dv.pages()
    .where(p => p.file && !SKIP_PATH.test(p.file.path))
    .where(p => {
      const type = String(p.type || "");
      const path = p.file.path;
      return type === "project" || type === "task"
        || path.startsWith("10-Projects/")
        || path.startsWith("timeManage/");
    });

  const items = [];
  for (const page of pages) {
    if (page.type === "task") {
      items.push(fromTaskNote(page));
      continue;
    }
    const tasks = page.file.tasks || [];
    for (const t of tasks) {
      if (shouldSkipInline(t)) continue;
      items.push(fromInline(page, t));
    }
  }

  const buckets = {
    overdue: [],
    starting: [],
    planned: [],
    carry: [],
    doing: [],
    unscheduled: [],
    done: []
  };

  for (const item of items) {
    const placed = place(item, S, E, kind);
    if (placed) buckets[placed].push(item);
  }

  dv.paragraph(`_${labelOf(kind)}：${S.format("YYYY-MM-DD")} → ${E.format("YYYY-MM-DD")} · 共 ${countShown(buckets, kind)} 条_`);

  if (kind === "daily" || kind === "weekly") {
    renderBucket("逾期", buckets.overdue);
    renderBucket("进行中", buckets.doing);
    renderBucket(kind === "daily" ? "今日开始" : "本期开始", buckets.starting);
    renderBucket("本期计划", buckets.planned);
    renderBucket("顺延", buckets.carry);
  }
  if (kind === "monthly") {
    renderBucket("本月计划 / 到期", buckets.planned.concat(buckets.doing, buckets.starting));
  }
  if (kind === "weekly") renderBucket("待排期池", buckets.unscheduled);
  if (kind !== "daily") renderBucket("本期完成", buckets.done);
  else renderBucket("今日完成", buckets.done);

  if (kind === "monthly" || kind === "quarterly" || kind === "yearly") {
    renderProgress(items, S, E);
  }
} catch (err) {
  dv.paragraph("**period-tasks 出错：** " + (err && err.message ? err.message : String(err)));
}

function parsePeriod(name) {
  let m;
  if ((m = /^(\d{4}-\d{2}-\d{2})$/.exec(name))) {
    const start = moment(m[1], "YYYY-MM-DD");
    return { kind: "daily", start, end: start.clone() };
  }
  if ((m = /^(\d{4})-\[W\](\d{2})$/.exec(name)) || (m = /^(\d{4})-W(\d{2})$/.exec(name))) {
    const start = moment().isoWeekYear(+m[1]).isoWeek(+m[2]).startOf("isoWeek");
    return { kind: "weekly", start, end: start.clone().endOf("isoWeek") };
  }
  if ((m = /^(\d{4})-(\d{2})$/.exec(name))) {
    const start = moment(`${m[1]}-${m[2]}-01`, "YYYY-MM-DD");
    return { kind: "monthly", start, end: start.clone().endOf("month") };
  }
  if ((m = /^(\d{4})-Q([1-4])$/.exec(name))) {
    const start = moment({ year: +m[1], month: (+m[2] - 1) * 3, day: 1 });
    return { kind: "quarterly", start, end: start.clone().endOf("quarter") };
  }
  if ((m = /^(\d{4})$/.exec(name))) {
    const start = moment(`${m[1]}-01-01`, "YYYY-MM-DD");
    return { kind: "yearly", start, end: start.clone().endOf("year") };
  }
  const start = moment().startOf("day");
  return { kind: "daily", start, end: start.clone() };
}

function asDay(value) {
  if (!value) return null;
  const raw = value.toISODate ? value.toISODate() : (value.toString ? value.toString() : String(value));
  const m = moment(raw.slice(0, 10), "YYYY-MM-DD", true);
  return m.isValid() ? m.startOf("day") : null;
}

function inRange(d, S, E) {
  return d && d.isSameOrAfter(S, "day") && d.isSameOrBefore(E, "day");
}

function shouldSkipInline(t) {
  const text = t.text || "";
  if (HABIT_RE.test(text)) return true;
  if (!text.replace(/#\S+/g, "").trim()) return true;
  if (/^\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(text) && text.length < 24) return true;
  const header = headerText(t);
  if (/习惯|日常习惯|正常工作|复盘/.test(header)) return true;
  return false;
}

function headerText(t) {
  if (!t.header) return "";
  if (typeof t.header === "string") return t.header;
  if (t.header.subpath) return t.header.subpath;
  return String(t.header);
}

function areaOf(page) {
  if (page.area) return String(page.area).replace(/[\[\]]/g, "").replace(/^.*\//, "");
  const path = page.file.path;
  if (path.includes("timeManage/project/study")) return "学习";
  if (path.includes("timeManage/project/work")) return "工作";
  if (path.includes("timeManage/task") || path.includes("_日常杂事")) return "杂事";
  if (path.includes("20-Areas/学习") || path.includes("/学习/")) return "学习";
  if (path.includes("20-Areas/生活") || path.includes("/生活/")) return "生活";
  return "工作";
}

function fromTaskNote(page) {
  const status = String(page.status || "todo").toLowerCase();
  return {
    kind: "note",
    page,
    task: null,
    name: page.file.name,
    path: page.file.path,
    project: page.project ? String(page.project).replace(/[\[\]]/g, "") : page.file.folder,
    area: areaOf(page),
    status,
    done: status === "done" || status === "cancelled",
    doing: status === "doing",
    waiting: status === "waiting",
    scheduled: asDay(page.scheduled),
    due: asDay(page.due),
    start: asDay(page.start),
    completed: asDay(page.completed),
    category: page.category || "",
    text: page.file.name
  };
}

function fromInline(page, t) {
  const status = (t.status || (t.completed ? "x" : " ")).toString();
  return {
    kind: "inline",
    page,
    task: t,
    name: t.text,
    path: page.file.path,
    project: page.file.name,
    area: areaOf(page),
    status,
    done: !!t.completed || status === "x" || status === "X" || status === "-",
    doing: status === "/",
    waiting: status === "?",
    scheduled: asDay(t.scheduled),
    due: asDay(t.due),
    start: asDay(t.start),
    completed: asDay(t.completion),
    category: categoryOf(t.text),
    text: t.text
  };
}

function categoryOf(text) {
  const m = /#daily\/work\/(\w+)/.exec(text || "");
  return m ? m[1] : "";
}

function place(item, S, E, kind) {
  if (item.status === "-" || item.status === "cancelled") return null;
  if (item.done) {
    if (inRange(item.completed, S, E) || (!item.completed && kind === "daily")) return "done";
    return null;
  }
  if (item.due && item.due.isBefore(S, "day")) return "overdue";
  if (item.doing && (!item.start || item.start.isSameOrBefore(E, "day"))) return "doing";
  if (inRange(item.start, S, E) && !inRange(item.scheduled, S, E) && !inRange(item.due, S, E)) return "starting";
  if (inRange(item.scheduled, S, E) || inRange(item.due, S, E)) return "planned";
  if (item.scheduled && item.scheduled.isBefore(S, "day") && !(item.due && item.due.isBefore(S, "day"))) return "carry";
  if (kind === "weekly" && !item.scheduled && !item.due) return "unscheduled";
  return null;
}

function countShown(buckets, kind) {
  let n = buckets.planned.length + buckets.done.length;
  if (kind === "daily" || kind === "weekly") n += buckets.overdue.length + buckets.carry.length + buckets.doing.length + buckets.starting.length;
  if (kind === "weekly") n += buckets.unscheduled.length;
  return n;
}

function labelOf(kind) {
  return { daily: "当日", weekly: "本周", monthly: "本月", quarterly: "本季", yearly: "本年" }[kind] || kind;
}

function renderBucket(title, list) {
  if (!list.length) return;
  dv.header(3, `${title}（${list.length}）`);
  const grouped = groupBy(list, it => it.area + " / " + it.project);
  for (const [group, rows] of grouped) {
    dv.header(4, group);
    const inline = rows.filter(r => r.kind === "inline" && r.task);
    const notes = rows.filter(r => r.kind === "note");
    if (inline.length) dv.taskList(inline.map(r => r.task), false);
    for (const n of notes) {
      const mark = n.done ? "x" : n.doing ? "/" : n.waiting ? "?" : " ";
      const dates = [
        n.scheduled ? `⏳ ${n.scheduled.format("MM-DD")}` : "",
        n.due ? `📅 ${n.due.format("MM-DD")}` : ""
      ].filter(Boolean).join(" ");
      dv.paragraph(`- [${mark}] [[${n.path}|${n.name}]] ${dates}`.trim());
    }
  }
}

function groupBy(list, keyFn) {
  const map = new Map();
  for (const item of list) {
    const key = keyFn(item) || "未分组";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function renderProgress(items, S, E) {
  const byProject = groupBy(items.filter(it => !it.done || inRange(it.completed, S, E) || !it.done), it => it.area + " / " + it.project);
  const rows = [];
  for (const [name, list] of byProject) {
    const total = list.length;
    const done = list.filter(it => it.done).length;
    const overdue = list.filter(it => !it.done && it.due && it.due.isBefore(S, "day")).length;
    if (!total) continue;
    rows.push([name, `${done}/${total}`, bar(done, total), overdue || ""]);
  }
  if (!rows.length) return;
  dv.header(3, "项目进度");
  dv.table(["项目", "完成", "进度", "逾期"], rows);
}

function bar(done, total) {
  const n = total ? Math.round(done / total * 10) : 0;
  return "█".repeat(n) + "░".repeat(10 - n);
}
