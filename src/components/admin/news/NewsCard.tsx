import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { NewsItem } from './types';

interface NewsCardProps {
  item: NewsItem;
  isSelected: boolean;
  onSelect: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const NewsCard = ({
  item,
  isSelected,
  onSelect,
  onToggleActive,
  onEdit,
  onDelete,
}: NewsCardProps) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border ${
      item.is_active ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'
    } p-4 space-y-3 transition-all duration-300 hover:shadow-lg`}
  >
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4"
        />
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          {item.category}
        </span>
      </div>
      <Switch checked={item.is_active} onCheckedChange={onToggleActive} />
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
      <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
        <Icon name="Edit" size={14} className="mr-1" />
        Редактировать
      </Button>
      <Button size="sm" variant="destructive" onClick={onDelete}>
        <Icon name="Trash2" size={14} />
      </Button>
    </div>
  </div>
);

export default NewsCard;

