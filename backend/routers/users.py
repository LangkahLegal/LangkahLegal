from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import ValidationError
from supabase import Client

from core.database import get_supabase_client
from core.user import CurrentUser
from docs import users as docs
from middleware import get_current_user
from schemas.users import ProfileForm, ProfileUpdatePayload
from services import user_service

router = APIRouter()


@router.get("/me/settings", **docs.GET_SETTINGS_INFO)
def get_settings_info(current_user: CurrentUser = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    return user_service.get_settings_info(db, current_user)


@router.get("/me/profile/full", **docs.GET_FULL_PROFILE)
def get_full_profile(current_user: CurrentUser = Depends(get_current_user), db: Client = Depends(get_supabase_client)):
    return user_service.get_full_profile(db, current_user)


@router.put("/me/profile/update", **docs.UPDATE_PROFILE)
async def update_profile(
    request: Request,
    form: ProfileForm = Depends(),
    current_user: CurrentUser = Depends(get_current_user),
    db: Client = Depends(get_supabase_client),
):
    if request.headers.get("content-type", "").startswith("application/json"):
        body = await request.json()
        try:
            payload = ProfileUpdatePayload(**body)
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=e.errors())
        explicit_portofolio_field = "portofolio" in body
    else:
        form_data = await request.form()
        explicit_portofolio_field = "portofolio" in form_data
        payload = form.to_payload()

    return await user_service.update_profile(
        db=db,
        current_user=current_user,
        payload=payload,
        explicit_portofolio_field=explicit_portofolio_field,
        portofolio_file=form.portofolio_file,
        foto_profil_file=form.foto_profil_file,
    )
