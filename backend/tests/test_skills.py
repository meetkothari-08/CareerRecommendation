import pytest

from careerrec.data import load_careers
from careerrec.training import build_extractor


@pytest.fixture(scope="module")
def extractor():
    return build_extractor(load_careers())


def test_aliases_are_normalised(extractor):
    skills = extractor.extract("python, sklearn, k8s, ML and some js")
    assert skills == ["Python", "Scikit-learn", "Kubernetes", "Machine Learning", "JavaScript"]


def test_symbols_and_longest_match(extractor):
    assert extractor.extract("C++, C#, Objective-C, Node.js") == ["C++", "C#", "Objective-C", "Node.js"]


def test_ambiguous_words_need_capitalisation(extractor):
    assert extractor.extract("I want to go and excel at work") == []
    assert extractor.extract("Go, C, R and Excel") == ["Go", "C", "R", "Excel"]


def test_list_input_and_deduplication(extractor):
    assert extractor.extract(["PyTorch", "torch", "pytorch"]) == ["PyTorch"]
