# GeoVoya · 天目寻境：运行与开发说明

本地前后端原型，用于检查页面、研学流程和前后端的数据保存。当前运行不需要付费 API、外部模型、云数据库或地图账户。项目概览与首次配置入口见 [根目录 README](../README.md)。

本分支另提供无需后端的前端交流版。启动前端后打开 `/?demo=1`；八个页面、教学沙盘、带谱重建、真实全景与资料问答的说明见 [前端交流版](FRONTEND_REVIEW.md)。不带该参数时继续使用以下服务模式。

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

1. 在“空间探索”切换照片、放大或并排比较，填写并保存独立观察，然后收藏资料。
2. 在“专题探究”查看柳杉专题的流程样例与研究子问题。
3. 在“科考档案馆”的“证据工作台”填写可见事实、研究含义与待补证据，选择资料在解释中的作用，再加入“研究论证板”。
4. 在“成果交流”选择证据、保存草稿或归档，查看修订版本、添加本地附件、导出 Markdown。
5. 在“学习反馈”检查各环节是否已有保存材料，填写反思并导出过程记录。

保存后的记录可在刷新或重启服务后恢复。保存失败会保留当前输入；离开未保存表单时会请求确认。成果版本保留保存时的证据快照，后续修改分析不会改写旧成果中的引用。

## 页面与实现范围

| 页面 | 当前能力 |
| --- | --- |
| 项目总览 | 项目入口、专题入口、基于已保存材料的流程进度 |
| 空间探索 | 三张真实普通照片、放大、对比、来源说明、观察保存、资料收藏 |
| 专题探究 | 柳杉专题流程样例与子问题；其余三个专题保留待补资料状态 |
| 科考档案馆 | 发现收藏、独立观察、三项证据分析、研究论证板 |
| 成果交流 | 个人成果草稿、归档、修订版本、本地附件、Markdown 导出 |
| 学习反馈 | 过程材料检查、个人反思、过程记录导出 |

“小天”提供按页面变化的固定课程提示，展开时明确标为“固定脚本”。柳杉专题的提示与问题用于检验流程，正式课程内容和评价标准仍需负责人及地理专业同学确认。

以下内容尚未接入：720、ArcGIS、三维沙盘、DEM、海拔剖面、360 全景播放器、生成式智能体、语音、正式账户、班级、小组共享、互评、教师评分及多人协作。相应位置使用待接入状态。

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
      pages/           # 六个主页面
      components/      # 观察表单与固定课程提示
      stores/          # Pinia 状态与 API 调用
      types.ts         # 前后端数据结构
      style.css        # 桌面与手机布局
    e2e/               # Playwright 浏览器流程测试
    public/media/      # 从原照片生成的网页素材
  tools/
    start.ps1          # 启动本地前后端
    stop.ps1           # 停止本项目记录的进程
    prepare-assets.mjs # 准备照片预览
```

前端采用 Vue 3、TypeScript、Pinia、Vue Router 与 Lucide；后端采用 FastAPI 和 Python 标准库 SQLite。开发服务器把 `/api` 转发给后端，默认目标为 `http://127.0.0.1:8000`。

## 接口

API 前缀为 `/api/v1`。完整输入、输出及校验要求以运行中的 `/docs` 为准。

| 接口 | 用途 |
| --- | --- |
| `GET /health` | 检查服务状态 |
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
