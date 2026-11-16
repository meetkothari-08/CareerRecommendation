"""Request/response models for the REST API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    skills: str | list[str] = Field(..., description="Free text or list, e.g. 'python, sklearn, SQL, k8s'")
    interests: str = Field("", description="Free-text interests, e.g. 'AI, healthcare'")
    education: str = Field("", description="Highest education, e.g. 'B.Tech in Computer Science'")
    experience_years: float = Field(0, ge=0, le=60)
    goals: str = Field("", description="Career goals in your own words")
    top_k: int = Field(5, ge=1, le=10)
    include_advice: bool = Field(True, description="Generate the LLM career report")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "skills": "Python, pandas, scikit-learn, SQL, a bit of PyTorch",
                    "interests": "machine learning, building AI products",
                    "education": "B.Tech in Computer Science",
                    "experience_years": 1,
                    "goals": "Become an ML engineer at a product company",
                }
            ]
        }
    }


class SkillGapItem(BaseModel):
    skill: str
    demand: float
    priority: Literal["Critical", "Important", "Nice to have"]


class Course(BaseModel):
    title: str
    provider: str
    url: str
    rating: float
    level: str
    skill: str


class MarketSummary(BaseModel):
    postings: int
    median_salary: float | None
    remote_share: float | None


class Reason(BaseModel):
    reason: str
    contribution: float


class CareerRecommendation(BaseModel):
    career_id: str
    title: str
    family: str
    description: str
    match_score: float
    confidence: float
    signals: dict[str, float]
    explanation: list[Reason]
    skill_coverage: float
    matched_skills: list[str]
    missing_skills: list[SkillGapItem]
    salary_range_usd: list[int]
    growth: str
    education: str
    next_roles: list[str]
    market: MarketSummary
    courses: list[Course]


class Advice(BaseModel):
    text: str
    source: Literal["llm", "template"]
    model: str | None


class RecommendResponse(BaseModel):
    extracted_skills: list[str]
    recommendations: list[CareerRecommendation]
    advice: Advice | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)
    profile: RecommendRequest | None = Field(None, description="Optional profile to ground the answer")


class ChatResponse(BaseModel):
    text: str
    source: str
    model: str | None
