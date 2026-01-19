import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('Гость');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Получаем имя из cookie согласия
    try {
      const consentStr = localStorage.getItem('cookieConsent');
      if (consentStr) {
        const consent = JSON.parse(consentStr);
        if (consent.privacy && consent.fullName) {
          setUserName(consent.fullName.split(' ')[0] || 'Гость');
        } else if (consent.cookies) {
          // Используем имя браузера
          const browserName = navigator.userAgent.split(' ')[0] || 'Гость';
          setUserName(browserName);
        }
      } else {
        const browserName = navigator.userAgent.split(' ')[0] || 'Гость';
        setUserName(browserName);
      }
    } catch (e) {
      console.error('[FloatingChat] Error reading consent:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': encodeURIComponent(userName),
          'X-User-Consent': 'true'
        },
        body: JSON.stringify({
          model: 'deepseek-coder:6.7b',
          prompt: input,
          stream: false,
          options: { temperature: 0.7, num_predict: 1000 }
        })
      });

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.error || 'Извините, произошла ошибка.'
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[FloatingChat] Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ошибка связи с сервером. Пожалуйста, попробуйте позже.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Кнопка открытия чата */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-r from-gradient-start to-gradient-mid shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
        >
          <span className="text-white text-2xl">💬</span>
        </button>
      )}

      {/* Модальное окно чата */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center px-4 py-4 sm:p-4 md:p-6 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gradient-start/20 dark:border-gradient-start/30">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gradient-start to-gradient-mid rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gradient-start to-gradient-mid bg-clip-text text-transparent">
                    Помощник по ценам
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Привет, {userName}! Задайте вопрос о наших услугах.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                  title="Очистить чат"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg">Задайте вопрос о ценах или услугах</p>
                  <p className="text-sm mt-2">Например: «Сколько стоит лендинг?»</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                      <div className="font-semibold text-xs mb-1">
                        {msg.role === 'user' ? userName : '🤖 Помощник'}
                      </div>
                      <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="animate-pulse">Генерирует ответ...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Ввод */}
            <div className="p-4 sm:p-6 border-t dark:border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите ваш вопрос..."
                  className="flex-1 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:border-gradient-start focus:ring-2 focus:ring-gradient-start/30"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gradient-start to-gradient-mid text-white rounded-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '...' : 'Отправить'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                💡 Спросите о ценах на услуги, заказе или калькуляторе.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;