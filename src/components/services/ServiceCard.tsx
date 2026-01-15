import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Service } from './types';
import { usePartner } from '@/contexts/PartnerContext';
import Icon from '@/components/ui/icon';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onToggle: () => void;
  isHosting?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(price);
};

const ServiceCard = ({ service, isSelected, onToggle, isHosting = false }: ServiceCardProps) => {
  const { isPartner, getDiscountedPrice, discountPercent } = usePartner();
  const discountedPrice = getDiscountedPrice(service.price, isHosting);
  const hasDiscount = isPartner && !isHosting && discountedPrice !== service.price;

  return (
    <Card
      className={`p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-primary border-2 bg-primary/5' : ''
      } ${hasDiscount ? 'border-green-500/30' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className="mt-1 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-base sm:text-lg">{service.title}</h3>
            {hasDiscount && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <Icon name="Percent" size={10} />
                -{discountPercent}%
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-3">{service.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {hasDiscount && (
              <p className="text-gray-400 line-through text-xs sm:text-sm">
                от {formatPrice(service.price)} ₽
              </p>
            )}
            <p className={`font-bold text-sm sm:text-base ${hasDiscount ? 'text-green-600' : 'text-primary'}`}>
              от {formatPrice(discountedPrice)} ₽
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ServiceCard;