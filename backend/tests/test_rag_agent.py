from types import SimpleNamespace

import pytest
from google.genai import types

from services import rag_service


class FakeResponse:
    def __init__(self, text="", function_calls=None, text_error=None):
        self._text = text
        self._text_error = text_error
        self.function_calls = function_calls or []
        self.candidates = [
            SimpleNamespace(content=types.Content(role="model", parts=[types.Part.from_text(text="tool call")]))
        ]

    @property
    def text(self):
        if self._text_error:
            raise self._text_error
        return self._text


class FakeModels:
    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.models_used = []

    def generate_content(self, model, contents, config):
        self.models_used.append(model)
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome


@pytest.fixture
def agent(monkeypatch):
    def _make(outcomes):
        models = FakeModels(outcomes)
        monkeypatch.setattr(rag_service, "_get_gemini_client", lambda: SimpleNamespace(models=models))
        monkeypatch.setattr("time.sleep", lambda seconds: None)
        return models

    return _make


def tool_call(name="search_consultants", args=None):
    return SimpleNamespace(name=name, args=args or {"kategori": "Pidana"})


def test_agentic_generate_returns_text(agent):
    models = agent([FakeResponse(text="Jawaban hukum")])

    result = rag_service.agentic_generate("pertanyaan", "konteks")

    assert result == {"type": "text", "jawaban": "Jawaban hukum"}
    assert models.models_used == ["gemini-2.5-flash"]


def test_agentic_generate_falls_back_to_next_model(agent):
    models = agent([Exception("429 quota"), FakeResponse(text="Dari model cadangan")])

    result = rag_service.agentic_generate("pertanyaan", "konteks")

    assert result["jawaban"] == "Dari model cadangan"
    assert models.models_used == ["gemini-2.5-flash", "gemini-2.0-flash"]


def test_agentic_generate_retries_after_all_models_fail(agent):
    models = agent([Exception("503")] * 3 + [FakeResponse(text="Berhasil setelah retry")])

    result = rag_service.agentic_generate("pertanyaan", "konteks")

    assert result["jawaban"] == "Berhasil setelah retry"
    assert len(models.models_used) == 4


def test_agentic_generate_raises_when_models_stay_unavailable(agent):
    agent([Exception("UNAVAILABLE")] * 9)

    with pytest.raises(Exception, match="RESOURCE_EXHAUSTED"):
        rag_service.agentic_generate("pertanyaan", "konteks")


def test_agentic_generate_reraises_non_retryable_error(agent):
    models = agent([ValueError("permintaan tidak valid")])

    with pytest.raises(ValueError, match="permintaan tidak valid"):
        rag_service.agentic_generate("pertanyaan", "konteks")

    assert models.models_used == ["gemini-2.5-flash"]


def test_agentic_generate_runs_tool_and_returns_consultants(agent, monkeypatch):
    consultants = [{"id_konsultan": 1, "nama_lengkap": "Budi"}]
    calls = []

    def fake_tool(supabase, name, args):
        calls.append((name, args))
        return {"consultants": consultants, "count": 1}

    monkeypatch.setattr(rag_service, "_execute_tool", fake_tool)
    models = agent(
        [
            FakeResponse(function_calls=[tool_call()]),
            FakeResponse(text="Berikut konsultannya"),
        ]
    )

    result = rag_service.agentic_generate("butuh pengacara", "konteks", supabase=object())

    assert result == {
        "type": "consultant_list",
        "jawaban": "Berikut konsultannya",
        "consultants": consultants,
    }
    assert calls == [("search_consultants", {"kategori": "Pidana"})]
    assert len(models.models_used) == 2


def test_agentic_generate_skips_tool_without_supabase(agent):
    models = agent([FakeResponse(text="", function_calls=[tool_call()])])

    result = rag_service.agentic_generate("butuh pengacara", "konteks", supabase=None)

    assert result == {"type": "text", "jawaban": ""}
    assert len(models.models_used) == 1


def test_agentic_generate_uses_fallback_message_when_text_unreadable(agent):
    agent([FakeResponse(text_error=ValueError("no text"))])

    result = rag_service.agentic_generate("pertanyaan", "konteks")

    assert result["type"] == "text"
    assert result["jawaban"].startswith("Maaf, saya mengalami kesulitan")


def test_agentic_generate_stops_after_tool_loop_limit(agent, monkeypatch):
    monkeypatch.setattr(rag_service, "_execute_tool", lambda *args: {"consultants": [], "count": 0})
    models = agent([FakeResponse(text="masih memanggil tool", function_calls=[tool_call()])] * 10)

    result = rag_service.agentic_generate("butuh pengacara", "konteks", supabase=object())

    assert len(models.models_used) == rag_service.MAX_TOOL_LOOP
    assert result == {"type": "text", "jawaban": "masih memanggil tool"}
