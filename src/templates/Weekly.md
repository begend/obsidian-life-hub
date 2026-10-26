---
创建时间: <% tp.file.creation_date() %>
type: weekly
tags:
  - weekly
---
## 一、本周待办
### 1.1、工作项目

```dataviewjs
function weekRangeFromName(name) {
  const m = name.match(/^(\d{4})-\[W\](\d{2})$/) || name.match(/^(\d{4})-W(\d{2})$/)
  if (!m) return null
  const start = moment().isoWeekYear(+m[1]).isoWeek(+m[2]).startOf("isoWeek")
  return [start.valueOf(), start.clone().endOf("isoWeek").valueOf()]
}
var res = weekRangeFromName(dv.current().file.name)
var curTime = res ? res[0] : moment().startOf("isoWeek").valueOf()
var endTime = res ? res[1] : moment().endOf("isoWeek").valueOf()
var tasks = dv.pages('"10-Projects"').file.tasks
  .where(t => !t.completed)
  .where(t => !t.path || !t.path.includes("_日常杂事"))
  .where(t => !t.start || Date.parse(t.start) <= endTime)
if (tasks.length == 0) {
  dv.paragraph("这周没有工作项目")
} else {
  dv.paragraph("这周的工作任务数量：" + tasks.length)
}
var headerMap = new Map()
for (let t of tasks) {
  let headerStr = JSON.stringify(t.header)
  if (headerMap.has(headerStr) == false) {
    dv.paragraph(t.header)
    headerMap.set(headerStr, 1)
  }
  var delayStr = ""
  if (!(t.due === undefined) && Date.parse(t.due) < curTime) delayStr = "==已经Delay=="
  dv.paragraph("- [ ] " + t.text + " " + delayStr)
}
```

### 1.2、学习任务

```dataviewjs
var tasks = dv.pages('"10-Projects"').where(p => (p.area + "").includes("study") || (p.area + "").includes("学习")).file.tasks
  .where(t => !t.completed)
if (tasks.length == 0) {
  dv.paragraph("这周没有学习项目")
} else {
  dv.paragraph("这周的学习任务数量：" + tasks.length)
}
var headerMap = new Map()
for (let t of tasks) {
  let headerStr = JSON.stringify(t.header)
  if (headerMap.has(headerStr) == false) {
    dv.paragraph(t.header)
    headerMap.set(headerStr, 1)
  }
  dv.paragraph("- [ ] " + t.text + " ")
}
```

### 1.3、杂事

```dataviewjs
var tasks = dv.pages('"10-Projects/_日常杂事"').file.tasks.where(t => !t.completed)
if (tasks.length == 0) {
  dv.paragraph("没有杂事")
} else {
  dv.paragraph("本周的杂事数量：" + tasks.length)
}
var headerMap = new Map()
for (let t of tasks) {
  let headerStr = JSON.stringify(t.header)
  if (headerMap.has(headerStr) == false) {
    dv.paragraph(t.header)
    headerMap.set(headerStr, 1)
  }
  dv.paragraph("- [ ] " + t.text + " ")
}
```

```dataviewjs
await dv.view("90-System/Scripts/period-tasks")
```

## 二、本周工作安排
### 2.1、周一工作安排

### 2.2、周二工作安排

### 2.3、周三工作安排

### 2.4、周四工作安排

### 2.5、周五工作安排

### 2.6、周六工作安排

## 三、复盘

### 3.1、习惯分析
```dataviewjs
await dv.view("90-System/Scripts/period-review")
```

----

### 3.2.1、本周最满意
```dataviewjs
const term = "#daily/sum/good"
function weekRangeFromName(name) {
  const m = name.match(/^(\d{4})-\[W\](\d{2})$/) || name.match(/^(\d{4})-W(\d{2})$/)
  if (!m) return null
  const start = moment().isoWeekYear(+m[1]).isoWeek(+m[2]).startOf("isoWeek")
  return [start.toDate(), start.clone().endOf("isoWeek").toDate()]
}
var res = weekRangeFromName(dv.current().file.name)
var startDate = res ? res[0] : moment().startOf("isoWeek").toDate()
var endDate = res ? res[1] : moment().endOf("isoWeek").toDate()
var files = dv.pages('"PeriodicNotes"').where(page => {
  var pageDate = moment(page.file.name.replace('.md', ''), 'YYYY-MM-DD')
  return pageDate.isValid() && pageDate.isSameOrAfter(startDate, 'day') && pageDate.isSameOrBefore(endDate, 'day')
})
const arr = files.map(async (d) => {
  var finalResStr = "#### " + d.file.name + "\n"
  const content = await dv.io.load(d.file.path)
  const lines = content.split("\n").filter(line => line.contains(term))
  if (lines.length <= 0) finalResStr += "- 没有反思\n"
  else {
    lines.forEach(line => { finalResStr += line })
    finalResStr += "\n"
  }
  return { content: finalResStr }
})
Promise.all(arr).then(values => {
  for (let i = 0; i < values.length; i++) dv.paragraph(values[i]['content'])
})
```

### 3.2.2、本周不满意
```dataviewjs
const term = "#daily/sum/bad"
function weekRangeFromName(name) {
  const m = name.match(/^(\d{4})-\[W\](\d{2})$/) || name.match(/^(\d{4})-W(\d{2})$/)
  if (!m) return null
  const start = moment().isoWeekYear(+m[1]).isoWeek(+m[2]).startOf("isoWeek")
  return [start.toDate(), start.clone().endOf("isoWeek").toDate()]
}
var res = weekRangeFromName(dv.current().file.name)
var startDate = res ? res[0] : moment().startOf("isoWeek").toDate()
var endDate = res ? res[1] : moment().endOf("isoWeek").toDate()
var files = dv.pages('"PeriodicNotes"').where(page => {
  var pageDate = moment(page.file.name.replace('.md', ''), 'YYYY-MM-DD')
  return pageDate.isValid() && pageDate.isSameOrAfter(startDate, 'day') && pageDate.isSameOrBefore(endDate, 'day')
})
const arr = files.map(async (d) => {
  var finalResStr = "#### " + d.file.name + "\n"
  const content = await dv.io.load(d.file.path)
  const lines = content.split("\n").filter(line => line.contains(term))
  if (lines.length <= 0) finalResStr += "- 没有反思\n"
  else {
    lines.forEach(line => { finalResStr += line })
    finalResStr += "\n"
  }
  return { content: finalResStr }
})
Promise.all(arr).then(values => {
  for (let i = 0; i < values.length; i++) dv.paragraph(values[i]['content'])
})
```

### 3.2.3、本周思考
```dataviewjs
const term = "#daily/sum/think"
function weekRangeFromName(name) {
  const m = name.match(/^(\d{4})-\[W\](\d{2})$/) || name.match(/^(\d{4})-W(\d{2})$/)
  if (!m) return null
  const start = moment().isoWeekYear(+m[1]).isoWeek(+m[2]).startOf("isoWeek")
  return [start.toDate(), start.clone().endOf("isoWeek").toDate()]
}
var res = weekRangeFromName(dv.current().file.name)
var startDate = res ? res[0] : moment().startOf("isoWeek").toDate()
var endDate = res ? res[1] : moment().endOf("isoWeek").toDate()
var files = dv.pages('"PeriodicNotes"').where(page => {
  var pageDate = moment(page.file.name.replace('.md', ''), 'YYYY-MM-DD')
  return pageDate.isValid() && pageDate.isSameOrAfter(startDate, 'day') && pageDate.isSameOrBefore(endDate, 'day')
})
const arr = files.map(async (d) => {
  var finalResStr = "#### " + d.file.name + "\n"
  const content = await dv.io.load(d.file.path)
  const lines = content.split("\n").filter(line => line.contains(term))
  if (lines.length <= 0) finalResStr += "- 没有反思\n"
  else {
    lines.forEach(line => { finalResStr += line })
    finalResStr += "\n"
  }
  return { content: finalResStr }
})
Promise.all(arr).then(values => {
  for (let i = 0; i < values.length; i++) dv.paragraph(values[i]['content'])
})
```
