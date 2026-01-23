#!/usr/bin/env python3
import os
import re
import sys
import importlib.util
import json
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Добавляем корень проекта, чтобы backend импортировался как пакет
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, root_dir)

# Установка DATABASE_URL если не задана
if not os.environ.get('DATABASE_URL'):
    os.environ['DATABASE_URL'] = 'postgresql://pixel_user:strong_password_123@localhost:5432/pixel_db'

app = FastAPI(title="Python Gatevey API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# UUID mapping (updated to match func2url.json)
UUID_MAPPING = {
    # Admin
    "fcfd14ca-b5b0-4e96-bd94-e4db4df256d5": "auth-admin",
    "743e5e24-86d0-4a6a-90ac-c71d80a5b822": "password-manager",
    
    # Partners
    "265f74c3-c0a3-4d44-b005-9119dff641cf": "news-feed",
    "4ea0202f-2619-4cf6-bc32-78c81e7beab3": "admin-login-logs",
    
    # Forms
    "f4905f63-ce85-4850-9f3a-2677d35f7d16": "track-visit",
    "40804d39-8296-462b-abc2-78ee1f80f0dd": "yandex-metrika-stats",
    
    # Auth
    "99ddd15c-93b5-4d9e-8536-31e6f6630304": "portfolio",
    
    # Upload
    "c7b03587-cdba-48a4-ac48-9aa2775ff9a0": "admin-partner-logos",
    
    # Password manager already mapped above
    
    # Analytics
    "28e36fe2-2513-4ae6-bf76-26a49b33c1bf": "brief-handler",
    "1103293c-17a5-453c-b290-c1c376ead996": "yandex-metrika-stats",
    
    # Webmaster
    "70951bfa-3fca-4f90-b41f-449db03fd019": "get-analytics",
    
    # Consent
    "3f1e2a11-15ea-463e-9cec-11697b90090c": "partners",
    "80536dd3-4799-47a9-893a-a756a259460e": "consent",
    
    # SEO
    "f7cef033-563d-43d4-bc11-18ea42d54a00": "yandex-webmaster-issues",
    "f75a6b04-8c4d-40ca-b0a1-adc0b31d79dd": "seo-apply",
    
    # Bots
    "7127ce9f-37a5-4bde-97f7-12edc35f6ab5": "bot-stats",
    "fa56bf24-1e0b-4d49-8511-6befcd962d6f": "secure-settings",
    "c3e66558-8a5b-42d7-b34d-ca6815cb2f76": "bot-logger",
    "9e365935-6746-496e-8c6f-c4dddd4c655c": "bot-stats",
    
    # Services
    "4dbcd084-f89e-4737-be41-9371059c6e4d": "submit-order",
    
    # News
    "91a16400-6baa-4748-9387-c7cdad64ce9c": "services-admin",
    "7aa533b8-b464-4b36-bd36-9c34cb6d0b8e": "news-admin",
    "c5a1b2d3-e4f5-6789-abcd-ef0123456789": "news-admin-crud",

    # Track
    "9a3097d8-c2ab-4acb-917e-a6fb88252298": "track-visit",

    # Secure settings
    "c61d607d-a45d-40ee-88b9-34da6d3ca3e7": "secure-settings",

    # Additional from func2url.json
    "0254ff37-a984-465b-873c-b4aabdc73b96": "seo-analyze",
    "f81db335-2453-41e1-9b1e-aaf4c61ea06f": "seo-apply",
    "6f0735b1-7477-4660-b2b0-0b694b4f36ea": "upload-image",
    "003b9991-d7d8-4f5d-8257-dee42fad0f91": "contact-form",
    "a074b7ff-c52b-4b46-a194-d991148dfa59": "partner-auth",
    "108ae5ed-e950-40bd-9b28-9149ddf9dae1": "telegram-password-reset",
}

def load_handler(func_name):
    """Динамически импортирует модуль из backend/{func_name}/index.py"""
    backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
    module_path = os.path.join(backend_dir, func_name, 'index.py')
    if not os.path.exists(module_path):
        raise ImportError(f"Module not found: {module_path}")
    
    spec = importlib.util.spec_from_file_location(f"backend.{func_name}.index", module_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    if hasattr(module, 'handler'):
        return module.handler
    else:
        raise AttributeError(f"Module {func_name} does not have 'handler' function")

def create_lambda_event(request: Request, body_data=None):
    """Создаёт событие в формате AWS Lambda из FastAPI запроса"""
    headers = dict(request.headers)
    # Получить IP из request
    ip = request.client.host if request.client else ""
    # Сконструировать requestContext как в API Gateway
    request_context = {
        "identity": {
            "sourceIp": ip,
            "userAgent": headers.get("user-agent", "")
        }
    }
    event = {
        "httpMethod": request.method,
        "headers": headers,
        "requestContext": request_context,
        "body": json.dumps(body_data) if body_data else None,
        "isBase64Encoded": False
    }
    return event

async def invoke_handler(func_name, request: Request):
    """Вызывает реальный обработчик"""
    try:
        handler = load_handler(func_name)
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Failed to load handler: {str(e)}"})
        }
    
    # Получить тело запроса
    body_data = None
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        try:
            body_data = await request.json()
        except Exception:
            body_data = None
    if request.method == "DELETE" and body_data:
        print(f"[GATEVEY] DELETE payload for {func_name}: {body_data}")
    
    event = create_lambda_event(request, body_data)
    
    try:
        # Вызвать handler с событием и пустым контекстом
        result = handler(event, None)
        # Преобразовать результат в FastAPI-ответ
        # Ожидается, что handler возвращает dict с statusCode, headers, body
        status_code = result.get("statusCode", 200)
        headers = result.get("headers", {"Content-Type": "application/json"})
        body = result.get("body", "")
        # Если body уже строка, оставляем, иначе json.dumps
        if isinstance(body, dict):
            body = json.dumps(body)
        # Установить заголовки CORS
        headers["Access-Control-Allow-Origin"] = "*"
        return Response(content=body, status_code=status_code, headers=headers)
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Handler execution failed", "message": str(e)})
        }

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def dynamic_api(path: str, request: Request):
    match = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', path)
    if match:
        uuid = match.group(1)
        func_name = UUID_MAPPING.get(uuid, None)
        if func_name:
            return await invoke_handler(func_name, request)
        # Неизвестный UUID - возвращаем 404
        return Response(
            content=json.dumps({"error": "UUID not found"}),
            status_code=404,
            headers={"Content-Type": "application/json"}
        )
    return {"success": True}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("GATEVEY_PORT", 3002))
    uvicorn.run(app, host="0.0.0.0", port=port)
