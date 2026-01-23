import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PortfolioProject } from './portfolio/types';
import { SortableProject } from './portfolio/SortableProject';
import { PortfolioModal } from './portfolio/PortfolioModal';
import { requireAdminAuthHeaders } from '@/utils/adminAuth';

const PortfolioAdmin = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const emptyProject: PortfolioProject = {
    title: '',
    description: '',
    image_url: '',
    gallery_images: [],
    website_url: '',
    display_order: 0,
    is_active: true,
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/99ddd15c-93b5-4d9e-8536-31e6f6630304', {
        headers: requireAdminAuthHeaders(),
      });
        if (response.ok) {
          const data = await response.json();
          const normalized = Array.isArray(data) ? data : [];
          setProjects(normalized);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);

      const newProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(newProjects);

      const updates = newProjects.map((project, index) => ({
        ...project,
        display_order: index,
      }));

      try {
        await Promise.all(
          updates.map((project) =>
            fetch('/api/99ddd15c-93b5-4d9e-8536-31e6f6630304', {
              method: 'PUT',
              headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
              body: JSON.stringify(project),
            })
          )
        );
      } catch (error) {
        console.error('Failed to update order:', error);
        fetchProjects();
      }
    }
  };

  const handleSave = async () => {
    if (!editingProject) return;

    if (editingProject.title.length > 10) {
      alert('Заголовок не должен превышать 10 символов');
      return;
    }

    const method = editingProject.id ? 'PUT' : 'POST';
    
    try {
      const response = await fetch('/api/99ddd15c-93b5-4d9e-8536-31e6f6630304', {
        method,
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(editingProject),
      });

      if (response.ok) {
        await fetchProjects();
        setIsModalOpen(false);
        setEditingProject(null);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Ошибка при сохранении проекта');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить проект?')) return;

    try {
      const response = await fetch('/api/99ddd15c-93b5-4d9e-8536-31e6f6630304', {
        method: 'DELETE',
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchProjects();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Ошибка при удалении проекта');
    }
  };

  const openModal = (project?: PortfolioProject) => {
    setEditingProject(project || { ...emptyProject });
    setIsModalOpen(true);
  };

  const toggleProjectSelection = (id: number) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProjects(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p.id!)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) return;
    
    if (!confirm(`Удалить выбранные проекты (${selectedProjects.size} шт.)?`)) return;

    try {
      const deletePromises = Array.from(selectedProjects).map(id =>
        fetch('/api/99ddd15c-93b5-4d9e-8536-31e6f6630304', {
          method: 'DELETE',
          headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id }),
        })
      );

      await Promise.all(deletePromises);
      setSelectedProjects(new Set());
      await fetchProjects();
    } catch (error) {
      console.error('Failed to delete projects:', error);
      alert('Ошибка при удалении проектов');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Портфолио</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Перетаскивайте карточки для изменения порядка отображения
          </p>
        </div>
        <div className="flex gap-3">
          {selectedProjects.size > 0 && (
            <Button 
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Icon name="Trash2" size={20} className="mr-2" />
              Удалить ({selectedProjects.size})
            </Button>
          )}
          <Button onClick={() => openModal()}>
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить проект
          </Button>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedProjects.size === projects.length}
              onChange={toggleSelectAll}
              className="w-4 h-4"
            />
            <span>Выбрать все</span>
          </label>
          {selectedProjects.size > 0 && (
            <span>Выбрано: {selectedProjects.size} из {projects.length}</span>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Icon name="FolderOpen" size={48} className="mx-auto mb-4 opacity-50" />
          <p className="mb-4">Проектов пока нет</p>
          <Button onClick={() => openModal()}>Добавить первый проект</Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projects.map((p) => p.id!)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <SortableProject
                  key={project.id}
                  project={project}
                  onEdit={() => openModal(project)}
                  onDelete={() => project.id && handleDelete(project.id)}
                  isSelected={selectedProjects.has(project.id!)}
                  onToggleSelect={() => toggleProjectSelection(project.id!)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isModalOpen && editingProject && (
        <PortfolioModal
          project={editingProject}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onChange={setEditingProject}
        />
      )}
    </div>
  );
};

export default PortfolioAdmin;
