import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface NewsItem {
  id?: number;
  original_title: string;
  translated_title: string;
  original_excerpt: string;
  translated_excerpt: string;
  original_content: string;
  translated_content: string;
  source: string;
  source_url: string;
  link: string;
  image_url: string;
  category: string;
  published_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const NewsAdmin = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<Set<number>>(new Set());
  const [refreshLoading, setRefreshLoading] = useState(false);
  const { toast } = useToast();

  const emptyNews: NewsItem = {
    original_title: '',
    translated_title: '',
    original_excerpt: '',
    translated_excerpt: '',
    original_content: '',
    translated_content: '',
    source: '',
    source_url: '',
    link: '',
    image_url: '',
    category: 'Технологии',
    published_date: new Date().toISOString().split('T')[0],
    is_active: true,
  };

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/c5a1b2d3-e4f5-6789-abcd-ef0123456789');
      if (response.ok) {
        const data = await response.json();
        setNews(data || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить новости',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleRefreshFeed = async () => {
    setRefreshLoading(true);
    try {
      const response = await fetch('/api/7aa533b8-b464-4b36-bd36-9c34cb6d0b8e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Успешно',
          description: `Обновлено новостей: ${result.result.inserted} добавлено, ${result.result.updated} обновлено`,
        });
        await fetchNews();
      } else {
        toast({
          title: 'Ошибка',
          description: result.error || 'Не удалось обновить ленту',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to refresh news feed:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить ленту новостей',
        variant: 'destructive',
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingNews) return;

    const method = editingNews.id ? 'PUT' : 'POST';
    const endpoint = '/api/c5a1b2d3-e4f5-6789-abcd-ef0123456789';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNews),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: editingNews.id ? 'Новость обновлена' : 'Новость добавлена',
        });
        setIsModalOpen(false);
        setEditingNews(null);
        fetchNews();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Failed to save news:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить новость',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить новость?')) return;

    try {
      const response = await fetch('/api/c5a1b2d3-e4f5-6789-abcd-ef0123456789', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Новость удалена',
        });
        fetchNews();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Failed to delete news:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить новость',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (id: number, currentActive: boolean) => {
    try {
      const response = await fetch('/api/c5a1b2d3-e4f5-6789-abcd-ef0123456789', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });

      if (response.ok) {
        setNews(news.map(item =>
          item.id === id ? { ...item, is_active: !currentActive } : item
        ));
        toast({
          title: 'Успешно',
          description: `Новость ${!currentActive ? 'активирована' : 'деактивирована'}`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось изменить статус новости',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to toggle news active:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус новости',
        variant: 'destructive',
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedNews.size === news.length) {
      setSelectedNews(new Set());
    } else {
      setSelectedNews(new Set(news.map(n => n.id!).filter(Boolean)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNews.size === 0) return;
    if (!confirm(`Удалить выбранные новости (${selectedNews.size} шт.)?`)) return;

    try {
      const deletePromises = Array.from(selectedNews).map(id =>
        fetch('/api/c5a1b2d3-e4f5-6789-abcd-ef0123456789', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      );
      await Promise.all(deletePromises);
      setSelectedNews(new Set());
      toast({
        title: 'Успешно',
        description: `Удалено ${selectedNews.size} новостей`,
      });
      fetchNews();
    } catch (error) {
      console.error('Failed to delete news:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить новости',
        variant: 'destructive',
      });
    }
  };

  const openModal = (item?: NewsItem) => {
    setEditingNews(item ? { ...item } : { ...emptyNews });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Управление новостями</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Редактирование, активация и обновление ленты новостей
          </p>
        </div>
        <div className="flex gap-3">
          {selectedNews.size > 0 && (
            <Button 
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Icon name="Trash2" size={20} className="mr-2" />
              Удалить ({selectedNews.size})
            </Button>
          )}
          <Button 
            onClick={handleRefreshFeed}
            disabled={refreshLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Icon name="RefreshCw" size={20} className={`mr-2 ${refreshLoading ? 'animate-spin' : ''}`} />
            {refreshLoading ? 'Обновление...' : 'Обновить ленту'}
          </Button>
          <Button onClick={() => openModal()}>
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить новость
          </Button>
        </div>
      </div>

      {news.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedNews.size === news.length}
              onChange={toggleSelectAll}
              className="w-4 h-4"
            />
            <span>Выбрать все</span>
          </label>
          {selectedNews.size > 0 && (
            <span>Выбрано: {selectedNews.size} из {news.length}</span>
          )}
        </div>
      )}

      {news.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Icon name="Newspaper" size={48} className="mx-auto mb-4 opacity-50" />
          <p className="mb-4">Новостей пока нет</p>
          <Button onClick={() => openModal()}>Добавить первую новость</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border ${
                item.is_active ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'
              } p-4 space-y-3`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedNews.has(item.id!)}
                    onChange={() => item.id && setSelectedNews(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(item.id!)) {
                        newSet.delete(item.id!);
                      } else {
                        newSet.add(item.id!);
                      }
                      return newSet;
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {item.category}
                  </span>
                </div>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={() => item.id && toggleActive(item.id, item.is_active)}
                />
              </div>

              <div className="h-32 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'}
                  alt={item.translated_title || item.original_title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
                {item.translated_title || item.original_title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {item.translated_excerpt || item.original_excerpt}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{item.source}</span>
                <span>{new Date(item.published_date).toLocaleDateString('ru-RU')}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openModal(item)}
                >
                  <Icon name="Edit" size={14} className="mr-1" />
                  Редактировать
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => item.id && handleDelete(item.id)}
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && editingNews && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingNews.id ? 'Редактирование новости' : 'Добавление новости'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                <Icon name="X" size={20} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Оригинальный заголовок</label>
                  <Input
                    value={editingNews.original_title}
                    onChange={(e) => setEditingNews({ ...editingNews, original_title: e.target.value })}
                    placeholder="Заголовок на английском"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Переведенный заголовок</label>
                  <Input
                    value={editingNews.translated_title}
                    onChange={(e) => setEditingNews({ ...editingNews, translated_title: e.target.value })}
                    placeholder="Заголовок на русском"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Оригинальный отрывок</label>
                  <Textarea
                    value={editingNews.original_excerpt}
                    onChange={(e) => setEditingNews({ ...editingNews, original_excerpt: e.target.value })}
                    placeholder="Отрывок на английском"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Переведенный отрывок</label>
                  <Textarea
                    value={editingNews.translated_excerpt}
                    onChange={(e) => setEditingNews({ ...editingNews, translated_excerpt: e.target.value })}
                    placeholder="Отрывок на русском"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Полный контент (переведенный)</label>
                <Textarea
                  value={editingNews.translated_content}
                  onChange={(e) => setEditingNews({ ...editingNews, translated_content: e.target.value })}
                  placeholder="Полный текст новости на русском"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Источник</label>
                  <Input
                    value={editingNews.source}
                    onChange={(e) => setEditingNews({ ...editingNews, source: e.target.value })}
                    placeholder="Например, Hacker News"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL источника</label>
                  <Input
                    value={editingNews.source_url}
                    onChange={(e) => setEditingNews({ ...editingNews, source_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ссылка на новость</label>
                  <Input
                    value={editingNews.link}
                    onChange={(e) => setEditingNews({ ...editingNews, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL изображения</label>
                  <Input
                    value={editingNews.image_url}
                    onChange={(e) => setEditingNews({ ...editingNews, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Категория</label>
                  <Input
                    value={editingNews.category}
                    onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value })}
                    placeholder="Технологии"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Дата публикации</label>
                  <Input
                    type="date"
                    value={editingNews.published_date.split('T')[0]}
                    onChange={(e) => setEditingNews({ ...editingNews, published_date: e.target.value + 'T00:00:00Z' })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingNews.is_active}
                  onCheckedChange={(checked) => setEditingNews({ ...editingNews, is_active: checked })}
                />
                <span className="text-sm font-medium">Активна</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave}>
                {editingNews.id ? 'Сохранить изменения' : 'Добавить новость'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsAdmin;
