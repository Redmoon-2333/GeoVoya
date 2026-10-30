from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import COOKIE, MAX_UPLOAD_BYTES, create_app


@pytest.fixture
def client(tmp_path: Path):
    with TestClient(create_app(tmp_path)) as result:
        result.get("/api/v1/bootstrap")
        yield result


def collect_and_analyze(client: TestClient) -> dict:
    favorite = client.post("/api/v1/favorites", json={"resource_id": "photo-floor"})
    assert favorite.status_code == 200
    response = client.put(
        "/api/v1/analyses/photo-floor",
        json={
            "favorite_id": "photo-floor",
            "observed": "画面中有倒木和林下植物。",
            "meaning": "可用于描述当前画面中的地表覆盖。",
            "missing": "缺少同点位不同时期的对照。",
            "scope": "仅适用于当前画面",
            "on_board": True,
        },
    )
    assert response.status_code == 200
    return response.json()


def artifact_payload() -> dict:
    return {
        "title": "林下观察研究",
        "summary": "从可见现象出发。",
        "content": "照片可以描述现象，成因仍需进一步调查。",
        "evidence_ids": ["photo-floor"],
        "status": "archived",
    }


def test_catalog_does_not_invent_spatial_data(client: TestClient):
    data = client.get("/api/v1/bootstrap").json()
    assert len(data["catalog"]["resources"]) == 3
    assert len(data["catalog"]["themes"]) == 4
    for node in data["catalog"]["nodes"]:
        assert node["latitude"] is None
        assert node["longitude"] is None
        assert node["altitude_m"] is None
        assert node["panorama_url"] is None
    assert data["feedback"]["completed_steps"] == 0
    assert data["catalog"]["capabilities"]["generative_ai"] is False
    assert data["feedback"]["teacher_status"] == "not_connected"


def test_local_panorama_sandbox_and_knowledge_guide(client: TestClient):
    data = client.get("/api/v1/bootstrap").json()
    assert data["catalog"]["capabilities"]["local_panorama"] is True
    assert data["catalog"]["capabilities"]["sandbox_2d"] is True
    assert data["catalog"]["panorama_samples"][0]["image"] == "/media/tianmu-panorama.webp"
    assert len(data["catalog"]["vegetation_zones"]) == 4
    reply = client.post(
        "/api/v1/guide/ask",
        json={"question": "为什么要先观察再解释？", "page": "/explore"},
    )
    assert reply.status_code == 200
    payload = reply.json()
    assert payload["mode"] == "knowledge_pack"
    assert payload["matched_card_id"] == "observe-before-explain"
    assert "单张照片" in payload["answer"]
    assert payload["disclaimer"]


def test_guide_rejects_unknown_node(client: TestClient):
    response = client.post(
        "/api/v1/guide/ask",
        json={"question": "如何观察？", "node_id": "unknown"},
    )
    assert response.status_code == 422


def test_session_required_and_cookie_flags(tmp_path: Path):
    with TestClient(create_app(tmp_path)) as client:
        assert client.get("/api/v1/feedback").status_code == 401
        response = client.get("/api/v1/bootstrap")
        cookie = response.headers["set-cookie"].lower()
        assert "httponly" in cookie and "samesite=strict" in cookie
        assert client.cookies.get(COOKIE)


@pytest.mark.parametrize(
    ("path", "payload", "status"),
    [
        ("/observations/sample-01", {"node_id": "sample-01", "fact": "   "}, 422),
        ("/observations/sample-01", {"node_id": "sample-02", "fact": "观察"}, 422),
        ("/observations/no-node", {"node_id": "no-node", "fact": "观察"}, 422),
        ("/observations/sample-01", {"node_id": "sample-01", "fact": "a" * 4001}, 422),
        ("/progress", {"last_node": "no-node"}, 422),
        ("/progress", {"theme_id": "bamboo"}, 422),
    ],
)
def test_invalid_inputs(client: TestClient, path: str, payload: dict, status: int):
    response = client.put(f"/api/v1{path}", json=payload)
    assert response.status_code == status
    assert response.json()["message"]


def test_unknown_resource_and_idempotent_favorite(client: TestClient):
    assert client.post("/api/v1/favorites", json={"resource_id": "unknown"}).status_code == 404
    first = client.post("/api/v1/favorites", json={"resource_id": "photo-floor"}).json()
    second = client.post("/api/v1/favorites", json={"resource_id": "photo-floor"}).json()
    assert first == second
    assert first["source"].endswith("IMG_20260820_111143.jpg")
    assert first["source_version"] == "local-photo-v1"
    assert len(client.get("/api/v1/bootstrap").json()["favorites"]) == 1


def test_analysis_requires_favorite_and_complete_board(client: TestClient):
    assert (
        client.put("/api/v1/analyses/photo-floor", json={"favorite_id": "photo-floor"}).status_code
        == 404
    )
    client.post("/api/v1/favorites", json={"resource_id": "photo-floor"})
    assert (
        client.put(
            "/api/v1/analyses/photo-floor",
            json={"favorite_id": "photo-floor", "observed": "内容", "on_board": True},
        ).status_code
        == 422
    )
    assert (
        client.put(
            "/api/v1/analyses/photo-floor",
            json={"favorite_id": "photo-floor", "question_id": "unknown"},
        ).status_code
        == 422
    )
    assert (
        client.put(
            "/api/v1/analyses/photo-floor", json={"favorite_id": "photo-floor", "observed": "草稿"}
        ).status_code
        == 200
    )
    assert not client.get("/api/v1/bootstrap").json()["analyses"][0]["on_board"]


def test_complete_workflow_revisions_and_frozen_citations(client: TestClient):
    assert (
        client.put(
            "/api/v1/observations/sample-01",
            json={"node_id": "sample-01", "fact": "地表存在倒木。"},
        ).status_code
        == 200
    )
    analysis = collect_and_analyze(client)
    data = artifact_payload()
    response = client.post("/api/v1/artifacts", json=data)
    assert response.status_code == 201
    artifact = response.json()
    assert artifact["version"] == 1
    assert artifact["evidence_snapshots"][0]["analysis"]["observed"] == analysis["observed"]

    updated_analysis = {
        key: value
        for key, value in analysis.items()
        if key not in {"id", "created_at", "updated_at"}
    }
    updated_analysis["observed"] = "后来的新观察"
    assert client.put("/api/v1/analyses/photo-floor", json=updated_analysis).status_code == 200
    exported = client.get(f"/api/v1/artifacts/{artifact['id']}/export")
    assert exported.status_code == 200
    assert analysis["observed"] in exported.text
    assert "后来的新观察" not in exported.text

    data["content"] = "修订后的研究正文"
    revised = client.put(f"/api/v1/artifacts/{artifact['id']}", json=data).json()
    assert revised["version"] == 2
    versions = client.get(f"/api/v1/artifacts/{artifact['id']}/versions").json()
    assert [item["version"] for item in versions] == [2, 1]
    assert versions[1]["content"] == artifact["content"]
    assert versions[1]["evidence_snapshots"][0]["analysis"]["observed"] == analysis["observed"]
    assert client.get("/api/v1/feedback").json()["completed_steps"] == 5
    assert (
        client.put("/api/v1/reflection", json={"text": "我需要更多比较证据。"}).status_code == 200
    )
    report = client.get("/api/v1/report/export")
    assert "我需要更多比较证据。" in report.text
    assert "地表存在倒木。" in report.text


def test_archive_requires_content_and_valid_board_evidence(client: TestClient):
    assert (
        client.post("/api/v1/artifacts", json={"title": "草稿", "status": "draft"}).status_code
        == 201
    )
    assert (
        client.post("/api/v1/artifacts", json={"title": "成果", "status": "archived"}).status_code
        == 422
    )
    assert client.post("/api/v1/artifacts", json=artifact_payload()).status_code == 404
    collect_and_analyze(client)
    assert (
        client.post("/api/v1/artifacts", json={**artifact_payload(), "content": " "}).status_code
        == 422
    )
    assert (
        client.post(
            "/api/v1/artifacts", json={**artifact_payload(), "theme_id": "bamboo"}
        ).status_code
        == 422
    )
    assert (
        client.put(
            "/api/v1/analyses/photo-floor", json={"favorite_id": "photo-floor", "on_board": False}
        ).status_code
        == 200
    )
    assert client.post("/api/v1/artifacts", json=artifact_payload()).status_code == 422


def test_persistence_after_app_restart(tmp_path: Path):
    with TestClient(create_app(tmp_path)) as first:
        first.get("/api/v1/bootstrap")
        token = first.cookies.get(COOKIE)
        first.put(
            "/api/v1/observations/sample-01",
            json={"node_id": "sample-01", "fact": "重启后仍应存在。"},
        )
    with TestClient(create_app(tmp_path)) as second:
        second.cookies.set(COOKIE, token)
        data = second.get("/api/v1/bootstrap").json()
        assert len(data["observations"]) == 1
        assert data["observations"][0]["fact"] == "重启后仍应存在。"
    assert (tmp_path / "fieldwork.sqlite3").is_file()


def test_other_session_cannot_read_or_update_records(client: TestClient):
    collect_and_analyze(client)
    artifact = client.post("/api/v1/artifacts", json=artifact_payload()).json()
    attachment = client.post(
        f"/api/v1/artifacts/{artifact['id']}/attachments",
        files={"file": ("notes.txt", b"private field notes", "text/plain")},
    ).json()
    with TestClient(client.app) as other:
        data = other.get("/api/v1/bootstrap").json()
        assert not data["favorites"] and not data["artifacts"]
        assert (
            other.put(f"/api/v1/artifacts/{artifact['id']}", json=artifact_payload()).status_code
            == 404
        )
        for path in [
            f"/artifacts/{artifact['id']}/versions",
            f"/artifacts/{artifact['id']}/attachments",
            f"/artifacts/{artifact['id']}/export",
            f"/attachments/{attachment['id']}",
        ]:
            assert other.get(f"/api/v1{path}").status_code == 404


def test_attachment_validation_and_download(client: TestClient):
    artifact = client.post("/api/v1/artifacts", json={"title": "附件测试"}).json()
    path = f"/api/v1/artifacts/{artifact['id']}/attachments"
    assert client.post(path, files={"file": ("bad.html", b"<script>")}).status_code == 422
    assert client.post(path, files={"file": ("empty.txt", b"")}).status_code == 422
    assert (
        client.post(path, files={"file": ("big.txt", b"a" * (MAX_UPLOAD_BYTES + 1))}).status_code
        == 413
    )
    response = client.post(path, files={"file": ("notes.txt", b"saved", "text/plain")})
    assert response.status_code == 201
    attachment = response.json()
    download = client.get(f"/api/v1/attachments/{attachment['id']}")
    assert download.content == b"saved"
    assert "attachment;" in download.headers["content-disposition"]
    assert len(client.get(path).json()) == 1
    assert len(list(client.app.state.uploads.iterdir())) == 1


def test_cross_site_write_rejected_and_input_not_modified(client: TestClient):
    response = client.put(
        "/api/v1/reflection",
        json={"text": "站外请求"},
        headers={"Origin": "https://example.com", "Sec-Fetch-Site": "cross-site"},
    )
    assert response.status_code == 403
    assert client.get("/api/v1/bootstrap").json()["reflection"] is None
    assert (
        client.put(
            "/api/v1/reflection",
            json={"text": "<script>plain text</script>"},
            headers={"Origin": "http://127.0.0.1:5173"},
        ).status_code
        == 200
    )
