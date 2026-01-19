import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';

interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  image_url: string;
  carousel_image_url?: string;
  preview_image_url?: string;
  gallery_images?: string[];
  website_url: string;
  display_order: number;
  is_active: boolean;
}

const Portfolio = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  useEffect(() => {
    if (selectedProject) {
      setCurrentSlide(0);
    }
  }, [selectedProject]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/99ddd15c-93b5-4d9e-8536-31e6f6630304');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <section id="portfolio" className="portfolio bg-white dark:bg-gray-800">
        <div className="max-w-[1500px] w-full px-[50px] mx-auto">
          <div className="w-[95%]">
            <h2 className="section-title">Портфолио</h2>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Icon name="Loader2" className="animate-spin inline-block mb-2" size={32} />
              <p>Загрузка проектов...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section id="portfolio" className="portfolio bg-white dark:bg-gray-800">
        <div className="max-w-[1500px] w-full px-[50px] mx-auto">
          <div className="w-[95%]">
            <h2 className="section-title">Портфолио</h2>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Icon name="FolderOpen" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Проекты скоро появятся</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // const doubledProjects = [...projects, ...projects]; // удалено, не используется
  const middleIndex = Math.ceil(projects.length / 2);
  const firstHalf = projects.slice(0, middleIndex);
  const secondHalf = projects.slice(middleIndex);
  const doubledFirstHalf = [...firstHalf, ...firstHalf];
  const doubledSecondHalf = [...secondHalf, ...secondHalf];

  return (
    <>
      <section id="portfolio" className="portfolio bg-white dark:bg-gray-800">
        <div className="max-w-[1500px] w-full px-[50px] mx-auto">
          <div className="w-[95%]">
            <h2 className="section-title">Портфолио</h2>
            
            <div className="mb-8 overflow-hidden hidden md:block">
              <div className="flex gap-6 animate-marquee whitespace-nowrap">
                {doubledFirstHalf.map((project, i) => (
                  <button 
                    key={`${project.id}-${i}`}
                    onClick={() => setSelectedProject(project)}
                    className="inline-block flex-shrink-0 group"
                  >
                    <div className="w-80 h-64 rounded-2xl relative overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                      {(project.preview_image_url || project.carousel_image_url || project.image_url) ? (
                        <img 
                          src={project.preview_image_url || project.carousel_image_url || project.image_url} 
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : project.website_url ? (
                        <iframe 
                          src={project.website_url}
                          title={project.title}
                          className="w-full h-full pointer-events-none scale-50 origin-top-left"
                          style={{ width: '200%', height: '200%' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                          <span className="text-gray-400">Нет изображения</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                        <div className="text-white text-xl font-bold mb-2">
                          {project.title}
                        </div>
                        {project.description && (
                          <p className="text-white/90 text-sm text-center mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-4 py-2 rounded-full text-sm font-semibold">
                          Смотреть проект
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8 overflow-x-auto md:hidden scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-4">
              <div className="flex gap-4 px-4">
                {projects.map((project) => (
                  <button 
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="inline-block flex-shrink-0 group snap-center"
                  >
                    <div className="w-[calc(100vw-3rem)] max-w-[320px] h-64 rounded-2xl relative overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all duration-500 active:scale-95">
                      {(project.preview_image_url || project.carousel_image_url || project.image_url) ? (
                        <img 
                          src={project.preview_image_url || project.carousel_image_url || project.image_url} 
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : project.website_url ? (
                        <iframe 
                          src={project.website_url}
                          title={project.title}
                          className="w-full h-full pointer-events-none scale-50 origin-top-left"
                          style={{ width: '200%', height: '200%' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                          <span className="text-gray-400">Нет изображения</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <div className="text-white text-xl font-bold mb-2">
                          {project.title}
                        </div>
                        {project.description && (
                          <p className="text-white/90 text-sm text-center mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-4 py-2 rounded-full text-sm font-semibold">
                          Смотреть проект
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {secondHalf.length > 0 && (
              <>
                <div className="py-8 border-y border-gradient-start/20 overflow-hidden my-12 relative hidden md:block">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gradient-start/5 to-transparent" />
                  <div className="flex gap-16 animate-marquee-slow whitespace-nowrap text-2xl font-semibold">
                    {['Разработка', 'Оптимизация', 'Веб-дизайн', 'Разработка', 'Оптимизация', 'Веб-дизайн', 'Разработка', 'Оптимизация'].map((text, i) => (
                      <p key={i} className="bg-gradient-to-r from-gradient-start to-gradient-mid bg-clip-text text-transparent dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.4)]">
                        {text}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden hidden md:block">
                  <div className="flex gap-6 animate-marquee-reverse whitespace-nowrap">
                    {doubledSecondHalf.map((project, i) => (
                      <button 
                        key={`${project.id}-${i}`}
                        onClick={() => setSelectedProject(project)}
                        className="inline-block flex-shrink-0 group"
                      >
                        <div className="w-80 h-64 rounded-2xl relative overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                          {(project.preview_image_url || project.carousel_image_url || project.image_url) ? (
                            <img 
                              src={project.preview_image_url || project.carousel_image_url || project.image_url} 
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : project.website_url ? (
                            <iframe 
                              src={project.website_url}
                              title={project.title}
                              className="w-full h-full pointer-events-none scale-50 origin-top-left"
                              style={{ width: '200%', height: '200%' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                              <span className="text-gray-400">Нет изображения</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                            <div className="text-white text-xl font-bold mb-2 dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">
                              {project.title}
                            </div>
                            {project.description && (
                              <p className="text-white/90 text-sm text-center mb-3 dark:[text-shadow:0_1px_6px_rgba(0,0,0,0.6)] line-clamp-2">
                                {project.description}
                              </p>
                            )}
                            <div className="bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-4 py-2 rounded-full text-sm font-semibold">
                              Смотреть проект
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Modal for project preview */}
      {selectedProject && (
        <div 
          className="fixed inset-0 bg-black/70 dark:bg-black/85 z-[99999] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedProject(null)}
        >
          <div 
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.4)]">
                {selectedProject.title}
              </h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <Icon name="X" size={28} />
              </button>
            </div>

            {selectedProject.description && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 dark:[text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
                  {selectedProject.description}
                </p>
              </div>
            )}

            <div className="p-4 bg-gray-100 dark:bg-gray-900 relative">
              {(() => {
                const galleryImages = selectedProject.gallery_images || [];
                const allImages = [
                  selectedProject.carousel_image_url,
                  selectedProject.image_url,
                  ...galleryImages
                ].filter(Boolean) as string[];
                
                if (allImages.length > 0) {
                  return (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="w-full h-[calc(90vh-320px)] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-900">
                          <img 
                            src={allImages[currentSlide]}
                            alt={`${selectedProject.title} - ${currentSlide + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        
                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={() => setCurrentSlide((prev) => (prev - 1 + allImages.length) % allImages.length)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-white p-3 rounded-full shadow-lg transition-all"
                            >
                              <Icon name="ChevronLeft" size={24} />
                            </button>
                            <button
                              onClick={() => setCurrentSlide((prev) => (prev + 1) % allImages.length)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-white p-3 rounded-full shadow-lg transition-all"
                            >
                              <Icon name="ChevronRight" size={24} />
                            </button>
                            
                            <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full">
                              {currentSlide + 1} / {allImages.length}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {allImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {allImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentSlide(index)}
                              className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentSlide
                                  ? 'border-gradient-start scale-105 shadow-lg'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gradient-start/50'
                              }`}
                            >
                              <img 
                                src={img}
                                alt={`Thumb ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <div className="flex flex-col items-center justify-center h-[calc(90vh-240px)] gap-6 text-center">
                    <div className="text-gray-600 dark:text-gray-400">
                      <Icon name="ExternalLink" size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Сайт нельзя отобразить во встроенном окне</p>
                      <p className="text-sm mt-2">Нажмите кнопку ниже, чтобы открыть его в новой вкладке</p>
                    </div>
                    <a
                      href={selectedProject.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gradient-start to-gradient-mid text-white rounded-full hover:shadow-xl transition-all font-medium"
                    >
                      <Icon name="ExternalLink" size={20} />
                      Открыть сайт
                    </a>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Закрыть
              </button>
              {selectedProject.website_url && 
               selectedProject.website_url !== 'https://example.com' && 
               !selectedProject.website_url.includes('example.com') && (
                <a
                  href={selectedProject.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-gradient-start to-gradient-mid text-white font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  Открыть сайт
                  <Icon name="ExternalLink" size={16} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Portfolio;