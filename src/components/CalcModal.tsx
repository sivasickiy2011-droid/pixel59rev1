import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import OrderModal from '@/components/services/OrderModal';
import { usePartner } from '@/contexts/PartnerContext';
import { Service } from '@/components/services/types';
import {
  bitrixLicenses,
  hostingOptions,
  begetTariffs,
  vpsTariffs
} from '@/components/services/servicesData';
import { Button } from '@/components/ui/button';

interface CalcModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CalcModal = ({ open, onOpenChange }: CalcModalProps) => {
  const { getDiscountedPrice } = usePartner();
  const [selectedDevelopment, setSelectedDevelopment] = useState<string[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<string[]>([]);
  const [selectedAdditional, setSelectedAdditional] = useState<string[]>([]);
  const [selectedTechnology, setSelectedTechnology] = useState<string>('');
  const [selectedBitrixLicense, setSelectedBitrixLicense] = useState<string>('');
  const [selectedHosting, setSelectedHosting] = useState<string>('');
  const [selectedBegetTariff, setSelectedBegetTariff] = useState<string>('');
  const [selectedVPSTariff, setSelectedVPSTariff] = useState<string>('');
  const [hostingPeriod, setHostingPeriod] = useState<6 | 12>(12);
  const [developmentServices, setDevelopmentServices] = useState<Service[]>([]);
  const [promotionServices, setPromotionServices] = useState<Service[]>([]);
  const [additionalServices, setAdditionalServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openSections, setOpenSections] = useState<string[]>(['development']);

  useEffect(() => {
    if (open) {
      const loadServices = async () => {
        try {
          const response = await fetch('/api/91a16400-6baa-4748-9387-c7cdad64ce9c');
          const data = await response.json();
          
          if (data.services) {
            const development = data.services
              .filter((s: any) => s.category === 'development' && s.is_active)
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((s: any) => ({
                id: s.service_id,
                title: s.title,
                description: s.description,
                price: s.price
              }));
            
            const promotion = data.services
              .filter((s: any) => s.category === 'promotion' && s.is_active)
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((s: any) => ({
                id: s.service_id,
                title: s.title,
                description: s.description,
                price: s.price
              }));
            
            const additional = data.services
              .filter((s: any) => s.category === 'additional' && s.is_active)
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((s: any) => ({
                id: s.service_id,
                title: s.title,
                description: s.description,
                price: s.price
              }));
            
            setDevelopmentServices(development);
            setPromotionServices(promotion);
            setAdditionalServices(additional);
          }
        } catch (error) {
          console.error('Ошибка загрузки услуг:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadServices();
    }
  }, [open]);

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
        services.push(`Битрикс: ${license.title}`);
      }
    }

    if (selectedHosting) {
      const hosting = hostingOptions.find(h => h.id === selectedHosting);
      if (hosting) {
        services.push(`Хостинг: ${hosting.title}`);
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

  const totalPrice = calculateTotal();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-bold">Калькулятор проектов</DialogTitle>
            <p className="text-sm sm:text-base text-muted-foreground">
              Выберите нужные услуги и рассчитайте стоимость проекта
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" className="animate-spin text-primary" size={48} />
            </div>
          ) : (
            <>
              <Accordion type="multiple" className="space-y-4" value={openSections} onValueChange={setOpenSections}>
                <AccordionItem value="development" className="border rounded-lg bg-white dark:bg-gray-900">
                  <AccordionTrigger className="px-3 sm:px-6 hover:no-underline">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <Icon name="Code" className="text-primary" size={20} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Разработка</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-normal">Создание сайтов под ключ</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

                <AccordionItem value="promotion" className="border rounded-lg bg-white dark:bg-gray-900">
                  <AccordionTrigger className="px-3 sm:px-6 hover:no-underline">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                        <Icon name="TrendingUp" className="text-secondary" size={20} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Продвижение</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-normal">SEO и маркетинг</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

                <AccordionItem value="additional" className="border rounded-lg bg-white dark:bg-gray-900">
                  <AccordionTrigger className="px-3 sm:px-6 hover:no-underline">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                        <Icon name="Sparkles" className="text-accent" size={20} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Дополнительно</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground font-normal">Сопровождение и поддержка</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t pt-4 sm:pt-6 mt-4 sm:mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <div className="w-full sm:w-auto text-center sm:text-left">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Итого</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{formatPrice(totalPrice)} ₽</p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => setIsOrderModalOpen(true)}
                    disabled={totalPrice === 0}
                    className="bg-gradient-to-r from-gradient-start to-gradient-mid w-full sm:w-auto text-sm sm:text-base"
                  >
                    Оформить заказ
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        services={getSelectedServices()}
        total={totalPrice}
      />
    </>
  );
};

export default CalcModal;