import { useState } from 'react';
import Icon from '@/components/ui/icon';
import ContactModal from './ContactModal';

const LeadGeneration = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const services = [
    { icon: "Target", title: "Таргетированная реклама", color: "from-orange-500 to-red-600" },
    { icon: "Zap", title: "UI Оптимизация", color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <section id="lid" className="lid bg-gray-50 dark:bg-gray-700">
      <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-[76px] lg:gap-[76px] gap-12 items-start min-h-[600px]">
          <div className="lid-left">
            <h2 className="section-title">Лидогенерация</h2>
            <ul className="flex gap-[10px] list-none m-0 p-0">
              {services.map((service, index) => (
                <li 
                  key={index}
                  className="card-item max-w-[282px] w-full flex flex-col justify-end group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}>
                    <Icon name={service.icon as any} size={32} className="text-white" />
                  </div>
                  <p className="text-[22px] font-semibold max-w-[190px] dark:text-gray-100">{service.title}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="lid-right pt-[316px] min-h-full space-y-6">
            <p className="icon-badge max-w-[335px] flex items-center gap-2 group/badge cursor-pointer">
              <img 
                src="/img/9a3097d8-c2ab-4acb-917e-a6fb88252298.png" 
                alt="memoji" 
                className="w-5 h-5 object-contain animate-bounce group-hover/badge:scale-125 group-hover/badge:rotate-12 transition-all duration-300"
              />
              лучшие в своем деле
            </p>
            <h3 className="section-subtitle">Мы комплексно подходим к процессу запуска интернет продаж</h3>
            <button 
              onClick={() => setContactModalOpen(true)}
              className="btn bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-8 py-4 rounded-full text-sm font-semibold hover:shadow-2xl transition-all duration-300"
            >
              Обсудить проект
            </button>
          </div>
        </div>
      </div>
      
      <ContactModal open={contactModalOpen} onOpenChange={setContactModalOpen} />
    </section>
  );
};

export default LeadGeneration;