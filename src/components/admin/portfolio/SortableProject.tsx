import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PortfolioProject } from './types';

interface SortableProjectProps {
  project: PortfolioProject;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export const SortableProject = ({ project, onEdit, onDelete, isSelected, onToggleSelect }: SortableProjectProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="aspect-video relative bg-gray-100 dark:bg-gray-900">
        {(project.preview_image_url || project.image_url || project.carousel_image_url) ? (
          <img
            src={project.preview_image_url || project.image_url || project.carousel_image_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : project.website_url ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-4">
              <Icon name="Globe" size={48} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Iframe: {new URL(project.website_url).hostname}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="ImageOff" size={48} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}
        {!project.is_active && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg">
            Скрыт
          </div>
        )}
        {project.website_url && !(project.preview_image_url || project.image_url || project.carousel_image_url) && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-1">
            <Icon name="Monitor" size={12} />
            iframe
          </div>
        )}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 p-2 rounded cursor-move hover:bg-white dark:hover:bg-gray-800 transition-colors"
          title="Перетащите для изменения порядка"
        >
          <Icon name="GripVertical" size={20} />
        </div>
        <div className="absolute bottom-2 left-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-5 h-5 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            {project.title}
          </h3>
          {project.gallery_images && project.gallery_images.length > 0 && (
            <div className="flex items-center gap-1 text-xs bg-gradient-to-r from-gradient-start to-gradient-mid text-white px-2 py-1 rounded-full">
              <Icon name="Images" size={12} />
              <span>{project.gallery_images.length}</span>
            </div>
          )}
        </div>
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Icon name="Edit" size={16} className="mr-1" />
            Редактировать
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};