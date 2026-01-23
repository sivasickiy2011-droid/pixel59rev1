import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { NewsItem } from './types';

interface NewsModalProps {
  newsItem: NewsItem;
  onChange: (updated: NewsItem) => void;
  onClose: () => void;
  onSave: () => void;
}

const NewsModal = ({ newsItem, onChange, onClose, onSave }: NewsModalProps) => {
  const handleFieldChange = (field: keyof NewsItem, value: string | boolean) => {
    onChange({
      ...newsItem,
      [field]: value,
    });
  };

  const publishedDateValue = newsItem.published_date.split('T')[0] || '';

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {newsItem.id ? 'Редактирование новости' : 'Добавление новости'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Оригинальный заголовок</label>
              <Input
                value={newsItem.original_title}
                onChange={(e) => handleFieldChange('original_title', e.target.value)}
                placeholder="Заголовок на английском"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Переведенный заголовок</label>
              <Input
                value={newsItem.translated_title}
                onChange={(e) => handleFieldChange('translated_title', e.target.value)}
                placeholder="Заголовок на русском"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Оригинальный отрывок</label>
              <Textarea
                value={newsItem.original_excerpt}
                onChange={(e) => handleFieldChange('original_excerpt', e.target.value)}
                placeholder="Отрывок на английском"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Переведенный отрывок</label>
              <Textarea
                value={newsItem.translated_excerpt}
                onChange={(e) => handleFieldChange('translated_excerpt', e.target.value)}
                placeholder="Отрывок на русском"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Полный контент (переведенный)</label>
            <Textarea
              value={newsItem.translated_content}
              onChange={(e) => handleFieldChange('translated_content', e.target.value)}
              placeholder="Полный текст новости на русском"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Источник</label>
              <Input
                value={newsItem.source}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                placeholder="Например, Hacker News"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL источника</label>
              <Input
                value={newsItem.source_url}
                onChange={(e) => handleFieldChange('source_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ссылка на новость</label>
              <Input
                value={newsItem.link}
                onChange={(e) => handleFieldChange('link', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL изображения</label>
              <Input
                value={newsItem.image_url}
                onChange={(e) => handleFieldChange('image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Категория</label>
              <Input
                value={newsItem.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                placeholder="Технологии"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Дата публикации</label>
              <Input
                type="date"
                value={publishedDateValue}
                onChange={(e) => handleFieldChange('published_date', `${e.target.value}T00:00:00Z`)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={newsItem.is_active}
              onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
            />
            <span className="text-sm font-medium">Активна</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave}>
            {newsItem.id ? 'Сохранить изменения' : 'Добавить новость'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;

