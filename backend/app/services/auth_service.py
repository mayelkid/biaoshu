"""用户认证服务"""

import hashlib
import secrets
import time
from typing import Dict, Optional

from ..models.auth_schema import UserInfo


class AuthService:
    """简单的内存用户认证服务"""

    def __init__(self):
        self._users: Dict[str, Dict] = {}
        self._tokens: Dict[str, Dict] = {}
        self._token_expiry = 24 * 60 * 60
        self._init_default_user()

    def _init_default_user(self):
        """初始化默认用户"""
        default_username = "admin"
        default_password = "admin123"
        if default_username not in self._users:
            self.register_user(default_username, default_password)

    def _hash_password(self, password: str, salt: Optional[str] = None) -> tuple[str, str]:
        """密码哈希"""
        if salt is None:
            salt = secrets.token_hex(16)
        hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hash_obj.hex(), salt

    def _verify_password(self, password: str, hashed: str, salt: str) -> bool:
        """验证密码"""
        new_hash, _ = self._hash_password(password, salt)
        return new_hash == hashed

    def _generate_user_id(self, username: str) -> str:
        """基于用户名生成确定性的 user_id"""
        # 使用用户名哈希生成固定的 user_id，确保重启后不变
        hash_obj = hashlib.sha256(username.encode())
        return hash_obj.hexdigest()[:16]

    def register_user(self, username: str, password: str) -> bool:
        """注册新用户"""
        if username in self._users:
            return False

        hashed_password, salt = self._hash_password(password)
        self._users[username] = {
            'user_id': self._generate_user_id(username),
            'username': username,
            'password': hashed_password,
            'salt': salt,
            'created_at': time.time()
        }
        return True

    def authenticate(self, username: str, password: str) -> Optional[str]:
        """验证用户并返回token"""
        if username not in self._users:
            return None

        user = self._users[username]
        if not self._verify_password(password, user['password'], user['salt']):
            return None

        token = secrets.token_hex(32)
        self._tokens[token] = {
            'user_id': user['user_id'],
            'username': username,
            'created_at': time.time(),
            'expires_at': time.time() + self._token_expiry
        }
        return token

    def verify_token(self, token: str) -> Optional[UserInfo]:
        """验证token并返回用户信息"""
        if token not in self._tokens:
            return None

        token_data = self._tokens[token]
        # 去掉时效验证，只验证token是否存在
        # if time.time() > token_data['expires_at']:
        #     del self._tokens[token]
        #     return None

        return UserInfo(
            user_id=token_data['user_id'],
            username=token_data['username']
        )

    def logout(self, token: str) -> bool:
        """登出，删除token"""
        if token in self._tokens:
            del self._tokens[token]
            return True
        return False

    def get_user_info(self, username: str) -> Optional[UserInfo]:
        """获取用户信息"""
        if username not in self._users:
            return None
        user = self._users[username]
        return UserInfo(user_id=user['user_id'], username=user['username'])

    def get_current_user_id(self, token: str) -> Optional[str]:
        """从token获取当前用户ID"""
        user_info = self.verify_token(token)
        if user_info:
            return user_info.user_id
        return None


# 全局认证服务实例
_auth_service: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """获取认证服务实例"""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service
