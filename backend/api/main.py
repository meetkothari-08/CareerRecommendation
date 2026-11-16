"""FastAPI service exposing the CareerRec engine.

Run:  uvicorn api.main:app --reload   (from the backend/ directory)
Docs: http://localhost:8000/docs
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from careerrec import __version__, paths
from careerrec.llm import LLMAdvisor
from careerrec.pipeline import CareerEngine
from careerrec.recommender import UserProfile

from .schemas import ChatRequest, ChatResponse, RecommendRequest, RecommendResponse

logging.basicConfig(level=logging.INFO)
state: dict = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    state["engine"] = CareerEngine.load()
    state["llm"] = LLMAdvisor()
    yield
    state.clear()


app = FastAPI(
    title="CareerRec API",
    version=__version__,
    lifespan=lifespan,
    description="Hybrid ML + LLM career recommendation, skill-gap analysis and job-market insights.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


def _profile(req: RecommendRequest) -> UserProfile:
    return UserProfile(req.skills, req.interests, req.education, req.experience_years, req.goals)


def _profile_context(req: RecommendRequest, extracted: list[str]) -> dict:
    return {
        "extracted_skills": extracted,
        "interests": req.interests,
        "education": req.education,
        "experience_years": req.experience_years,
        "goals": req.goals,
    }


@app.get("/api/health")
def health() -> dict:
    llm: LLMAdvisor = state["llm"]
    return {
        "status": "ok",
        "version": __version__,
        "model": state["engine"].recommender.model_name,
        "llm_enabled": llm.enabled,
        "llm_model": llm.model if llm.enabled else None,
    }


@app.get("/api/careers")
def careers() -> list[dict]:
    return [
        {
            "id": c.id,
            "title": c.title,
            "family": c.family,
            "description": c.description,
            "core_skills": c.core_skills,
            "salary_usd": list(c.salary_usd),
            "growth": c.growth,
        }
        for c in state["engine"].careers
    ]


@app.post("/api/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest) -> dict:
    engine: CareerEngine = state["engine"]
    result = engine.recommend(_profile(req), top_k=req.top_k)
    if not result["extracted_skills"] and not (req.interests or req.goals).strip():
        raise HTTPException(422, "No recognisable skills or interests found. Try e.g. 'Python, SQL, React'.")
    if req.include_advice:
        ctx = _profile_context(req, result["extracted_skills"])
        result["advice"] = state["llm"].career_advice(ctx, result["recommendations"])
    return result


@app.get("/api/market/overview")
def market_overview() -> dict:
    return state["engine"].market.overview()


@app.get("/api/market/careers/{career_id}")
def market_career(career_id: str) -> dict:
    data = state["engine"].market.career(career_id)
    if data is None:
        raise HTTPException(404, f"Unknown career '{career_id}'")
    return data


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> dict:
    profile = recs = None
    if req.profile:
        result = state["engine"].recommend(_profile(req.profile), top_k=3, with_courses=False)
        profile, recs = _profile_context(req.profile, result["extracted_skills"]), result["recommendations"]
    return state["llm"].chat(req.message, [m.model_dump() for m in req.history], profile, recs)


@app.get("/api/metrics")
def metrics() -> dict:
    if not paths.METRICS_PATH.exists():
        raise HTTPException(404, "No metrics yet - run `python -m scripts.train`.")
    return json.loads(paths.METRICS_PATH.read_text())
