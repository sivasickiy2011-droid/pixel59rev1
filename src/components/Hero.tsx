import { useState, useEffect } from 'react';
import Header from './Header';
import PartnersCarousel from './PartnersCarousel';

const Hero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    // Определяем производительность устройства
    const checkPerformance = () => {
      const isLowEndDevice = 
        window.innerWidth <= 1140 || // Узкие экраны
        navigator.hardwareConcurrency <= 2 || // <= 2 ядер CPU
        /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); // Мобильные устройства
      
      setShouldAnimate(!isLowEndDevice);
    };

    checkPerformance();
    window.addEventListener('resize', checkPerformance);
    return () => window.removeEventListener('resize', checkPerformance);
  }, []);

  return (
    <header className="header relative overflow-hidden min-h-[calc(100vh-80px)] md:min-h-screen flex flex-col bg-white dark:bg-gray-800 rounded-b-[30px] pt-20 md:pt-0">
      <div className={`absolute inset-0 ${shouldAnimate ? 'animated-gradient-bg' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'}`} />
      
      {shouldAnimate && (
        <>
          <div className="absolute inset-0 opacity-20 dark:opacity-15">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)`,
              animation: 'gradient-animation 20s ease infinite',
            }} />
          </div>

          {/* Пролетающие макеты сайтов - только на мощных устройствах */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-20">
            {[
              { delay: '0s', duration: '25s', top: '10%', size: 'w-[280px] h-[180px]' },
              { delay: '5s', duration: '30s', top: '40%', size: 'w-[320px] h-[200px]' },
              { delay: '10s', duration: '28s', top: '70%', size: 'w-[300px] h-[190px]' },
              { delay: '15s', duration: '32s', top: '25%', size: 'w-[260px] h-[170px]' },
              { delay: '8s', duration: '27s', top: '55%', size: 'w-[290px] h-[185px]' },
            ].map((mockup, idx) => (
              <div
                key={idx}
                className={`absolute ${mockup.size} animate-float-horizontal`}
                style={{
                  top: mockup.top,
                  left: '-350px',
                  animationDelay: mockup.delay,
                  animationDuration: mockup.duration,
                }}
              >
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-700/30 dark:from-black/50 dark:to-gray-900/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-sm border border-gray-400/20 dark:border-gray-600/30">
                  <div className="w-full h-8 bg-gradient-to-b from-gray-800/50 to-transparent dark:from-black/60 rounded-t-2xl flex items-center px-3 gap-1.5 border-b border-gray-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-600/60 dark:bg-gray-700/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-600/60 dark:bg-gray-700/70"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-600/60 dark:bg-gray-700/70"></div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-3/4 bg-gradient-to-r from-gray-700/40 to-gray-600/30 dark:from-gray-800/60 dark:to-gray-700/50 rounded"></div>
                    <div className="h-3 w-1/2 bg-gradient-to-r from-gray-700/40 to-gray-600/30 dark:from-gray-800/60 dark:to-gray-700/50 rounded"></div>
                    <div className="mt-4 h-20 w-full bg-gradient-to-br from-gray-700/30 to-gray-600/20 dark:from-gray-800/50 dark:to-gray-700/40 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="fixed top-[10px] left-0 right-0 z-50">
        <div className="max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto">
          <Header />
        </div>
      </div>

      <div className="relative max-w-[1500px] w-full lg:px-[50px] px-4 mx-auto py-8 flex-1 flex flex-col pt-24 md:pt-8">
        <div className="grid lg:grid-cols-2 gap-6 xl:gap-12 2xl:gap-[76px] items-center flex-1">
          <div className="header-left space-y-4 md:space-y-6 xl:space-y-8 relative z-10 flex flex-col justify-center lg:mt-0 mt-16 sm:mt-20">
            <div className="header-bottom space-y-3 md:space-y-4 xl:space-y-6">
              <div className="space-y-2 md:space-y-3 xl:space-y-4">
                <h1 className="text-[clamp(48px,10vw,140px)] font-black leading-[0.9] m-0 bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                  Pixel
                </h1>
                <p className="text-[clamp(18px,3.5vw,42px)] font-bold leading-tight text-gray-800 dark:text-gray-100 max-w-[600px]">
                  Разработка сайтов, которые приносят реальные результаты вашему бизнесу
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 lg:gap-3 xl:gap-4 items-stretch sm:items-center">
                <a href="#contacts" className="btn bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-6 sm:px-8 lg:px-8 xl:px-10 py-3.5 sm:py-4 lg:py-4 xl:py-5 rounded-full text-sm sm:text-base lg:text-base xl:text-lg font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-center">
                  Начать проект
                </a>
                <a href="#portfolio" className="btn bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-white px-5 sm:px-6 lg:px-6 xl:px-8 py-3.5 sm:py-4 lg:py-4 xl:py-5 rounded-full text-sm sm:text-base lg:text-base xl:text-lg font-semibold border-2 border-gradient-start/30 hover:border-gradient-start hover:shadow-xl transition-all duration-300 text-center">
                  Посмотреть работы
                </a>
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-5 lg:gap-4 xl:gap-6 pt-2 sm:pt-3 xl:pt-4">
                <a href="#blok-dev" className="group relative nav-link-custom text-base sm:text-lg lg:text-lg xl:text-xl font-semibold pb-2 hover:-translate-y-1 transition-all duration-300">
                  <span className="relative z-10">Разработка</span>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-gradient-start to-gradient-mid transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </a>
                <a href="#services" className="group relative nav-link-custom text-base sm:text-lg lg:text-lg xl:text-xl font-semibold pb-2 hover:-translate-y-1 transition-all duration-300">
                  <span className="relative z-10">digital</span>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-gradient-mid to-gradient-end transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </a>
              </div>
            </div>
          </div>

          <div className="header-right space-y-8 relative z-10 flex flex-col justify-center">
            
            <div className="header-img relative xl:-translate-x-[39%] xl:-translate-y-[9%] xl:w-[144%] lg:w-full lg:translate-x-0 lg:translate-y-0 hidden lg:block">
              <div className="relative h-[400px] flex items-center lg:justify-center xl:justify-end overflow-hidden" style={{ transform: shouldAnimate ? `translateY(${scrollY * 0.05}px)` : 'none' }}>
                <div className="relative w-[350px] h-[350px] animate-float" style={{ transform: 'rotateX(10deg) rotateY(-10deg)', transformStyle: 'preserve-3d' }}>
                  <div className="grid grid-cols-10 gap-[2px]">
                    {Array.from({ length: 100 }).map((_, i) => {
                      const isColored = Math.random() > 0.7;
                      const height = Math.random() * 50 + 25;
                      const depth = Math.random() * 20;
                      const hue = Math.random() * 60 + 220;
                      return (
                        <div
                          key={i}
                          className="relative transition-all duration-500 hover:scale-125 hover:z-50"
                          style={{
                            height: `${height}px`,
                            transform: `translateZ(${depth}px)`,
                          }}
                        >
                          <div
                            className={isColored 
                              ? "w-full h-full rounded-[2px] shadow-lg dark:shadow-none transition-all duration-500" 
                              : "w-full h-full rounded-[2px] border dark:border-white/5 transition-all duration-500"
                            }
                            style={{
                              background: isColored 
                                ? `linear-gradient(135deg, hsl(${hue}, 90%, 65%) 0%, hsl(${hue + 20}, 85%, 55%) 100%)`
                                : 'transparent',
                              opacity: isColored ? 0.95 : 1,
                              boxShadow: isColored ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PartnersCarousel />
    </header>
  );
};

export default Hero;