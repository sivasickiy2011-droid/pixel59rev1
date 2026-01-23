import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface NewsAdminActionsProps {
  selectedCount: number;
  refreshLoading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  onBulkDelete: () => void;
}

const NewsAdminActions = ({
  selectedCount,
  refreshLoading,
  onRefresh,
  onAdd,
  onBulkDelete,
}: NewsAdminActionsProps) => (
  <div className="flex gap-3">
    {selectedCount > 0 && (
      <Button onClick={onBulkDelete} className="bg-red-500 hover:bg-red-600 text-white">
        <Icon name="Trash2" size={20} className="mr-2" />
        Удалить ({selectedCount})
      </Button>
    )}
    <Button
      onClick={onRefresh}
      disabled={refreshLoading}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Icon name="RefreshCw" size={20} className={`mr-2 ${refreshLoading ? 'animate-spin' : ''}`} />
      {refreshLoading ? 'Обновление...' : 'Обновить ленту'}
    </Button>
    <Button onClick={onAdd}>
      <Icon name="Plus" size={20} className="mr-2" />
      Добавить новость
    </Button>
  </div>
);

export default NewsAdminActions;

