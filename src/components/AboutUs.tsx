import { useState } from 'react';
import ContactModal from './ContactModal';
import Icon from './ui/icon';

const AboutUs = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  const gridBlocks = [
    { 
      icon: 'Code2', 
      title: 'Код высшего качества',
      description: 'Мы пишем чистый, масштабируемый и поддерживаемый код, следуя лучшим практикам индустрии. Наши разработчики создают надежные решения, которые работают быстро и стабильно на протяжении многих лет.'
    },
    { 
      icon: 'Palette', 
      title: 'Уникальный дизайн',
      description: 'Создаем современные и запоминающиеся интерфейсы, которые отражают индивидуальность вашего бренда. Каждый проект — это баланс эстетики, удобства и функциональности, адаптированный под ваши цели.'
    },
    { 
      icon: 'Rocket', 
      title: 'Быстрый запуск',
      description: 'Оптимизированные процессы разработки позволяют нам запускать проекты в сжатые сроки без потери качества. Мы ценим ваше время и делаем всё, чтобы вы увидели результат максимально быстро.'
    },
    { 
      icon: 'Target', 
      title: 'Точное попадание в цель',
      description: 'Глубоко изучаем вашу нишу и целевую аудиторию, чтобы создать решение, которое решает конкретные бизнес-задачи. Каждая функция и элемент работают на достижение ваших целей.'
    },
    { 
      icon: 'Users', 
      title: 'Клиентоориентированность',
      description: 'Ваш успех — наш приоритет. Мы работаем как единая команда с вашим бизнесом, учитываем каждое пожелание и остаемся на связи на всех этапах проекта. Ваше мнение для нас важнее всего.'
    },
    { 
      icon: 'TrendingUp', 
      title: 'Рост и масштабирование',
      description: 'Создаем проекты, которые растут вместе с вашим бизнесом. Наши решения легко расширяются новыми функциями и выдерживают увеличение нагрузки без потери производительности.'
    },
    { 
      icon: 'Lightbulb', 
      title: 'Инновационные решения',
      description: 'Используем передовые технологии и нестандартный подход к каждой задаче. Наша команда всегда в курсе последних трендов и внедряет инновации, которые дают вам конкурентное преимущество.'
    },
    { 
      icon: 'Award', 
      title: 'Проверенная экспертиза',
      description: 'За плечами — десятки успешных проектов различной сложности. Наш опыт позволяет предвидеть возможные проблемы и предлагать оптимальные решения на каждом этапе разработки.'
    },
    { 
      icon: 'Zap', 
      title: 'Высокая производительность',
      description: 'Оптимизируем каждый байт кода для максимальной скорости работы. Ваш сайт будет загружаться молниеносно, что улучшает пользовательский опыт и позиции в поисковых системах.'
    }
  ];

  const services = [
    { icon: 'Layout', text: 'Разработка современных веб-сайтов и приложений' },
    { icon: 'Smartphone', text: 'Адаптивный дизайн для всех устройств' },
    { icon: 'Search', text: 'SEO-оптимизация и продвижение' },
    { icon: 'Shield', text: 'Надежность и безопасность проектов' },
    { icon: 'Headphones', text: 'Поддержка на всех этапах разработки' }
  ];
  
  return (
    <section id="about-us" className="about-us bg-gray-50 dark:bg-gray-700">
      <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-[76px] items-start min-h-[400px] sm:min-h-[600px]">
          <div className="about-us-left space-y-6 sm:space-y-8">
            <h2 className="section-title">О Нас</h2>
            <div 
              className="w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-gradient-start/30 via-gradient-mid/20 to-gradient-end/30 rounded-2xl sm:rounded-3xl relative overflow-hidden border border-gradient-start/20 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.grid-container')) {
                  setHoveredIndex(null);
                  setIsLocked(false);
                }
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setIsLocked(false);
              }}
            >
              <div className="absolute inset-0 p-3 sm:p-6 lg:p-8 grid-container">
                <div className="relative w-full h-full">
                  {gridBlocks.map((block, i) => {
                    const isHovered = hoveredIndex === i;
                    const hasHover = hoveredIndex !== null;
                    
                    const gridPositions = [
                      { top: '0', left: '0', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: '0', left: 'calc(33.333% + 5.33px)', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: '0', left: 'calc(66.666% + 10.67px)', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: 'calc(33.333% + 5.33px)', left: '0', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: 'calc(33.333% + 5.33px)', left: 'calc(33.333% + 5.33px)', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: 'calc(33.333% + 5.33px)', left: 'calc(66.666% + 10.67px)', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: 'calc(66.666% + 10.67px)', left: '0', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: 'calc(66.666% + 10.67px)', left: 'calc(33.333% + 5.33px)', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' },
                      { top: 'calc(66.666% + 10.67px)', left: 'calc(66.666% + 10.67px)', width: 'calc(33.333% - 10.67px)', height: 'calc(33.333% - 10.67px)' }
                    ];
                    
                    const getSmallBlockPosition = (index: number) => {
                      let count = 0;
                      const numRightBlocks = 4;
                      // const numBottomBlocks = 4; // удалено, не используется
                      const rightBlockWidth = 18;
                      const rightBlockHeight = 22;
                      const bottomBlockHeight = 22;
                      const bottomBlockWidth = 18;
                      
                      for (let j = 0; j < 9; j++) {
                        if (j === hoveredIndex) continue;
                        if (j === index) {
                          if (count < numRightBlocks) {
                            const topPositions = [0, 25, 50, 75];
                            const gaps = [0, 8, 16, 24];
                            return {
                              right: '0',
                              top: `calc(${topPositions[count]}% + ${gaps[count]}px)`,
                              width: `calc(${rightBlockWidth}% - 4px)`,
                              height: `calc(${rightBlockHeight}% - 6px)`
                            };
                          } else {
                            const bottomIndex = count - numRightBlocks;
                            const leftPositions = [0, 18.33, 36.67, 55];
                            const leftGaps = [0, 8, 16, 24];
                            return {
                              bottom: '-9px',
                              left: `calc(${leftPositions[bottomIndex]}% + ${leftGaps[bottomIndex]}px)`,
                              width: `calc(${bottomBlockWidth}% - 4px)`,
                              height: `calc(${bottomBlockHeight}% - 6px)`
                            };
                          }
                        }
                        count++;
                      }
                      return {};
                    };
                    
                    let finalStyle = {};
                    if (!hasHover) {
                      finalStyle = gridPositions[i];
                    } else if (isHovered) {
                      finalStyle = { 
                        top: '0', 
                        left: '0', 
                        width: 'calc(80% - 4px)', 
                        height: 'calc(80% - 4px)'
                      };
                    } else {
                      finalStyle = getSmallBlockPosition(i);
                    }
                    
                    return (
                      <div 
                        key={i}
                        className={`absolute rounded-2xl lg:rounded-2xl rounded-xl bg-gradient-to-br backdrop-blur-sm border animate-fade-in transition-all duration-500 flex items-center justify-center cursor-pointer overflow-hidden ${
                          !hasHover
                            ? 'from-white/50 to-white/20 dark:from-white/30 dark:to-white/10 border-white/40 dark:border-white/20'
                            : isHovered
                              ? 'from-white/70 to-white/30 dark:from-white/40 dark:to-white/20 border-white/60 dark:border-white/30 z-20'
                              : 'from-white/40 to-white/10 dark:from-white/25 dark:to-white/5 border-white/30 dark:border-white/15 z-10'
                        }`}
                        style={{ ...finalStyle, animationDelay: `${i * 0.1}s` }}
                        onMouseEnter={() => {
                          if (!isLocked) {
                            setHoveredIndex(i);
                            setIsLocked(true);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isHovered) {
                            setHoveredIndex(null);
                            setIsLocked(false);
                          } else {
                            setHoveredIndex(i);
                            setIsLocked(true);
                          }
                        }}
                      >
                        {isHovered ? (
                          <div className="p-3 sm:p-4 lg:p-6 xl:p-8 text-left space-y-2 sm:space-y-3 lg:space-y-4 w-full h-full flex flex-col">
                            <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gradient-start to-gradient-mid flex items-center justify-center shadow-lg flex-shrink-0">
                                <Icon name={block.icon} size={20} className="text-white sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                              </div>
                              <h4 className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-gray-900 dark:text-white pt-1 leading-tight flex-1 break-words hyphens-auto">{block.title}</h4>
                            </div>
                            <p className="text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-200 leading-relaxed flex-1 overflow-y-auto scrollbar-hide">{block.description}</p>
                          </div>
                        ) : (
                          <Icon 
                            name={block.icon} 
                            size={hasHover ? 12 : 24} 
                            className={`${hasHover ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8'} text-gradient-start dark:text-white drop-shadow-lg transition-all duration-500`} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="about-us-right lg:pt-[316px] pt-0 min-h-full space-y-6">
            <p className="icon-badge max-w-[190px] flex items-center gap-2 group/badge cursor-pointer">
              <img 
                src="/img/9a3097d8-c2ab-4acb-917e-a6fb88252298.png" 
                alt="memoji" 
                className="w-5 h-5 object-contain animate-bounce group-hover/badge:scale-125 group-hover/badge:rotate-12 transition-all duration-300"
              />
              компания
            </p>
            <h3 className="section-subtitle dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.4)]">Создаем цифровые решения для вашего бизнеса</h3>
            
            <div className="space-y-4">
              <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-gradient-start/20">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Icon name="History" size={18} className="text-gradient-start" />
                  Наша история
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Pixel59 — это команда опытных разработчиков и дизайнеров, которые с 2018 года создают веб-решения для бизнеса. За это время мы реализовали <strong>более 150 проектов</strong> различной сложности — от корпоративных сайтов до крупных интернет-магазинов и SaaS-платформ.
                </p>
              </div>

              <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-gradient-start/20">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Icon name="Users" size={18} className="text-gradient-mid" />
                  Наша команда
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  Мы — это 12 специалистов, каждый из которых эксперт в своей области:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gradient-start to-gradient-mid"></div>
                    <span className="text-gray-700 dark:text-gray-300">Frontend-разработчики</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gradient-mid to-gradient-end"></div>
                    <span className="text-gray-700 dark:text-gray-300">Backend-разработчики</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end"></div>
                    <span className="text-gray-700 dark:text-gray-300">UI/UX дизайнеры</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-gradient-end to-gradient-start"></div>
                    <span className="text-gray-700 dark:text-gray-300">SEO-специалисты</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              {services.map((service, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-gradient-start/20 to-gradient-mid/20 flex items-center justify-center border border-gradient-start/20">
                    <Icon name={service.icon} size={20} className="text-gradient-start dark:text-gradient-mid" />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-2">{service.text}</p>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setContactModalOpen(true)}
              className="btn bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-8 py-4 rounded-full text-sm font-semibold hover:shadow-2xl transition-all duration-300 mt-6"
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

export default AboutUs;