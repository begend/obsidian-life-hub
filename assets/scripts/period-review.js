const moment = window.moment;
const TERMS = {
  good: "#daily/sum/good",
  bad: "#daily/sum/bad",
  think: "#daily/sum/think",
  habit: "#daily/habit",
  work: "#daily/work"
};
const WORK_KINDS = ["code", "design", "prd", "project", "misc", "interupt", "interrupt"];

try {
  const fileName = (dv.current()?.file?.name || "").replace(/\.md$/, "");
  const period = parsePeriod(fileName);
  const S = period.start.clone().startOf("day");
  const E = period.end.clone().endOf("day");

  if (period.kind === "daily") {
    renderDaily();
  } else {
    await renderRange(S, E, period.kind);
  }
} catch (err) {
  dv.paragraph("**period-review 出错：** " + (err && err.message ? err.message : String(err)));
}

void 0;

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

function renderDaily() {
  const tasks = dv.current().file.tasks || [];
  const habits = tasks.filter(t => (t.text || "").includes(TERMS.habit));
  const work = tasks.filter(t => (t.text || "").includes(TERMS.work));
  const habitDone = habits.filter(t => t.completed).length;
  const workDone = work.filter(t => t.completed).length;
  const interrupt = work.filter(t => INTERRUPT(t.text)).length;
  const code = work.filter(t => (t.text || "").includes("#daily/work/code")).length;
  dv.header(5, `习惯完成 ${habitDone} / ${habits.length}`);
  dv.header(5, `工作条目 ${work.length} · 完成 ${workDone} · 插入 ${interrupt} · 编码 ${code}`);
}

function INTERRUPT(text) {
  return /#daily\/work\/interupt|#daily\/work\/interrupt/.test(text || "");
}

async function renderRange(S, E, kind) {
  const dailies = dv.pages('"PeriodicNotes" or "Day Planners/daily"')
    .where(p => {
      const n = p.file.name.replace(/\.md$/, "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(n)) return false;
      const d = moment(n, "YYYY-MM-DD");
      return d.isSameOrAfter(S, "day") && d.isSameOrBefore(E, "day");
    });

  let habitDone = 0, habitTotal = 0, workDone = 0, workTotal = 0, interrupt = 0;
  const cats = Object.fromEntries(WORK_KINDS.map(k => [k, 0]));

  for (const page of dailies) {
    for (const t of page.file.tasks || []) {
      const text = t.text || "";
      if (text.includes(TERMS.habit)) {
        habitTotal += 1;
        if (t.completed) habitDone += 1;
      }
      if (text.includes(TERMS.work)) {
        workTotal += 1;
        if (t.completed) workDone += 1;
        if (INTERRUPT(text)) interrupt += 1;
        for (const k of WORK_KINDS) {
          if (text.includes("#daily/work/" + k)) cats[k] += 1;
        }
      }
    }
  }

  dv.header(5, `习惯完成 ${habitDone} / ${habitTotal}`);
  dv.header(5, `工作条目 ${workTotal} · 完成 ${workDone} · 插入 ${interrupt} · 编码 ${cats.code}`);

  if (kind === "weekly" || kind === "monthly") {
    await renderTagged("本期满意", TERMS.good, dailies);
    await renderTagged("本期不满意", TERMS.bad, dailies);
    await renderTagged("本期心得", TERMS.think, dailies);
  }
}

async function renderTagged(title, term, pages) {
  dv.header(3, title);
  let any = false;
  const list = Array.from(pages).sort((a, b) => a.file.name.localeCompare(b.file.name));
  for (const page of list) {
    const content = await dv.io.load(page.file.path);
    const lines = content.split("\n").filter(line => line.includes(term) && !/^#{1,6}\s/.test(line) && line.replace(term, "").trim().length > 1);
    if (!lines.length) continue;
    any = true;
    dv.header(4, page.file.name);
    for (const line of lines) dv.paragraph(line);
  }
  if (!any) dv.paragraph("（没有记录）");
}
