from app.schemas.error import ErrorResponse

NOT_FOUND = {404: {"model": ErrorResponse, "description": "리소스를 찾을 수 없음"}}
FORBIDDEN = {403: {"model": ErrorResponse, "description": "다른 세션의 리소스에 접근함"}}
CONFLICT = {409: {"model": ErrorResponse, "description": "이미 존재함(중복)"}}
INVALID_REQUEST = {400: {"model": ErrorResponse, "description": "잘못된 요청"}}
