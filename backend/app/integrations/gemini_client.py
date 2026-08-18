from typing import Any, Optional

import httpx

from app.core.config import settings


class GeminiTimeoutError(Exception):
    pass


class GeminiRequestError(Exception):
    pass


class GeminiInvalidResponseError(Exception):
    pass


_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    """프로세스 전체에서 재사용하는 HTTPX AsyncClient 싱글턴."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient()
    return _client


async def close_http_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def _extract_text(data: dict[str, Any]) -> str:
    try:
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(part.get("text", "") for part in parts)
    except (KeyError, IndexError, TypeError) as exc:
        raise GeminiInvalidResponseError("Gemini 응답 구조를 해석할 수 없습니다.") from exc


async def call_gemini(
    client: httpx.AsyncClient,
    *,
    prompt: str,
    model_name: str,
    api_key: str,
    response_schema: dict[str, Any],
    timeout_seconds: float = 10.0,
) -> str:
    """Gemini 구조화 출력을 호출해 응답 텍스트(JSON 문자열)를 반환한다.

    response_schema는 호출부가 기대하는 구조화 출력 형태를 정의한다(레시피 배열, 재료
    검증 객체 등 용도별로 다르므로 이 계층에 고정하지 않는다).
    타임아웃/네트워크 오류/5xx는 최대 1회 재시도한다(총 2회 시도). 4xx는 재시도하지
    않는다. 어떤 예외 메시지에도 api_key를 포함하지 않는다.
    """
    url = f"{settings.gemini_api_base_url}/models/{model_name}:generateContent"
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": response_schema,
            # 3.x세대 모델은 기본으로 "thinking"이 켜져 있어 구조화 출력 요청이
            # 극도로 느려지거나(40초+) 503(high demand)이 잦아진다(2026-08-18 실측).
            # 우리 용도는 정해진 스키마로 바로 뽑아내는 것뿐이라 thinking이 필요
            # 없어 0으로 꺼서 지연을 줄인다.
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    last_exc: Optional[BaseException] = None
    timed_out = False
    for _ in range(2):
        try:
            response = await client.post(url, headers=headers, json=body, timeout=timeout_seconds)
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            last_exc, timed_out = exc, True
            continue
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code < 500:
                raise GeminiRequestError(
                    f"Gemini 호출 실패 (status={exc.response.status_code})"
                ) from exc
            last_exc, timed_out = exc, False
            continue
        except httpx.HTTPError as exc:
            last_exc, timed_out = exc, False
            continue
        else:
            try:
                data = response.json()
            except ValueError as exc:
                raise GeminiInvalidResponseError("Gemini 응답이 JSON이 아닙니다.") from exc
            return _extract_text(data)

    if timed_out:
        raise GeminiTimeoutError("Gemini 호출이 시간 초과되었습니다.") from last_exc
    raise GeminiRequestError("Gemini 호출 실패 (재시도 포함 모두 실패)") from last_exc
