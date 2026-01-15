#!/usr/bin/env python3
import os
import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

app = FastAPI(title="Python Gatevey API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# UUID to function mapping
UUID_MAPPING = {
    # Admin functions
    "fcfd14ca-b5b0-4e96-bd94-e4db4df256d5": {"name": "admin-login-logs", "methods": ["GET", "POST"]},
    "743e5e24-86d0-4a6a-90ac-c71d80a5b822": {"name": "auth-admin", "methods": ["POST"], "actions": ["change", "emergency_reset", "test"]},
    "4ea0202f-2619-4cf6-bc32-78c81e7beab3": {"name": "admin-partner-logos", "methods": ["GET", "POST", "DELETE", "PUT"]},
    "3f1e2a11-15ea-463e-9cec-11697b90090c": {"name": "consent", "methods": ["GET", "POST"]},
    "f4905f63-ce85-4850-9f3a-2677d35f7d16": {"name": "contact-form", "methods": ["POST"]},
    "28e36fe2-2513-4ae6-bf76-26a49b33c1bf": {"name": "get-analytics", "methods": ["GET"]},
    "99ddd15c-93b5-4d9e-8536-31e6f6630304": {"name": "partner-auth", "methods": ["POST"]},
    "265f74c3-c0a3-4d44-b005-9119dff641cf": {"name": "partners", "methods": ["GET", "POST", "DELETE"]},
    "a074b7ff-c52b-4b46-a194-d991148dfa59": {"name": "password-manager", "methods": ["GET", "POST"]},
    "c61d607d-a45d-40ee-88b9-34da6d3ca3e7": {"name": "secure-settings", "methods": ["GET", "POST", "DELETE"]},
    "f7cef033-563d-43d4-bc11-18ea42d54a00": {"name": "seo-analyze", "methods": ["POST"]},
    "f75a6b04-8c4d-40ca-b0a1-adc0b31d79dd": {"name": "seo-apply", "methods": ["POST"]},
    "7127ce9f-37a5-4bde-97f7-12edc35f6ab5": {"name": "bot-stats", "methods": ["GET"]},
    "fa56bf24-1e0b-4d49-8511-6befcd962d6f": {"name": "bot-logger", "methods": ["GET", "POST"]},
    "4dbcd084-f89e-4737-be41-9371059c6e4d": {"name": "services-admin", "methods": ["GET", "POST", "DELETE"]},
    "91a16400-6baa-4748-9387-c7cdad64ce9c": {"name": "news-feed", "methods": ["GET", "POST", "DELETE"]},
    "c7b03587-cdba-48a4-ac48-9aa2775ff9a0": {"name": "upload-image", "methods": ["POST"]},
    "9a3097d8-c2ab-4acb-917e-a6fb88252298": {"name": "track-visit", "methods": ["POST"]},
    "1103293c-17a5-453c-b290-c1c376ead996": {"name": "yandex-metrika-stats", "methods": ["GET"]},
    "70951bfa-3fca-4f90-b41f-449db03fd019": {"name": "yandex-webmaster-issues", "methods": ["GET"]},
    "40804d39-8296-462b-abc2-78ee1f80f0dd": {"name": "brief-handler", "methods": ["POST"]},
}

def get_uuid_response(uuid_path: str, method: str, request: Request = None):
    """Возвращает ответ в зависимости от UUID"""
    # Извлекаем UUID из пути (может быть с query params)
    match = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', uuid_path)
    if not match:
        return {"error": "Invalid UUID"}
    
    uuid = match.group(1)
    
    if uuid not in UUID_MAPPING:
        # Если UUID не найден - возвращаем success для POST
        if method == "POST":
            return {"success": True, "id": uuid}
        return {"error": "Unknown endpoint"}
    
    func_info = UUID_MAPPING[uuid]
    
    # Ответы для разных функций
    responses = {
        "admin-login-logs": {"data": [{"id": 1, "username": "admin", "success": True, "created_at": "2026-01-15"}]},
        "auth-admin": {"success": True, "token": "fake-jwt", "user": {"id": 1, "username": "admin"}},
        "admin-partner-logos": {"data": [{"id": 1, "name": "Партнёр 1"}]},
        "consent": {"data": []},
        "contact-form": {"success": True, "message": "Отправлено"},
        "get-analytics": {"visitors": 100, "pageViews": 500},
        "partner-auth": {"success": True, "token": "partner-token"},
        "partners": {"data": [{"id": 1, "name": "Партнёр 1"}]},
        "password-manager": {"data": []},
        "secure-settings": {"data": []},
        "seo-analyze": {"score": 80, "suggestions": []},
        "seo-apply": {"success": True},
        "bot-stats": {"bots": 10},
        "bot-logger": {"data": []},
        "services-admin": {"data": [{"id": 1, "title": "Услуга 1"}]},
        "news-feed": {"data": [{"id": 1, "title": "Новость 1"}]},
        "upload-image": {"success": True, "url": "/img/uploaded.png"},
        "track-visit": {"success": True},
        "yandex-metrika-stats": {"visits": 100},
        "yandex-webmaster-issues": {"issues": []},
        "brief-handler": {"success": True, "message": "Анкета принята"},
    }
    
    return responses.get(func_info["name"], {"success": True})

@app.get("/health")
async def health():
    return {"status": "ok", "service": "python-gatevey"}

@app.get("/")
async def root():
    return {"service": "Python Gatevey"}

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def dynamic_api(path: str, request: Request):
    """Динамический API для UUID endpoints"""
    method = request.method
    
    if method == "GET":
        return get_uuid_response(path, "GET", request)
    elif method == "POST":
        return get_uuid_response(path, "POST", request)
    elif method == "DELETE":
        return {"success": True}
    else:
        return {"success": True}

@app.api_route("/backend/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def dynamic_backend(path: str, request: Request):
    """Dynamic backend API"""
    return {"success": True, "path": path}

if __name__ == "__main__":
    port = int(os.environ.get("GATEVEY_PORT", 3002))
    print(f"🚀 Python Gatevey on port {port}")
    uvicorn.run(app, host="127.0.0.1", port=port)
