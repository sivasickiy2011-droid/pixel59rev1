import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { requireAdminAuthHeaders } from '@/utils/adminAuth';
import NewsAdminHeader from '@/components/admin/news/NewsAdminHeader';
import NewsAdminActions from '@/components/admin/news/NewsAdminActions';
import NewsSelectionBar from '@/components/admin/news/NewsSelectionBar';
import NewsCard from '@/components/admin/news/NewsCard';
import NewsModal from '@/components/admin/news/NewsModal';
import NewsEmptyState from '@/components/admin/news/NewsEmptyState';
import { NewsItem } from '@/components/admin/news/types';
import API_ENDPOINTS from '@/config/api';

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
      const response = await fetch(API_ENDPOINTS.news.adminCrud, {
        headers: requireAdminAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const normalizedNews = Array.isArray(data)
          ? data
          : Array.isArray(data?.news)
            ? data.news
            : [];
        if (!Array.isArray(data) && !Array.isArray(data?.news)) {
          console.error('Unexpected news payload', data);
          toast({
            title: 'Ошибка',
            description: 'Сервер вернул некорректные данные для новостей',
            variant: 'destructive',
          });
        }
        setNews(normalizedNews);
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
      const response = await fetch(API_ENDPOINTS.news.adminRefresh, {
        method: 'POST',
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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
    const endpoint = API_ENDPOINTS.news.adminCrud;

    try {
    const response = await fetch(endpoint, {
      method,
      headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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
      const response = await fetch(API_ENDPOINTS.news.adminCrud, {
        method: 'DELETE',
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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
      const response = await fetch(API_ENDPOINTS.news.adminCrud, {
        method: 'PATCH',
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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
      return;
    }
    setSelectedNews(new Set(news.map(n => n.id!).filter(Boolean)));
  };

  const handleBulkDelete = async () => {
    if (selectedNews.size === 0) return;
    if (!confirm(`Удалить выбранные новости (${selectedNews.size} шт.)?`)) return;

    try {
      const deletePromises = Array.from(selectedNews).map(id =>
        fetch(API_ENDPOINTS.news.adminCrud, {
          method: 'DELETE',
          headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
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

  const handleSelectToggle = (id: number) => {
    setSelectedNews(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedCount = selectedNews.size;
  const allSelected = news.length > 0 && selectedCount === news.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <NewsAdminHeader />
        <NewsAdminActions
          selectedCount={selectedCount}
          refreshLoading={refreshLoading}
          onRefresh={handleRefreshFeed}
          onAdd={() => openModal()}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      <NewsSelectionBar
        totalCount={news.length}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
      />

      {news.length === 0 ? (
        <NewsEmptyState onAdd={() => openModal()} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, index) => {
            const itemId = item.id ?? index;
            return (
              <NewsCard
                key={`news-${itemId}`}
                item={item}
                isSelected={selectedNews.has(item.id!)}
                onSelect={() => item.id && handleSelectToggle(item.id)}
                onToggleActive={() => item.id && toggleActive(item.id, item.is_active)}
                onEdit={() => openModal(item)}
                onDelete={() => item.id && handleDelete(item.id)}
              />
            );
          })}
        </div>
      )}

      {isModalOpen && editingNews && (
        <NewsModal
          newsItem={editingNews}
          onChange={setEditingNews!}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default NewsAdmin;
