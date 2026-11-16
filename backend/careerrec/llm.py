"""LLM advisor using any OpenAI-compatible chat-completions endpoint.

By default it targets Groq. Point ``LLM_BASE_URL``/``LLM_MODEL`` at a vLLM or
Ollama server to use the LoRA fine-tuned career-advisor model from
``finetune/``. Without an API key the advisor falls back to a deterministic,
data-grounded template so the system always works offline.
"""

from __future__ import annotations

import logging
import os

import httpx

from .prompts import CHAT_SYSTEM_PROMPT, SYSTEM_PROMPT, build_advice_prompt, build_context, template_advice

log = logging.getLogger(__name__)


class LLMAdvisor:
    def __init__(
        self, base_url: str | None = None, api_key: str | None = None, model: str | None = None, timeout: float = 30.0
    ):
        self.base_url = (base_url or os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")).rstrip("/")
        self.api_key = api_key if api_key is not None else (os.getenv("LLM_API_KEY") or os.getenv("GROQ_API_KEY"))
        self.model = model or os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
        self.timeout = timeout

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def _complete(self, messages: list[dict], max_tokens: int = 900) -> str:
        resp = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"model": self.model, "messages": messages, "temperature": 0.4, "max_tokens": max_tokens},
            timeout=self.timeout,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()

    def career_advice(self, profile: dict, recommendations: list[dict]) -> dict:
        if self.enabled:
            try:
                text = self._complete(
                    [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": build_advice_prompt(profile, recommendations)},
                    ]
                )
                return {"text": text, "source": "llm", "model": self.model}
            except Exception as exc:  # network, auth or quota problems
                log.warning("LLM advice failed, using template fallback: %s", exc)
        return {"text": template_advice(profile, recommendations), "source": "template", "model": None}

    def chat(
        self, message: str, history: list[dict], profile: dict | None = None, recommendations: list[dict] | None = None
    ) -> dict:
        if not self.enabled:
            return {
                "text": (
                    "The conversational advisor needs an LLM endpoint. Set `LLM_API_KEY` (e.g. a Groq key) "
                    "or point `LLM_BASE_URL` at your fine-tuned model server."
                ),
                "source": "unavailable",
                "model": None,
            }
        system = CHAT_SYSTEM_PROMPT
        if profile and recommendations:
            system += "\n\n" + build_context(profile, recommendations)
        messages = [{"role": "system", "content": system}]
        messages += [m for m in history[-10:] if m.get("role") in {"user", "assistant"}]
        messages.append({"role": "user", "content": message})
        try:
            return {"text": self._complete(messages, max_tokens=700), "source": "llm", "model": self.model}
        except Exception as exc:
            log.warning("LLM chat failed: %s", exc)
            return {
                "text": "The advisor is temporarily unavailable. Please try again.",
                "source": "error",
                "model": None,
            }
