---
创建时间: <% tp.file.creation_date() %>
type: daily
tag: daily
---

## 今日待办
### 工作项目

```tasks
not done
filter by function task.file.path.includes("10-Projects")
filter by function !task.file.path.includes("_日常杂事")
filter by function task.start.moment?.isSameOrBefore(moment("{{query.file.filename}}".substring(0,10)), 'day') || false
path does not include 90-System/Templates
path does not include PeriodicNotes/Templates
path does not include 010-tpl
```

### 杂事

```dataviewjs
var curDay = dv.current().file.name
var curTime = Date.parse(curDay)
var tasks = dv.pages('"10-Projects/_日常杂事"').file.tasks
  .where(t => !t.completed)
if (tasks.length == 0) {
  dv.paragraph("没有杂事")
} else {
  dv.paragraph("今天的杂事数量：" + tasks.length)
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

## 正常工作
### 上午
- [ ] 10:30 - 11:00
- [ ] 11:00 - 12:00

### 下午
- [ ] 14:00 - 15:00
- [ ] 16:00 - 17:00
- [ ] 17:00 - 18:00

### 晚上
- [ ] 19:00 - 20:00
- [ ] 20:00 - 21:00
- [ ] 21:00 - 22:00

## 插入工作
- [ ] xx #daily/work/interupt

## 复盘

## 日常习惯

- [ ] 7:00 起床 #daily/habit
- [ ] 7:30 锻炼身体 #daily/habit
- [ ] 8:00 点读书 #daily/habit
- [ ] 9:00-10:00 路上背单词 #daily/habit
- [ ] 10:10 - 10:20 安排今日工作 #daily/habit
- [ ] 23:00 复盘 #daily/habit
- [ ] 23:30 点读财经 #daily/habit
- [ ] 24:00 点睡觉 #daily/habit

### 习惯分析
```dataviewjs
var tasks = dv.current().file.tasks.where(t => t.text.includes("#daily/habit"))
var finishCnt = 0
for (i = 0; i < tasks.length; i++) {
  if (tasks[i].completed == true) finishCnt += 1
}
dv.header(5, "今日日常习惯完成：" + finishCnt)
```

### 工作分析
```dataviewjs
var tasks = dv.current().file.tasks.where(t => t.text.includes("#daily/work"))
var finishCnt = 0
var codeCnt = 0
var miscCnt = 0
var designCnt = 0
var prdCnt = 0
var projectCnt = 0
var intruptCnt = 0
for (i = 0; i < tasks.length; i++) {
  if (tasks[i].completed == true) finishCnt += 1
  if (tasks[i].text.includes("#daily/work/code")) codeCnt += 1
  if (tasks[i].text.includes("#daily/work/misc")) miscCnt += 1
  if (tasks[i].text.includes("#daily/work/design")) designCnt += 1
  if (tasks[i].text.includes("#daily/work/prd")) prdCnt += 1
  if (tasks[i].text.includes("#daily/work/project")) projectCnt += 1
  if (tasks[i].text.includes("#daily/work/interupt")) intruptCnt += 1
}
dv.header(5, "今日日常总任务：" + tasks.length)
dv.header(5, "今日日常插入事项：" + intruptCnt)
dv.header(5, "今日日常编码事项：" + codeCnt)
dv.header(5, "今日日常完成完成：" + finishCnt)
```

----

#### 今日产出(满意)
- #daily/sum/good

#### 不满意
- #daily/sum/bad

### 心得
- #daily/sum/think

### 待提高
- xx
