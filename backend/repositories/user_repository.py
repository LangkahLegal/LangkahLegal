from supabase import Client

TABLE = "users"


def get_by_id_strict(db: Client, id_user: int, columns: str = "*") -> dict:
    return db.table(TABLE).select(columns).eq("id_user", id_user).single().execute().data


def list_by_auth_user_id(db: Client, auth_user_id: str, columns: str = "*") -> list[dict]:
    return db.table(TABLE).select(columns).eq("auth_user_id", auth_user_id).execute().data


def list_by_email(db: Client, email: str, columns: str = "*") -> list[dict]:
    return db.table(TABLE).select(columns).eq("email", email).execute().data


def count(db: Client, role: str | None = None) -> int:
    query = db.table(TABLE).select("id_user", count="exact")
    if role:
        query = query.eq("role", role)
    return query.limit(1).execute().count or 0


def insert(db: Client, data: dict) -> list[dict]:
    return db.table(TABLE).insert(data).execute().data


def update(db: Client, id_user: int, data: dict) -> list[dict]:
    return db.table(TABLE).update(data).eq("id_user", id_user).execute().data


def link_auth_user(db: Client, email: str, auth_user_id: str) -> None:
    db.table(TABLE).update({"auth_user_id": auth_user_id}).eq("email", email).execute()


def get_contact(db: Client, id_user: int) -> dict:
    return get_by_id_strict(db, id_user, "email, nama")


def get_email(db: Client, id_user: int) -> dict:
    return get_by_id_strict(db, id_user, "email")


def get_profile_fields(db: Client, id_user: int) -> dict:
    return get_by_id_strict(db, id_user, "nama, email, foto_profil, role")
