import { useState } from 'react';
import ContactModal from './ContactModal';
import Icon from '@/components/ui/icon';

const Promotion = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  return (
    <section id="promotion" className="promotion bg-gray-50 dark:bg-gray-700">
      <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-[76px] lg:gap-[76px] gap-12 items-start min-h-[600px]">
          <div className="promotion-left space-y-8">
            <h2 className="section-title">Продвижение</h2>
            <div className="w-full h-96 lg:h-96 h-72 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-rose-500/30 rounded-3xl relative overflow-hidden border border-gradient-start/20 backdrop-blur-sm group hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0">
                <div className="absolute top-12 left-8 animate-float" style={{ animationDuration: '4s' }}>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="Megaphone" size={24} className="text-white/80" />
                  </div>
                </div>
                
                <div className="absolute top-20 right-16 animate-float" style={{ animationDuration: '5s', animationDelay: '0.5s' }}>
                  <div className="w-10 h-10 rounded-full bg-blue-500/30 backdrop-blur-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white/90" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </div>
                </div>
                
                <div className="absolute bottom-24 left-20 animate-float" style={{ animationDuration: '6s', animationDelay: '1s' }}>
                  <div className="w-11 h-11 rounded-full bg-blue-600/30 backdrop-blur-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white/90" fill="currentColor">
                      <path d="M15.07 2.38c5.25.67 6.54 5.46 6.54 9.62 0 4.16-1.29 8.95-6.54 9.62-.91.12-1.67-.83-1.41-1.7l1.79-5.94c.24-.8-.29-1.62-1.12-1.62h-3.72c-1.14 0-1.82-1.27-1.2-2.23l5.77-8.97c.51-.79 1.63-.57 1.89.22z"/>
                      <path d="M8.93 21.62c-5.25-.67-6.54-5.46-6.54-9.62 0-4.16 1.29-8.95 6.54-9.62.91-.12 1.67.83 1.41 1.7l-1.79 5.94c-.24.8.29 1.62 1.12 1.62h3.72c1.14 0 1.82 1.27 1.2 2.23l-5.77 8.97c-.51.79-1.63.57-1.89-.22z" opacity="0.5"/>
                    </svg>
                  </div>
                </div>
                
                <div className="absolute bottom-16 right-12 animate-float" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}>
                  <div className="w-10 h-10 rounded-full bg-purple-500/30 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="Megaphone" size={20} className="text-white/80" />
                  </div>
                </div>
                
                <div className="absolute top-32 left-1/3 animate-float" style={{ animationDuration: '7s', animationDelay: '2s' }}>
                  <div className="w-9 h-9 rounded-full bg-blue-500/25 backdrop-blur-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/90" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </div>
                </div>

                <div className="absolute top-1/2 right-1/4 animate-float" style={{ animationDuration: '6.5s', animationDelay: '2.5s' }}>
                  <div className="w-8 h-8 rounded-full bg-blue-600/25 backdrop-blur-sm flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/90" fill="currentColor">
                      <path d="M15.07 2.38c5.25.67 6.54 5.46 6.54 9.62 0 4.16-1.29 8.95-6.54 9.62-.91.12-1.67-.83-1.41-1.7l1.79-5.94c.24-.8-.29-1.62-1.12-1.62h-3.72c-1.14 0-1.82-1.27-1.2-2.23l5.77-8.97c.51-.79 1.63-.57 1.89.22z"/>
                      <path d="M8.93 21.62c-5.25-.67-6.54-5.46-6.54-9.62 0-4.16 1.29-8.95 6.54-9.62.91-.12 1.67.83 1.41 1.7l-1.79 5.94c-.24.8.29 1.62 1.12 1.62h3.72c1.14 0 1.82 1.27 1.2 2.23l-5.77 8.97c-.51.79-1.63.57-1.89-.22z" opacity="0.5"/>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-32 h-32 border-4 border-white/30 rounded-full animate-pulse" />
                <div className="absolute w-24 h-24 border-4 border-white/40 rounded-full animate-ping" />
                <div className="absolute w-16 h-16 bg-white/30 rounded-full backdrop-blur-sm" />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-gradient-mid/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
            </div>
          </div>
          <div className="promotion-right lg:pt-[316px] pt-0 min-h-full space-y-6">
            <a href="/services#promotion" className="icon-badge max-w-[195px] flex items-center gap-2 group/badge cursor-pointer">
              <img 
                src="/img/9a3097d8-c2ab-4acb-917e-a6fb88252298.png" 
                alt="memoji" 
                className="w-5 h-5 object-contain animate-bounce group-hover/badge:scale-125 group-hover/badge:rotate-12 transition-all duration-300"
              />
              взлетаем
            </a>
            <h3 className="section-subtitle">Приводим целевых клиентов и растим ваш бизнес в интернете</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[17px]">
              Комплексное digital-продвижение: SEO-оптимизация для поисковых систем, контекстная реклама (Яндекс.Директ, Google Ads), таргетированная реклама в социальных сетях и email-маркетинг. <strong>Работаем на результат</strong> — увеличение трафика, конверсии и продаж.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>SEO-оптимизация:</strong> Выход в ТОП-10 Яндекс и Google за 2-6 месяцев
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>Контекстная реклама:</strong> Настройка и ведение рекламных кампаний с ROI от 200%
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  <strong>SMM и таргет:</strong> Привлечение клиентов из ВКонтакте, Telegram и других соцсетей
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

export default Promotion;