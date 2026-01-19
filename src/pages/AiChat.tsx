import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AiChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchModelInfo();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAdminStatus = () => {
    const adminAuth = localStorage.getItem('admin_auth');
    const authTime = localStorage.getItem('admin_auth_time');
    
    if (adminAuth && authTime) {
      const sessionDuration = 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - parseInt(authTime);
      
      if (elapsed <= sessionDuration) {
        setIsAdmin(true);
        console.log('[AiChat] Admin session active');
      } else {
        // Session expired
        localStorage.removeItem('admin_auth');
        localStorage.removeItem('admin_auth_time');
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (isAdmin) {
      const adminAuth = localStorage.getItem('admin_auth');
      if (adminAuth) {
        headers['X-Admin-Token'] = adminAuth;
      }
    }
    
    // Добавляем информацию о пользователе из cookie согласия
    try {
      const consentStr = localStorage.getItem('cookieConsent');
      if (consentStr) {
        const consent = JSON.parse(consentStr);
        if (consent.privacy && consent.fullName) {
          headers['X-User-Name'] = encodeURIComponent(consent.fullName);
        } else if (consent.cookies) {
          // Если согласие на куки есть, но нет privacy, используем имя браузера
          const browserName = navigator.userAgent.split(' ')[0] || 'Гость';
          headers['X-User-Name'] = encodeURIComponent(browserName);
        }
        headers['X-User-Consent'] = 'true';
      } else {
        // Если согласия нет, используем имя браузера
        const browserName = navigator.userAgent.split(' ')[0] || 'Гость';
        headers['X-User-Name'] = encodeURIComponent(browserName);
        headers['X-User-Consent'] = 'false';
      }
    } catch (e) {
      console.error('[AiChat] Error reading consent:', e);
    }
    
    return headers;
  };

  const fetchModelInfo = async () => {
    console.log('[AiChat] Fetching model info from /api/ai-chat/tags...');
    try {
      const response = await fetch('/api/ai-chat/tags', {
        headers: { 'ngrok-skip-browser-warning': 'true', ...getAuthHeaders() }
      });
      console.log('[AiChat] Model info response status:', response.status);
      const data = await response.json();
      console.log('[AiChat] Model info data:', data);
      setModelInfo(data.models?.[0]);
    } catch (error) {
      console.error('[AiChat] Error fetching model info:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) {
      console.log('[AiChat] sendMessage skipped: empty input or loading');
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    console.log('[AiChat] User message:', userMessage.content);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const requestBody = {
      model: 'deepseek-coder:6.7b',
      prompt: input,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 2000
      }
    };
    console.log('[AiChat] Sending request to /api/ai-chat/generate...');
    console.log('[AiChat] Request body:', requestBody);

    try {
      const response = await fetch('/api/ai-chat/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('[AiChat] Response status:', response.status);
      console.log('[AiChat] Response ok:', response.ok);

      const data = await response.json();
      console.log('[AiChat] Response data:', data);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.error || 'No response'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[AiChat] Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: ' + error
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header with Build Info */}
      <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">🤖 AI Chat - DeepSeek Coder 6.7b</h1>
          {isAdmin ? (
            <div className="bg-green-900 text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
              🔐 Администратор (suser)
            </div>
          ) : (
            <div className="bg-gray-700 text-gray-400 text-xs font-semibold px-3 py-1 rounded-full">
              👤 Гость (только помощь по ценам)
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400">Model</div>
            <div className="font-semibold">{modelInfo?.name || 'Loading...'}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400">Size</div>
            <div className="font-semibold">
              {modelInfo ? (modelInfo.size / 1024 / 1024 / 1024).toFixed(1) + ' GB' : '-'}
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400">Parameters</div>
            <div className="font-semibold">{modelInfo?.details?.parameter_size || '-'}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400">Format</div>
            <div className="font-semibold">{modelInfo?.details?.format || '-'}</div>
          </div>
        </div>

        {/* Guest helper section */}
        {!isAdmin && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">💡 Помощник по ценам и заказам</h3>
            <p className="text-sm text-gray-300 mb-3">
              Я могу помочь вам с информацией о стоимости услуг, подобрать подходящий пакет и оформить заявку.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.open('/services', '_blank')}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                📊 Калькулятор цен
              </button>
              <button
                onClick={() => window.open('/brief', '_blank')}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                📝 Заполнить бриф
              </button>
              <button
                onClick={() => window.open('https://t.me/pixel59_support', '_blank')}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded text-sm"
              >
                📨 Написать в Telegram
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Примеры вопросов: «Сколько стоит лендинг?», «Какие услуги входят в SEO?», «Как оформить заказ?»
            </p>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="max-w-4xl mx-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg">Начните диалог с AI</p>
            <p className="text-sm">Задавайте вопросы по коду или просите помощи</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-blue-600' 
                : 'bg-gray-700'
            }`}>
              <div className="font-semibold text-xs mb-1">
                {msg.role === 'user' ? 'Вы' : '🤖 DeepSeek'}
              </div>
              <pre className="whitespace-pre-wrap font-s">{msg.content}</pre>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 p-4 rounded-lg">
              <span className="animate-pulse">Генерирует ответ...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Введите сообщение..."
            className="flex-1 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-6 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
