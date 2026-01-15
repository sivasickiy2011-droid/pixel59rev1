#!/usr/bin/env python3
"""
🐍 Python Gatevey Server
Запускает backend функции на Python
"""

import os
import sys
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(title="Python Gatevey API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================

class BriefRequest(BaseModel):
    companyName: str
    goal: str
    results: str
    businessArea: str
    clients: str
    likeSites: Optional[str] = ""
    dislikeSites: Optional[str] = ""
    colorScheme: Optional[str] = ""
    designType: List[str] = []
    sections: Optional[str] = ""
    deliveryMethod: str
    clientEmail: Optional[str] = ""

class SeoRequest(BaseModel):
    url: str
    content: str

# ============================================
# HELPERS
# ============================================

def get_problem_title(problem_type: str) -> str:
    problem_titles = {
        'SITEMAP_ERROR': 'Ошибка в sitemap.xml',
        'ROBOTS_TXT_ERROR': 'Ошибка в robots.txt',
        'HTTPS_ERROR': 'Проблемы с HTTPS',
        'MOBILE_FRIENDLY': 'Проблемы с мобильной версией',
        'PAGE_SPEED': 'Низкая скорость загрузки',
        'BROKEN_LINKS': 'Битые ссылки на сайте',
        'DUPLICATE_CONTENT': 'Дублирующийся контент',
        'THIN_CONTENT': 'Недостаточно контента',
        'CRAWL_ERRORS': 'Ошибки сканирования'
    }
    return problem_titles.get(problem_type, 'Проблема на сайте')

# ============================================
# ENDPOINTS
# ============================================

@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-gatevey"}

@app.get("/")
async def root():
    return {
        "service": "Python Gatevey",
        "version": "1.0.0",
        "endpoints": ["/health", "/brief", "/partners", "/news", "/settings", "/seo/analyze", "/webmaster/issues"]
    }

# BRIEF HANDLER
@app.post("/brief")
async def brief_handler(data: BriefRequest):
    """Обработка анкет"""
    print(f"Brief received: {data.companyName}")
    # Здесь можно добавить отправку в Telegram
    
    return {
        "success": True,
        "message": "Анкета принята",
        "data": {
            "companyName": data.companyName,
            "submittedAt": "2026-01-14T14:00:00Z"
        }
    }

# PARTNERS
@app.get("/partners")
async def get_partners():
    """Получить список партнёров"""
    # Заглушка - потом подключим БД
    return [
        {"id": 1, "name": "Партнёр 1", "logo_url": "/img/partner1.png", "website": "https://partner1.ru"},
        {"id": 2, "name": "Партнёр 2", "logo_url": "/img/partner2.png", "website": "https://partner2.ru"}
    ]

# NEWS
@app.get("/news")
async def get_news():
    """Получить новости"""
    return [
        {
            "id": 1,
            "title": "Новость 1",
            "date": "14 января 2026",
            "summary": "Описание новости...",
            "url": "#"
        }
    ]

# SETTINGS
@app.get("/settings")
async def get_settings():
    """Получить настройки"""
    # Заглушка
    return []

@app.get("/settings/{key}")
async def get_setting(key: str):
    """Получить одну настройку"""
    return {"key": key, "value": None}

@app.post("/settings")
async def save_setting(key: str, value: str):
    """Сохранить настройку"""
    return {"success": True, "key": key, "value": value}

# SEO ANALYZE
@app.post("/seo/analyze")
async def analyze_seo(data: SeoRequest):
    """SEO анализ"""
    suggestions = []
    
    if not data.content or len(data.content) < 50:
        suggestions.append({"type": "error", "message": "Слишком мало контента"})
    
    if "<h1>" not in data.content.lower():
        suggestions.append({"type": "warning", "message": "Отсутствует заголовок H1"})
    
    if "alt=" not in data.content.lower():
        suggestions.append({"type": "info", "message": "Добавьте alt-текст к изображениям"})
    
    score = max(0, 100 - (len(suggestions) * 20))
    
    return {
        "score": score,
        "suggestions": suggestions,
        "analyzedAt": "2026-01-14T14:00:00Z"
    }

# WEBMASTER ISSUES
@app.get("/webmaster/issues")
async def get_webmaster_issues():
    """Проблемы вебмастера"""
    return [
        {"type": "SITEMAP_ERROR", "title": get_problem_title("SITEMAP_ERROR"), "count": 0, "severity": "low"},
        {"type": "PAGE_SPEED", "title": get_problem_title("PAGE_SPEED"), "count": 2, "severity": "medium"},
        {"type": "ROBOTS_TXT_ERROR", "title": get_problem_title("ROBOTS_TXT_ERROR"), "count": 0, "severity": "low"}
    ]

# ============================================
# START
# ============================================

if __name__ == "__main__":
    port = int(os.environ.get("GATEVEY_PORT", 3002))
    print(f"🚀 Python Gatevey запущен на порту {port}")
    uvicorn.run(app, host="127.0.0.1", port=port)
