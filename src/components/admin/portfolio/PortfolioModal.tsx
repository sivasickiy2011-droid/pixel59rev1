import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PortfolioProject } from './types';
import { uploadImage, uploadGalleryImage } from './PortfolioImageUploader';
import { PortfolioMainImages } from './PortfolioMainImages';
import { PortfolioGallery } from './PortfolioGallery';
import { PortfolioPreview } from './PortfolioPreview';

interface PortfolioModalProps {
  project: PortfolioProject;
  onClose: () => void;
  onSave: () => void;
  onChange: (project: PortfolioProject) => void;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';

export const PortfolioModal = ({ project, onClose, onSave, onChange }: PortfolioModalProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [isUploading, setIsUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  const galleryImages = project.gallery_images || [];

  const handleUploadImage = (file: File, field: 'carousel_image_url' | 'preview_image_url' | 'image_url') => {
    uploadImage({ file, field, project, onChange, setIsUploading });
  };

  const handleUploadGalleryImage = (file: File) => {
    uploadGalleryImage({ file, project, galleryImages, onChange, setIsUploading });
  };

  const addImageByUrl = () => {
    if (!newImageUrl.trim()) return;
    
    if (galleryImages.length >= 5) {
      alert('Максимум 5 изображений в галерее');
      return;
    }

    onChange({ 
      ...project, 
      gallery_images: [...galleryImages, newImageUrl.trim()]
    });
    setNewImageUrl('');
  };

  const removeGalleryImage = (index: number) => {
    const updated = galleryImages.filter((_, i) => i !== index);
    onChange({ ...project, gallery_images: updated });
  };

  const removeImage = (field: 'carousel_image_url' | 'preview_image_url' | 'image_url') => {
    onChange({ ...project, [field]: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {project.id ? 'Редактировать проект' : 'Новый проект'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Название проекта <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({project.title.length}/10 символов)
              </span>
            </label>
            <Input
              value={project.title}
              onChange={(e) =>
                onChange({ ...project, title: e.target.value.slice(0, 10) })
              }
              placeholder="Макс 10 символов"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Описание
            </label>
            <Textarea
              value={project.description}
              onChange={(e) =>
                onChange({ ...project, description: e.target.value })
              }
              placeholder="Краткое описание проекта"
              rows={3}
            />
          </div>

          <PortfolioMainImages
            project={project}
            isUploading={isUploading}
            onUploadImage={handleUploadImage}
            onRemoveImage={removeImage}
          />

          <PortfolioGallery
            project={project}
            galleryImages={galleryImages}
            isUploading={isUploading}
            newImageUrl={newImageUrl}
            setNewImageUrl={setNewImageUrl}
            onUploadGalleryImage={handleUploadGalleryImage}
            onAddImageByUrl={addImageByUrl}
            onRemoveGalleryImage={removeGalleryImage}
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              URL сайта <span className="text-red-500">*</span>
            </label>
            <Input
              value={project.website_url}
              onChange={(e) =>
                onChange({ ...project, website_url: e.target.value })
              }
              placeholder="https://example.com"
            />
            {project.website_url && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Будет использоваться для iframe-предпросмотра, если нет изображений
              </p>
            )}
          </div>
          
          <PortfolioPreview
            project={project}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={project.is_active}
              onChange={(e) =>
                onChange({ ...project, is_active: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm text-gray-900 dark:text-gray-100">
              Показывать на сайте
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={isUploading}>
            {isUploading ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
