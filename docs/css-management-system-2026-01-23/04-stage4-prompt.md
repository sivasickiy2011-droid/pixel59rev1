# Промпт для Этапа 4: Админ-панель для редактирования CSS

**Этап:** 4 из 5  
**Контекст:** До 200,000 токенов  
**Предыдущие результаты:** `stage1-results.md`, `stage2-results.md`, `stage3-results.md`

---

## 📋 Контекст проекта

### Входные данные из предыдущих этапов
1. **Этап 1:** Список компонентов с BEM-классами
2. **Этап 2:** Backend API endpoints
3. **Этап 3:** Динамический загрузчик CSS работает

### Текущая админ-панель
- **Расположение:** `src/components/admin/`
- **Роутинг:** `/admin/*`
- **Существующие разделы:** Согласия, Партнёры, Контент, Аналитика, Безопасность
- **Layout:** `AdminLayout.tsx`

---

## 🎯 Задача этапа

Создать полнофункциональный интерфейс для управления CSS через админ-панель.

### Подзадачи:
1. Создать страницу управления CSS
2. Реализовать редактор кода с подсветкой синтаксиса
3. Добавить превью изменений
4. Реализовать историю изменений
5. Добавить функцию отката
6. Интегрировать в существующую админ-панель

---

## 🏗️ Архитектура интерфейса

```
/admin/css-management
├── Список блоков (левая панель)
│   ├── Фильтр по компонентам
│   ├── Поиск
│   └── Список карточек блоков
├── Редактор (центральная панель)
│   ├── Информация о блоке
│   ├── Monaco Editor
│   ├── Кнопки действий
│   └── Валидация
└── Превью/История (правая панель)
    ├── Вкладка "Превью"
    └── Вкладка "История"
```

---

## 📁 Структура файлов

```
src/
├── pages/
│   └── admin/
│       └── CSSManagement.tsx         # Главная страница
├── components/
│   └── admin/
│       └── css/
│           ├── CSSBlockList.tsx      # Список блоков
│           ├── CSSBlockCard.tsx      # Карточка блока
│           ├── CSSEditor.tsx         # Редактор кода
│           ├── CSSPreview.tsx        # Превью изменений
│           ├── CSSHistory.tsx        # История изменений
│           └── CSSBlockForm.tsx      # Форма создания блока
├── hooks/
│   └── admin/
│       └── useCSSManagement.ts       # Hook для API
└── types/
    └── css.ts                        # TypeScript типы
```

---

## 💻 Реализация

### Файл: `src/types/css.ts`

```typescript
export interface CSSBlock {
  id: number;
  block_name: string;
  component_name: string;
  css_content: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  description: string;
}

export interface CSSHistoryEntry {
  id: number;
  block_id: number;
  css_content_before: string;
  css_content_after: string;
  changed_by: string;
  changed_at: string;
  change_description: string;
}

export interface CSSBlockFormData {
  block_name: string;
  component_name: string;
  css_content: string;
  is_active: boolean;
  priority: number;
  description: string;
}
```

### Файл: `src/hooks/admin/useCSSManagement.ts`

```typescript
import { useState, useCallback } from 'react';
import axios from 'axios';
import { CSSBlock, CSSHistoryEntry, CSSBlockFormData } from '@/types/css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pixel59.ru/api';

export const useCSSManagement = () => {
  const [blocks, setBlocks] = useState<CSSBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<CSSBlock | null>(null);
  const [history, setHistory] = useState<CSSHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('admin_auth')}`,
  });

  /**
   * Загрузить все блоки
   */
  const fetchBlocks = useCallback(async (filters?: { component?: string; active?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.component) params.append('component', filters.component);
      if (filters?.active !== undefined) params.append('active', String(filters.active));

      const response = await axios.get<{ blocks: CSSBlock[] }>(
        `${API_BASE_URL}/css-blocks?${params}`,
        { headers: getAuthHeaders() }
      );
      setBlocks(response.data.blocks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blocks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Загрузить блок по ID
   */
  const fetchBlock = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ block: CSSBlock }>(
        `${API_BASE_URL}/css-blocks/${id}`,
        { headers: getAuthHeaders() }
      );
      setSelectedBlock(response.data.block);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch block');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Создать новый блок
   */
  const createBlock = useCallback(async (data: CSSBlockFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post<{ block: CSSBlock }>(
        `${API_BASE_URL}/css-blocks`,
        data,
        { headers: getAuthHeaders() }
      );
      await fetchBlocks();
      return response.data.block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create block');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBlocks]);

  /**
   * Обновить блок
   */
  const updateBlock = useCallback(async (id: number, data: Partial<CSSBlockFormData>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.put<{ block: CSSBlock }>(
        `${API_BASE_URL}/css-blocks/${id}`,
        data,
        { headers: getAuthHeaders() }
      );
      await fetchBlocks();
      setSelectedBlock(response.data.block);
      return response.data.block;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBlocks]);

  /**
   * Удалить блок
   */
  const deleteBlock = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(
        `${API_BASE_URL}/css-blocks/${id}`,
        { headers: getAuthHeaders() }
      );
      await fetchBlocks();
      if (selectedBlock?.id === id) {
        setSelectedBlock(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete block');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBlocks, selectedBlock]);

  /**
   * Загрузить историю изменений
   */
  const fetchHistory = useCallback(async (blockId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ history: CSSHistoryEntry[] }>(
        `${API_BASE_URL}/css-blocks/${blockId}/history`,
        { headers: getAuthHeaders() }
      );
      setHistory(response.data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Откатить изменения
   */
  const rollbackChanges = useCallback(async (blockId: number, historyId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post<{ block: CSSBlock }>(
        `${API_BASE_URL}/css-blocks/${blockId}/rollback/${historyId}`,
        {},
        { headers: getAuthHeaders() }
      );
      await fetchBlocks();
      setSelectedBlock(response.data.block);
      await fetchHistory(blockId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rollback changes');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBlocks, fetchHistory]);

  return {
    blocks,
    selectedBlock,
    history,
    isLoading,
    error,
    fetchBlocks,
    fetchBlock,
    createBlock,
    updateBlock,
    deleteBlock,
    fetchHistory,
    rollbackChanges,
    setSelectedBlock,
  };
};
```

### Файл: `src/components/admin/css/CSSEditor.tsx`

```typescript
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CSSBlock } from '@/types/css';
import { Save, X, Eye, History } from 'lucide-react';

interface CSSEditorProps {
  block: CSSBlock | null;
  onSave: (data: Partial<CSSBlock>) => Promise<void>;
  onCancel: () => void;
  onShowPreview: () => void;
  onShowHistory: () => void;
}

const CSSEditor: React.FC<CSSEditorProps> = ({
  block,
  onSave,
  onCancel,
  onShowPreview,
  onShowHistory,
}) => {
  const [cssContent, setCssContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (block) {
      setCssContent(block.css_content);
      setIsActive(block.is_active);
      setPriority(block.priority);
      setDescription(block.description || '');
      setHasChanges(false);
    }
  }, [block]);

  const handleSave = async () => {
    if (!block) return;
    
    setIsSaving(true);
    try {
      await onSave({
        css_content: cssContent,
        is_active: isActive,
        priority,
        description,
      });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setCssContent(value || '');
    setHasChanges(true);
  };

  if (!block) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Выберите блок для редактирования
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{block.block_name}</h3>
            <p className="text-sm text-gray-400">{block.component_name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShowPreview}
              className="text-gray-300"
            >
              <Eye className="w-4 h-4 mr-2" />
              Превью
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHistory}
              className="text-gray-300"
            >
              <History className="w-4 h-4 mr-2" />
              История
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={(checked) => {
                setIsActive(checked);
                setHasChanges(true);
              }}
            />
            <Label htmlFor="is-active" className="text-gray-300">
              Активен
            </Label>
          </div>
          
          <div>
            <Label htmlFor="priority" className="text-gray-300 text-xs">
              Приоритет
            </Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => {
                setPriority(parseInt(e.target.value) || 0);
                setHasChanges(true);
              }}
              className="mt-1 bg-gray-900 text-white border-gray-700"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300 text-xs">
              Описание
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Краткое описание"
              className="mt-1 bg-gray-900 text-white border-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="css"
          value={cssContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-800 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {hasChanges && '● Есть несохраненные изменения'}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CSSEditor;
```

### Файл: `src/pages/admin/CSSManagement.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useCSSManagement } from '@/hooks/admin/useCSSManagement';
import AdminLayout from '@/components/AdminLayout';
import CSSBlockList from '@/components/admin/css/CSSBlockList';
import CSSEditor from '@/components/admin/css/CSSEditor';
import CSSPreview from '@/components/admin/css/CSSPreview';
import CSSHistory from '@/components/admin/css/CSSHistory';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'editor' | 'preview' | 'history';

const CSSManagement = () => {
  const {
    blocks,
    selectedBlock,
    history,
    isLoading,
    error,
    fetchBlocks,
    fetchBlock,
    updateBlock,
    deleteBlock,
    fetchHistory,
    rollbackChanges,
    setSelectedBlock,
  } = useCSSManagement();

  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterComponent, setFilterComponent] = useState<string>('');

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    if (selectedBlock && viewMode === 'history') {
      fetchHistory(selectedBlock.id);
    }
  }, [selectedBlock, viewMode, fetchHistory]);

  const handleSelectBlock = async (blockId: number) => {
    await fetchBlock(blockId);
    setViewMode('editor');
  };

  const handleSave = async (data: Partial<typeof selectedBlock>) => {
    if (!selectedBlock) return;
    
    try {
      await updateBlock(selectedBlock.id, data);
      toast.success('CSS блок успешно обновлен');
    } catch (err) {
      toast.error('Ошибка при сохранении блока');
    }
  };

  const handleDelete = async (blockId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот блок?')) return;
    
    try {
      await deleteBlock(blockId);
      toast.success('CSS блок успешно удален');
    } catch (err) {
      toast.error('Ошибка при удалении блока');
    }
  };

  const handleRollback = async (historyId: number) => {
    if (!selectedBlock) return;
    if (!confirm('Вы уверены, что хотите откатить изменения?')) return;
    
    try {
      await rollbackChanges(selectedBlock.id, historyId);
      toast.success('Изменения успешно откачены');
      setViewMode('editor');
    } catch (err) {
      toast.error('Ошибка при откате изменений');
    }
  };

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = block.block_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         block.component_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesComponent = !filterComponent || block.component_name === filterComponent;
    return matchesSearch && matchesComponent;
  });

  const components = Array.from(new Set(blocks.map(b => b.component_name))).sort();

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Управление CSS</h1>
            <p className="text-gray-400 mt-1">
              Редактирование стилей компонентов без пересборки
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Создать блок
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100%-5rem)]">
          {/* Левая панель - список блоков */}
          <div className="col-span-3 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
            <CSSBlockList
              blocks={filteredBlocks}
              selectedBlockId={selectedBlock?.id}
              onSelectBlock={handleSelectBlock}
              onDeleteBlock={handleDelete}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterComponent={filterComponent}
              onFilterChange={setFilterComponent}
              components={components}
              isLoading={isLoading}
            />
          </div>

          {/* Центральная панель - редактор */}
          <div className="col-span-6 bg-gray-800 rounded-lg overflow-hidden">
            <CSSEditor
              block={selectedBlock}
              onSave={handleSave}
              onCancel={() => setSelectedBlock(null)}
              onShowPreview={() => setViewMode('preview')}
              onShowHistory={() => setViewMode('history')}
            />
          </div>

          {/* Правая панель - превью/история */}
          <div className="col-span-3 bg-gray-800 rounded-lg overflow-hidden">
            {viewMode === 'preview' ? (
              <CSSPreview
                block={selectedBlock}
                onClose={() => setViewMode('editor')}
              />
            ) : viewMode === 'history' ? (
              <CSSHistory
                history={history}
                onRollback={handleRollback}
                onClose={() => setViewMode('editor')}
                isLoading={isLoading}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Выберите превью или историю</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CSSManagement;
```

---

## 📦 Установка зависимостей

```bash
# Monaco Editor для React
npm install @monaco-editor/react

# Или альтернатива - CodeMirror
npm install @uiw/react-codemirror @codemirror/lang-css
```

---

## 🔗 Интеграция в роутинг

```typescript
// src/App.tsx или router config

import CSSManagement from '@/pages/admin/CSSManagement';

// Добавить роут:
<Route path="/admin/css-management" element={<CSSManagement />} />
```

### Обновить AdminLayout.tsx

```typescript
// src/components/AdminLayout.tsx

const navItems = [
  { path: '/admin/consents', label: 'Согласия', icon: FileCheck },
  { path: '/admin/partners', label: 'Партнёры', icon: Users },
  { path: '/admin/content', label: 'Контент', icon: FolderKanban },
  { path: '/admin/css-management', label: 'CSS', icon: Palette }, // НОВЫЙ
  { path: '/admin/analytics', label: 'Аналитика и SEO', icon: BarChart3 },
  { path: '/admin/security', label: 'Безопасность', icon: ShieldCheck },
];
```

---

## ✅ Критерии выполнения

### Функциональность:
- [ ] Список блоков отображается
- [ ] Редактор кода работает
- [ ] Сохранение изменений работает
- [ ] Превью отображается
- [ ] История изменений работает
- [ ] Откат изменений работает
- [ ] Поиск и фильтрация работают
- [ ] Создание новых блоков работает
- [ ] Удаление блоков работает

### UI/UX:
- [ ] Интерфейс интуитивно понятен
- [ ] Адаптивный дизайн
- [ ] Быстрая отзывчивость
- [ ] Информативные сообщения об ошибках
- [ ] Подтверждение опасных действий

### Интеграция:
- [ ] Роутинг настроен
- [ ] Навигация обновлена
- [ ] Авторизация работает
- [ ] API интегрирован

---

## 📄 Формат отчета

Создайте файл `stage4-results.md`:

```markdown
# Результаты Этапа 4: Админ-панель для редактирования CSS

## Реализованные компоненты

### Страницы
- ✅ CSSManagement.tsx - Главная страница управления

### Компоненты
- ✅ CSSBlockList.tsx - Список блоков
- ✅ CSSBlockCard.tsx - Карточка блока
- ✅ CSSEditor.tsx - Редактор кода
- ✅ CSSPreview.tsx - Превью изменений
- ✅ CSSHistory.tsx - История изменений
- ✅ CSSBlockForm.tsx - Форма создания

### Хуки
- ✅ useCSSManagement.ts - API интеграция

## Интеграция
- ✅ Роут /admin/css-management добавлен
- ✅ Навигация обновлена
- ✅ Авторизация настроена

## Тестирование
- ✅ Все CRUD операции работают
- ✅ Редактор кода функционирует
- ✅ Превью отображается корректно
- ✅ История и откат работают

## Следующий этап
Переход к Этапу 5: Финальное тестирование и документация
```

---

**Статус:** 🚀 Готов к выполнению  
**Следующий промпт:** `05-stage5-prompt.md`  
**Требуемые файлы:** `stage1-results.md`, `stage2-results.md`, `stage3-results.md`
