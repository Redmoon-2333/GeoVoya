import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Request, Response, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from starlette.exceptions import HTTPException

from app.catalog import (
    CATALOG,
    NODE_IDS,
    QUESTION_IDS,
    RESOURCE_BY_ID,
    THEME_BY_ID,
    answer_guide,
)
from app.schemas import (
    AnalysisInput,
    ArtifactInput,
    FavoriteInput,
    GuideInput,
    ObservationInput,
    ProgressInput,
    ReflectionInput,
)
from app.store import Store

COOKIE = "tianmu_session"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".md", ".txt", ".docx", ".pptx"}


def fail(status: int, message: str, code: str = "invalid_request"):
    raise HTTPException(status, {"code": code, "message": message, "detail": None})


def require_session(request: Request) -> str:
    token = request.cookies.get(COOKIE, "")
    if not token or not request.app.state.store.has_session(token):
        fail(401, "请重新打开页面以建立本地研学档案。", "session_required")
    return token


Owner = Annotated[str, Depends(require_session)]


def create_app(data_dir: Path | None = None) -> FastAPI:
    data_dir = data_dir or Path(
        os.getenv("GEOVR_DATA_DIR", str(Path(__file__).resolve().parent.parent / "data"))
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.store = Store(data_dir / "fieldwork.sqlite3")
        app.state.uploads = data_dir / "uploads"
        app.state.uploads.mkdir(parents=True, exist_ok=True)
        yield

    app = FastAPI(title="天目·寻境 · 本地研学 API", version="0.1.0", lifespan=lifespan)

    @app.middleware("http")
    async def local_origin(request: Request, call_next):
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("origin")
            if origin and (
                urlparse(origin).hostname not in {"127.0.0.1", "localhost", "::1"}
                or request.headers.get("sec-fetch-site") == "cross-site"
            ):
                return JSONResponse(
                    {"code": "origin_rejected", "message": "不接受站外写入。", "detail": None},
                    status_code=403,
                )
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(HTTPException)
    async def http_error(_request, error):
        detail = error.detail
        if not isinstance(detail, dict):
            detail = {"code": "not_found", "message": str(detail), "detail": None}
        return JSONResponse(detail, status_code=error.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request, _error):
        return JSONResponse(
            {"code": "validation_error", "message": "请检查必填项和文字长度。", "detail": None},
            status_code=422,
        )

    def owned(owner: str, kind: str, record_id: str) -> dict:
        result = app.state.store.get(owner, kind, record_id)
        if result is None:
            fail(404, "未找到这条记录。", "not_found")
        return result

    def check_theme(theme_id: str):
        if theme_id not in THEME_BY_ID or THEME_BY_ID[theme_id]["status"] != "prototype":
            fail(422, "该专题资料尚未开放。")

    def check_artifact(owner: str, data: ArtifactInput):
        check_theme(data.theme_id)
        snapshots = []
        for analysis_id in data.evidence_ids:
            analysis = owned(owner, "analysis", analysis_id)
            if analysis["theme_id"] != data.theme_id or not analysis["on_board"]:
                fail(422, "请选择当前专题论证板中的证据。")
            favorite = owned(owner, "favorite", analysis["favorite_id"])
            resource = RESOURCE_BY_ID[favorite["resource_id"]]
            snapshots.append({"analysis": analysis, "favorite": favorite, "resource": resource})
        if data.status == "archived" and (not data.content or not data.evidence_ids):
            fail(422, "完成归档前，请补充正文并关联至少一条论证板证据。")
        return snapshots

    def feedback(owner: str) -> dict:
        store = app.state.store
        observations = store.list(owner, "observation")
        favorites = store.list(owner, "favorite")
        analyses = store.list(owner, "analysis")
        artifacts = store.list(owner, "artifact")
        board = [item for item in analyses if item["on_board"]]
        steps = [
            {
                "id": "observe",
                "title": "观察与记录",
                "done": bool(observations),
                "description": "保存至少一条对实景的独立观察",
                "href": "/explore",
            },
            {
                "id": "collect",
                "title": "收藏发现",
                "done": bool(favorites),
                "description": "收藏资料并保留原始出处",
                "href": "/archive",
            },
            {
                "id": "analyze",
                "title": "整理证据",
                "done": any(
                    item["observed"] and item["meaning"] and item["missing"] for item in analyses
                ),
                "description": "写清观察、含义和仍需补充的资料",
                "href": "/archive?tab=workbench",
            },
            {
                "id": "argue",
                "title": "组织解释",
                "done": bool(board),
                "description": "把分析加入论证板，保留局限",
                "href": "/archive?tab=board",
            },
            {
                "id": "create",
                "title": "形成成果",
                "done": any(item["status"] == "archived" for item in artifacts),
                "description": "完成带有证据引用的个人成果",
                "href": "/outcomes",
            },
        ]
        return {
            "steps": steps,
            "counts": {
                "observations": len(observations),
                "favorites": len(favorites),
                "analyses": len(analyses),
                "board": len(board),
                "artifacts": len(artifacts),
            },
            "completed_steps": sum(step["done"] for step in steps),
            "teacher_status": "not_connected",
            "dimensions": [
                {
                    "title": "信息搜集与处理",
                    "status": "已保留来源" if favorites else "等待资料收藏",
                    "note": "收藏保留文件出处与素材版本",
                },
                {
                    "title": "实践观察",
                    "status": "已有观察记录" if observations else "等待独立观察",
                    "note": "普通照片观察；现场调查与空间数据待补充",
                },
                {"title": "合作探究", "status": "待接入课堂", "note": "个人记录不作为合作表现依据"},
                {
                    "title": "分析解释",
                    "status": "已有分析草稿" if board else "等待证据分析",
                    "note": "提示记录是否齐全，科学解释由教师评价",
                },
                {
                    "title": "成果表达",
                    "status": "已有归档成果" if steps[-1]["done"] else "等待成果归档",
                    "note": "正文、证据引用和修订版本分别保留",
                },
            ],
        }

    @app.get("/api/v1/health")
    def health():
        return {"status": "ok", "mode": "local_prototype"}

    @app.post("/api/v1/guide/ask")
    def ask_guide(data: GuideInput, owner: Owner):
        if data.node_id is not None and data.node_id not in NODE_IDS:
            fail(422, "当前观察节点不存在。")
        if data.theme_id not in THEME_BY_ID:
            fail(422, "当前专题不存在。")
        answer = answer_guide(data.question)
        return {
            **answer,
            "question": data.question,
            "page": data.page,
            "node_id": data.node_id,
            "theme_id": data.theme_id,
            "disclaimer": "当前回答来自审核后的本地知识包，不是生成式模型，也不替代教师判断。",
        }

    @app.get("/api/v1/bootstrap")
    def bootstrap(request: Request, response: Response):
        token = request.cookies.get(COOKIE, "")
        if not token or not app.state.store.has_session(token):
            token = secrets.token_urlsafe(32)
            app.state.store.create_session(token)
            response.set_cookie(
                COOKIE,
                token,
                httponly=True,
                samesite="strict",
                max_age=60 * 60 * 24 * 180,
                path="/",
            )
        store = app.state.store
        return {
            "catalog": CATALOG,
            "progress": store.get(token, "progress", "current"),
            "observations": store.list(token, "observation"),
            "favorites": store.list(token, "favorite"),
            "analyses": store.list(token, "analysis"),
            "artifacts": store.list(token, "artifact"),
            "reflection": store.get(token, "reflection", "current"),
            "feedback": feedback(token),
        }

    @app.put("/api/v1/progress")
    def save_progress(data: ProgressInput, owner: Owner):
        if data.last_node is not None and data.last_node not in NODE_IDS:
            fail(422, "观察素材不存在。")
        check_theme(data.theme_id)
        return app.state.store.save(owner, "progress", data.model_dump(), "current")

    @app.put("/api/v1/observations/{node_id}")
    def save_observation(node_id: str, data: ObservationInput, owner: Owner):
        if node_id not in NODE_IDS or data.node_id != node_id:
            fail(422, "观察素材不存在或关联不一致。")
        return app.state.store.save(owner, "observation", data.model_dump(), node_id)

    @app.post("/api/v1/favorites")
    def save_favorite(data: FavoriteInput, owner: Owner):
        if data.resource_id not in RESOURCE_BY_ID:
            fail(404, "资料不存在。", "not_found")
        existing = app.state.store.get(owner, "favorite", data.resource_id)
        if existing:
            return existing
        resource = RESOURCE_BY_ID[data.resource_id]
        return app.state.store.save(
            owner,
            "favorite",
            {
                "resource_id": data.resource_id,
                "source": resource["source"],
                "source_version": resource["source_version"],
            },
            data.resource_id,
        )

    @app.put("/api/v1/analyses/{favorite_id}")
    def save_analysis(favorite_id: str, data: AnalysisInput, owner: Owner):
        if data.favorite_id != favorite_id:
            fail(422, "收藏关联不一致。")
        owned(owner, "favorite", favorite_id)
        check_theme(data.theme_id)
        if data.question_id not in QUESTION_IDS:
            fail(422, "研究子问题不存在。")
        if data.on_board and not (data.observed and data.meaning and data.missing):
            fail(422, "加入论证板前，请先填写三项分析。")
        return app.state.store.save(owner, "analysis", data.model_dump(), favorite_id)

    @app.post("/api/v1/artifacts", status_code=201)
    def create_artifact(data: ArtifactInput, owner: Owner):
        snapshots = check_artifact(owner, data)
        return app.state.store.save_artifact(
            owner, None, {**data.model_dump(), "evidence_snapshots": snapshots}
        )

    @app.put("/api/v1/artifacts/{artifact_id}")
    def update_artifact(artifact_id: str, data: ArtifactInput, owner: Owner):
        owned(owner, "artifact", artifact_id)
        snapshots = check_artifact(owner, data)
        return app.state.store.save_artifact(
            owner, artifact_id, {**data.model_dump(), "evidence_snapshots": snapshots}
        )

    @app.get("/api/v1/artifacts/{artifact_id}/versions")
    def artifact_versions(artifact_id: str, owner: Owner):
        owned(owner, "artifact", artifact_id)
        return [
            item
            for item in app.state.store.list(owner, "revision")
            if item["artifact_id"] == artifact_id
        ]

    @app.get("/api/v1/artifacts/{artifact_id}/attachments")
    def list_attachments(artifact_id: str, owner: Owner):
        owned(owner, "artifact", artifact_id)
        return [
            item
            for item in app.state.store.list(owner, "attachment")
            if item["artifact_id"] == artifact_id
        ]

    @app.post("/api/v1/artifacts/{artifact_id}/attachments", status_code=201)
    async def upload_attachment(
        artifact_id: str, owner: Owner, file: Annotated[UploadFile, File()]
    ):
        owned(owner, "artifact", artifact_id)
        filename = Path((file.filename or "").replace("\\", "/")).name
        extension = Path(filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS or len(filename) > 200:
            fail(422, "请选择 PDF、图片、文本、DOCX 或 PPTX 文件，文件名不超过 200 字。")
        attachment_id = str(uuid4())
        target = app.state.uploads / attachment_id
        total = 0
        try:
            with target.open("wb") as output:
                while chunk := await file.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_UPLOAD_BYTES:
                        fail(413, "附件不能超过 10 MB。", "file_too_large")
                    output.write(chunk)
            if total == 0:
                fail(422, "文件内容为空。")
            return app.state.store.save(
                owner,
                "attachment",
                {"artifact_id": artifact_id, "filename": filename, "size": total},
                attachment_id,
            )
        except BaseException:
            target.unlink(missing_ok=True)
            raise
        finally:
            await file.close()

    @app.get("/api/v1/attachments/{attachment_id}")
    def download_attachment(attachment_id: str, owner: Owner):
        attachment = owned(owner, "attachment", attachment_id)
        return FileResponse(
            app.state.uploads / attachment["id"],
            media_type="application/octet-stream",
            filename=attachment["filename"],
        )

    @app.get("/api/v1/artifacts/{artifact_id}/export")
    def export_artifact(artifact_id: str, owner: Owner):
        artifact = owned(owner, "artifact", artifact_id)
        lines = [
            f"# {artifact['title']}",
            "",
            f"专题：{THEME_BY_ID[artifact['theme_id']]['title']}",
            f"版本：{artifact['version']}",
            f"保存时间：{artifact['updated_at']}",
            "",
            artifact["summary"],
            "",
            artifact["content"],
            "",
            "## 证据引用",
        ]
        for snapshot in artifact["evidence_snapshots"]:
            analysis = snapshot["analysis"]
            favorite = snapshot["favorite"]
            resource = snapshot["resource"]
            lines.extend(
                [
                    "",
                    f"### {resource['title']}",
                    f"- 来源：{favorite['source']}",
                    f"- 素材版本：{favorite['source_version']}",
                    f"- 观察：{analysis['observed']}",
                    f"- 含义：{analysis['meaning']}",
                    f"- 待补充：{analysis['missing']}",
                ]
            )
        lines.extend(["", "本地研学原型个人成果；教师尚未评价。"])
        return PlainTextResponse(
            "\n".join(lines),
            headers={"Content-Disposition": 'attachment; filename="tianmu-outcome.md"'},
        )

    @app.get("/api/v1/feedback")
    def get_feedback(owner: Owner):
        return feedback(owner)

    @app.put("/api/v1/reflection")
    def save_reflection(data: ReflectionInput, owner: Owner):
        return app.state.store.save(owner, "reflection", data.model_dump(), "current")

    @app.get("/api/v1/report/export")
    def export_report(owner: Owner):
        report = feedback(owner)
        lines = ["# 天目·寻境 · 个人研学过程记录", "", "教师评价：待接入课堂", ""]
        lines.extend(
            f"- {'已记录' if step['done'] else '待补充'}：{step['title']}"
            for step in report["steps"]
        )
        lines.extend(["", "## 我的观察"])
        for observation in app.state.store.list(owner, "observation"):
            node = next(item for item in CATALOG["nodes"] if item["id"] == observation["node_id"])
            resource = RESOURCE_BY_ID[node["resource_id"]]
            lines.extend(
                [
                    "",
                    f"### {node['title']}",
                    f"来源：{resource['source']}",
                    f"观察：{observation['fact']}",
                    f"依据：{observation['evidence']}",
                    f"疑问：{observation['question']}",
                ]
            )
        reflection = app.state.store.get(owner, "reflection", "current")
        lines.extend(["", "## 我的反思", (reflection or {}).get("text", "")])
        return PlainTextResponse(
            "\n".join(lines),
            headers={"Content-Disposition": 'attachment; filename="tianmu-learning-record.md"'},
        )

    return app


app = create_app()
