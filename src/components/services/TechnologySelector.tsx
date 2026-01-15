import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { BitrixLicense } from './types';

interface TechnologySelectorProps {
  selectedTechnology: string;
  selectedBitrixLicense: string;
  bitrixLicenses: BitrixLicense[];
  onTechnologyChange: (tech: string) => void;
  onBitrixLicenseChange: (licenseId: string) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(price);
};

const TechnologySelector = ({
  selectedTechnology,
  selectedBitrixLicense,
  bitrixLicenses,
  onTechnologyChange,
  onBitrixLicenseChange
}: TechnologySelectorProps) => {
  return (
    <div className="mt-6 sm:mt-8">
      <h3 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">На чем собираем сайт</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card
          className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg ${
            selectedTechnology === 'bitrix' ? 'border-primary border-2 bg-primary/5' : ''
          }`}
          onClick={() => onTechnologyChange('bitrix')}
        >
          <div className="flex items-center gap-3">
            <Checkbox checked={selectedTechnology === 'bitrix'} className="shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-sm sm:text-lg">CMS 1С-Битрикс</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">Управление Сайтом</p>
            </div>
          </div>
        </Card>

        <Card
          className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg ${
            selectedTechnology === 'react' ? 'border-primary border-2 bg-primary/5' : ''
          }`}
          onClick={() => onTechnologyChange('react')}
        >
          <div className="flex items-center gap-3">
            <Checkbox checked={selectedTechnology === 'react'} className="shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-sm sm:text-lg">React</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">Современный фреймворк</p>
            </div>
          </div>
        </Card>

        <Card
          className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg ${
            selectedTechnology === 'html' ? 'border-primary border-2 bg-primary/5' : ''
          }`}
          onClick={() => onTechnologyChange('html')}
        >
          <div className="flex items-center gap-3">
            <Checkbox checked={selectedTechnology === 'html'} className="shrink-0" />
            <div className="min-w-0">
              <h4 className="font-semibold text-sm sm:text-lg">HTML-статика</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">Простое решение</p>
            </div>
          </div>
        </Card>
      </div>

      {selectedTechnology === 'bitrix' && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <h4 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">Выберите лицензию 1С-Битрикс</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {bitrixLicenses.map(license => (
              <Card
                key={license.id}
                className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedBitrixLicense === license.id ? 'border-primary border-2 bg-primary/5' : ''
                }`}
                onClick={() => onBitrixLicenseChange(license.id)}
              >
                <div className="mb-3 sm:mb-4">
                  <Checkbox checked={selectedBitrixLicense === license.id} className="mb-2 sm:mb-3" />
                  <h5 className="font-bold text-base sm:text-lg mb-1">{license.title}</h5>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{license.description}</p>
                  <p className="text-primary font-bold text-lg sm:text-xl">{formatPrice(license.price)} ₽</p>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {license.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                      <Icon name="Check" size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnologySelector;