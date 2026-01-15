import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { categories } from './types';

interface SecretsVaultToolbarProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  settingsCount: number;
  clearingCache: boolean;
  copyingSecrets: boolean;
  onClearCache: () => void;
  onCopyProjectSecrets: () => void;
  onAddNew: () => void;
}

export default function SecretsVaultToolbar({
  selectedCategory,
  setSelectedCategory,
  settingsCount,
  clearingCache,
  copyingSecrets,
  onClearCache,
  onCopyProjectSecrets,
  onAddNew
}: SecretsVaultToolbarProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-4 items-center">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px] bg-gray-800/50 border-gray-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400">
          Найдено: <span className="font-semibold text-white">{settingsCount}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onClearCache}
          disabled={clearingCache}
          variant="outline"
          className="border-green-600 text-green-400 hover:bg-green-950/30"
        >
          <Icon name="RefreshCw" className="h-4 w-4 mr-2" />
          {clearingCache ? 'Очищаю...' : 'Очистить кеш'}
        </Button>
        <Button
          onClick={onCopyProjectSecrets}
          disabled={copyingSecrets}
          variant="outline"
          className="border-purple-600 text-purple-400 hover:bg-purple-950/30"
        >
          <Icon name="Download" className="h-4 w-4 mr-2" />
          {copyingSecrets ? 'Копирую...' : 'Импорт из секретов'}
        </Button>
        <Button
          onClick={onAddNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Icon name="Plus" className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>
    </div>
  );
}
