import pytest

from careerrec.pipeline import CareerEngine


@pytest.fixture(scope="session")
def engine() -> CareerEngine:
    return CareerEngine.load()
