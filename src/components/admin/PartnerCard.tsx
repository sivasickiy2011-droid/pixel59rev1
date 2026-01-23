import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useImageUpload } from '@/hooks/useImageUpload';

interface PartnerLogo {
  id: number;
  name: string;
  logo_url: string;
  website_url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PartnerCardProps {
  partner: PartnerLogo;
  isEditing: boolean;
  isSaving?: boolean;
  onEdit: () => void;
  onUpdate: (id: number, field: keyof PartnerLogo, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

const PartnerCard = ({
  partner,
  isEditing,
  isSaving,
  onEdit,
  onUpdate,
  onSave,
  onCancel,
  onDelete
}: PartnerCardProps) => {
  const { uploadImage, isUploading, error: uploadError } = useImageUpload({ folder: 'logos' });

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-100 hover:border-gradient-start/30 transition-all">
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-black">Название</Label>
              <Input
                value={partner.name}
                onChange={(e) => onUpdate(partner.id, 'name', e.target.value)}
                className="text-black"
              />
            </div>

            <div>
              <Label className="text-black">Сайт</Label>
              <Input
                value={partner.website_url}
                onChange={(e) => onUpdate(partner.id, 'website_url', e.target.value)}
                className="text-black"
              />
            </div>

            <div className="col-span-2 space-y-3">
              <Label className="text-base font-semibold text-black">Логотип партнёра</Label>
              <p className="text-sm text-gray-500">
                Выберите файл логотипа с компьютера (PNG, SVG, JPG)
              </p>
              
              <Input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const url = await uploadImage(file);
                      onUpdate(partner.id, 'logo_url', url);
                    } catch (error) {
                      console.error('Upload failed:', error);
                    }
                  }
                }}
                className="text-black"
              />

              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gradient-start" />
                  <span>Загрузка изображения...</span>
                </div>
              )}

              {uploadError && (
                <p className="text-sm text-red-600 mt-2">{uploadError}</p>
              )}

              {partner.logo_url && (
                <div className="mt-2 p-4 border-2 border-gradient-start/20 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                  <p className="text-xs text-gray-500 mb-2">Предпросмотр:</p>
                  <img 
                    src={partner.logo_url} 
                    alt="Preview" 
                    className="h-20 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-black">Порядок</Label>
              <Input
                type="number"
                value={partner.display_order}
                onChange={(e) => onUpdate(partner.id, 'display_order', parseInt(e.target.value))}
                className="text-black"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={partner.is_active}
                onCheckedChange={(checked) => onUpdate(partner.id, 'is_active', checked)}
              />
              <Label className="text-black">Активен</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-gradient-start to-gradient-mid text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  Сохранить
                </>
              )}
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            {partner.logo_url && (
              <div className="relative group">
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="h-16 w-32 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                  <Button
                    onClick={() => {
                      const fileInput = document.getElementById(`logo-replace-${partner.id}`) as HTMLInputElement;
                      fileInput?.click();
                    }}
                    variant="outline"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="Upload" size={16} className="mr-2" />
                    Заменить
                  </Button>
                </div>
                <input
                  id={`logo-replace-${partner.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const url = await uploadImage(file);
                        onUpdate(partner.id, 'logo_url', url);
                        onSave();
                      } catch (error) {
                        console.error('Upload failed:', error);
                      }
                    }
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-black">{partner.name}</h3>
              <a
                href={partner.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gradient-start hover:underline"
              >
                {partner.website_url}
              </a>
              <p className="text-sm text-gray-500 mt-1">
                Порядок: {partner.display_order} • {partner.is_active ? 'Активен' : 'Неактивен'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <Icon name="Pencil" size={16} />
            </Button>
            <Button
              onClick={onDelete}
              variant="destructive"
              size="sm"
            >
              <Icon name="Trash2" size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerCard;