import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

interface PartnerFormData {
  name: string;
  logo_url: string;
  website_url: string;
  display_order: number;
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
            placeholder="https://example.com"
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUri = event.target?.result as string;
                  onFormDataChange({ ...formData, logo_url: dataUri });
                };
                reader.readAsDataURL(file);
              }
            }}
            className="text-black"
          />

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

        <div>
          <Label htmlFor="order" className="text-black">Порядок отображения</Label>
          <Input
            id="order"
            type="number"
            value={formData.display_order}
            onChange={(e) => onFormDataChange({ ...formData, display_order: parseInt(e.target.value) })}
            className="text-black"
          />
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