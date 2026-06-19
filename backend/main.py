import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import knowledge_daily_card
from routes.knowledge_articles import router as articles_router
from routes.characters import router as characters_router
from routes.knowledge_qa import router as knowledge_qa_router
from routes.chat import router as chat_router
from routes.qa import router as qa_router
from routes.art import router as art_router
from routes.community import router as community_router

app = FastAPI(
    title='溯光 Aetherlight API',
    version='0.1.0',
    description='传统文化活化项目 API 服务',
)

# CORS：允许前端开发服务器跨域调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# 注册路由模块
app.include_router(
    articles_router,
    prefix="/api/knowledge",
    tags=["knowledge"],
)

app.include_router(
    knowledge_qa_router,
    prefix="/api/knowledge/qa",
    tags=["knowledge-qa"],
)

app.include_router(
    characters_router,
    prefix="/api/characters",
    tags=["characters"],
)

app.include_router(
    chat_router,
    prefix="/api/chat",
    tags=["chat"],
)

app.include_router(
    qa_router,
    prefix="/api/qa",
    tags=["qa"],
)

app.include_router(
    art_router,
    prefix="/api/art",
    tags=["art"],
)

app.include_router(
    community_router,
    prefix="/api/community",
    tags=["community"],
)

app.include_router(
    knowledge_daily_card.router,
    prefix='/api/knowledge',
    tags=['knowledge'],
)


@app.get('/')
def root():
    return {
        'name': '溯光 Aetherlight API',
        'version': '0.1.0',
        'status': 'running',
    }


@app.get('/health')
def health_check():
    return {'status': 'ok'}


if __name__ == '__main__':
    uvicorn.run(
        'main:app',
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
    )
