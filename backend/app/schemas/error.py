from sqlmodel import SQLModel


class ErrorDetail(SQLModel):
    code: str
    message: str


class ErrorResponse(SQLModel):
    error: ErrorDetail

    model_config = {
        "json_schema_extra": {
            "example": {"error": {"code": "not_found", "message": "리소스를 찾을 수 없습니다."}}
        }
    }
