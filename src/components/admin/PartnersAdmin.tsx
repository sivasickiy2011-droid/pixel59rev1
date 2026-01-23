import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import PartnerForm from './PartnerForm';
import PartnerCard from './PartnerCard';
import { requireAdminAuthHeaders } from '@/utils/adminAuth';

interface PartnerLogo {
  id: number;
  name: string;
  logo_url: string;
  website_url: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const PartnersAdmin = () => {
  // const navigate = useNavigate(); // удалено, не используется
  const [partners, setPartners] = useState<PartnerLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/c7b03587-cdba-48a4-ac48-9aa2775ff9a0', {
        headers: requireAdminAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setPartners(data);
        } else {
          console.error('Unexpected partners payload', data);
          toast({
            title: 'Ошибка',
            description: 'Сервер вернул некорректный список партнёров',
            variant: 'destructive'
          });
          setPartners([]);
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить партнёров',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleAdd = async () => {
    // Валидация названия
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите название партнёра',
        variant: 'destructive'
      });
      return;
    }

    if (formData.name.trim().length < 2) {
      toast({
        title: 'Ошибка',
        description: 'Название должно содержать минимум 2 символа',
        variant: 'destructive'
      });
      return;
    }

    if (formData.name.trim().length > 100) {
      toast({
        title: 'Ошибка',
        description: 'Название не должно превышать 100 символов',
        variant: 'destructive'
      });
      return;
    }

    // Валидация логотипа
    if (!formData.logo_url.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Загрузите логотип партнёра',
        variant: 'destructive'
      });
      return;
    }

    // Валидация URL
    if (!formData.website_url.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите сайт партнёра',
        variant: 'destructive'
      });
      return;
    }

    try {
      new URL(formData.website_url);
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный URL (начинается с http:// или https://)',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/c7b03587-cdba-48a4-ac48-9aa2775ff9a0', {
        method: 'POST',
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Партнёр добавлен'
        });
        setIsAdding(false);
        setFormData({
          name: '',
          logo_url: '',
          website_url: '',
          is_active: true
        });
        fetchPartners();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        toast({
          title: 'Ошибка',
          description: errorData.error || 'Не удалось добавить партнёра',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error adding partner:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить партнёра. Проверьте соединение.',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async (id: number) => {
    setSavingId(id);
    
    try {
      const partner = partners.find(p => p.id === id);
      if (!partner) return;

      // Валидация названия
      if (!partner.name.trim()) {
        toast({
          title: 'Ошибка',
          description: 'Введите название партнёра',
          variant: 'destructive'
        });
        return;
      }

      if (partner.name.trim().length < 2) {
        toast({
          title: 'Ошибка',
          description: 'Название должно содержать минимум 2 символа',
          variant: 'destructive'
        });
        return;
      }

      if (partner.name.trim().length > 100) {
        toast({
          title: 'Ошибка',
          description: 'Название не должно превышать 100 символов',
          variant: 'destructive'
        });
        return;
      }

      // Валидация логотипа
      if (!partner.logo_url.trim()) {
        toast({
          title: 'Ошибка',
          description: 'Загрузите логотип партнёра',
          variant: 'destructive'
        });
        return;
      }

      // Валидация URL
      if (!partner.website_url.trim()) {
        toast({
          title: 'Ошибка',
          description: 'Введите сайт партнёра',
          variant: 'destructive'
        });
        return;
      }

      try {
        new URL(partner.website_url);
      } catch {
        toast({
          title: 'Ошибка',
          description: 'Введите корректный URL (начинается с http:// или https://)',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/c7b03587-cdba-48a4-ac48-9aa2775ff9a0', {
        method: 'PUT',
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(partner)
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Партнёр обновлён'
        });
        setEditingId(null);
        fetchPartners();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        toast({
          title: 'Ошибка',
          description: errorData.error || 'Не удалось обновить партнёра',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить партнёра. Проверьте соединение.',
        variant: 'destructive'
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const partner = partners.find(p => p.id === id);
    if (!partner) return;

    const confirmMessage = `Вы уверены, что хотите удалить партнёра "${partner.name}"?\n\n` +
      `Сайт: ${partner.website_url}\n` +
      `Статус: ${partner.is_active ? 'Активен' : 'Неактивен'}\n\n` +
      `Это действие нельзя отменить.`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/c7b03587-cdba-48a4-ac48-9aa2775ff9a0?id=${id}`, {
        method: 'DELETE',
        headers: requireAdminAuthHeaders({ 'Content-Type': 'application/json' })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: `Партнёр "${partner.name}" удалён`
        });
        fetchPartners();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
        toast({
          title: 'Ошибка',
          description: errorData.error || 'Не удалось удалить партнёра',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить партнёра. Проверьте соединение.',
        variant: 'destructive'
      });
    }
  };

  const updatePartner = (id: number, field: keyof PartnerLogo, value: any) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p));
  };



  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-start mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">
          Логотипы партнёров
        </h2>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-gradient-to-r from-gradient-start to-gradient-mid text-white"
        >
          <Icon name={isAdding ? 'X' : 'Plus'} size={20} className="mr-2" />
          {isAdding ? 'Отмена' : 'Добавить партнёра'}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gradient-start/20 space-y-4">
          <h3 className="text-xl font-bold text-black">Новый партнёр</h3>
          
          <PartnerForm
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleAdd}
            submitLabel="Сохранить"
          />
        </div>
      )}

      <div className="grid gap-4">
        {partners.map((partner) => (
          <PartnerCard
            key={partner.id}
            partner={partner}
            isEditing={editingId === partner.id}
            isSaving={savingId === partner.id}
            onEdit={() => setEditingId(partner.id)}
            onUpdate={updatePartner}
            onSave={() => handleUpdate(partner.id)}
            onCancel={() => setEditingId(null)}
            onDelete={() => handleDelete(partner.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PartnersAdmin;
