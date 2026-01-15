# Дополнительные endpoints для Gatevey

# ADMIN - Авторизация админа
@app.post("/auth-admin")
async def auth_admin(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    if username == "admin" and password == "admin123":
        return {"success": True, "token": "fake-jwt-token", "user": {"id": 1, "username": username}}
    return {"success": False, "error": "Неверный логин или пароль"}

@app.get("/admin-login-logs")
async def get_login_logs():
    return [
        {"id": 1, "username": "admin", "ip": "172.16.57.77", "success": True, "created_at": "2026-01-15T10:00:00Z"},
    ]

@app.post("/admin-login-logs")
async def create_login_log(request: Request):
    return {"success": True}

@app.get("/admin-partner-logos")
async def get_partner_logos():
    return [{"id": 1, "name": "Партнёр 1", "logo_url": "/img/partner1.png"}]

@app.post("/admin-partner-logos")
async def create_partner_logo(request: Request):
    return {"success": True}

@app.delete("/admin-partner-logos/{id}")
async def delete_partner_logo(id: int):
    return {"success": True}

@app.put("/admin-partner-logos/{id}")
async def update_partner_logo(id: int, request: Request):
    return {"success": True}

@app.get("/consent")
async def get_consent():
    return []

@app.post("/contact-form")
async def contact_form(request: Request):
    return {"success": True, "message": "Сообщение отправлено"}

@app.get("/get-analytics")
async def get_analytics():
    return {"visitors": 100, "pageViews": 500}

@app.post("/partner-auth")
async def partner_auth(request: Request):
    return {"success": True, "token": "partner-token"}

@app.get("/partners/all")
async def get_all_partners():
    return [{"id": 1, "name": "Партнёр 1"}]

@app.post("/partners")
async def create_partner(request: Request):
    return {"success": True, "id": 3}

@app.delete("/partners/{id}")
async def delete_partner(id: int):
    return {"success": True}

@app.get("/password-manager")
async def get_passwords():
    return []

@app.post("/password-manager")
async def create_password(request: Request):
    return {"success": True}

@app.get("/secure-settings")
async def get_secure_settings():
    return []

@app.post("/secure-settings")
async def create_secure_setting(request: Request):
    return {"success": True}

@app.delete("/secure-settings/{key}")
async def delete_secure_setting(key: str):
    return {"success": True}

@app.post("/seo/apply")
async def apply_seo(request: Request):
    return {"success": True}

@app.get("/bot-stats")
async def get_bot_stats():
    return {"bots": 10}

@app.post("/bot-logger")
async def create_bot_log(request: Request):
    return {"success": True}

@app.get("/services-admin")
async def get_services():
    return [{"id": 1, "title": "Услуга 1"}]

@app.post("/services-admin")
async def create_service(request: Request):
    return {"success": True, "id": 2}

@app.delete("/services-admin/{id}")
async def delete_service(id: int):
    return {"success": True}

@app.get("/news/all")
async def get_all_news():
    return [{"id": 1, "title": "Новость 1"}]

@app.post("/news")
async def create_news(request: Request):
    return {"success": True, "id": 2}

@app.delete("/news/{id}")
async def delete_news(id: int):
    return {"success": True}

@app.post("/upload-image")
async def upload_image(request: Request):
    return {"success": True, "url": "/img/uploaded.png"}

@app.post("/track-visit")
async def track_visit(request: Request):
    return {"success": True}

@app.get("/yandex-metrika-stats")
async def get_metrika_stats():
    return {"visits": 100}

@app.post("/brief-handler")
async def brief_handler(request: Request):
    return {"success": True, "message": "Анкета принята"}
