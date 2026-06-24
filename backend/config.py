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

        # 云端 LLM API（OpenAI 兼容）
        self.CLOUD_API_KEY: str = os.getenv("CLOUD_API_KEY", "")
        self.CLOUD_API_BASE_URL: str = os.getenv("CLOUD_API_BASE_URL", "https://api.siliconflow.cn/v1")
        self.CLOUD_MODEL: str = os.getenv("CLOUD_MODEL", "Qwen/Qwen2.5-7B-Instruct")

        # 后端服务
        self.BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
        try:
            self.BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
        except Exception:
            self.BACKEND_PORT = 8000


# 在模块加载时创建全局 settings 实例
settings = Settings()

__all__ = ["settings"]