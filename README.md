# 玛一把 · FGO 猜从者

玛头大人，来看看你统御的阵容吧

面向 FGO 玩家的一款中文网页猜谜游戏。每局八次机会，通过属性反馈猜出从者。支持每日挑战、无限推演、简单与困难、中文昵称及拼音搜索。游戏运行时只读取随项目提供的本地 JSON，不访问 Mooncell。

## 打开网页

双击 `run.cmd`，或在项目目录执行：

```powershell
node scripts/build.mjs
node scripts/serve.mjs
```

浏览器访问 http://localhost:4173 。运行环境为 Node.js 24.22+；不用安装 npm。关闭终端会停止服务。

发布到静态托管服务时，上传整个 `dist/`，包括 `releases/` 和 `licenses/`。此项目目前只在本机运行，未发布到公网。

## 玩法与存档

- 简单显示 12 项属性，困难显示 8 项。提交后锁定该局难度；两个难度独立存档。
- 绿色完全匹配，黄色部分匹配，灰色不匹配，未知不参与判断。文字和符号同时展示，避免只靠颜色区分。
- 每日挑战按北京时间零点更新，使用冻结题库与确定性散列。无限模式避开上一局答案。
- 刷新后恢复进度及模式。损坏存档会被拒绝，浏览器禁止存储时会提示。存档仅在当前浏览器中保存。
- 可复制不含答案名字的 Emoji 成绩。剪贴板不可用时提供手动复制框。
- 搜索支持正式名、Mooncell 昵称、前缀、子串、日文、英文、拼音、首字母、繁体和近似拼写；关联版本来自原页面的同名从者模板。

## 数据范围与来源

图鉴索引来自 Mooncell `英灵图鉴/数据`，本次索引共 486 条。最终导入数量、答案池数量、缺失字段与排除原因见 `data/quality-report.json`，网页页脚也会展示。

1. 先验证松永久秀：序号 486，武内崇／若山诗音，Berserker，混沌·善，人，女性，日本，史实，BBAAQ，Buster 全体宝具，活动赠送。
2. 验证 MediaWiki `action=parse&prop=wikitext` 和 Semantic MediaWiki `action=ask`。实际导入使用页面模板参数，不解析 HTML。
3. 用平衡括号扫描模板，避免嵌套模板中的竖线破坏参数。每条记录保留基础数值原始参数、资料段、宝具原值、来源链接和更新时间。
4. 地域与出处优先来自“资料1”。部分页面将基础资料移到“详情”，按该实际位置读取并在 `raw.profileKey` 记录；“出典”作为同字段名称处理。不会把所有神话概括成“神话”。
5. 基础属性使用初始灵基，变化参数保存在 `states.variants`；宝具比较页面已公开的全部卡色／目标组合，去除重复组合。U－奥尔加玛丽的地域选取原文明确标注的第一、第二灵基“地球”。
6. 国服状态沿用 Mooncell `Gameinfo/国服/灵基一览` 与基础数值模板的序号判断规则。国服具体实装日期仍为 `null`，没有以日服日期代替，也没有把预告当作实装。
7. 从者名称、Alter、泳装及其他版本按图鉴编号独立保存。资料不完整者仍可检索，但不进入相应难度的答案池。

别名独立保存在 `data/aliases.json`，支持一对多映射，包含权重与来源。大部分来自图鉴的 `name_other` 和从者模板的“昵称”。“C呆”另附真实玩家评测链接。没有给每位角色机械生成昵称。

## 更新资料

```powershell
# 更新图鉴索引与国服版本信息
node scripts/update.mjs --index --refresh
# 增量获取新增页面；已有缓存不重复请求
node scripts/update.mjs --all
# 核查并刷新指定页面
node scripts/update.mjs --title "松永久秀" --refresh
# 本地规范化、校验、测试
node scripts/import.mjs
node scripts/validate.ts
node --test scripts/test.ts
```

请求串行执行，间隔 1.5 秒，设置超时和 maxlag。HTTP 错误、限流或非缺页 API 错误会立即停止，不绕过站点限制。原始结果缓存在 `data/cache/`；刷新采用临时文件后替换。大范围更新前重新检查站点规则和使用条件。

每天的题库必须保持不变。导入新数据后，为**未来日期**生成快照：

```powershell
node scripts/freeze.mjs 2026-11-14
node scripts/build.mjs
```

日期仅为本次发布示例，后续必须选择尚未生效的日期。脚本拒绝覆盖已有版本；新版本包含独立 JSON 快照和两个难度的有序答案列表。请同时发布快照与清单。旧样本版记录保留；新版国服／日服挑战使用独立的冻结清单。无限模式立即使用最新数据。

## 验证

```powershell
node scripts/validate.ts
node --test scripts/test.ts
npx --package typescript@5.9.3 tsc --noEmit --allowJs --target es2023 --module esnext --skipLibCheck src/engine.ts
node scripts/build.mjs
```

核心逻辑测试覆盖集合比较、双维度、宝具、特殊职阶和性别、国服未实装、卡序、缺失、搜索、重复提交、胜负、损坏存档、日期边界和分享。浏览器已检查搜索提交、难度锁定、刷新恢复和 390 像素移动布局。

## 模块

- `src/engine.ts`：纯函数比较、搜索、日期、状态恢复、分享。
- `scripts/mooncell.mjs`、`scripts/import.mjs`：模板读取、规范化、缺失检查。
- `scripts/update.mjs`：串行缓存更新。
- `scripts/atlas.mjs`：可选 Atlas Academy 辅助读取适配器；本版主数据未依赖 Atlas。
- `scripts/freeze.mjs`：不可覆盖的每日题库快照。
- `app.js`：界面、键盘交互与本地存档。
- `vendor/`：固定版本的拼音、简繁转换与类型检查工具，无运行时 CDN。

## 版权及限制

文字资料来自 [Mooncell 贡献者](https://fgo.wiki/)，其站点 rightsinfo 声明 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。原始缓存及规范化派生资料保留署名、来源与相同方式共享要求，仅供非商业使用。本游戏未获 Mooncell 或 FGO 官方背书。

官方美术的授权不由文字许可覆盖。当前使用原创文字徽章，`portrait.url` 为 `null`；没有冒用头像授权。OpenCC-js、pinyin-pro 及 TypeScript 的许可保留在各自 vendor 包内；静态发布也包含 OpenCC 及相关数据许可。

尚存边界：具体国服实装日期未核实；地域只对相同标签或原文明示的层级片段作部分匹配，没有推断全球地理归属；复杂模板中仍无法安全解释的字段保留未知。全部数据来自社区资料，未逐条与游戏客户端人工复核。客户端可查看答案，不适用于有奖竞技。

## 国服／日服与新版布局

默认国服，仅以已实装从者作答案及搜索候选；日服包含全部已导入从者。两区独立保存每日及随机记录，开始猜测后锁定范围。原无限模式记录在日服范围保留。新版分区每日挑战使用独立冻结清单，不覆盖旧记录。桌面端显示全部属性；窄屏按带标签的卡片排列；结果区不设内部滚动。胜负通过弹窗显示，可关闭后重看。

公开仓库不附带抓取时的全文页面缓存。游戏可直接构建运行；重新导入资料前，先按更新命令下载缓存。
