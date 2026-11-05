# GeoVoya

**天目·寻境 | 交互式地理研学平台**

以西天目山自然地理研学为场景，将实景观察、资料收藏、证据分析与成果表达串成一个可保存、可回看的学习流程。支持独立前端运行，以及 FastAPI / SQLite 本地服务模式，不依赖付费 API、外部大模型、云数据库或地图账户。

前端启动后访问 `/?demo=1` 可使用浏览器本地档案，无需后端；不带该参数时使用本地 API。两种档案独立。运行配置见 [运行说明](platform/README.md)。

## 当前能力

| 页面 | 已实现 |
| --- | --- |
| 项目总览 | 当前任务与预期产出、五阶段研学路线、个人记录概览；首页直接恢复待完成的阶段 |
| 望闻问切 | 10 题入门路线、5 种植物案例、26 题判题与分级提示、24 张知识卡、图鉴、原图放大及署名、学习记录导出 |
| 空间探索 | 真实 360° 全景拖动与切换、普通照片对比、教学沙盘与带谱示意、笔记、带谱排序检查 |
| 垂直地带性探究 | 西天目山 V11 的 26 项资料、32 组数据、13 个图表、样点比较、土壤与植被插图、地形雨与局地环境过程、古道地点卡、正文标注与批注、引用、收藏和观察 |
| 星球植被图鉴 | 可拖动和缩放的纹理地球、7 类植被、纬度与沿海至内陆路线、气温和降水示意、全屏及手机布局 |
| 专题探究 | 四专题问题链；柳杉专题接通证据工作台、论证板和成果，另外三专题作为拓展草记与研究计划 |
| 科考档案馆 | 发现收藏、实景观察、地带性课程记录；旧工作台与论证板链接自动转到专题探究 |
| 成果交流 | 当前草稿与关联证据、历史成果列表、作品预览、归档、修订历史、附件、Markdown 导出 |
| 学习反馈 | 五阶段基础任务状态、过程记录明细、反思保存、过程记录导出 |
| 课程资料库 | 六份有出处的课程摘要、检索、分类、待读清单 |

实景照片的观察、收藏、证据分析、成果、附件及反思由 FastAPI 和 SQLite 持久化；成果修订保留当时的证据快照。望闻问切进度、带谱笔记与练习、专题草记、研究计划、待读清单和地带性探究记录保存在当前浏览器，提供相应页面的导出。山地资料的收藏与观察可在“科考档案馆”的“地带性探究记录”中回看；它们尚未写入服务端论证板。更换电脑不会自动同步这些本地记录。桌面和手机布局均有浏览器流程测试。

五阶段基础任务依次为：完成 10 道望闻问切入门题；保存至少一条实景观察并写一条非空地带性课程笔记；将填写了可见事实、研究含义和待补证据的一份分析加入论证板；归档一份引用证据的成果；保存非空学习反思。首页、导航和反馈页共用这套规则，收藏、浏览与空白笔记不计作完成。状态表示基础学习产出，不是能力评分，也不限制自由访问。首页优先继续最近进行中的任务，否则推荐最早未完成阶段；题目、素材、课程资料和成果的有效继续位置按演示/API 模式分别保存。已有方法和课程存储键保持兼容。未配置视频源时不显示视频占位内容。

小目提供按页面变化的提示，通过 main 的 `/guide/ask` 知识接口检索课程卡片并展示来源，尚未接入生成式模型。360° 全景使用团队等距柱状投影影像、Photo Sphere Viewer 和 main 的热点配置，补充两幅影像切换；720 云、ArcGIS、真实 DEM / 路线剖面、语音、正式账户、班级共享及教师评价尚未接入。沙盘和带谱明确标为教学示意。全景与照片的采集点、海拔和植被带对应仍待地理组核验；普通照片不作为全景、时间序列或物种鉴定结果展示。

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router、Lucide、Photo Sphere Viewer、Three.js。
- 后端：Python 3.12、FastAPI、SQLite、Uvicorn。
- 验证：pytest、Ruff、Playwright。
- 依赖管理：pnpm 和 uv，包含版本锁文件。

## 快速开始

准备 Node.js 22.12+（或 24 LTS）、pnpm 10、Python 3.12 和 uv。首次安装依赖和浏览器测试环境需要联网，日常运行不需要外部服务。以下命令在 PowerShell 中执行：

```powershell
git clone https://github.com/Redmoon-2333/GeoVoya.git
cd GeoVoya/platform

Push-Location backend
uv sync --python 3.12 --locked
Pop-Location

Push-Location frontend
pnpm install --frozen-lockfile
Pop-Location
```

### 准备本地照片

**本仓库不分发本地课程资料库、实拍原始照片或其派生预览。** 本次集成的两份 HTML 课程所需脚本、数据和图片已随前端发布，进入“地带性探究”无需额外导入。实景照片观察页面和完整浏览器测试需要先准备经授权的本地照片。当前目录使用以下三个文件名，分别对应林下、细节和林冠观察：

```text
IMG_20260820_111143.jpg
IMG_20260820_122236.jpg
IMG_20260820_124918.jpg
```

在 `platform/` 下设置照片所在文件夹，然后生成网页预览：

```powershell
$env:GEOVR_PHOTO_DIR = 'C:\path\to\authorized-photos'
Push-Location frontend
pnpm prepare:assets
Pop-Location
```

脚本不修改原图；生成物位于 `platform/frontend/public/media/`，同样不纳入 Git。未配置环境变量时，脚本沿用项目本地的原照片目录，详见 [运行说明](platform/README.md)。没有这些照片时可独立运行后端、后端测试和前端构建，但照片页面不完整，启动脚本也会提示先准备素材。

### 准备望闻问切素材包

新增课程按地理组 2026-10-30 素材包实现，代码与题目数据纳入仓库，图片原件仍留在本地。首次配置新机器时，在仓库根目录执行：

```powershell
.\platform\backend\.venv\Scripts\python.exe .\platform\tools\prepare-identification.py 'D:\桌面\VR\对接\望闻问切_开发素材包.zip'
```

脚本将 26 张图片放入已忽略的 `public/media/identification/`，并生成课程清单。入门路线共 10 题；完成后解锁方法图鉴，其余植物案例可选做。外部参考照片、教学示意及 AI 材质类比分别标明来源与性质，不冒充本次采集点或真实叶片。包内部分图仅授权内部开发，公开发布前需逐项确认授权。

### 地带性探究课程

在“空间探索”的课程切换栏进入山地资料或全球图鉴，资料库也保留课程入口：

- `/geography/tianmu`：西天目山气候、土壤、植被与成因归纳；通过 `?page=VE01` 等参数直接打开具体资料。
- `/geography/atlas`：全球自然带、纬度与干湿度比较；地球和植物纹理使用本地文件，气候色面保留“教学示意”标识。可选的 NASA POWER 查询和外部植被参考图需要联网。

西天目山课程使用原页面的 `mount/destroy` 接口，收藏、观察、阅读标注和古道地点卡接入浏览器记录及档案馆；全球图鉴在独立 iframe 中运行，离开页面时释放其场景。两份 HTML 的内嵌图片提取为 70 个去重 WebP 文件（其中 15 张古道地点照保留原文件名，见 `public/lessons/tianmu/landmarks/`），保持图片尺寸与比例（仅由 `tianmu-overrides.json` 追加的地点照缩放到长边不超过 2000 px），按课程访问加载。原始 HTML 留在本地归档，HTML 内的完整参考文献阅读器未发布，正文引用和图表来源保留。导入来源与变换见 [课程来源清单](platform/frontend/public/lessons/sources.json) 和 [素材说明](platform/frontend/public/lessons/NOTICE.md)。

嵌入课程默认从植被比较（`VE03`）开始，平台统一提供“比较植被 → 查气候 → 查土壤 → 归纳联系”导航；完整的 26 项资料仍可通过目录检索打开。课程笔记纳入五阶段进度，并在反馈页回看，保持浏览器本地课程记录的性质。

最高植被带显示名称自 V9 起统一为“落叶针叶混交林”，V11 继续保留原资料“落叶矮林”的名称说明（见 `source_name_audit`）；带谱示意不代表全景采集点已完成物种、海拔或植被归属核验。古道地点卡照片的署名与许可见 `NOTICE.md`，通用林道照片只作沿线环境观察，不冒充单株或精确定位证据。

### 启动与停止

本机依赖与素材已准备好时，在仓库根目录双击 `start.cmd`，即可启动前后端并打开网站。重复启动会打开已运行的网站，不会重复启动服务。停止时双击根目录的 `stop.cmd`；学习记录保留。

也可以在 PowerShell 中执行：

```powershell
cd D:\GeoVoya
.\start.cmd
# 停止服务：.\stop.cmd
```

启动器直接使用已安装的 Node.js、项目内的 Vite 与 Python 虚拟环境，无需终端能识别 pnpm。端口被占用时自动选择空闲端口，前端同步连接实际后端地址；运行日志在 `platform/.runtime/`。

只启动服务、不自动打开或切换浏览器时，运行 `.\start.cmd -NoBrowser`，再手动访问启动器打印的网址。

在 `platform/` 下也可继续使用原来的脚本：

```powershell
.\tools\start.ps1
```

默认网页为 <http://127.0.0.1:5173/>，API 文档为 <http://127.0.0.1:8000/docs>。端口被占用时脚本会选择附近空闲端口并打印实际地址。启动脚本面向 Windows，服务仅绑定本机。

```powershell
.\tools\stop.ps1
```

其他系统可分别在 `platform/backend/` 运行 `uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`，在 `platform/frontend/` 运行 `pnpm dev`。当前仓库不是公网部署方案，也未配置 GitHub Pages。

## 开发验证

后端在 `platform/backend/` 执行：

```powershell
uv run ruff check app tests
uv run pytest -q
```

前端在 `platform/frontend/` 执行；完整浏览器测试需先准备照片：

```powershell
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:frontend
```

Playwright 自动启动独立测试服务并使用隔离的数据目录，不读取普通试用档案。默认测试端口为 `8091` 和 `5174`，可通过 `GEOVR_TEST_API_PORT` 和 `GEOVR_TEST_WEB_PORT` 调整。

## 仓库结构

```text
platform/
  backend/       # API、SQLite 存储、输入校验与后端测试
  frontend/      # 研学页面、组件、状态管理与浏览器测试
  tools/         # 本地启动、停止、照片预览生成
  README.md      # 详细配置、接口、数据保存与备份说明
```

## 数据与发布范围

代码仓库包含前后端源码、测试、依赖锁文件、配置、工具脚本及本次两份 HTML 课程的运行资源。不包含本地课程资料库、原始 HTML、完整参考文献阅读器、论文、前期草稿、设计文档、计划、Claude/Codex 等本地工具目录、依赖目录、运行日志、数据库、用户附件和测试产物。课程内容仍需项目团队确认，素材署名与使用性质保留在课程中。

学习记录默认位于 `platform/backend/data/`。匿名档案由 HttpOnly Cookie `tianmu_session` 区分，不等同于正式账户；清除 Cookie 后当前界面无法恢复旧档案。试用时请持续使用同一浏览器和 `127.0.0.1` 地址。备份前先停止服务，再备份整个数据目录。

更多接口、数据边界和启动说明见 [platform/README.md](platform/README.md)。
