import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';

interface PartnerFormData {
  name: string;
  logo_url: string;
  website_url: string;
  is_active: boolean;
}

interface PartnerFormProps {
  formData: PartnerFormData;
  onFormDataChange: (data: PartnerFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
}

const PartnerForm = ({
  formData,
  onFormDataChange,
  onSubmit,
  submitLabel
}: PartnerFormProps) => {
  const { uploadImage, isUploading, error: uploadError } = useImageUpload({ folder: 'logos' });
  const { toast } = useToast();

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-base font-semibold text-black">Название бренда</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            placeholder="1С-Битрикс"
            className="text-black"
          />
        </div>

        <div>
          <Label htmlFor="website" className="text-base font-semibold text-black">Сайт партнёра</Label>
          <Input
            id="website"
            value={formData.website_url}
            onChange={(e) => onFormDataChange({ ...formData, website_url: e.target.value })}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !validateUrl(value)) {
                toast({
                  title: 'Внимание',
                  description: 'URL должен начинаться с http:// или https://',
                  variant: 'destructive'
                });
              }
            }}
            placeholder="https://example.com"
            className="text-black"
          />
          <p className="text-xs text-gray-500 mt-1">
            Укажите полный URL с протоколом (http:// или https://)
          </p>
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
                  onFormDataChange({ ...formData, logo_url: url });
                } catch (error) {
                  console.error('Upload failed:', error);
                }
              }
            }}
            className="text-black"
          />

          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gradient-start" />
              <span>Загрузка изображения...</span>
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}

          {formData.logo_url && (
            <div className="mt-2 p-4 border-2 border-gradient-start/20 rounded-lg bg-gradient-to-br from-gray-50 to-white">
              <p className="text-xs text-gray-500 mb-2">Предпросмотр:</p>
              <img 
                src={formData.logo_url} 
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

        <div className="col-span-2">
          <p className="text-sm text-gray-500 italic">
            Порядок отображения будет назначен автоматически.
            Вы сможете изменить его при редактировании.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.is_active}
            onCheckedChange={(checked) => onFormDataChange({ ...formData, is_active: checked })}
          />
          <Label htmlFor="active" className="text-black">Активен</Label>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        className="bg-gradient-to-r from-gradient-start to-gradient-mid text-white"
      >
        <Icon name="Check" size={20} className="mr-2" />
        {submitLabel}
      </Button>
    </div>
  );
};

export default PartnerForm;