import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

export default function TestS3Upload() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const { toast } = useToast();

  const testUpload = async () => {
    setIsUploading(true);
    setUploadedUrl('');
    setErrorDetails('');

    // Маленькая тестовая картинка 1x1 пиксель (красный PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    try {
      const response = await fetch('/api/1103293c-17a5-453c-b290-c1c376ead996', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: testImageBase64,
          filename: 'test-logo.png'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedUrl(data.url);
        toast({
          title: '✅ Успешно!',
          description: 'S3 настроен правильно. Логотип загружен.'
        });
      } else {
        const errorMsg = JSON.stringify(data, null, 2);
        setErrorDetails(errorMsg);
        toast({
          title: '❌ Ошибка загрузки',
          description: data.error || data.message || 'Проверьте секреты S3',
          variant: 'destructive'
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorDetails(errorMsg);
      toast({
        title: '❌ Ошибка подключения',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card p-8 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              size="sm"
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              В админ-панель
            </Button>
          </div>

          <h1 className="text-3xl font-bold mb-4">🧪 Тест подключения S3</h1>
          <p className="text-muted-foreground mb-6">
            Проверка настройки Yandex Cloud Object Storage для загрузки логотипов партнёров
          </p>

          <div className="space-y-4">
            <Button 
              onClick={testUpload} 
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? '⏳ Загрузка...' : '▶️ Запустить тест'}
            </Button>

            {uploadedUrl && (
              <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg border-2 border-green-500">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-3">
                  ✅ S3 работает правильно!
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">URL изображения:</p>
                    <a 
                      href={uploadedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {uploadedUrl}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Превью:</p>
                    <img 
                      src={uploadedUrl} 
                      alt="Test upload" 
                      className="w-32 h-32 border rounded object-contain bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {errorDetails && (
              <div className="bg-red-50 dark:bg-red-950 p-6 rounded-lg border-2 border-red-500">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-3">
                  ❌ Детали ошибки:
                </h3>
                <pre className="text-xs bg-red-100 dark:bg-red-900 p-3 rounded overflow-auto max-h-64">
                  {errorDetails}
                </pre>
              </div>
            )}

            <div className="bg-muted p-4 rounded text-sm space-y-2">
              <p className="font-semibold">📋 Что проверяется:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Наличие всех секретов (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME)</li>
                <li>Подключение к Yandex Cloud Object Storage</li>
                <li>Права на запись в бакет</li>
                <li>Публичный доступ на чтение</li>
                <li>Генерация корректных URL</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">💡 Возможные ошибки:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 mt-2">
                <li><strong>S3 credentials not configured</strong> - заполните все секреты</li>
                <li><strong>Access Denied</strong> - проверьте ключи и роль storage.editor</li>
                <li><strong>NoSuchBucket</strong> - проверьте имя бакета</li>
                <li><strong>Image not loading</strong> - включите публичный доступ на чтение</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}