import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface LogoAdminProps {
  isEmbedded?: boolean;
}

const LogoAdmin = ({ isEmbedded = false }: LogoAdminProps) => {
  const [logo, setLogo] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const updateFavicon = (url: string) => {
    // Удаляем старый favicon
    const existingFavicon = document.querySelector("link[rel='icon']");
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // Создаем новый favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = url;
    document.head.appendChild(link);
  };

  useEffect(() => {
    const savedLogo = localStorage.getItem('site_logo');
    if (savedLogo) {
      setLogo(savedLogo);
      setPreviewUrl(savedLogo);
      updateFavicon(savedLogo);
    } else {
      // Устанавливаем текущий логотип по умолчанию
      const defaultLogo = '/img/5e53ea79-1c81-4c3f-847b-e8a82a5743c2.png';
      setLogo(defaultLogo);
      setPreviewUrl(defaultLogo);
      localStorage.setItem('site_logo', defaultLogo);
      updateFavicon(defaultLogo);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    // Конвертируем файл в base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          
          const response = await fetch('/api/6f0735b1-7477-4660-b2b0-0b694b4f36ea', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64String.split(',')[1], // Убираем префикс data:image/...;base64,
              filename: file.name,
              storage_type: 'data_uri'
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка загрузки: ${errorText}`);
          }

          const data = await response.json();
          resolve(data.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!previewFile) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadToS3(previewFile);
      setLogo(uploadedUrl);
      localStorage.setItem('site_logo', uploadedUrl);
      
      // Обновляем favicon
      updateFavicon(uploadedUrl);
      
      // Отправляем событие для обновления логотипа в других компонентах
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: uploadedUrl }));
      
      alert('Логотип успешно загружен!');
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Ошибка при загрузке логотипа');
    } finally {
      setUploading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Логотип и Фавикон сайта</h3>
            <p className="text-gray-400 text-sm mb-6">
              Загрузите логотип вашей компании. Он будет использован как фавикон (иконка во вкладке браузера).
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Загрузка */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo-upload" className="text-white mb-2 block">
                  Загрузить новый логотип
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-gray-700 border-gray-600 text-white file:bg-blue-600 file:text-white file:border-0 file:px-4 file:py-2 file:rounded file:mr-4 cursor-pointer"
                />
              </div>

              {previewUrl && (
                <div className="space-y-3">
                  <Label className="text-white">Предпросмотр логотипа:</Label>
                  <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 flex items-center justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Логотип" 
                      className="max-w-full max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!previewFile || uploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" className="mr-2 h-4 w-4" />
                    Загрузить логотип
                  </>
                )}
              </Button>
            </div>

            {/* Предпросмотр фавикона */}
            <div className="space-y-4">
              <Label className="text-white">Как будет выглядеть во вкладке браузера:</Label>
              
              <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4">
                <div className="bg-white rounded-t-lg p-2 space-y-2">
                  {/* Имитация вкладки браузера */}
                  <div className="flex items-center gap-2 bg-gray-200 rounded px-3 py-2">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Favicon" 
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    )}
                    <span className="text-gray-800 text-sm font-medium">Pixel — Разработка сайтов</span>
                  </div>

                  {/* Имитация адресной строки */}
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1.5">
                    <Icon name="Lock" className="w-3 h-3 text-green-600" />
                    {previewUrl && (
                      <img 
                        src={previewUrl} 
                        alt="Favicon" 
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span className="text-gray-600 text-xs">example.com</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded">
                  <p className="text-blue-300 text-xs">
                    <Icon name="Info" className="inline w-3 h-3 mr-1" />
                    Фавикон отображается размером 16×16 или 32×32 пикселя
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Текущий логотип */}
          {logo && (
            <div className="pt-6 border-t border-gray-700">
              <Label className="text-white mb-3 block">Текущий активный логотип:</Label>
              <div className="flex items-center gap-4 bg-gray-900 border border-gray-700 rounded-lg p-4">
                <img 
                  src={logo} 
                  alt="Текущий логотип" 
                  className="w-16 h-16 object-contain bg-white rounded p-2"
                />
                <div className="flex-1">
                  <p className="text-white font-medium">Логотип активен</p>
                  <p className="text-gray-400 text-sm break-all">{logo}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Логотип и Фавикон
          </h1>
          <p className="text-gray-400">Управление логотипом и иконкой сайта</p>
        </div>
        {content}
      </div>
    </div>
  );
};

export default LogoAdmin;