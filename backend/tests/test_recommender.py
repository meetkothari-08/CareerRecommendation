from careerrec.evaluation import ndcg_at_k, normalized_relevance_at_k, reciprocal_rank
from careerrec.recommender import UserProfile


def test_ml_profile_gets_ml_careers(engine):
    profile = UserProfile(
        "Python, pandas, scikit-learn, PyTorch, deep learning, SQL",
        "machine learning, AI",
        "B.Tech",
        1,
        "Become an ML engineer",
    )
    top3 = engine.recommender.rank(profile)[:3]
    assert "machine_learning_engineer" in top3
    assert set(top3) & {"data_scientist", "ai_research_scientist", "nlp_engineer", "computer_vision_engineer"}


def test_interests_steer_career_switchers(engine):
    profile = UserProfile("Excel, communication, Jira", "product, startups, users", "MBA", 4, "lead a product team")
    assert engine.recommender.rank(profile)[0] == "product_manager"


def test_recommend_payload_contains_skill_gap_and_market(engine):
    result = engine.recommend(UserProfile("Docker, Linux, Bash", "cloud automation"), top_k=3)
    assert result["extracted_skills"] == ["Docker", "Linux", "Bash"]
    rec = result["recommendations"][0]
    assert 0 <= rec["match_score"] <= 100
    assert 0 <= rec["skill_coverage"] <= 1
    assert rec["market"]["postings"] > 0
    assert all(g["priority"] in {"Critical", "Important", "Nice to have"} for g in rec["missing_skills"])
    assert not set(rec["matched_skills"]) & {g["skill"] for g in rec["missing_skills"]}


def test_ranking_metrics():
    ranked = ["a", "b", "c", "d"]
    assert reciprocal_rank(ranked, "b") == 0.5
    assert normalized_relevance_at_k(ranked, {"a", "c"}, 3) == 1.0
    assert ndcg_at_k(["a", "b"], "a", {"a"}, 5) == 1.0
    assert ndcg_at_k(["b", "a"], "a", {"a"}, 5) < 1.0
