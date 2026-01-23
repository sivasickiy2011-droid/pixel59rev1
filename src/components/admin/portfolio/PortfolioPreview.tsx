import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { PortfolioProject } from './types';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

interface PortfolioPreviewProps {
  project: PortfolioProject;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const getPreviewDimensions = (viewMode: ViewMode) => {
  switch (viewMode) {
    case 'desktop': return { width: '100%', height: '500px' };
    case 'tablet': return { width: '768px', height: '450px', margin: '0 auto' };
    case 'mobile': return { width: '375px', height: '667px', margin: '0 auto' };
  }
};

const isPdfUrl = (url: string) => url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');

export const PortfolioPreview = ({
  project,
  viewMode,
  setViewMode,
}: PortfolioPreviewProps) => {
  const mainImageUrl = project.carousel_image_url || project.image_url || project.preview_image_url;
  const isPdf = mainImageUrl && isPdfUrl(mainImageUrl);

  return (
    <div className="border border-gradient-start/30 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Icon name="Eye" size={18} />
          Предпросмотр (изображения, PDF, сайт)
        </h4>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            onClick={() => setViewMode('desktop')}
          >
            <Icon name="Monitor" size={16} className="mr-1" />
            Desktop
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'tablet' ? 'default' : 'outline'}
            onClick={() => setViewMode('tablet')}
          >
            <Icon name="Tablet" size={16} className="mr-1" />
            Tablet
          </Button>
          <Button
            type="button"
            size="sm"
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            onClick={() => setViewMode('mobile')}
          >
            <Icon name="Smartphone" size={16} className="mr-1" />
            Mobile
          </Button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 overflow-auto">
        {mainImageUrl ? (
          <div style={getPreviewDimensions(viewMode)} className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden relative">
            {isPdf ? (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800">
                <iframe
                  src={mainImageUrl}
                  title="PDF Preview"
                  className="w-full h-full"
                />
                <div className="absolute bottom-3 right-3">
                  <a
                    href={mainImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
                  >
                    Открыть PDF
                  </a>
                </div>
              </div>
            ) : (
              <img
                src={mainImageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ) : project.website_url ? (
          <div style={getPreviewDimensions(viewMode)} className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <iframe
              src={project.website_url}
              title="Website Preview"
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <Icon name="ImageOff" size={48} className="mx-auto mb-2 opacity-50" />
              <p>Загрузите изображение, PDF или укажите URL</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
