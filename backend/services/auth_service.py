from typing import Optional

import supabase
from config import settings
from fastapi import HTTPException, Request

_jwt_cache: dict = {}


async def get_current_user(request: Request) -> dict:
    """
    从 Authorization: Bearer <token> 提取用户信息。
    实际项目中应验证 JWT 签名，这里简化为查询 Supabase。
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")

    token = auth_header[7:]

    # 缓存减少查询
    if token in _jwt_cache:
        return _jwt_cache[token]

    try:
        client = supabase.create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_ANON_KEY,
        )
        user = client.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="UNAUTHORIZED")

        user_info = {
            "id": user.user.id,
            "email": user.user.email,
            "raw_user_meta_data": user.user.user_metadata,
        }
        _jwt_cache[token] = user_info
        return user_info
    except Exception:
        raise HTTPException(status_code=401, detail="UNAUTHORIZED")
