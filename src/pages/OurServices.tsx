import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/services/ServiceCard';
import TechnologySelector from '@/components/services/TechnologySelector';
import HostingSelector from '@/components/services/HostingSelector';
import PartnerLogin from '@/components/services/PartnerLogin';
import OrderModal from '@/components/services/OrderModal';
import { usePartner } from '@/contexts/PartnerContext';
import { Service } from '@/components/services/types';
import {
  bitrixLicenses,
  hostingOptions,
  begetTariffs,
  vpsTariffs
} from '@/components/services/servicesData';

const OurServices = () => {
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
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      if (hash === '#development') {
        setOpenSections(['development']);
      } else if (hash === '#promotion') {
        setOpenSections(['promotion']);
      } else if (hash === '#additional') {
        setOpenSections(['additional']);
      }
      
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
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

  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen bg-background">
      <PartnerLogin />
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Icon name="ArrowLeft" size={20} />
            <span className="font-medium">На главную</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Наши услуги</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Выберите нужные услуги и рассчитайте стоимость проекта
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="animate-spin text-primary" size={48} />
          </div>
        ) : (
        <>
        <Accordion type="multiple" className="space-y-4" value={openSections} onValueChange={setOpenSections}>
          <AccordionItem value="development" id="development" className="border rounded-lg bg-white dark:bg-gray-900">
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Code" className="text-primary" size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Разработка</h2>
                  <p className="text-sm text-muted-foreground font-normal">Создание сайтов под ключ</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
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

          <AccordionItem value="promotion" id="promotion" className="border rounded-lg bg-white dark:bg-gray-900">
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="TrendingUp" className="text-primary" size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Продвижение</h2>
                  <p className="text-sm text-muted-foreground font-normal">Привлечение клиентов и рост продаж</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-6">
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

          <AccordionItem value="additional" id="additional" className="border rounded-lg bg-white dark:bg-gray-900">
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Plus" className="text-primary" size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Дополнительные услуги</h2>
                  <p className="text-sm text-muted-foreground font-normal">Поддержка и развитие проекта</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid md:grid-cols-2 gap-6">
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
          <Card className="sticky bottom-6 p-8 bg-white shadow-xl border-2 mt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-muted-foreground mb-2">Предварительная стоимость проекта</p>
                <p className="text-4xl font-bold text-primary">{formatPrice(totalPrice)} ₽</p>
              </div>
              <Button 
                size="lg" 
                className="w-full md:w-auto"
                onClick={() => setIsOrderModalOpen(true)}
              >
                <Icon name="Send" size={20} className="mr-2" />
                Отправить заявку
              </Button>
            </div>
          </Card>
        )}
        </>
        )}

      </main>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        total={totalPrice}
        services={getSelectedServices()}
      />

      <Footer />
    </div>
  );
};

export default OurServices;