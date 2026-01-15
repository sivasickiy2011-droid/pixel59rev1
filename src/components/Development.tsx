import { useState, useEffect } from 'react';
import ContactModal from './ContactModal';
import { useAnimation } from '@/contexts/AnimationContext';

const Development = () => {
  const [activeType, setActiveType] = useState(0);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { animationEnabled } = useAnimation();
  
  const developmentTypes = [
    {
      title: 'Landing page',
      illustration: (
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-300/60 dark:bg-gray-700/60" />
            <div className="flex gap-2">
              <div className="w-12 h-1 bg-gray-300/60 dark:bg-gray-700/60 rounded" />
              <div className="w-12 h-1 bg-gray-300/60 dark:bg-gray-700/60 rounded" />
            </div>
            <div className="w-16 h-6 bg-gray-300/60 dark:bg-gray-700/60 rounded" />
          </div>
          <div className="w-full h-32 bg-gray-300/60 dark:bg-gray-700/60 rounded-xl mb-4" />
          <div className="absolute bottom-8 left-8 right-8 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-3 h-3 rounded-full bg-white" />
              <div className="w-3 h-3 rounded-full bg-white" />
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <div className="w-16 h-6 bg-white rounded-lg" />
          </div>
        </div>
      )
    },
    {
      title: 'Корпоративные\nсайты',
      illustration: (
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-300/60 dark:bg-gray-700/60" />
            <div className="flex gap-2">
              <div className="w-20 h-1 bg-gray-300/60 dark:bg-gray-700/60 rounded" />
              <div className="w-20 h-1 bg-gray-300/60 dark:bg-gray-700/60 rounded" />
              <div className="w-20 h-1 bg-gray-300/60 dark:bg-gray-700/60 rounded" />
            </div>
          </div>
          <div className="w-full h-24 bg-gray-300/60 dark:bg-gray-700/60 rounded-xl mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-gray-300/60 dark:bg-gray-700/60 rounded-xl" />
            <div className="h-20 bg-gray-300/60 dark:bg-gray-700/60 rounded-xl" />
          </div>
          <div className="absolute bottom-6 left-6 flex gap-1">
            <div className="w-1 h-1 rounded-full bg-gray-400/60 dark:bg-gray-600/60" />
            <div className="w-1 h-1 rounded-full bg-gray-400/60 dark:bg-gray-600/60" />
            <div className="w-1 h-1 rounded-full bg-gray-400/60 dark:bg-gray-600/60" />
          </div>
        </div>
      )
    },
    {
      title: 'Разработка\nприложений',
      illustration: (
        <div className="w-full h-full bg-white dark:bg-gray-900 rounded-2xl p-6 relative flex gap-3">
          <div className="flex-1 space-y-3">
            <div className="h-40 bg-gray-300/60 dark:bg-gray-700/60 rounded-xl" />
            <div className="space-y-2 px-2">
              <div className="text-[6px] text-gray-400/80 dark:text-gray-500/80 font-medium">&lt;div class=</div>
              <div className="text-[5px] text-gray-400/80 dark:text-gray-500/80 pl-2">...</div>
              <div className="text-[5px] text-gray-400/80 dark:text-gray-500/80 pl-2">...</div>
            </div>
          </div>
          <div className="w-24 h-full bg-gradient-to-b from-gray-300/60 to-gray-400/60 dark:from-gray-700/60 dark:to-gray-600/60 rounded-xl flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 bg-blue-600/80 rounded-2xl flex items-center justify-center text-white text-xs font-bold">
              App
            </div>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (!animationEnabled) return;
    
    const interval = setInterval(() => {
      setActiveType((prev) => (prev + 1) % developmentTypes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [animationEnabled, developmentTypes.length]);

  return (
    <section id="blok-dev" className="blok-dev bg-white dark:bg-gray-800">
      <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-[76px] items-start min-h-[400px] sm:min-h-[600px]">
          <div className="blok-dev-left space-y-4 sm:space-y-6 lg:space-y-8">
            <h2 className="section-title">Разработка</h2>
            <div className="w-full bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-indigo-500/30 rounded-2xl sm:rounded-3xl border border-gradient-start/20 backdrop-blur-sm overflow-hidden">
              <div className="w-full aspect-[4/3] relative px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 flex items-center justify-center">
                <div className="w-full max-w-[240px] sm:max-w-[320px] lg:max-w-[500px] aspect-[4/3] relative">
                  {developmentTypes.map((type, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-700 ${
                        index === activeType
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-95'
                      }`}
                    >
                      {type.illustration}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full flex justify-center gap-3 px-4 py-4 sm:py-6 lg:py-8">
                {developmentTypes.map((type, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveType(index)}
                    className={`px-4 py-2 lg:px-6 lg:py-3 rounded-full text-xs lg:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                      index === activeType
                        ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-lg scale-105'
                        : 'bg-white/30 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/50'
                    }`}
                  >
                    {type.title.split('\n')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="blok-dev-right lg:pt-[316px] pt-0 min-h-full space-y-6">
            <a href="/services#development" className="icon-badge max-w-[230px] flex items-center gap-2 group/badge cursor-pointer">
              <img 
                src="/img/9a3097d8-c2ab-4acb-917e-a6fb88252298.png" 
                alt="memoji" 
                className="w-5 h-5 object-contain animate-bounce group-hover/badge:scale-125 group-hover/badge:rotate-12 transition-all duration-300"
              />
              наши услуги
            </a>
            <h3 className="section-subtitle">Превращаем ваши идеи в работающие веб-решения</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[17px]">
              Разрабатываем сайты любой сложности — от одностраничных лендингов до крупных корпоративных порталов и интернет-магазинов. <strong>Каждый проект создается с учетом ваших бизнес-целей</strong>: увеличение продаж, привлечение клиентов или повышение узнаваемости бренда.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gradient-start to-gradient-mid flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>Быстрый запуск:</strong> Landing page за 7-10 дней, корпоративный сайт за 2-4 недели
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gradient-start to-gradient-mid flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>Современные технологии:</strong> React, TypeScript, адаптивная верстка и SEO-оптимизация
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gradient-start to-gradient-mid flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>Поддержка 24/7:</strong> Гарантия 30 дней + техническая поддержка после запуска
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

export default Development;