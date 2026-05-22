"""认证相关 API 路由"""

import logging

from fastapi import APIRouter, Cookie, HTTPException, Response

from ..models.auth_schema import (
    LoginResponse,
    LogoutResponse,
    RegisterRequest,
    RegisterResponse,
    UserLoginRequest,
)
from ..services.auth_service import get_auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["用户认证"])


@router.post("/login", response_model=LoginResponse)
async def login(request: UserLoginRequest, response: Response):
    """用户登录"""
    auth_service = get_auth_service()
    token = auth_service.authenticate(request.username, request.password)

    if token is None:
        return LoginResponse(
            success=False,
            message="用户名或密码错误"
        )

    user_info = auth_service.get_user_info(request.username)
    
    # 设置 HttpOnly Cookie
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=False,  # 开发环境使用 False，生产环境使用 True
        samesite="strict",
        max_age=86400  # 24小时过期
    )
    
    return LoginResponse(
        success=True,
        message="登录成功",
        token=token,
        user=user_info
    )


@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    """用户注册"""
    auth_service = get_auth_service()

    if len(request.username) < 3:
        return RegisterResponse(
            success=False,
            message="用户名至少需要3个字符"
        )

    if len(request.password) < 6:
        return RegisterResponse(
            success=False,
            message="密码至少需要6个字符"
        )

    success = auth_service.register_user(request.username, request.password)

    if not success:
        return RegisterResponse(
            success=False,
            message="用户名已存在"
        )

    user_info = auth_service.get_user_info(request.username)
    return RegisterResponse(
        success=True,
        message="注册成功",
        user=user_info
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response, token: str = Cookie(None)):
    """用户登出"""
    auth_service = get_auth_service()

    if token is None:
        return LogoutResponse(
            success=False,
            message="未登录"
        )

    success = auth_service.logout(token)
    
    # 清除 Cookie
    response.delete_cookie(key="token")
    
    return LogoutResponse(
        success=success,
        message="登出成功" if success else "登出失败"
    )


@router.get("/verify")
async def verify_token(token: str = Cookie(None)):
    """验证token是否有效"""
    auth_service = get_auth_service()

    if token is None:
        raise HTTPException(status_code=401, detail="未登录")

    user_info = auth_service.verify_token(token)

    if user_info is None:
        raise HTTPException(status_code=401, detail="登录已过期")

    return {
        "success": True,
        "user": user_info
    }