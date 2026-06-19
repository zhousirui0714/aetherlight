"""配置模块（从 .env 或环境变量读取），简化实现以避免对 pydantic_settings 的依赖。

该文件导出 `settings` 对象，供后端其它模块使用。
"""
from __future__ import annotations

import os
from dotenv import load_dotenv

# 尝试读取后端目录下的 .env 文件
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))


class Settings:
    def __init__(self) -> None:
        # Supabase
        self.SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
        self.SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

        # Ollama
        self.OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

        # 后端服务
        self.BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
        try:
            self.BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
        except Exception:
            self.BACKEND_PORT = 8000

        # 可选的第三方 API
        self.QWEATHER_API_KEY: str = os.getenv("QWEATHER_API_KEY", "")


# 在模块加载时创建全局 settings 实例
settings = Settings()

__all__ = ["settings"]
