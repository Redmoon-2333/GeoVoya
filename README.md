# GeoVoya

**天目·寻境 | 交互式地理研学平台**

以西天目山自然地理研学为场景，将实景观察、资料收藏、证据分析与成果表达串成一个可保存、可回看的学习流程。支持独立前端运行，以及 FastAPI / SQLite 本地服务模式，不依赖付费 API、外部大模型、云数据库或地图账户。

前端启动后访问 `/?demo=1` 可使用浏览器本地档案，无需后端；不带该参数时使用本地 API。两种档案独立。运行配置见 [运行说明](platform/README.md)。

## 当前能力

| 页面 | 已实现 |
| --- | --- |
| 项目总览 | 专题入口、个人记录概览、基于已保存材料的流程进度 |
| 空间探索 | 真实 360° 全景拖动与切换、普通照片对比、教学沙盘与带谱示意、笔记、带谱排序检查 |
| 专题探究 | 四专题问题链、独立草记、研究计划与导出 |
| 科考档案馆 | 收藏与观察、三项证据分析、研究论证板 |
| 成果交流 | 个人作品展示与预览、草稿、归档、修订历史、附件、Markdown 导出 |
| 学习反馈 | 过程材料检查、共同考察记录、反思保存、过程记录导出 |
| 课程资料库 | 六份有出处的课程摘要、检索、分类、待读清单 |

学习记录由 FastAPI 和 SQLite 持久化。刷新页面或重启服务后可继续使用；成果修订保留当时的证据快照。桌面和手机布局均有浏览器流程测试。

小天提供固定脚本导学与本地关键词资料问答，带来源，尚未接入生成式模型。360° 全景使用团队等距柱状投影影像和本地播放器；720 云、ArcGIS、真实 DEM / 路线剖面、语音、正式账户、班级共享及教师评价尚未接入。沙盘和带谱明确标为教学示意。全景与照片的采集点、海拔和植被带对应仍待地理组核验；普通照片不作为全景、时间序列或物种鉴定结果展示。

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Pinia、Vue Router、Lucide。
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

**本仓库不分发课程资料库、原始照片或其派生预览。** 照片观察页面和完整浏览器测试需要先准备经授权的本地照片。当前目录使用以下三个文件名，分别对应林下、细节和林冠观察：

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

### 启动与停止

本机依赖与素材已准备好时，在仓库根目录双击 `start.cmd`，即可启动前后端并打开网站。重复启动会打开已运行的网站，不会重复启动服务。停止时双击根目录的 `stop.cmd`；学习记录保留。

也可以在 PowerShell 中执行：

```powershell
cd D:\GeoVoya
.\start.cmd
# 停止服务：.\stop.cmd
```

启动器直接使用已安装的 Node.js、项目内的 Vite 与 Python 虚拟环境，无需终端能识别 pnpm。端口被占用时自动选择空闲端口，前端同步连接实际后端地址；运行日志在 `platform/.runtime/`。

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

代码仓库包含前后端源码、测试、依赖锁文件、配置和工具脚本。不包含课程资料库、论文、前期草稿、设计文档、计划、Claude/Codex 等本地工具目录、依赖目录、运行日志、数据库、用户附件和测试产物。课程内容仍需项目团队确认，资料公开使用前需确认授权。

学习记录默认位于 `platform/backend/data/`。匿名档案由 HttpOnly Cookie `tianmu_session` 区分，不等同于正式账户；清除 Cookie 后当前界面无法恢复旧档案。试用时请持续使用同一浏览器和 `127.0.0.1` 地址。备份前先停止服务，再备份整个数据目录。

更多接口、数据边界和启动说明见 [platform/README.md](platform/README.md)。
