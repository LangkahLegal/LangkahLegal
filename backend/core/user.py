from dataclasses import dataclass


@dataclass(frozen=True)
class CurrentUser:
    id_user: int
    role: str
    nama: str | None = None
    id_konsultan: int | None = None
