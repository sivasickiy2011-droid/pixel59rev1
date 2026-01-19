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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModelInfo();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchModelInfo = async () => {
    console.log('[AiChat] Fetching model info from /api/ai-chat/tags...');
    try {
      const response = await fetch('/api/ai-chat/tags', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
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
        headers: { 'Content-Type': 'application/json' },
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
        <h1 className="text-2xl font-bold mb-4">🤖 AI Chat - DeepSeek Coder 6.7b</h1>
        
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
