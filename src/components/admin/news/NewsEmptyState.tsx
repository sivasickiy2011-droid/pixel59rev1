import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface NewsEmptyStateProps {
  onAdd: () => void;
}

const NewsEmptyState = ({ onAdd }: NewsEmptyStateProps) => (
  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
    <Icon name="Newspaper" size={48} className="mx-auto mb-4 opacity-50" />
    <p className="mb-4">Новостей пока нет</p>
    <Button onClick={onAdd}>Добавить первую новость</Button>
  </div>
);

export default NewsEmptyState;

