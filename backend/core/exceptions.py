from fastapi import HTTPException


class AppError(HTTPException):
    status_code = 500

    def __init__(self, detail=None, status_code: int | None = None, headers: dict[str, str] | None = None) -> None:
        super().__init__(status_code=status_code or self.status_code, detail=detail, headers=headers)


class BadRequestError(AppError):
    status_code = 400


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class TooManyRequestsError(AppError):
    status_code = 429


class InternalError(AppError):
    status_code = 500
