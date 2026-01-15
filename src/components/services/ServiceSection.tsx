import Icon from '@/components/ui/icon';
import ServiceCard from './ServiceCard';
import { Service } from './types';

interface ServiceSectionProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  services: Service[];
  selectedServices: string[];
  onToggle: (serviceId: string) => void;
}

const ServiceSection = ({
  id,
  title,
  description,
  icon,
  services,
  selectedServices,
  onToggle
}: ServiceSectionProps) => {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Icon name={icon} className="text-primary" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedServices.includes(service.id)}
            onToggle={() => onToggle(service.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default ServiceSection;
