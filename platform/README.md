# GeoVoya · 天目寻境：运行与开发说明

本地前后端原型，用于检查页面、研学流程和前后端的数据保存。当前运行不需要付费 API、外部模型、云数据库或地图账户。项目概览与首次配置入口见 [根目录 README](../README.md)。

单独启动前端后打开 `/?demo=1`，学习档案保存在浏览器中，无需后端。该参数会在导航与刷新时保留，不请求 API；不带该参数时使用以下服务模式。浏览器本地档案与服务档案独立。望闻问切进度、带谱笔记与练习、专题草记、研究计划、待读清单和地带性探究记录在两种模式下均使用浏览器存储，可通过各页面导出相应材料。

## 直接启动

首次使用请先完成下文的依赖安装与本地照片准备。已配置好的环境可在仓库根目录的 PowerShell 中运行：

```powershell
Set-Location platform
.\tools\start.ps1
```

默认前端地址是 `http://127.0.0.1:5173`，API 文档是 `http://127.0.0.1:8000/docs`。如果端口被占用，脚本会选择附近的空闲端口，并打印实际地址。

停止本项目启动的服务：

```powershell
.\tools\stop.ps1
```

停止、重新启动服务不会清除已保存的学习记录。启动状态与日志在 `.runtime/`，重复运行启动脚本会提示已有服务。

两个服务均绑定 `127.0.0.1`，当前交付用于本机试用，未配置公网部署。

## 第一次配置

本机验证环境为 Node.js 24.19.0、pnpm 10.33.2、uv 0.10.2，后端使用 Python 3.12。依赖版本记录在 `frontend/pnpm-lock.yaml` 和 `backend/uv.lock`。

从 `platform/` 目录依次执行：

```powershell
Push-Location .\backend
uv sync --python 3.12 --locked
Pop-Location

Push-Location .\frontend
pnpm install --frozen-lockfile
Pop-Location

$env:GEOVR_PHOTO_DIR = 'C:\path\to\authorized-photos'
Push-Location .\frontend
pnpm prepare:assets
Pop-Location

.\tools\start.ps1
```

照片准备脚本从 `GEOVR_PHOTO_DIR` 指定的文件夹读取 `IMG_20260820_111143.jpg`、`IMG_20260820_122236.jpg`、`IMG_20260820_124918.jpg`，生成网页用 WebP 与缩略图。未设置环境变量时，默认读取 `platform/` 上一级的 `天目山柳杉照片-2026/天目山照片-202608/普通照片-ziyao/` 目录。脚本不修改原照片，生成物位于 `frontend/public/media/`，可重复生成。原图与预览均不随仓库发布，素材使用前需确认授权。

## 可试用的流程

1. 从总览的“开始方法学习”进入“望闻问切”，按图片观察、知识卡、答题和提示完成入门 10 题，解锁方法图鉴；五种植物案例按需补学。
2. 在“空间探索”环视全景、点击原有热点；也可切换两幅额外全景、普通照片并排比较，保存独立观察、收藏资料，在二维沙盘观察带谱并完成排序练习。
   “地带性探究”进一步提供西天目山气候、土壤与植被资料，以及全球植被图鉴。山地资料可切换样点、查看引用、收藏并记录观察；在档案馆的“地带性探究记录”回看和导出。
3. 在“专题探究”进入柳杉衰退的问题链，结合原始照片整理证据；另外三专题可填写草记与研究计划，导出后继续补充资料。
4. 在“科考档案馆”的“证据工作台”填写可见事实、研究含义与待补证据，选择资料在解释中的作用，再加入“研究论证板”。
5. 在“成果交流”选择证据、保存草稿或归档，查看修订版本、添加本地附件、导出 Markdown。
6. 在“学习反馈”检查各环节已有材料、方法训练及带谱完成情况，填写反思并导出过程记录。方法记录另在“望闻问切”页面导出。

保存后的记录可在刷新或重启服务后恢复。保存失败会保留当前输入；离开未保存表单时会请求确认。成果版本保留保存时的证据快照，后续修改分析不会改写旧成果中的引用。

## 页面与实现范围

| 页面 | 当前能力 |
| --- | --- |
| 项目总览 | 方法学习、样带与专题入口、基于已保存材料的流程进度 |
| 望闻问切 | 10 题入门路线、五种植物案例共 26 题、24 张知识卡与解锁图鉴、图片来源及放大、学习记录导出 |
| 空间探索 | 真实全景环视与切换、普通照片对比、植被带示意、带谱排序、观察与笔记 |
| 垂直地带性探究 | 西天目山 V11：26 项资料、32 组数据、13 个图表、样点切换、土壤剖面、山地与林分插图、过程演示、古道地点卡（7 卡 15 图）、正文高亮/直线/波浪线/摘录/批注、参考文献、收藏与观察 |
| 星球植被图鉴 | Three.js 纹理地球、7 类植被、5 种展示模式、地域比较路线、全屏；无 WebGL 时沿用原页面的 Canvas 2D 球面 |
| 专题探究 | 四专题问题链、专题草记、研究计划；柳杉专题可关联现有照片证据 |
| 科考档案馆 | 发现收藏、独立观察、三项证据分析、研究论证板 |
| 成果交流 | 个人成果草稿、归档、修订版本、本地附件、Markdown 导出 |
| 学习反馈 | 过程材料检查、个人反思、过程记录导出 |
| 课程资料库 | 资料摘要、分类检索、来源与待读清单 |

“小目”提供按页面变化的课程提示，通过 main 的知识问答 API 检索课程卡片与来源。目前未连接生成式模型。该接口不是开放式生成问答；未命中时会明确提示。

720 云、ArcGIS、真实 DEM 与路线剖面、语音、正式账户、班级协作和教师评分尚未实现，页面不提供这些功能的占位入口。当前沙盘与带谱为二维植被带示意；全景由 Photo Sphere Viewer 呈现，保留 main 配置的三个观察热点，其余两幅可切换全景不添加虚构热点。

照片只作为可核查的画面资料；坐标、海拔和全景链接均为空。素材编号表示目录顺序，不表示真实地理路线；当前照片不作为时间序列或物种鉴定的依据。

## 代码结构

```text
platform/
  backend/
    app/
      main.py          # FastAPI 路由、会话、流程反馈与导出
      catalog.py       # 只读的课程与照片目录
      schemas.py       # 输入结构与校验
      store.py         # SQLite 持久化与成果版本
    tests/             # 后端流程与数据边界测试
    data/              # 运行时数据，不纳入 Git
  frontend/
    src/
      App.vue          # 导航与页面框架
      pages/           # 十个课程与研学页面
      components/      # 全景、观察表单、知识导学与课程图片
      stores/          # Pinia 状态与 API 调用
      types.ts         # 前后端数据结构
      style.css        # 保留 main 的页面风格
      course.css       # 仅新增功能的局部样式
      geography.css    # 地带性课程在平台内的布局适配
      course/          # 地理组方法训练题目、卡片及素材清单
    e2e/               # Playwright 浏览器流程测试
    public/media/      # 从原照片生成的网页素材
    public/lessons/    # 两份 HTML 课程提取的运行资源，纳入 Git
  tools/
    start.ps1          # 启动本地前后端
    stop.ps1           # 停止本项目记录的进程
    prepare-assets.mjs # 准备照片与全景预览
    prepare-identification.py # 从地理组 ZIP 准备方法训练图片和清单
    import-geography-pages.mjs # 从两份 HTML 提取课程脚本、数据和图片
```

前端采用 Vue 3、TypeScript、Pinia、Vue Router 与 Lucide，全景和地球分别由 Photo Sphere Viewer 与 Three.js 呈现；后端采用 FastAPI 和 Python 标准库 SQLite。开发服务器把 `/api` 转发给后端，默认目标为 `http://127.0.0.1:8000`。

## 接口

API 前缀为 `/api/v1`。完整输入、输出及校验要求以运行中的 `/docs` 为准。

| 接口 | 用途 |
| --- | --- |
| `GET /health` | 检查服务状态 |
| `POST /guide/ask` | 基于课程卡片检索导学答案及来源 |
| `GET /bootstrap` | 建立或恢复匿名会话，加载课程目录与个人记录 |
| `PUT /progress`、`PUT /observations/{node_id}` | 保存浏览位置与观察 |
| `POST /favorites`、`PUT /analyses/{favorite_id}` | 收藏资料与保存证据分析 |
| `POST /artifacts`、`PUT /artifacts/{artifact_id}` | 新建或修订成果 |
| `GET /artifacts/{artifact_id}/versions`、`GET /artifacts/{artifact_id}/export` | 查看成果版本、导出已保存成果 |
| `GET/POST /artifacts/{artifact_id}/attachments`、`GET /attachments/{attachment_id}` | 查询、上传与下载附件 |
| `GET /feedback`、`PUT /reflection`、`GET /report/export` | 过程反馈、反思与过程记录导出 |

## 数据保存

默认数据库为 `backend/data/fieldwork.sqlite3`，附件为 `backend/data/uploads/`。后端读取 `GEOVR_DATA_DIR` 时可使用指定的数据目录；浏览器测试单独使用 `.runtime/e2e-data/`。

服务端用随机的 HttpOnly Cookie `tianmu_session` 识别匿名浏览器会话，学习记录和附件按会话隔离。它是本地原型的访问凭据，不等同于正式登录。请持续使用同一浏览器及 `127.0.0.1` 地址；无痕窗口、其他浏览器或 `localhost` 地址会建立不同会话。

清除 Cookie 后，原记录仍在数据库中，但当前原型没有恢复旧会话的界面。需要备份时，先停止服务，再备份整个 `backend/data/` 目录。附件限 10 MB，支持 PDF、常见图片、文本、DOCX 与 PPTX。

## 开发验证

后端：

```powershell
Push-Location .\backend
uv run ruff check app tests
uv run pytest -q
Pop-Location
```

前端：

```powershell
Push-Location .\frontend
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
Pop-Location
```

浏览器测试自动启动隔离服务，默认 API 端口为 `8091`、网页端口为 `5174`；已有服务占用时会报错，可在运行前设置 `GEOVR_TEST_API_PORT` 和 `GEOVR_TEST_WEB_PORT`。测试报告位于 `frontend/playwright-report/`，六个页面的桌面与手机截图位于 `frontend/test-results/`。

## 前端验证

`pnpm test:frontend` 检查十个研学页面、带谱、全景、问答、26 道方法训练题与本地保存，还检查全部山地资料、图鉴像素与拖动、页面切换、观察保存失败和资源重试；`pnpm test:e2e` 检查 API 保存流程。可设置 `$env:PLAYWRIGHT_CHANNEL = 'chrome'` 使用已安装的 Chrome。

全景预览可设置 `GEOVR_PANORAMA_DIR` 指向经授权的 `CAM_001` 目录后运行素材准备脚本，所需文件是 `CAM_20260818103558_0030_D.JPG`、`CAM_20260818103703_0032_D.JPG` 和 `CAM_20260818103812_0034_D.JPG`。脚本校验 2:1 比例并生成 4096 像素宽预览，原始照片与派生预览仍不入 Git。


## 方法训练素材与保存边界

在仓库根目录执行：

```powershell
.\platform\backend\.venv\Scripts\python.exe .\platform\tools\prepare-identification.py 'D:\桌面\VR\对接\望闻问切_开发素材包.zip'
```

导入不修改 ZIP 原件。图片输出到已忽略的 `frontend/public/media/identification/`，课程内容清单输出到 `frontend/src/course/identification.json`。图片按原比例展示，提供放大及署名；外部参考图不作为天目山采集点照片，AI 材质类比不作为真实叶片或识别依据。部分图片仅授权内部开发，不能因代码公开便视为图片也获准公开。

方法训练不修改后端数据表或接口。方法进度、已读卡片及答题次数保存在当前浏览器的 `geovoya:methods-v3`，不纳入服务端过程报告、不会自动跨设备同步，可在训练页面单独导出。四专题的问题链与研究草记均可使用；目前只有柳杉专题具备实际照片证据和服务端问题分类，其余专题还需要补充正式调查资料。

## 地带性课程资源与记录

`/geography/tianmu` 原生挂载西天目山 V11 课程，使用其已有的销毁接口清理观察器、动画和事件监听。路由中的 `page` 参数对应 `CL01`、`SO01`、`VE01` 等资料编号，刷新、返回档案和课程切换均可定位资料。宿主以 `autoTour: false` 关闭自动弹出的操作导览，导览仍可从课程顶部“操作指引”手动打开；局地环境的三步提示只在点击“操作指引”后出现。`/geography/atlas` 通过同源 iframe 隔离原图鉴的渲染器与全局事件；手机上可展开植被选择菜单。

两份源 HTML 的课程运行资源已纳入 `frontend/public/lessons/`，正常使用无需在新机器上重新导入。需要根据更新后的原 HTML 重建资源时，在仓库根目录执行：

```powershell
node .\platform\tools\import-geography-pages.mjs '.\资料库\页面原件\2026-11-04\【经纬度地带性】星球植被图鉴.html' '.\资料库\页面原件\2026-11-05\西天目山_场景与阅读交互升级版_V11_20261104.html'
```

归档的两份源 HTML 为本地资料，不随仓库发布；本机副本位于 `资料库\页面原件\`，西天目山 V11 的 SHA-256 为 `3db9f17299e8797a8d83ea8452310ca469b633e2b410b4afdf204463c4f0c7b8`。脚本解析 JSON 赋值而不执行源文件代码，提取脚本、作用域样式、32 组数据和 13 个图表，去重并转为 70 个 WebP 图片（其中 15 张为古道地点照，保留原文件名写入 `public/lessons/tianmu/landmarks/`），不裁剪；源 HTML 内嵌图片不缩放，仅由 `tianmu-overrides.json` 追加的地点照缩放到长边不超过 2000 px。地图地点卡的文字与照片改动、以及 VE05 资料摘要的替换都写在 `platform/tools/tianmu-overrides.json`，由导入脚本在解析后套用，缺卡片、缺照片、缺本地文件或摘要与预期原文不符都会直接报错；资料正文不在此处改动。完整原始文献阅读器不进入运行资源；原有正文引用、参考文献和图表对照仍保留。来源文件的 SHA-256、图像原始哈希及变换记录见 `frontend/public/lessons/sources.json`；`NOTICE.md` 保留库与图片来源说明。图鉴的气候色面为教学示意，NASA POWER 在线查询及外部植被参考图需要联网；山地插图不等同于真实 DEM 或实测三维模型。

山地课程的收藏、观察笔记、阅读标注（高亮、直线、波浪线、摘录、批注）与古道地点卡收进记录使用浏览器键 `geovoya:tianmu-causes-v9`——键名沿用 V9 以便旧记录直接打开，值中新增 `annotations`、`fieldcards`、`knowledge` 字段。服务模式与独立前端模式共用该本地课程记录。收藏与观察汇入档案馆的“地带性探究记录”，可导出 Markdown，也可在课程证据夹导出 JSON。它们尚未并入服务端照片证据表、论证板或过程报告，不自动跨设备同步。

最高植被带显示名称自 V9 起统一为“落叶针叶混交林”，V11 继续保留原资料“落叶矮林”的名称说明（`source_name_audit`）；代表树种按课程补充为黄山松、金钱松、灯台树、四照花、红果山胡椒，原有记录 ID 与海拔范围保留。对全景采集点的定位与物种鉴定没有因此自动确认。

浏览器测试使用隔离数据，不代表班级共享、正式账户或公网环境已经验证。仓库尚无固定视觉截图基线，当前截图用于人工核对布局，不作视觉回归已通过的声明。

2026-11-04 验证：前端类型检查与生产构建、34 项独立前端浏览器测试、10 项真实服务流程测试、18 项后端测试与 Ruff 检查通过。生产构建仍提示原有全景页面的分包超过 500 kB；图鉴沿用源文件中的 Three.js 经典脚本，浏览器会显示其弃用提醒。后端测试有一条 Starlette 测试客户端依赖弃用提醒。
