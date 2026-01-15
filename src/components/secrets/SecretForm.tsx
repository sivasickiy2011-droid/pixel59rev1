import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { SecretFormData, categories } from './types';

interface SecretFormProps {
  formData: SecretFormData;
  setFormData: (data: SecretFormData) => void;
  editingId: number | null;
  saving: boolean;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function SecretForm({
  formData,
  setFormData,
  editingId,
  saving,
  showPassword,
  setShowPassword,
  onSave,
  onCancel
}: SecretFormProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">
          {editingId ? 'Редактировать настройку' : 'Новая настройка'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Ключ</Label>
            <Input
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="telegram_bot_token"
              className="bg-gray-900/50 border-gray-600 text-white"
              disabled={!!editingId}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Категория</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.value !== 'all').map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Значение</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Введите значение"
              className="bg-gray-900/50 border-gray-600 text-white pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <Icon name={showPassword ? "EyeOff" : "Eye"} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Описание (опционально)</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Для чего используется эта настройка"
            className="bg-gray-900/50 border-gray-600 text-white"
            rows={2}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onSave}
            disabled={saving || !formData.key || !formData.value}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Icon name="Save" className="h-4 w-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
