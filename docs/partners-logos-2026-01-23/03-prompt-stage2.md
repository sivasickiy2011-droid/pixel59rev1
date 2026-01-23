# Промпт: Этап 2 - Интеграция загрузки изображений

**Этап:** 2 из 5  
**Приоритет:** Высокий  
**Оценка:** ~150 строк кода  
**Лимит контекста:** 200k токенов

---

## Контекст задачи

Сейчас логотипы партнёров сохраняются как Data URI (base64) прямо в базу данных, что увеличивает размер БД и замедляет запросы.

В проекте уже есть endpoint `/api/6f0735b1-7477-4660-b2b0-0b694b4f36ea` (upload-image) для загрузки файлов, но он не используется в компонентах управления партнёрами.

## Цель этапа

Интегрировать загрузку изображений через `upload-image` endpoint, чтобы логотипы сохранялись как файлы в `/public/uploads/logos/`, а в БД хранился только путь к файлу.

## Технические требования

### 1. Создать хук `src/hooks/useImageUpload.ts`

**Функционал:**
- Загрузка изображения на сервер
- Валидация размера файла (макс 2MB)
- Валидация типа файла (PNG, JPG, JPEG, SVG, WEBP)
- Индикатор загрузки
- Обработка ошибок

**Интерфейс:**
```typescript
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
```

### 2. Обновить `src/config/api.ts`

Добавить endpoint для загрузки изображений:
```typescript
upload: {
  image: `${API_BASE_URL}/6f0735b1-7477-4660-b2b0-0b694b4f36ea`,
}
```

### 3. Обновить `src/components/admin/PartnerForm.tsx`

**Изменения:**
- Использовать хук `useImageUpload`
- Показывать индикатор загрузки
- Отображать ошибки валидации
- Сохранять URL файла вместо Data URI

### 4. Обновить `src/components/admin/PartnerCard.tsx`

**Изменения:**
- Использовать хук `useImageUpload`
- Показывать индикатор загрузки при замене логотипа
- Отображать ошибки валидации

## Детальная реализация

### Файл 1: `src/hooks/useImageUpload.ts`

```typescript
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
```

### Файл 2: Обновление `src/config/api.ts`

Добавь в объект `API_ENDPOINTS`:

```typescript
upload: {
  image: `${API_BASE_URL}/6f0735b1-7477-4660-b2b0-0b694b4f36ea`,
},
```

### Файл 3: Обновление `src/components/admin/PartnerForm.tsx`

Замени логику загрузки файла:

**Было:**
```typescript
<Input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result as string;
        onFormDataChange({ ...formData, logo_url: dataUri });
      };
      reader.readAsDataURL(file);
    }
  }}
  className="text-black"
/>
```

**Стало:**
```typescript
import { useImageUpload } from '@/hooks/useImageUpload';

// В компоненте:
const { uploadImage, isUploading, error: uploadError } = useImageUpload({ folder: 'logos' });

// В JSX:
<Input
  type="file"
  accept="image/*"
  disabled={isUploading}
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImage(file);
        onFormDataChange({ ...formData, logo_url: url });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }}
  className="text-black"
/>

{isUploading && (
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gradient-start" />
    <span>Загрузка изображения...</span>
  </div>
)}

{uploadError && (
  <p className="text-sm text-red-600">{uploadError}</p>
)}
```

### Файл 4: Обновление `src/components/admin/PartnerCard.tsx`

Аналогичные изменения для режима редактирования:

```typescript
import { useImageUpload } from '@/hooks/useImageUpload';

// В компоненте:
const { uploadImage, isUploading, error: uploadError } = useImageUpload({ folder: 'logos' });

// В JSX (в режиме редактирования):
<Input
  type="file"
  accept="image/*"
  disabled={isUploading}
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImage(file);
        onUpdate(partner.id, 'logo_url', url);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }}
  className="text-black"
/>

{isUploading && (
  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gradient-start" />
    <span>Загрузка изображения...</span>
  </div>
)}
```

## Критерии приёмки

После выполнения этого этапа должно работать:

1. ✅ При выборе файла он загружается на сервер
2. ✅ Файл сохраняется в `/public/uploads/logos/`
3. ✅ В БД сохраняется путь `/uploads/logos/uuid.ext`, а не Data URI
4. ✅ Валидация размера файла работает (макс 2MB)
5. ✅ Валидация типа файла работает (только изображения)
6. ✅ Показывается индикатор загрузки
7. ✅ Ошибки отображаются пользователю
8. ✅ Превью обновляется после загрузки
9. ✅ Работает как при создании, так и при редактировании

## Тестирование

### Тест 1: Успешная загрузка

1. Открыть админ-панель → Логотипы партнёров
2. Нажать "Добавить партнёра"
3. Выбрать PNG файл < 2MB
4. **Ожидаемый результат:**
   - Показывается индикатор загрузки
   - Файл загружается
   - Превью отображается
   - При сохранении в БД записывается путь `/uploads/logos/...`

### Тест 2: Валидация размера

1. Попытаться загрузить файл > 2MB
2. **Ожидаемый результат:**
   - Ошибка: "Размер файла не должен превышать 2 МБ"
   - Файл не загружается
   - Toast уведомление об ошибке

### Тест 3: Валидация типа

1. Попытаться загрузить .txt или .pdf файл
2. **Ожидаемый результат:**
   - Ошибка: "Разрешены только изображения: PNG, JPG, SVG, WEBP"
   - Файл не загружается
   - Toast уведомление об ошибке

### Тест 4: Замена логотипа

1. Открыть редактирование существующего партнёра
2. Загрузить новый логотип
3. Сохранить
4. **Ожидаемый результат:**
   - Старый логотип заменяется новым
   - В БД обновляется `logo_url`
   - Новый файл сохранён в `/public/uploads/logos/`

### Тест 5: Проверка файловой системы

После загрузки проверить:
```bash
ls -la /public/uploads/logos/
```

Должны быть файлы с UUID именами:
```
uuid-123.png
uuid-456.jpg
```

## Файлы для изменения

1. **Создать:** `src/hooks/useImageUpload.ts`
2. **Обновить:** `src/config/api.ts`
3. **Обновить:** `src/components/admin/PartnerForm.tsx`
4. **Обновить:** `src/components/admin/PartnerCard.tsx`

## Зависимости

- Endpoint `/api/6f0735b1-7477-4660-b2b0-0b694b4f36ea` (upload-image) должен работать
- Директория `/public/uploads/logos/` должна существовать с правами на запись
- Хук `useToast` должен быть доступен

## Возможные проблемы

### Проблема 1: Директория не существует

**Решение:**
```bash
mkdir -p public/uploads/logos
chmod 755 public/uploads/logos
```

### Проблема 2: Нет прав на запись

**Решение:**
```bash
chmod 755 public/uploads/logos
```

### Проблема 3: CORS ошибки

**Решение:** Проверить заголовки в `backend/upload-image/index.py`

## Следующий этап

После успешного выполнения этого этапа переходи к **Этапу 3: Автоматическая сортировка**.

---

## Промпт для ИИ агента

```
Интегрируй загрузку изображений через upload-image endpoint для логотипов партнёров.

ЗАДАЧА:
1. Создай хук useImageUpload в src/hooks/useImageUpload.ts
2. Обновь src/config/api.ts - добавь upload.image endpoint
3. Обновь src/components/admin/PartnerForm.tsx - используй хук вместо FileReader
4. Обнови src/components/admin/PartnerCard.tsx - используй хук вместо FileReader

ХУК useImageUpload:
- Валидация размера (макс 2MB)
- Валидация типа (PNG, JPG, JPEG, SVG, WEBP)
- Конвертация в base64
- POST запрос к /api/6f0735b1-7477-4660-b2b0-0b694b4f36ea
- Параметры: { image: base64, filename, storage_type: 'local', folder: 'logos' }
- Возврат URL файла
- Индикатор загрузки (isUploading)
- Обработка ошибок

ENDPOINT CONFIG:
upload: {
  image: `${API_BASE_URL}/6f0735b1-7477-4660-b2b0-0b694b4f36ea`,
}

КОМПОНЕНТЫ:
- Заменить FileReader на useImageUpload
- Добавить индикатор загрузки
- Показывать ошибки валидации
- Сохранять URL вместо Data URI

КРИТЕРИИ:
- Файлы сохраняются в /public/uploads/logos/
- В БД путь /uploads/logos/uuid.ext
- Валидация работает
- Индикатор загрузки показывается
- Ошибки отображаются

ТЕСТ:
1. Загрузи PNG < 2MB - должно работать
2. Загрузи файл > 2MB - должна быть ошибка
3. Загрузи .txt - должна быть ошибка
4. Проверь /public/uploads/logos/ - файлы должны быть там
```
