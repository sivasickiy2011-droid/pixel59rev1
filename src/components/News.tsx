import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface NewsItem {
  title: string;
  excerpt: string;
  content: string;
  source: string;
  sourceUrl: string;
  date: string;
  image: string;
  category: string;
  link: string;
}

const News = () => {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [categories, setCategories] = useState<string[]>(['Все']);
  const [showAll, setShowAll] = useState(false);
  const newsGridRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/265f74c3-c0a3-4d44-b005-9119dff641cf');
        const data = await response.json();
        
        if (data.news && Array.isArray(data.news)) {
          setNewsItems(data.news);
          
          const uniqueCategories = ['Все', ...Array.from(new Set(data.news.map((item: NewsItem) => item.category)))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const filteredNews = selectedCategory === 'Все' 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

  const cleanHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const getCardHeight = (index: number) => {
    const patterns = [
      'h-[380px]', 'h-[320px]', 'h-[420px]',
      'h-[350px]', 'h-[400px]', 'h-[340px]',
      'h-[390px]', 'h-[360px]', 'h-[410px]',
      'h-[330px]', 'h-[370px]', 'h-[400px]'
    ];
    return patterns[index % patterns.length];
  };

  const handleShowAllToggle = () => {
    if (!showAll) {
      setShowAll(true);
      setTimeout(() => {
        if (newsGridRef.current) {
          const firstNewCard = newsGridRef.current.children[4] as HTMLElement;
          if (firstNewCard) {
            const offset = 100;
            const elementPosition = firstNewCard.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      }, 100);
    } else {
      if (buttonRef.current) {
        buttonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        setShowAll(false);
      }, 300);
    }
  };

  return (
    <section id="news" className="py-24 lg:px-[50px] px-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gradient-start/20 to-transparent" />
      
      <div className="max-w-[1500px] mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[clamp(40px,8vw,80px)] font-black bg-gradient-to-r from-gradient-start via-gradient-mid to-gradient-end bg-clip-text text-transparent">
            Новости
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Последние тренды и обновления из мира веб-разработки
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-gradient-start to-gradient-mid text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 hover:border-gradient-start/30'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-gradient-start/20 border-t-gradient-start rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400 font-semibold">Загрузка новостей...</p>
            </div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="FileQuestion" size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-xl text-gray-600 dark:text-gray-400">Новостей не найдено</p>
          </div>
        ) : (
          <>
            <div className="md:hidden overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-[50px] px-[50px]">
              <div className="flex gap-4 pb-4">
                {filteredNews.map((item, index) => (
                  <article
                    key={`${item.link}-${index}`}
                    className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gradient-start/30 flex-shrink-0 w-[85vw] snap-center h-[480px]"
                    onClick={() => setSelectedNews(item)}
                  >
                    <div className="relative overflow-hidden h-[45%] min-h-[160px] bg-gray-100 dark:bg-gray-700">
                      <div className="absolute inset-0 bg-gradient-to-br from-gradient-start/60 to-gradient-mid/40 z-10 opacity-30 group-hover:opacity-10 transition-opacity duration-300" />
                      <img 
                        src={item.image} 
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800';
                        }}
                      />
                      
                      <div className="absolute top-3 left-3 z-20">
                        <span className="inline-block px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full text-xs font-bold text-gradient-start shadow-sm">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3 flex flex-col justify-between h-[55%]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <a 
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-gradient-start dark:hover:text-gradient-mid transition-colors font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="ExternalLink" size={11} />
                            <span>{item.source}</span>
                          </a>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-[11px]">{item.date}</span>
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-gradient-start transition-colors line-clamp-3 text-base leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
                          {cleanHtml(item.excerpt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-gradient-start font-semibold text-sm pt-2 group-hover:gap-2 transition-all dark:[text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
                        Читать
                        <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="hidden md:block">
              <div 
                ref={newsGridRef}
                className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 transition-all duration-1000 ease-in-out overflow-hidden"
                style={{
                  maxHeight: showAll ? `${filteredNews.length * 500}px` : '2000px'
                }}
              >
                {(showAll ? filteredNews : filteredNews.slice(0, 4)).map((item, index) => (
              <article
                key={`${item.link}-${index}`}
                className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-700 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gradient-start/30 break-inside-avoid mb-4 ${getCardHeight(index)} ${
                  index >= 4 && !showAll ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
                style={{
                  transitionDelay: showAll ? `${(index - 4) * 50}ms` : '0ms'
                }}
                onClick={() => setSelectedNews(item)}
              >
                <div className="relative overflow-hidden h-[45%] min-h-[160px] bg-gray-100 dark:bg-gray-700">
                  <div className="absolute inset-0 bg-gradient-to-br from-gradient-start/60 to-gradient-mid/40 z-10 opacity-30 group-hover:opacity-10 transition-opacity duration-300" />
                  <img 
                    src={item.image} 
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800';
                    }}
                  />
                  
                  <div className="absolute top-3 left-3 z-20">
                    <span className="inline-block px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full text-xs font-bold text-gradient-start shadow-sm">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex flex-col justify-between h-[55%]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <a 
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-gradient-start dark:hover:text-gradient-mid transition-colors font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon name="ExternalLink" size={11} />
                        <span>{item.source}</span>
                      </a>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-[11px]">{item.date}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-gradient-start transition-colors line-clamp-3 text-base leading-snug dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.4)]">
                      {item.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed dark:[text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
                      {cleanHtml(item.excerpt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-gradient-start font-semibold text-sm pt-2 group-hover:gap-2 transition-all dark:[text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
                    Читать
                    <Icon name="ArrowRight" size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
              </div>

              {filteredNews.length > 4 && (
                <div className="flex justify-center mt-12">
                  <button
                    ref={buttonRef}
                    onClick={handleShowAllToggle}
                    className="px-8 py-4 bg-gradient-to-r from-gradient-start to-gradient-mid text-white rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    {showAll ? (
                      <>
                        Свернуть
                        <Icon name="ChevronUp" size={20} />
                      </>
                    ) : (
                      <>
                        Показать все
                        <Icon name="ChevronDown" size={20} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedNews && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedNews(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 overflow-hidden bg-gray-100 dark:bg-gray-700">
              <div className="absolute inset-0 bg-gradient-to-br from-gradient-start/80 via-gradient-mid/70 to-gradient-end/60 z-10 opacity-70" />
              <img 
                src={selectedNews.image} 
                alt={selectedNews.title}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200';
                }}
              />
              
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-900 transition-colors shadow-lg group"
              >
                <Icon name="X" size={20} className="text-gray-700 dark:text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              <div className="absolute bottom-6 left-6 z-20">
                <span className="inline-block px-4 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full text-sm font-bold text-gradient-start mb-4">
                  {selectedNews.category}
                </span>
              </div>
            </div>

            <div className="p-8 lg:p-12 space-y-6">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <a 
                  href={selectedNews.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-gradient-start dark:hover:text-gradient-mid transition-colors group/source"
                >
                  <Icon name="ExternalLink" size={14} className="group-hover/source:translate-x-0.5 group-hover/source:-translate-y-0.5 transition-transform" />
                  <span className="font-semibold">{selectedNews.source}</span>
                </a>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{selectedNews.date}</span>
              </div>

              <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 dark:[text-shadow:0_3px_12px_rgba(0,0,0,0.5)]">
                {selectedNews.title}
              </h2>

              <p className="text-xl text-gradient-start font-semibold dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.4)]">
                {cleanHtml(selectedNews.excerpt)}
              </p>

              <div className="prose prose-lg max-w-none dark:prose-invert dark:[text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedNews.content }} />
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <a
                  href={selectedNews.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gradient-start font-semibold hover:gap-3 transition-all"
                >
                  Читать полностью на {selectedNews.source}
                  <Icon name="ExternalLink" size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default News;