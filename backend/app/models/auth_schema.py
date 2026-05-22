"""认证相关数据模型"""

from typing import Optional
from pydantic import BaseModel, Field


class UserLoginRequest(BaseModel):
    """用户登录请求"""
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UserInfo(BaseModel):
    """用户信息"""
    user_id: str
    username: str


class LoginResponse(BaseModel):
    """登录响应"""
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[UserInfo] = None


class LogoutResponse(BaseModel):
    """登出响应"""
    success: bool
    message: str


class RegisterRequest(BaseModel):
    """用户注册请求"""
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class RegisterResponse(BaseModel):
    """注册响应"""
    success: bool
    message: str
    user: Optional[UserInfo] = None