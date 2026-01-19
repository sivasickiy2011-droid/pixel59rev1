const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const OLLAMA_HOST = '172.16.57.77';
const OLLAMA_PORT = 11434;

// Rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 requests per minute for non-admin users

function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
        if (data.timestamp < windowStart) {
            requestCounts.delete(key);
        }
    }
    
    const userData = requestCounts.get(ip);
    if (!userData) {
        requestCounts.set(ip, { count: 1, timestamp: now });
        return true;
    }
    
    if (userData.timestamp < windowStart) {
        // Reset counter if outside window
        userData.count = 1;
        userData.timestamp = now;
        return true;
    }
    
    if (userData.count >= RATE_LIMIT_MAX) {
        return false;
    }
    
    userData.count++;
    return true;
}

// System prompts for different user roles
const SYSTEM_PROMPT_ADMIN = `You are an AI assistant for Pixel59 project with full administrative access.
You have deep knowledge of the project internals, including:
- Python (FastAPI, PostgreSQL, async/await)
- JavaScript/TypeScript (React, TSX, Vite, Node.js)
- React with hooks, context, and modern patterns
- Vite build tool and its configuration
- PostgreSQL database with migrations
- Docker, Nginx, deployment on CentOS
- Ollama and AI model integration

You are running as root within the project server environment.
You can discuss any technical details of the project, provide code examples, and help with debugging.
Always respond in Russian unless the user asks otherwise. Be helpful and professional.`;

const SYSTEM_PROMPT_GUEST = `You are an AI assistant for the Pixel59 platform, acting as a helper for pricing and order recommendations.
Your capabilities are limited to:
- Providing pricing information based on the calculator (website, online store, project development)
- Recommending suitable services based on user needs
- Assisting with order form submission to Telegram
- Answering general questions about services offered

You MUST NOT discuss internal project details, source code, architecture, or any technical implementation.
If asked about project internals, politely decline and redirect to pricing or order assistance.

Pricing examples (точные данные из калькулятора):
- Разработка:
  * Лендинг: 25 000 ₽
  * Сайт-визитка: 15 000 ₽
  * Корпоративный сайт: 50 000 ₽
  * Интернет1магазин: 80 000 ₽
  * Адаптивная верстка: 10 000 ₽
- Продвижение:
  * SEO-оптимизация: 30 000 ₽
  * Контекстная реклама: 25 000 ₽
  * SMM-продвижение: 20 000 ₽
- Дополнительные услуги:
  * Работа с интеграциями CRM: 5 000 ₽
  * Контент-менеджмент: 15 000 ₽
  * Техническая поддержка: 10 000 ₽
  * Веб-аналитика: 12 000 ₽
- Хостинг (Beget):
  * START: 150 ₽/мес
  * OPTIMAL: 250 ₽/мес
  * BUSINESS: 450 ₽/мес
  * PRO: 750 ₽/мес
- VPS тарифы (ISPmanager 6):
  * START: 350 ₽/мес
  * OPTIMAL: 700 ₽/мес
  * BUSINESS: 1 400 ₽/мес
  * PRO: 2 800 ₽/мес
- Лицензии Битрикс:
  * Старт: 6 200 ₽
  * Стандарт: 17 900 ₽
  * Малый бизнес: 40 900 ₽
  * Бизнес: 83 900 ₽

Для оформления заказа пользователь может:
1. Использовать калькулятор на странице /services и отправить заявку через форму.
2. Заполнить бриф на странице /brief.
3. Написать напрямую в Telegram по ссылке https://t.me/pixel59_support.
4. Нажать кнопку «Заказать» в калькуляторе или на главной странице.

Все цены указаны в рублях. Для партнёров действует скидка 10% на услуги разработки и продвижения.
Always respond in Russian. Be friendly and concise.`;

// Helper to enhance the prompt with system context based on admin status and user name
function enhancePrompt(userPrompt, isAdmin, userName = null) {
    const systemPrompt = isAdmin ? SYSTEM_PROMPT_ADMIN : SYSTEM_PROMPT_GUEST;
    let enhancedPrompt = systemPrompt;
    if (userName && userName !== 'Гость') {
        enhancedPrompt += `\n\nПользователь представился как: ${userName}. Обращайся к нему по имени, если это уместно.`;
    }
    enhancedPrompt += `\n\nUser question: ${userPrompt}\n\nAssistant:`;
    return enhancedPrompt;
}

// Check if request is from admin (suser)
async function isAdminRequest(req) {
    const token = req.headers['x-admin-token'];
    if (!token) return false;
    
    // Option 1: Compare with stored hash from environment (admin password hash)
    const adminHash = process.env.ADMIN_PASSWORD_HASH;
    if (adminHash) {
        try {
            const match = await bcrypt.compare(token, adminHash);
            return match;
        } catch (err) {
            console.error('[AiChat] bcrypt compare error:', err);
        }
    }
    
    // Option 2: Simple token check (for development)
    // In production, use proper JWT validation
    return token === 'suser_admin'; // fallback
}

// Proxy all requests to Ollama
router.all('/*', async (req, res) => {
    const path = req.path;
    
    try {
        // Check if user is admin (suser)
        const isAdmin = await isAdminRequest(req);
        console.log('[AiChat] User role:', isAdmin ? 'admin' : 'guest');
        
        // Get user IP for rate limiting
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
        
        // Apply rate limit for non-admin users
        if (!isAdmin && path.includes('/generate')) {
            const allowed = checkRateLimit(ip);
            if (!allowed) {
                console.log(`[AiChat] Rate limit exceeded for IP: ${ip}`);
                return res.status(429).json({
                    error: 'Слишком много запросов. Пожалуйста, подождите минуту перед следующим запросом.'
                });
            }
        }
        
        // Extract user name from headers
        let userName = null;
        if (req.headers['x-user-name']) {
            try {
                userName = decodeURIComponent(req.headers['x-user-name']);
            } catch (e) {
                userName = req.headers['x-user-name'];
            }
        }
        
        // Modify request body if needed
        let requestBody = req.body;
        if (requestBody && requestBody.prompt && path.includes('/generate')) {
            // Enhance the prompt with system context based on admin status and user name
            requestBody.prompt = enhancePrompt(requestBody.prompt, isAdmin, userName);
            console.log('[AiChat] Enhanced prompt length:', requestBody.prompt.length);
        }
        if (requestBody && requestBody.model) {
            // Replace llama3 variants with deepseek-coder:6.7b
            if (requestBody.model.startsWith('llama3') || requestBody.model === 'llama3.2') {
                requestBody.model = 'deepseek-coder:6.7b';
            }
        }
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000); // 1 minute timeout
        
        const response = await fetch(`http://${OLLAMA_HOST}:${OLLAMA_PORT}/api${path}`, {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AiChat] Ollama error ${response.status}:`, errorText);
            throw new Error(`Ollama error: ${response.status} ${errorText}`);
        }

        // Ollama returns streaming JSON - read as lines
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            fullResponse += data.response;
                        }
                        if (data.done) {
                            res.json({ response: fullResponse });
                            return;
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }

        // Fallback if no done signal
        if (fullResponse) {
            res.json({ response: fullResponse });
        } else {
            // Try to parse as regular JSON
            try {
                const data = JSON.parse(buffer);
                res.json(data);
            } catch (e) {
                res.json({ response: buffer });
            }
        }
    } catch (error) {
        console.error('[AiChat] Proxy error:', error.message);
        if (error.name === 'AbortError') {
            res.status(504).json({ error: 'Request timeout' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

module.exports = router;
