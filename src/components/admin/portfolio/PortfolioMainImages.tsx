import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PortfolioProject } from './types';

interface PortfolioMainImagesProps {
  project: PortfolioProject;
  isUploading: boolean;
  onUploadImage: (file: File, field: 'carousel_image_url' | 'preview_image_url' | 'image_url') => void;
  onRemoveImage: (field: 'carousel_image_url' | 'preview_image_url' | 'image_url') => void;
}

export const PortfolioMainImages = ({
  project,
  isUploading,
  onUploadImage,
  onRemoveImage,
}: PortfolioMainImagesProps) => {
  const isPdfUrl = (url?: string) => url?.toLowerCase().endsWith('.pdf') || url?.includes('application/pdf');

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Icon name="Image" size={18} />
        Основные изображения
      </h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            1. Основное изображение <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">Для карусели и карточек</span>
          </label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadImage(file, 'image_url');
              }}
              className="flex-1"
            />
            {project.image_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveImage('image_url')}
                className="text-red-600"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            )}
          </div>
          {project.image_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative group">
              {isPdfUrl(project.image_url) ? (
                <div className="w-full h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <div className="text-center">
                    <Icon name="FileText" size={36} className="mx-auto text-gray-400" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">PDF документ</p>
                  </div>
                </div>
              ) : (
                <img src={project.image_url} alt="Main" className="w-full h-40 object-cover" />
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            2. Превью (опционально)
            <span className="text-xs text-gray-500 ml-2">Для миниатюр</span>
          </label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadImage(file, 'preview_image_url');
              }}
              className="flex-1"
            />
            {project.preview_image_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveImage('preview_image_url')}
                className="text-red-600"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            )}
          </div>
          {project.preview_image_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {isPdfUrl(project.preview_image_url) ? (
                <div className="w-full h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Icon name="FileText" size={24} className="text-gray-400" />
                </div>
              ) : (
                <img src={project.preview_image_url} alt="Preview" className="w-full h-24 object-cover" />
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            3. Для карусели (опционально)
            <span className="text-xs text-gray-500 ml-2">Большое изображение</span>
          </label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*,.pdf"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadImage(file, 'carousel_image_url');
              }}
              className="flex-1"
            />
            {project.carousel_image_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveImage('carousel_image_url')}
                className="text-red-600"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            )}
          </div>
          {project.carousel_image_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              {isPdfUrl(project.carousel_image_url) ? (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <Icon name="FileText" size={32} className="text-gray-400" />
                </div>
              ) : (
                <img src={project.carousel_image_url} alt="Carousel" className="w-full h-48 object-cover" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
