import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { SecureSetting, categories, getCategoryColor } from './types';

interface SecretsListProps {
  settings: SecureSetting[];
  loading: boolean;
  onEdit: (setting: SecureSetting) => void;
  onDelete: (key: string) => void;
}

export default function SecretsList({
  settings,
  loading,
  onEdit,
  onDelete
}: SecretsListProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Icon name="Loader2" className="h-8 w-8 animate-spin mx-auto mb-4" />
        Загрузка настроек...
      </div>
    );
  }

  if (settings.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="py-12 text-center">
          <Icon name="Lock" className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Нет сохранённых настроек</p>
          <p className="text-sm text-gray-500 mt-2">
            Добавьте первую настройку для безопасного хранения
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {settings.map((setting) => (
        <Card key={setting.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <code className="text-lg font-mono text-blue-400 bg-gray-900/50 px-3 py-1 rounded">
                    {setting.key}
                  </code>
                  <Badge className={getCategoryColor(setting.category)}>
                    {categories.find(c => c.value === setting.category)?.label || setting.category}
                  </Badge>
                </div>
                
                {setting.description && (
                  <p className="text-sm text-gray-400">{setting.description}</p>
                )}
                
                <div className="flex gap-6 text-xs text-gray-500">
                  <span>Создано: {new Date(setting.created_at).toLocaleString('ru-RU')}</span>
                  <span>Обновлено: {new Date(setting.updated_at).toLocaleString('ru-RU')}</span>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  onClick={() => onEdit(setting)}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <Icon name="Pencil" className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onDelete(setting.key)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                >
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
