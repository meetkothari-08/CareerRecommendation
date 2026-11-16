"""Labour-market analytics computed from job postings."""

from __future__ import annotations

from collections import Counter

import pandas as pd

from .data import Career


class MarketAnalyzer:
    def __init__(self, postings: pd.DataFrame, careers: list[Career]):
        self.df = postings.copy()
        self.df["salary_mid"] = (self.df["salary_min"] + self.df["salary_max"]) / 2
        self.df["month"] = self.df["posted_date"].dt.to_period("M").astype(str)
        self.careers = {c.id: c for c in careers}

    @staticmethod
    def _skill_share(df: pd.DataFrame, top_n: int) -> list[dict]:
        counts = Counter(s for row in df["skills"] for s in row)
        n = max(len(df), 1)
        return [{"skill": s, "share": round(c / n, 3)} for s, c in counts.most_common(top_n)]

    @staticmethod
    def _trend(df: pd.DataFrame) -> list[dict]:
        return [{"month": m, "postings": int(n)} for m, n in df.groupby("month").size().sort_index().items()]

    def overview(self) -> dict:
        df = self.df
        by_career = (
            df.groupby("career_id")
            .agg(postings=("job_id", "count"), median_salary=("salary_mid", "median"))
            .sort_values("postings", ascending=False)
        )
        return {
            "total_postings": int(len(df)),
            "careers_covered": int(df["career_id"].nunique()),
            "companies": int(df["company"].nunique()),
            "date_range": [df["posted_date"].min().date().isoformat(), df["posted_date"].max().date().isoformat()],
            "remote_share": round(float(df["remote"].mean()), 3),
            "median_salary": float(df["salary_mid"].median()),
            "monthly_trend": self._trend(df),
            "top_skills": self._skill_share(df, 15),
            "top_careers": [
                {
                    "career_id": cid,
                    "title": self.careers[cid].title,
                    "postings": int(r.postings),
                    "median_salary": float(r.median_salary),
                }
                for cid, r in by_career.head(12).iterrows()
            ],
            "by_family": [
                {"family": f, "postings": int(n)}
                for f, n in df.groupby("family").size().sort_values(ascending=False).items()
            ],
            "by_country": [
                {"country": c, "postings": int(n)}
                for c, n in df.groupby("country").size().sort_values(ascending=False).items()
            ],
        }

    def career(self, career_id: str) -> dict | None:
        if career_id not in self.careers:
            return None
        df = self.df[self.df["career_id"] == career_id]
        career = self.careers[career_id]
        if df.empty:
            return {"career_id": career_id, "title": career.title, "postings": 0}
        sal = df["salary_mid"]
        return {
            "career_id": career_id,
            "title": career.title,
            "family": career.family,
            "postings": int(len(df)),
            "share_of_market": round(len(df) / len(self.df), 4),
            "remote_share": round(float(df["remote"].mean()), 3),
            "salary": {
                "p25": float(sal.quantile(0.25)),
                "median": float(sal.median()),
                "p75": float(sal.quantile(0.75)),
            },
            "salary_by_seniority": [
                {"seniority": s, "median_salary": float(v)}
                for s, v in df.groupby("seniority")["salary_mid"]
                .median()
                .reindex(["Junior", "Mid", "Senior", "Lead"])
                .dropna()
                .items()
            ],
            "monthly_trend": self._trend(df),
            "top_skills": self._skill_share(df, 12),
            "top_locations": [
                {"location": loc, "postings": int(n)} for loc, n in df["location"].value_counts().head(6).items()
            ],
        }

    def summary(self, career_id: str) -> dict:
        df = self.df[self.df["career_id"] == career_id]
        if df.empty:
            return {"postings": 0, "median_salary": None, "remote_share": None}
        return {
            "postings": int(len(df)),
            "median_salary": float(df["salary_mid"].median()),
            "remote_share": round(float(df["remote"].mean()), 3),
        }
