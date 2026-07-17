from fastapi import APIRouter

from app.core.security import CurrentUser, CurrentUserDep

router = APIRouter()


@router.get("/me", response_model=CurrentUser)
def read_current_user(user: CurrentUserDep) -> CurrentUser:
    return user
