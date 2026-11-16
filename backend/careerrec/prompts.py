"""Prompt construction shared by the online LLM advisor and the fine-tuning dataset.

Keeping one prompt format for training and inference means the fine-tuned model
sees exactly the same grounded context at serving time as during training.
"""

from __future__ import annotations

SYSTEM_PROMPT = (
    "You are CareerRec, an expert technology career advisor. You receive a candidate profile together with "
    "the output of a machine-learning recommender (ranked careers, match scores, skill gaps and job-market "
    "statistics). Explain the recommendations, stay faithful to the provided data, never invent numbers, "
    "and give a concrete, prioritised learning plan. Be concise and use Markdown headings and bullet points."
)

CHAT_SYSTEM_PROMPT = (
    "You are CareerRec, an expert technology career advisor. Only answer questions about careers, skills, "
    "education, job search and professional growth. If market data or the user's recommendations are provided "
    "in the context, ground your answer in them. Be concise and practical."
)


def _fmt_salary(value: float | None) -> str:
    return f"${value:,.0f}" if value else "n/a"


def build_context(profile: dict, recommendations: list[dict]) -> str:
    """Render the structured ML output into a compact, model-friendly context block."""
    lines = [
        "## Candidate profile",
        f"- Skills: {', '.join(profile.get('extracted_skills') or []) or 'not specified'}",
        f"- Interests: {profile.get('interests') or 'not specified'}",
        f"- Education: {profile.get('education') or 'not specified'}",
        f"- Experience: {profile.get('experience_years', 0)} years",
        f"- Goals: {profile.get('goals') or 'not specified'}",
        "",
        "## Recommender output",
    ]
    for i, rec in enumerate(recommendations, 1):
        market = rec.get("market", {})
        missing = ", ".join(f"{g['skill']} ({g['priority']})" for g in rec.get("missing_skills", [])[:5]) or "none"
        lines += [
            f"{i}. {rec['title']} - match {rec['match_score']}%, skill coverage {round(rec['skill_coverage'] * 100)}%",
            f"   - Matched skills: {', '.join(rec.get('matched_skills', [])[:6]) or 'none'}",
            f"   - Skill gaps: {missing}",
            f"   - Market: {market.get('postings', 0)} postings, "
            f"median salary {_fmt_salary(market.get('median_salary'))}, growth outlook {rec.get('growth', 'n/a')}",
        ]
    return "\n".join(lines)


def build_advice_prompt(profile: dict, recommendations: list[dict]) -> str:
    return (
        build_context(profile, recommendations)
        + "\n\n## Task\nWrite a personalised career report with these sections: "
        "**Why these careers fit**, **Skill gap plan** (prioritise Critical gaps, 30/60/90-day plan), "
        "and **Next steps** (3 concrete actions)."
    )


def template_advice(profile: dict, recommendations: list[dict]) -> str:
    """Deterministic, data-grounded report used when no LLM endpoint is configured.

    Also used as the target-response format when building the supervised
    fine-tuning dataset (see ``finetune/build_sft_dataset.py``).
    """
    if not recommendations:
        return "Add a few skills and interests so I can generate recommendations."
    top = recommendations[0]
    out = ["### Why these careers fit"]
    for rec in recommendations[:3]:
        matched = ", ".join(rec.get("matched_skills", [])[:4])
        reason = f"your experience with {matched}" if matched else "your stated interests"
        market = rec.get("market", {})
        out.append(
            f"- **{rec['title']}** ({rec['match_score']}% match): builds on {reason}. "
            f"{market.get('postings', 0)} recent postings, median salary {_fmt_salary(market.get('median_salary'))}, "
            f"{rec.get('growth', 'n/a').lower()} growth outlook."
        )

    gaps = top.get("missing_skills", [])
    critical = [g["skill"] for g in gaps if g["priority"] == "Critical"]
    important = [g["skill"] for g in gaps if g["priority"] == "Important"]
    nice = [g["skill"] for g in gaps if g["priority"] == "Nice to have"]
    out += [
        "",
        f"### Skill gap plan for {top['title']}",
        f"You already cover {round(top['skill_coverage'] * 100)}% of the skills employers ask for.",
    ]
    out.append(
        f"- **Days 1-30:** {', '.join(critical[:3]) or ', '.join(important[:2]) or 'deepen your strongest skills'}"
        " - these appear in the majority of postings."
    )
    out.append(
        f"- **Days 31-60:** {', '.join((important if critical else important[2:])[:3]) or 'build a portfolio project'}."
    )
    out.append(f"- **Days 61-90:** {', '.join(nice[:3]) or 'contribute to open source and prepare for interviews'}.")

    project_skills = ", ".join((critical + important)[:2]) or "your core skills"
    highlights = ", ".join(top.get("matched_skills", [])[:3]) or "transferable skills"
    out += [
        "",
        "### Next steps",
        f"1. Build one end-to-end portfolio project that uses {project_skills}.",
        "2. Complete the recommended courses below and add the certificates to your resume.",
        f"3. Tailor your resume to {top['title']} postings, highlighting {highlights}.",
    ]
    return "\n".join(out)
