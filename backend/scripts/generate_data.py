"""Generate the reproducible job-posting snapshot and evaluation profiles.

The real-time pipeline (``scripts/ingest_jobs.py``) pulls live postings from the
Adzuna API. Because live postings cannot be redistributed and change daily,
the repository ships a *synthetic snapshot* with the same schema, generated
from the career knowledge base with realistic noise:

* ``data/job_postings.csv``             - 1,200 postings across 56 careers
* ``data/eval/validation_profiles.json`` - 400 profiles used to tune blend weights
* ``data/eval/test_profiles.json``       - 100 held-out profiles used for reporting

Profiles are deliberately messy: partial skill lists, aliases (``k8s``,
``sklearn``), off-target skills, blended backgrounds and vague goals.

Usage:  python -m scripts.generate_data
"""

from __future__ import annotations

import json
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

from careerrec import paths
from careerrec.data import Career, load_careers, load_skill_aliases

SEED = 42
N_POSTINGS = 1200
SNAPSHOT_END = date(2026, 10, 31)
MONTHS = 12

SENIORITY = [("Junior", 0.25, 0.0), ("Mid", 0.42, 0.45), ("Senior", 0.26, 0.85), ("Lead", 0.07, 1.1)]
LOCATIONS = [  # (city, country, salary factor, weight)
    ("San Francisco, CA", "United States", 1.20, 8),
    ("New York, NY", "United States", 1.12, 8),
    ("Seattle, WA", "United States", 1.10, 6),
    ("Austin, TX", "United States", 0.98, 5),
    ("Boston, MA", "United States", 1.05, 4),
    ("Chicago, IL", "United States", 0.97, 4),
    ("Toronto, ON", "Canada", 0.80, 4),
    ("London", "United Kingdom", 0.85, 6),
    ("Berlin", "Germany", 0.78, 4),
    ("Amsterdam", "Netherlands", 0.80, 3),
    ("Bengaluru", "India", 0.32, 9),
    ("Hyderabad", "India", 0.30, 5),
    ("Pune", "India", 0.28, 4),
    ("Singapore", "Singapore", 0.85, 4),
    ("Sydney", "Australia", 0.88, 3),
]
COMPANY_A = [
    "Blue",
    "North",
    "Bright",
    "Quantum",
    "Silver",
    "Apex",
    "Nimbus",
    "Vertex",
    "Cedar",
    "Orbit",
    "Lumen",
    "Iron",
    "Coral",
    "Summit",
    "Nova",
    "Pixel",
    "Harbor",
    "Atlas",
    "Zen",
    "Echo",
]
COMPANY_B = [
    "Labs",
    "Analytics",
    "Systems",
    "Health",
    "Robotics",
    "Cloud",
    "Finance",
    "Networks",
    "Data",
    "Security",
    "Dynamics",
    "Works",
    "AI",
    "Logistics",
    "Energy",
    "Media",
]
GENERIC_SKILLS = [
    "Git",
    "Communication",
    "Agile",
    "SQL",
    "Python",
    "Docker",
    "Linux",
    "Excel",
    "Leadership",
    "Problem Solving",
    "Jira",
    "AWS",
    "Documentation",
    "Data Analysis",
]
GROWTH_WEIGHT = {"High": 1.6, "Medium": 1.0, "Low": 0.6}
GROWTH_TREND = {"High": 0.07, "Medium": 0.0, "Low": -0.05}  # monthly drift in posting volume

DESCRIPTION_TEMPLATES = [
    "{company} is hiring a {title}. {desc} You will work with {s1}, {s2} and {s3} in a collaborative team.",
    "As a {title} at {company}, you will join the team that {desc_lower} "
    "Strong experience with {s1} and {s2} is required; {s3} is a plus.",
    "Join {company} as a {title}. {desc} Must have: {s1}, {s2}. Nice to have: {s3}.",
]


def _company(rng: random.Random) -> str:
    return f"{rng.choice(COMPANY_A)}{rng.choice(['', ' '])}{rng.choice(COMPANY_B)}"


def _posting_month_weights(growth: str) -> np.ndarray:
    drift = GROWTH_TREND[growth]
    w = np.array([(1 + drift) ** m for m in range(MONTHS)])
    return w / w.sum()


def generate_postings(careers: list[Career], rng: random.Random, nprng: np.random.Generator) -> pd.DataFrame:
    # Demand depends on growth outlook plus career-specific variation.
    weights = np.array([GROWTH_WEIGHT[c.growth] for c in careers]) * nprng.lognormal(0.0, 0.35, len(careers))
    counts = np.maximum(8, np.round(weights / weights.sum() * N_POSTINGS)).astype(int)
    while counts.sum() > N_POSTINGS:
        counts[np.argmax(counts)] -= 1
    while counts.sum() < N_POSTINGS:
        counts[np.argmax(weights)] += 1

    by_family: dict[str, list[Career]] = {}
    for c in careers:
        by_family.setdefault(c.family, []).append(c)

    loc_w = np.array([loc[3] for loc in LOCATIONS], dtype=float)
    loc_w /= loc_w.sum()
    rows = []
    job_id = 100000
    for career, n in zip(careers, counts):
        month_w = _posting_month_weights(career.growth)
        neighbours = [c for c in by_family[career.family] if c.id != career.id]
        for _ in range(n):
            level, _, frac = SENIORITY[nprng.choice(len(SENIORITY), p=[s[1] for s in SENIORITY])]
            city, country, factor, _ = LOCATIONS[nprng.choice(len(LOCATIONS), p=loc_w)]

            skills = [s for s in career.core_skills if rng.random() < 0.68]
            skills += [s for s in career.secondary_skills if rng.random() < 0.3]
            for _ in range(nprng.poisson(1.5)):
                skills.append(rng.choice(GENERIC_SKILLS))
            if neighbours and rng.random() < 0.5:  # hybrid roles borrow skills from adjacent careers
                skills += rng.sample(rng.choice(neighbours).all_skills, k=rng.randint(1, 2))
            while len(set(skills)) < 4:
                skills.append(rng.choice(career.core_skills))
            skills = list(dict.fromkeys(skills))
            rng.shuffle(skills)

            lo, hi = career.salary_usd
            base = (lo + (hi - lo) * min(frac, 1.0)) * (1.1 if frac > 1 else 1.0) * factor
            base *= nprng.normal(1.0, 0.08)
            salary_min = int(round(base * 0.9, -3))
            salary_max = int(round(base * 1.15, -3))

            month_offset = MONTHS - 1 - nprng.choice(MONTHS, p=month_w)
            posted = SNAPSHOT_END.replace(day=1) - pd.DateOffset(months=int(month_offset))
            posted = (posted + timedelta(days=int(nprng.integers(0, 28)))).date()

            title = career.title if level == "Mid" else f"{level} {career.title}"
            company = _company(rng)
            s1, s2, s3 = (skills + career.core_skills)[:3]
            desc = rng.choice(DESCRIPTION_TEMPLATES).format(
                company=company,
                title=title,
                desc=career.description,
                desc_lower=career.description[0].lower() + career.description[1:],
                s1=s1,
                s2=s2,
                s3=s3,
            )
            rows.append(
                {
                    "job_id": f"JP{job_id}",
                    "title": title,
                    "career_id": career.id,
                    "family": career.family,
                    "company": company,
                    "location": city,
                    "country": country,
                    "remote": bool(rng.random() < (0.35 if career.family != "Hardware & Embedded" else 0.1)),
                    "seniority": level,
                    "salary_min": salary_min,
                    "salary_max": salary_max,
                    "currency": "USD",
                    "posted_date": posted.isoformat(),
                    "skills": ";".join(skills),
                    "description": desc,
                    "source": "synthetic-snapshot",
                }
            )
            job_id += 1
    df = pd.DataFrame(rows).sample(frac=1.0, random_state=SEED).reset_index(drop=True)
    return df


def _surface(skill: str, aliases: dict[str, list[str]], rng: random.Random) -> str:
    """Write a skill the way a person might type it."""
    if skill in aliases and rng.random() < 0.3:
        return rng.choice(aliases[skill])
    return skill.lower() if rng.random() < 0.3 and skill not in {"C", "R", "Go"} else skill


def _skill_overlap(a: Career, b: Career) -> float:
    sa, sb = set(a.all_skills), set(b.all_skills)
    return len(sa & sb) / len(sa | sb)


def generate_profiles(careers: list[Career], aliases: dict[str, list[str]], n: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    by_id = {c.id: c for c in careers}
    all_skills = sorted({s for c in careers for s in c.all_skills})
    edu_options = {
        "Associate": ["Diploma in IT", "Associate degree"],
        "Bachelor's": ["B.Tech in Computer Science", "Bachelor's in Engineering", "BSc", "Bachelor's degree"],
        "Master's": ["Master's in Data Science", "M.Tech", "MSc", "Master's degree", "MBA"],
        "PhD": ["PhD", "PhD in Computer Science"],
    }
    goal_templates = [
        "I want to grow into a role where I work on {interest}.",
        "Looking to build a long-term career in {interest}.",
        "Get my first job in tech and keep learning.",
        "Switch careers into something related to {interest} with good pay.",
        "Become a {title} in the next two years.",
        "Transition into {interest} - I enjoy it more than my current work.",
        "Work at a fast-growing company and take on more responsibility.",
    ]
    profiles = []
    for pid in range(n):
        target = rng.choice(careers)
        blend = None
        kind = rng.choices(["focused", "blended", "switcher"], weights=[0.55, 0.3, 0.15])[0]
        if kind == "blended":  # background spans two related careers
            pool = [by_id[r] for r in target.next_roles] + [
                c for c in careers if c.family == target.family and c.id != target.id
            ]
            blend = rng.choice(pool)
        elif kind == "switcher":  # skills come from a previous career, interests/goals point to the target
            blend = by_id[rng.choice([c.id for c in careers if c.id in target.next_roles or c.family != target.family])]

        keep = rng.uniform(0.1, 0.3) if kind == "switcher" else rng.uniform(0.25, 0.6)
        skills = [s for s in target.core_skills if rng.random() < keep]
        skills += [s for s in target.secondary_skills if rng.random() < 0.15]
        if blend:
            k = rng.randint(3, 5) if kind == "switcher" else rng.randint(1, 3)
            skills += rng.sample(blend.core_skills, k=min(k, len(blend.core_skills)))
        skills += rng.sample(GENERIC_SKILLS, k=rng.randint(1, 3))  # skills everybody lists
        skills += rng.sample(all_skills, k=rng.randint(0, 2))  # off-target noise
        if len(skills) < 3:
            skills += rng.sample(target.core_skills, k=2)
        skills = list(dict.fromkeys(skills))
        rng.shuffle(skills)

        interests = rng.sample(target.interests, k=min(len(target.interests), rng.randint(1, 2)))
        if rng.random() < 0.35:
            interests.append(rng.choice(rng.choice(careers).interests))
        if kind != "switcher" and rng.random() < 0.15:
            interests = []  # some users leave interests empty

        goal = rng.choice(goal_templates).format(interest=rng.choice(target.interests), title=target.title)
        edu = rng.choice(edu_options[target.education if rng.random() < 0.7 else rng.choice(list(edu_options))])

        relevant = {target.id} | ({blend.id} if blend else set())
        relevant |= {c.id for c in careers if c.id != target.id and _skill_overlap(target, c) >= 0.25}
        profiles.append(
            {
                "id": f"P{seed}-{pid:04d}",
                "skills": ", ".join(_surface(s, aliases, rng) for s in skills),
                "interests": ", ".join(interests),
                "education": edu,
                "experience_years": rng.choice([0, 0, 1, 2, 3, 4, 5, 7, 10]),
                "goals": goal,
                "profile_type": kind,
                "target": target.id,
                "relevant": sorted(relevant),
            }
        )
    return profiles


def main() -> None:
    rng = random.Random(SEED)
    nprng = np.random.default_rng(SEED)
    careers = load_careers()
    aliases = load_skill_aliases()

    postings = generate_postings(careers, rng, nprng)
    postings.to_csv(paths.POSTINGS_PATH, index=False)
    print(f"wrote {len(postings)} postings across {postings.career_id.nunique()} careers -> {paths.POSTINGS_PATH}")

    paths.TEST_PROFILES_PATH.parent.mkdir(parents=True, exist_ok=True)
    val = generate_profiles(careers, aliases, 400, seed=7)
    test = generate_profiles(careers, aliases, 100, seed=2025)
    paths.VAL_PROFILES_PATH.write_text(json.dumps(val, indent=1))
    paths.TEST_PROFILES_PATH.write_text(json.dumps(test, indent=1))
    print(f"wrote {len(val)} validation and {len(test)} test profiles")


if __name__ == "__main__":
    main()
