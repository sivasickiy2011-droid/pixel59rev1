# Промпт: Этап 4 - Улучшения UX и обработка ошибок

**Этап:** 4 из 5  
**Приоритет:** Средний  
**Оценка:** ~100 строк кода  
**Лимит контекста:** 200k токенов

---

## Контекст задачи

Базовый функционал работает, но нужно улучшить пользовательский опыт: добавить валидацию, улучшить сообщения об ошибках, добавить подтверждения действий.

## Цель этапа

1. Улучшить валидацию данных
2. Добавить подтверждение удаления с деталями
3. Улучшить сообщения об ошибках
4. Добавить возможность замены логотипа
5. Добавить индикаторы состояния

## Технические требования

### 1. Валидация URL сайта

#### Обновить `src/components/admin/PartnerForm.tsx`

**Добавить валидацию URL:**

```typescript
const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// В JSX:
<div>
  <Label htmlFor="website" className="text-base font-semibold text-black">
    Сайт партнёра
  </Label>
  <Input
    id="website"
    value={formData.website_url}
    onChange={(e) => {
      const value = e.target.value;
      onFormDataChange({ ...formData, website_url: value });
    }}
    onBlur={(e) => {
      const value = e.target.value;
      if (value && !validateUrl(value)) {
        toast({
          title: 'Внимание',
          description: 'URL должен начинаться с http:// или https://',
          variant: 'destructive'
        });
      }
    }}
    placeholder="https://example.com"
    className="text-black"
  />
  <p className="text-xs text-gray-500 mt-1">
    Укажите полный URL с протоколом (http:// или https://)
  </p>
</div>
```

### 2. Улучшенное подтверждение удаления

#### Обновить `src/components/admin/PartnersAdmin.tsx`

**Заменить простой confirm на детальное подтверждение:**

```typescript
const handleDelete = async (id: number) => {
  const partner = partners.find(p => p.id === id);
  if (!partner) return;

  const confirmMessage = `Вы уверены, что хотите удалить партнёра "${partner.name}"?\n\n` +
    `Сайт: ${partner.website_url}\n` +
    `Статус: ${partner.is_active ? 'Активен' : 'Неактивен'}\n\n` +
    `Это действие нельзя отменить.`;

  if (!confirm(confirmMessage)) return;

  try {
    const response = await fetch(`/api/c7b03587-cdba-48a4-ac48-9aa2775ff9a0?id=${id}`, {
      method: 'DELETE',
      headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' })
    });

    if (response.ok) {
      toast({
        title: 'Успешно',
        description: `Партнёр "${partner.name}" удалён`
      });
      fetchPartners();
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
      toast({
        title: 'Ошибка',
        description: errorData.error || 'Не удалось удалить партнёра',
        variant: 'destructive'
      });
    }
  } catch (error) {
    console.error('Error deleting partner:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось удалить партнёра. Проверьте соединение.',
      variant: 'destructive'
    });
  }
};
```

### 3. Валидация названия

#### Обновить `src/components/admin/PartnersAdmin.tsx`

**Улучшить валидацию в handleAdd:**

```typescript
const handleAdd = async () => {
  // Валидация названия
  if (!formData.name.trim()) {
    toast({
      title: 'Ошибка',
      description: 'Введите название партнёра',
      variant: 'destructive'
    });
    return;
  }

  if (formData.name.trim().length < 2) {
    toast({
      title: 'Ошибка',
      description: 'Название должно содержать минимум 2 символа',
      variant: 'destructive'
    });
    return;
  }

  if (formData.name.trim().length > 100) {
    toast({
      title: 'Ошибка',
      description: 'Название не должно превышать 100 символов',
      variant: 'destructive'
    });
    return;
  }

  // Валидация логотипа
  if (!formData.logo_url.trim()) {
    toast({
      title: 'Ошибка',
      description: 'Загрузите логотип партнёра',
      variant: 'destructive'
    });
    return;
  }

  // Валидация URL
  if (!formData.website_url.trim()) {
    toast({
      title: 'Ошибка',
      description: 'Введите сайт партнёра',
      variant: 'destructive'
    });
    return;
  }

  try {
    new URL(formData.website_url);
  } catch {
    toast({
      title: 'Ошибка',
      description: 'Введите корректный URL (начинается с http:// или https://)',
      variant: 'destructive'
    });
    return;
  }

  // Остальной код handleAdd...
};
```

### 4. Возможность замены логотипа

#### Обновить `src/components/admin/PartnerCard.tsx`

**Добавить кнопку "Заменить логотип":**

```typescript
{partner.logo_url && !isEditing && (
  <div className="mt-2">
    <Label className="text-sm text-gray-600">Текущий логотип:</Label>
    <div className="relative group">
      <img 
        src={partner.logo_url} 
        alt={partner.name}
        className="h-20 object-contain mt-1"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
        <Button
          onClick={() => {
            // Открыть file input
            const fileInput = document.getElementById(`logo-replace-${partner.id}`) as HTMLInputElement;
            fileInput?.click();
          }}
          variant="outline"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Icon name="Upload" size={16} className="mr-2" />
          Заменить
        </Button>
      </div>
    </div>
    <input
      id={`logo-replace-${partner.id}`}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const url = await uploadImage(file);
            onUpdate(partner.id, 'logo_url', url);
            // Автоматически сохранить
            onSave();
          } catch (error) {
            console.error('Upload failed:', error);
          }
        }
      }}
    />
  </div>
)}
```

### 5. Индикаторы состояния сохранения

#### Обновить `src/components/admin/PartnersAdmin.tsx`

**Добавить состояние сохранения:**

```typescript
const [savingId, setSavingId] = useState<number | null>(null);

const handleUpdate = async (id: number) => {
  setSavingId(id);
  
  try {
    const partner = partners.find(p => p.id === id);
    if (!partner) return;

    // Валидация (аналогично handleAdd)
    // ...

    const response = await fetch('/api/c7b03587-cdba-48a4-ac48-9aa2775ff9a0', {
      method: 'PUT',
      headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(partner)
    });

    if (response.ok) {
      toast({
        title: 'Успешно',
        description: 'Партнёр обновлён'
      });
      setEditingId(null);
      fetchPartners();
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
      toast({
        title: 'Ошибка',
        description: errorData.error || 'Не удалось обновить партнёра',
        variant: 'destructive'
      });
    }
  } catch (error) {
    console.error('Error updating partner:', error);
    toast({
      title: 'Ошибка',
      description: 'Не удалось обновить партнёра. Проверьте соединение.',
      variant: 'destructive'
    });
  } finally {
    setSavingId(null);
  }
};
```

**Передать в PartnerCard:**

```typescript
<PartnerCard
  key={partner.id}
  partner={partner}
  isEditing={editingId === partner.id}
  isSaving={savingId === partner.id}  // ДОБАВИТЬ
  onEdit={() => setEditingId(partner.id)}
  onUpdate={updatePartner}
  onSave={() => handleUpdate(partner.id)}
  onCancel={() => setEditingId(null)}
  onDelete={() => handleDelete(partner.id)}
/>
```

**Обновить интерфейс PartnerCard:**

```typescript
interface PartnerCardProps {
  partner: PartnerLogo;
  isEditing: boolean;
  isSaving?: boolean;  // ДОБАВИТЬ
  onEdit: () => void;
  onUpdate: (id: number, field: keyof PartnerLogo, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

// В кнопке сохранения:
<Button
  onClick={onSave}
  disabled={isSaving}
  className="bg-gradient-to-r from-gradient-start to-gradient-mid text-white"
>
  {isSaving ? (
    <>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
      Сохранение...
    </>
  ) : (
    <>
      <Icon name="Check" size={16} className="mr-2" />
      Сохранить
    </>
  )}
</Button>
```

### 6. Улучшенная обработка ошибок загрузки изображений

#### Обновить `src/components/PartnersCarousel.tsx`

**Добавить fallback для ошибок загрузки:**

```typescript
<img
  src={partner.logo_url}
  alt={partner.name}
  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
  onError={(e) => {
    const target = e.target as HTMLImageElement;
    // Попробовать загрузить с абсолютным путём
    if (!target.src.startsWith('http') && !target.dataset.retried) {
      target.dataset.retried = 'true';
      target.src = window.location.origin + partner.logo_url;
    } else {
      // Показать текстовый fallback
      target.style.display = 'none';
      const textFallback = document.createElement('div');
      textFallback.className = 'text-lg font-bold text-gray-700 dark:text-gray-300';
      textFallback.textContent = partner.name;
      target.parentElement?.appendChild(textFallback);
    }
  }}
/>
```

## Критерии приёмки

После выполнения этого этапа должно работать:

1. ✅ Валидация URL работает (проверка протокола)
2. ✅ Валидация названия (2-100 символов)
3. ✅ Подтверждение удаления показывает детали партнёра
4. ✅ Можно заменить логотип без редактирования всей карточки
5. ✅ Индикатор сохранения показывается при обновлении
6. ✅ Все ошибки отображаются понятными сообщениями
7. ✅ Fallback для ошибок загрузки изображений работает

## Тестирование

### Тест 1: Валидация URL

1. Попытаться ввести URL без протокола: "example.com"
2. **Ожидаемый результат:** Предупреждение при потере фокуса

### Тест 2: Валидация названия

1. Попытаться сохранить с названием "A" (1 символ)
2. **Ожидаемый результат:** Ошибка "минимум 2 символа"

### Тест 3: Подтверждение удаления

1. Нажать "Удалить" на партнёре
2. **Ожидаемый результат:** 
   - Диалог с названием, сайтом, статусом
   - Предупреждение "нельзя отменить"

### Тест 4: Замена логотипа

1. Навести на логотип в режиме просмотра
2. Нажать "Заменить"
3. Выбрать новый файл
4. **Ожидаемый результат:**
   - Логотип загружается
   - Автоматически сохраняется
   - Превью обновляется

### Тест 5: Индикатор сохранения

1. Редактировать партнёра
2. Нажать "Сохранить"
3. **Ожидаемый результат:**
   - Кнопка показывает "Сохранение..."
   - Спиннер анимируется
   - После сохранения возврат к "Сохранить"

## Файлы для изменения

1. **Обновить:** `src/components/admin/PartnerForm.tsx` (валидация URL)
2. **Обновить:** `src/components/admin/PartnersAdmin.tsx` (валидация, подтверждение, индикаторы)
3. **Обновить:** `src/components/admin/PartnerCard.tsx` (замена логотипа, индикатор сохранения)
4. **Обновить:** `src/components/PartnersCarousel.tsx` (fallback для ошибок)

## Следующий этап

После успешного выполнения этого этапа переходи к **Этапу 5: Финальная проверка и документация**.

---

## Промпт для ИИ агента

```
Улучши UX и обработку ошибок в управлении партнёрами.

ЗАДАЧА 1: Валидация

1. Добавь валидацию URL в PartnerForm.tsx:
   - Проверка протокола (http/https)
   - Предупреждение при onBlur
   - Подсказка под полем

2. Улучши валидацию в PartnersAdmin.tsx:
   - Название: 2-100 символов
   - URL: корректный формат
   - Логотип: обязателен

ЗАДАЧА 2: Подтверждение удаления

3. Замени confirm на детальное подтверждение:
   - Показать название, сайт, статус
   - Предупреждение "нельзя отменить"
   - Улучшенное сообщение после удаления

ЗАДАЧА 3: Замена логотипа

4. Добавь в PartnerCard.tsx:
   - Кнопка "Заменить" при наведении на логотип
   - Скрытый file input
   - Автоматическое сохранение после загрузки

ЗАДАЧА 4: Индикаторы состояния

5. Добавь состояние savingId в PartnersAdmin.tsx
6. Передай isSaving в PartnerCard
7. Покажи спиннер и "Сохранение..." в кнопке

ЗАДАЧА 5: Fallback для изображений

8. Улучши onError в PartnersCarousel.tsx:
   - Попытка загрузки с абсолютным путём
   - Текстовый fallback при ошибке

КРИТЕРИИ:
- Валидация работает для всех полей
- Подтверждение удаления информативное
- Можно заменить логотип без полного редактирования
- Индикаторы показывают состояние операций
- Ошибки загрузки обрабатываются gracefully

ТЕСТ:
1. Введи URL без протокола - должно быть предупреждение
2. Введи название из 1 символа - должна быть ошибка
3. Удали партнёра - должен быть детальный диалог
4. Наведи на логотип - должна появиться кнопка "Заменить"
5. Сохрани изменения - должен показаться индикатор
```
