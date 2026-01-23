import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import API_ENDPOINTS from '@/config/api';

interface UseImageUploadOptions {
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<string>;
  isUploading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useImageUpload = (options?: UseImageUploadOptions): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    folder = 'logos',
    maxSizeMB = 2,
    allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
  } = options || {};

  const uploadImage = async (file: File): Promise<string> => {
    setError(null);
    setIsUploading(true);

    try {
      // Валидация типа файла
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = 'Разрешены только изображения: PNG, JPG, SVG, WEBP';
        setError(errorMsg);
        toast({
          title: 'Ошибка',
          description: errorMsg,
          variant: 'destructive'
        });
        throw new Error(errorMsg);
      }

      // Валидация размера файла
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        const errorMsg = `Размер файла не должен превышать ${maxSizeMB} МБ`;
        setError(errorMsg);
        toast({
          title: 'Ошибка',
          description: errorMsg,
          variant: 'destructive'
        });
        throw new Error(errorMsg);
      }

      // Конвертация файла в base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Убираем префикс "data:image/...;base64,"
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Отправка на сервер
      const response = await fetch(API_ENDPOINTS.upload.image, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64,
          filename: file.name,
          storage_type: 'local',
          folder: folder
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка загрузки' }));
        throw new Error(errorData.error || 'Не удалось загрузить изображение');
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Сервер не вернул URL изображения');
      }

      toast({
        title: 'Успешно',
        description: 'Изображение загружено'
      });

      return data.url;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMsg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    uploadImage,
    isUploading,
    error,
    clearError
  };
};
