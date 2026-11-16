"""Refresh the job-posting dataset from the Adzuna jobs API (real-time market data).

For every career in ``data/careers.json`` the script queries recent postings,
extracts skills from title + description with the same ``SkillExtractor`` used
at inference time, and writes them in the schema of ``data/job_postings.csv``.

Requires free Adzuna credentials (https://developer.adzuna.com):

    export ADZUNA_APP_ID=... ADZUNA_APP_KEY=...
    python -m scripts.ingest_jobs --countries us gb in --per-career 25 --out ../data/job_postings_live.csv

Train on the result with:  CAREERREC_POSTINGS=../data/job_postings_live.csv python -m scripts.train
"""

from __future__ import annotations

import argparse
import os
import time
from pathlib import Path

import httpx
import pandas as pd

from careerrec import paths
from careerrec.data import load_careers
from careerrec.training import build_extractor

API = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
COUNTRY_NAMES = {"us": "United States", "gb": "United Kingdom", "in": "India", "ca": "Canada", "de": "Germany",
                 "au": "Australia", "nl": "Netherlands", "sg": "Singapore", "fr": "France"}
SENIORITY_WORDS = [("Lead", ("lead", "principal", "staff")), ("Senior", ("senior", "sr")), ("Junior", ("junior", "jr"))]


def seniority(title: str) -> str:
    t = title.lower()
    return next((level for level, words in SENIORITY_WORDS if any(w in t.split() for w in words)), "Mid")


def fetch(client: httpx.Client, country: str, what: str, n: int) -> list[dict]:
    params = {"app_id": os.environ["ADZUNA_APP_ID"], "app_key": os.environ["ADZUNA_APP_KEY"],
              "what_phrase": what, "results_per_page": min(n, 50), "content-type": "application/json"}
    resp = client.get(API.format(country=country, page=1), params=params)
    resp.raise_for_status()
    return resp.json().get("results", [])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--countries", nargs="+", default=["us", "gb", "in"])
    parser.add_argument("--per-career", type=int, default=25, help="postings per career and country")
    parser.add_argument("--min-skills", type=int, default=3, help="drop postings with fewer extracted skills")
    parser.add_argument("--out", type=Path, default=paths.DATA_DIR / "job_postings_live.csv")
    args = parser.parse_args()

    careers = load_careers()
    extractor = build_extractor(careers)
    rows = []
    with httpx.Client(timeout=20) as client:
        for career in careers:
            for country in args.countries:
                try:
                    results = fetch(client, country, career.title, args.per_career)
                except httpx.HTTPError as exc:
                    print(f"  ! {career.title} [{country}]: {exc}")
                    continue
                for job in results:
                    text = f"{job.get('title', '')}. {job.get('description', '')}"
                    skills = extractor.extract(text)
                    if len(skills) < args.min_skills:
                        continue
                    salary_min, salary_max = job.get("salary_min"), job.get("salary_max")
                    rows.append({
                        "job_id": f"ADZ{job['id']}", "title": job.get("title", career.title),
                        "career_id": career.id, "family": career.family,
                        "company": job.get("company", {}).get("display_name", "Unknown"),
                        "location": job.get("location", {}).get("display_name", ""),
                        "country": COUNTRY_NAMES.get(country, country.upper()),
                        "remote": "remote" in text.lower(), "seniority": seniority(job.get("title", "")),
                        "salary_min": salary_min, "salary_max": salary_max or salary_min,
                        "currency": "local", "posted_date": job.get("created", "")[:10],
                        "skills": ";".join(skills), "description": job.get("description", "")[:500],
                        "source": "adzuna",
                    })
                time.sleep(0.3)  # stay well within the free-tier rate limit
            print(f"{career.title:35s} total postings so far: {len(rows)}")

    df = pd.DataFrame(rows).drop_duplicates("job_id")
    df = df.dropna(subset=["salary_min"])
    df.to_csv(args.out, index=False)
    print(f"wrote {len(df)} live postings -> {args.out}")


if __name__ == "__main__":
    main()
