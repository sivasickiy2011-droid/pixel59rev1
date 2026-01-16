import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import PartnerForm from './PartnerForm';
import PartnerCard from './PartnerCard';

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
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PartnerLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/pyapi/c7b03587-cdba-48a4-ac48-9aa2775ff9a0');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
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
    try {
      const response = await fetch('/pyapi/c7b03587-cdba-48a4-ac48-9aa2775ff9a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          display_order: 0,
          is_active: true
        });
        fetchPartners();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить партнёра',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const partner = partners.find(p => p.id === id);
      if (!partner) return;

      const response = await fetch('/pyapi/c7b03587-cdba-48a4-ac48-9aa2775ff9a0', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partner)
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Партнёр обновлён'
        });
        setEditingId(null);
        fetchPartners();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить партнёра',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить партнёра?')) return;

    try {
      const response = await fetch(`/pyapi/c7b03587-cdba-48a4-ac48-9aa2775ff9a0?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Партнёр удалён'
        });
        fetchPartners();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить партнёра',
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