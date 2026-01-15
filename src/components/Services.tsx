import { useState } from 'react';
import Icon from '@/components/ui/icon';
import ContactModal from './ContactModal';

const Services = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const services = [
    { icon: "TrendingUp", title: "Таргетированная реклама", color: "from-blue-500 to-indigo-600" },
    { icon: "BarChart3", title: "UI Оптимизация", color: "from-purple-500 to-pink-600" },
  ];

  return (
    <section id="services" className="services bg-white dark:bg-gray-800">
      <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-[76px] items-start min-h-[400px] sm:min-h-[600px]">
          <div className="services-left">
            <h2 className="section-title">Услуги</h2>
            <ul className="flex gap-2 sm:gap-[10px] list-none m-0 p-0 flex-wrap">
              {services.map((service, index) => (
                <li 
                  key={index}
                  className="card-item max-w-[155px] sm:max-w-[200px] lg:max-w-[282px] w-full min-h-[180px] sm:min-h-[220px] lg:min-h-[321px] flex flex-col justify-end group cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`mb-3 sm:mb-4 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}>
                    <Icon name={service.icon as any} size={24} className="text-white sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                  </div>
                  <p className="text-sm sm:text-base lg:text-[22px] font-semibold max-w-full break-words dark:text-gray-100 leading-tight">{service.title}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="services-right lg:pt-[316px] pt-0 min-h-full space-y-6">
            <a href="/services#additional" className="icon-badge max-w-[295px] flex items-center gap-2 group/badge cursor-pointer">
              <img 
                src="/img/9a3097d8-c2ab-4acb-917e-a6fb88252298.png" 
                alt="memoji" 
                className="w-5 h-5 object-contain animate-bounce group-hover/badge:scale-125 group-hover/badge:rotate-12 transition-all duration-300"
              />
              мы предоставляем
            </a>
            <h3 className="section-subtitle">
              Ваш сайт будет работать на вас 24/7 и приносить реальную прибыль
            </h3>
            <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-gradient-start/30 mb-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Наше уникальное предложение
              </h4>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">
                <strong>Мы не просто создаем сайты — мы создаем инструменты для роста вашего бизнеса.</strong> Каждый проект проходит глубокий анализ вашей ниши, целевой аудитории и конкурентов. Результат: сайт, который привлекает клиентов, конвертирует посетителей в покупателей и окупается в первые месяцы работы.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">💰</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>Фиксированная стоимость</strong> — никаких скрытых платежей и доплат в процессе
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">⚡</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>Гарантия сроков</strong> — прописываем дедлайны в договоре и соблюдаем их
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">🛡️</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>Бесплатная поддержка 30 дней</strong> — исправим любые ошибки после запуска
                </p>
              </div>
            </div>
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

export default Services;