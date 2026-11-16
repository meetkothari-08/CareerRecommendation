import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    mp = pytest.MonkeyPatch()
    mp.delenv("LLM_API_KEY", raising=False)
    mp.delenv("GROQ_API_KEY", raising=False)
    from api.main import app

    with TestClient(app) as c:
        yield c
    mp.undo()


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["llm_enabled"] is False
    assert body["model"]


def test_recommend_with_template_advice(client):
    resp = client.post(
        "/api/recommend",
        json={"skills": "React, TypeScript, CSS, HTML, git", "interests": "web development, design", "top_k": 3},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["recommendations"]) == 3
    assert body["recommendations"][0]["career_id"] in {"frontend_developer", "full_stack_developer"}
    assert body["advice"]["source"] == "template"
    assert body["recommendations"][0]["explanation"], "top recommendation should be explained"
    assert "Skill gap plan" in body["advice"]["text"]


def test_recommend_rejects_empty_profile(client):
    assert client.post("/api/recommend", json={"skills": "nothing useful"}).status_code == 422


def test_market_endpoints(client):
    overview = client.get("/api/market/overview").json()
    assert overview["total_postings"] >= 1000 and overview["careers_covered"] >= 50
    career = client.get("/api/market/careers/data_scientist").json()
    assert career["postings"] > 0 and career["salary"]["p25"] <= career["salary"]["p75"]
    assert client.get("/api/market/careers/astronaut").status_code == 404


def test_careers_and_metrics(client):
    assert len(client.get("/api/careers").json()) >= 50
    assert client.get("/api/metrics").json()["dataset"]["test_profiles"] == 100


def test_chat_without_llm_explains_configuration(client):
    body = client.post("/api/chat", json={"message": "How do I become a data engineer?"}).json()
    assert body["source"] == "unavailable"
