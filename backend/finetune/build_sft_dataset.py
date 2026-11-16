"""Build the instruction-tuning dataset for the career-advisor LLM.

Each example pairs the *exact* grounded prompt used at inference time
(``careerrec.prompts``) with a target career report. Targets come from one of:

* ``--teacher none`` (default): the deterministic, data-grounded report from
  ``template_advice`` - teaches the model the format and to stay faithful to the
  recommender's numbers.
* ``--teacher llm``: a larger teacher model behind ``LLM_BASE_URL`` writes the
  report (knowledge distillation into a small, cheap-to-serve model).

Usage:  python -m finetune.build_sft_dataset --n 1500
Output: data/finetune/career_advisor_sft.jsonl  (chat "messages" format)
"""

from __future__ import annotations

import argparse
import json
import random

from careerrec import paths
from careerrec.data import load_skill_aliases
from careerrec.llm import LLMAdvisor
from careerrec.pipeline import CareerEngine
from careerrec.prompts import SYSTEM_PROMPT, build_advice_prompt, template_advice
from careerrec.recommender import UserProfile
from scripts.generate_data import generate_profiles


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=1500, help="number of training examples")
    parser.add_argument("--teacher", choices=["none", "llm"], default="none")
    parser.add_argument("--seed", type=int, default=99)
    args = parser.parse_args()

    engine = CareerEngine.load()
    teacher = LLMAdvisor() if args.teacher == "llm" else None
    if teacher and not teacher.enabled:
        raise SystemExit("--teacher llm requires LLM_API_KEY")

    # Fresh synthetic profiles (different seed from the evaluation sets, so no test leakage).
    profiles = generate_profiles(engine.careers, load_skill_aliases(), args.n, seed=args.seed)
    rng = random.Random(args.seed)
    paths.SFT_DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    with paths.SFT_DATASET_PATH.open("w", encoding="utf-8") as fh:
        for i, p in enumerate(profiles):
            profile = UserProfile(p["skills"], p["interests"], p["education"], p["experience_years"], p["goals"])
            result = engine.recommend(profile, top_k=rng.choice([3, 4, 5]), with_courses=False)
            ctx = {"extracted_skills": result["extracted_skills"], **{k: p[k] for k in
                   ("interests", "education", "experience_years", "goals")}}
            prompt = build_advice_prompt(ctx, result["recommendations"])
            if teacher:
                answer = teacher.career_advice(ctx, result["recommendations"])["text"]
            else:
                answer = template_advice(ctx, result["recommendations"])
            fh.write(json.dumps({"messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": answer},
            ]}) + "\n")
            if (i + 1) % 250 == 0:
                print(f"{i + 1}/{len(profiles)} examples")
    print(f"wrote {len(profiles)} examples -> {paths.SFT_DATASET_PATH}")


if __name__ == "__main__":
    main()
