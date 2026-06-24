"""应用配置管理"""

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from typing import Optional
import os

# Define BASE_DIR at the project root level
# Assuming config.py is in backend/app/, we go up three levels to reach the project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings(BaseSettings):
    """应用设置"""

    app_name: str = "AI写标书助手"
    app_version: str = "2.0.0"
    debug: bool = True
    enable_file_logging: bool = True

    # CORS设置
    cors_origins: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3004",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]

    # 文件上传设置
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = os.path.join(BASE_DIR, "backend", "uploads") # Now upload_dir is an absolute path

    # OpenAI默认设置
    default_model: str = "gpt-3.5-turbo"

    class Config:
        env_file = ".env"


# 全局设置实例
settings = Settings()

# Ensure upload directory exists - now it uses the absolute path
os.makedirs(settings.upload_dir, exist_ok=True)
