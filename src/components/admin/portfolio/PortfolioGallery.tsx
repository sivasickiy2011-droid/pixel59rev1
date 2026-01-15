import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PortfolioProject } from './types';

interface PortfolioGalleryProps {
  project: PortfolioProject;
  galleryImages: string[];
  isUploading: boolean;
  newImageUrl: string;
  setNewImageUrl: (url: string) => void;
  onUploadGalleryImage: (file: File) => void;
  onAddImageByUrl: () => void;
  onRemoveGalleryImage: (index: number) => void;
}

export const PortfolioGallery = ({
  project,
  galleryImages,
  isUploading,
  newImageUrl,
  setNewImageUrl,
  onUploadGalleryImage,
  onAddImageByUrl,
  onRemoveGalleryImage,
}: PortfolioGalleryProps) => {
  return (
    <div className="border border-gradient-start/30 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Icon name="Images" size={18} />
        Галерея проекта (до 5 изображений)
        <span className="text-xs text-gray-500 ml-2">
          {galleryImages.length}/5
        </span>
      </h4>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            disabled={isUploading || galleryImages.length >= 5}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadGalleryImage(file);
              e.target.value = '';
            }}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2">
          <Input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Или вставьте URL изображения"
            disabled={galleryImages.length >= 5}
            onKeyDown={(e) => e.key === 'Enter' && onAddImageByUrl()}
          />
          <Button
            type="button"
            onClick={onAddImageByUrl}
            disabled={!newImageUrl.trim() || galleryImages.length >= 5}
            size="sm"
          >
            <Icon name="Plus" size={16} />
          </Button>
        </div>

        {galleryImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            {galleryImages.map((url, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover" />
                <button
                  onClick={() => onRemoveGalleryImage(index)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="X" size={16} />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
