import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import ServiceCard from '@/components/services/ServiceCard';
import TechnologySelector from '@/components/services/TechnologySelector';
import HostingSelector from '@/components/services/HostingSelector';
import { usePartner } from '@/contexts/PartnerContext';
import {
  developmentServices,
  promotionServices,
  additionalServices,
  bitrixLicenses,
  hostingOptions,
  begetTariffs,
  vpsTariffs
} from '@/components/services/servicesData';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        MainButton: {
          setText: (text: string) => void;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        close: () => void;
        sendData: (data: string) => void;
      };
    };
  }
}

const TelegramMiniApp = () => {
  const { getDiscountedPrice } = usePartner();
  const [selectedDevelopment, setSelectedDevelopment] = useState<string[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<string[]>([]);
  const [selectedAdditional, setSelectedAdditional] = useState<string[]>([]);
  const [selectedTechnology, setSelectedTechnology] = useState<string>('');
  const [selectedBitrixLicense, setSelectedBitrixLicense] = useState<string>('');
  const [selectedHosting, setSelectedHosting] = useState<string>('');
  const [selectedBegetTariff, setSelectedBegetTariff] = useState<string>('');
  const [selectedVPSTariff, setSelectedVPSTariff] = useState<string>('');
  const [hostingPeriod, setHostingPeriod] = useState<6 | 12>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
    }
  }, []);

  const toggleService = (
    id: string,
    category: 'development' | 'promotion' | 'additional'
  ) => {
    if (category === 'development') {
      setSelectedDevelopment(prev =>
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      );
    } else if (category === 'promotion') {
      setSelectedPromotion(prev =>
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      );
    } else {
      setSelectedAdditional(prev =>
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      );
    }
  };

  const handleTechnologyChange = (tech: string) => {
    setSelectedTechnology(selectedTechnology === tech ? '' : tech);
    setSelectedBitrixLicense('');
  };

  const handleBitrixLicenseChange = (licenseId: string) => {
    setSelectedBitrixLicense(licenseId === selectedBitrixLicense ? '' : licenseId);
  };

  const handleHostingChange = (hostingId: string) => {
    setSelectedHosting(selectedHosting === hostingId ? '' : hostingId);
    setSelectedBegetTariff('');
    setSelectedVPSTariff('');
  };

  const handleBegetTariffChange = (tariffId: string) => {
    setSelectedBegetTariff(tariffId === selectedBegetTariff ? '' : tariffId);
  };

  const handleVPSTariffChange = (tariffId: string) => {
    setSelectedVPSTariff(tariffId === selectedVPSTariff ? '' : tariffId);
  };

  const handlePeriodChange = (period: 6 | 12) => {
    setHostingPeriod(period);
  };

  const calculateTotal = () => {
    let total = 0;
    
    developmentServices.forEach(service => {
      if (selectedDevelopment.includes(service.id)) {
        total += getDiscountedPrice(service.price, false);
      }
    });
    
    promotionServices.forEach(service => {
      if (selectedPromotion.includes(service.id)) {
        total += getDiscountedPrice(service.price, false);
      }
    });
    
    additionalServices.forEach(service => {
      if (selectedAdditional.includes(service.id)) {
        total += getDiscountedPrice(service.price, false);
      }
    });

    if (selectedTechnology === 'bitrix' && selectedBitrixLicense) {
      const license = bitrixLicenses.find(l => l.id === selectedBitrixLicense);
      if (license) {
        total += getDiscountedPrice(license.price, false);
      }
    }

    if (selectedHosting) {
      const hosting = hostingOptions.find(h => h.id === selectedHosting);
      if (hosting) {
        total += getDiscountedPrice(hosting.price, true);
      }
    }

    if (selectedHosting === 'vps' && selectedVPSTariff) {
      const tariff = vpsTariffs.find(t => t.id === selectedVPSTariff);
      if (tariff) {
        const hostingPrice = hostingPeriod === 6 ? tariff.priceMonthly * 6 : tariff.priceYearly;
        total += getDiscountedPrice(hostingPrice, true);
      }
    }

    if (selectedHosting === 'beget' && selectedBegetTariff) {
      const tariff = begetTariffs.find(t => t.id === selectedBegetTariff);
      if (tariff) {
        const hostingPrice = hostingPeriod === 6 ? tariff.price * 6 : tariff.price * 12;
        total += getDiscountedPrice(hostingPrice, true);
      }
    }
    
    return total;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const getSelectedServices = (): string[] => {
    const services: string[] = [];
    
    developmentServices.forEach(service => {
      if (selectedDevelopment.includes(service.id)) {
        services.push(service.title);
      }
    });
    
    promotionServices.forEach(service => {
      if (selectedPromotion.includes(service.id)) {
        services.push(service.title);
      }
    });
    
    additionalServices.forEach(service => {
      if (selectedAdditional.includes(service.id)) {
        services.push(service.title);
      }
    });

    if (selectedTechnology === 'bitrix' && selectedBitrixLicense) {
      const license = bitrixLicenses.find(l => l.id === selectedBitrixLicense);
      if (license) {
        services.push(`Битрикс: ${license.name}`);
      }
    }

    if (selectedHosting) {
      const hosting = hostingOptions.find(h => h.id === selectedHosting);
      if (hosting) {
        services.push(`Хостинг: ${hosting.name}`);
      }
    }

    if (selectedHosting === 'vps' && selectedVPSTariff) {
      const tariff = vpsTariffs.find(t => t.id === selectedVPSTariff);
      if (tariff) {
        services.push(`VPS: ${tariff.name} (${hostingPeriod} мес.)`);
      }
    }

    if (selectedHosting === 'beget' && selectedBegetTariff) {
      const tariff = begetTariffs.find(t => t.id === selectedBegetTariff);
      if (tariff) {
        services.push(`Beget: ${tariff.name} (${hostingPeriod} мес.)`);
      }
    }
    
    return services;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    
    const services = getSelectedServices();
    const total = calculateTotal();

    try {
      const response = await fetch('/pyapi/4dbcd084-f89e-4737-be41-9371059c6e4d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total,
          services,
          isPartner: false,
          discount: 0,
          name: user?.first_name || 'Telegram User',
          phone: `@${user?.username || user?.id || 'unknown'}`,
          email: `telegram_${user?.id || 'unknown'}@temp.mail`,
        }),
      });

      if (response.ok) {
        if (tg) {
          tg.sendData(JSON.stringify({ success: true, total, services }));
          tg.close();
        }
      } else {
        alert('Ошибка при отправке заявки');
      }
    } catch (error) {
      alert('Ошибка соединения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = calculateTotal();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && totalPrice > 0) {
      tg.MainButton.setText(`Отправить заявку (${formatPrice(totalPrice)} ₽)`);
      tg.MainButton.show();
      tg.MainButton.onClick(handleSubmit);
      
      return () => {
        tg.MainButton.offClick(handleSubmit);
        tg.MainButton.hide();
      };
    }
  }, [totalPrice]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Калькулятор услуг</h1>
          <p className="text-sm text-muted-foreground">
            Выберите услуги для расчёта стоимости
          </p>
        </div>

        <Accordion type="multiple" className="space-y-4" defaultValue={['development']}>
          <AccordionItem value="development" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Code" className="text-primary" size={20} />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold">Разработка</h2>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {developmentServices.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedDevelopment.includes(service.id)}
                    onToggle={() => toggleService(service.id, 'development')}
                  />
                ))}
              </div>

              <TechnologySelector
                selectedTechnology={selectedTechnology}
                selectedBitrixLicense={selectedBitrixLicense}
                bitrixLicenses={bitrixLicenses}
                onTechnologyChange={handleTechnologyChange}
                onBitrixLicenseChange={handleBitrixLicenseChange}
              />

              <HostingSelector
                selectedHosting={selectedHosting}
                selectedBegetTariff={selectedBegetTariff}
                selectedVPSTariff={selectedVPSTariff}
                hostingOptions={hostingOptions}
                begetTariffs={begetTariffs}
                vpsTariffs={vpsTariffs}
                hostingPeriod={hostingPeriod}
                onHostingChange={handleHostingChange}
                onBegetTariffChange={handleBegetTariffChange}
                onVPSTariffChange={handleVPSTariffChange}
                onPeriodChange={handlePeriodChange}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="promotion" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="TrendingUp" className="text-primary" size={20} />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold">Продвижение</h2>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {promotionServices.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedPromotion.includes(service.id)}
                    onToggle={() => toggleService(service.id, 'promotion')}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional" className="border rounded-lg bg-white">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Plus" className="text-primary" size={20} />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold">Дополнительно</h2>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {additionalServices.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedAdditional.includes(service.id)}
                    onToggle={() => toggleService(service.id, 'additional')}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {totalPrice > 0 && (
          <Card className="mt-6 p-4 bg-white border-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Итоговая стоимость:</p>
              <p className="text-3xl font-bold text-primary">{formatPrice(totalPrice)} ₽</p>
            </div>
          </Card>
        )}

        {!window.Telegram?.WebApp && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-sm text-yellow-800">
              Эта страница предназначена для работы внутри Telegram Mini App
            </p>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || totalPrice === 0}
              className="mt-4"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramMiniApp;