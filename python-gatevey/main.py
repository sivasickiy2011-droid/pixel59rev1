#!/usr/bin/env python3
import os
import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Python Gatevey API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# UUID mapping
UUID_MAPPING = {
    # Admin
    "fcfd14ca-b5b0-4e96-bd94-e4db4df256d5": "admin-login-logs",
    "743e5e24-86d0-4a6a-90ac-c71d80a5b822": "auth-admin",
    
    # Partners
    "265f74c3-c0a3-4d44-b005-9119dff641cf": "partners",
    "4ea0202f-2619-4cf6-bc32-78c81e7beab3": "admin-partner-logos",
    
    # Forms
    "f4905f63-ce85-4850-9f3a-2677d35f7d16": "contact-form",
    "40804d39-8296-462b-abc2-78ee1f80f0dd": "brief-handler",
    
    # Auth
    "99ddd15c-93b5-4d9e-8536-31e6f6630304": "partner-auth",
    
    # Upload
    "c7b03587-cdba-48a4-ac48-9aa2775ff9a0": "upload-image",
    
    # Password manager
    "a074b7ff-c52b-4b46-a194-d991148dfa59": "password-manager",
    
    # Analytics
    "28e36fe2-2513-4ae6-bf76-26a49b33c1bf": "get-analytics",
    "1103293c-17a5-453c-b290-c1c376ead996": "yandex-metrika-stats",
    
    # Webmaster
    "70951bfa-3fca-4f90-b41f-449db03fd019": "yandex-webmaster-issues",
    
    # Consent
    "3f1e2a11-15ea-463e-9cec-11697b90090c": "consent",
    
    # SEO
    "f7cef033-563d-43d4-bc11-18ea42d54a00": "seo-analyze",
    "f75a6b04-8c4d-40ca-b0a1-adc0b31d79dd": "seo-apply",
    
    # Bots
    "7127ce9f-37a5-4bde-97f7-12edc35f6ab5": "bot-stats",
    "fa56bf24-1e0b-4d49-8511-6befcd962d6f": "bot-logger",
    
    # Services
    "4dbcd084-f89e-4737-be41-9371059c6e4d": "services-admin",
    
    # News
    "91a16400-6baa-4748-9387-c7cdad64ce9c": "news-feed",
    
    # Track
    "9a3097d8-c2ab-4acb-917e-a6fb88252298": "track-visit",
    
    # Secure settings
    "c61d607d-a45d-40ee-88b9-34da6d3ca3e7": "secure-settings",
}

def get_response(func_name, method):
    # Всегда возвращаем МАССИВЫ для списков, объекты для одиночных записей
    data = {
        "admin-login-logs": [{"id": 1, "username": "admin", "success": True, "created_at": "2026-01-15"}],
        "auth-admin": {"success": True, "token": "fake-jwt", "user": {"id": 1, "username": "admin"}},
        "partners": [{"id": 1, "name": "Яндекс", "logo_url": "/img/partner-yandex.png"}],
        "admin-partner-logos": [],
        "contact-form": {"success": True, "message": "Отправлено"},
        "brief-handler": {"success": True, "message": "Анкета принята"},
        "partner-auth": {"success": True, "token": "partner-token"},
        "upload-image": {"success": True, "url": "/img/uploaded.png"},
        "password-manager": [],
        "get-analytics": {"visitors": 100, "pageViews": 500},
        "yandex-metrika-stats": {"visits": 100},
        "yandex-webmaster-issues": [],
        "consent": [],
        "seo-analyze": {"score": 80, "suggestions": []},
        "seo-apply": {"success": True},
        "bot-stats": {"bots": 10},
        "bot-logger": [],
        "services-admin": [],
        "news-feed": [],
        "track-visit": {"success": True},
        "secure-settings": [],
    }
    return data.get(func_name, [])

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def dynamic_api(path: str, request: Request):
    match = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', path)
    if match:
        uuid = match.group(1)
        func_name = UUID_MAPPING.get(uuid, None)
        if func_name:
            return get_response(func_name, request.method)
        # Неизвестный UUID - возвращаем ПУСТОЙ МАССИВ чтобы не было ошибки
        return []
    return {"success": True}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("GATEVEY_PORT", 3002))
    uvicorn.run(app, host="127.0.0.1", port=port)
