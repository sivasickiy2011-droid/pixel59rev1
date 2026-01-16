import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import AdminLayout from '@/components/AdminLayout';

interface Partner {
  id: number;
  login: string;
  name: string;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
}

export default function Partners() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    name: '',
    discount_percent: 10,
    is_active: true
  });

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_auth');
    if (!adminAuth) {
      navigate('/admin/login');
      return;
    }
    
    loadPartners();
  }, [navigate]);

  const loadPartners = async () => {
    try {
      const adminAuth = localStorage.getItem('admin_auth');
      if (!adminAuth) return;

      const response = await fetch('/pyapi/3f1e2a11-15ea-463e-9cec-11697b90090c', {
        headers: {
          'X-Admin-Password': adminAuth
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const adminAuth = localStorage.getItem('admin_auth');
      if (!adminAuth) return;

      const url = editingPartner 
        ? '/pyapi/3f1e2a11-15ea-463e-9cec-11697b90090c'
        : '/pyapi/3f1e2a11-15ea-463e-9cec-11697b90090c';

      const body = editingPartner 
        ? { ...formData, id: editingPartner.id }
        : formData;

      const response = await fetch(url, {
        method: editingPartner ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': adminAuth
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowDialog(false);
        setEditingPartner(null);
        setFormData({
          login: '',
          password: '',
          name: '',
          discount_percent: 10,
          is_active: true
        });
        loadPartners();
      }
    } catch (error) {
      console.error('Error saving partner:', error);
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      login: partner.login,
      password: '',
      name: partner.name,
      discount_percent: partner.discount_percent,
      is_active: partner.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого партнёра?')) return;

    try {
      const adminAuth = localStorage.getItem('admin_auth');
      if (!adminAuth) return;

      const response = await fetch(`/pyapi/3f1e2a11-15ea-463e-9cec-11697b90090c?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': adminAuth
        }
      });

      if (response.ok) {
        loadPartners();
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Список партнёров</h2>
            <Button onClick={() => {
              setEditingPartner(null);
              setFormData({
                login: '',
                password: '',
                name: '',
                discount_percent: 10,
                is_active: true
              });
              setShowDialog(true);
            }}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить партнёра
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Логин</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Скидка %</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>{partner.id}</TableCell>
                  <TableCell className="font-medium">{partner.login}</TableCell>
                  <TableCell>{partner.name}</TableCell>
                  <TableCell>{partner.discount_percent}%</TableCell>
                  <TableCell>
                    {partner.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                        <Icon name="CheckCircle" size={12} />
                        Активен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
                        <Icon name="XCircle" size={12} />
                        Неактивен
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(partner.created_at).toLocaleDateString('ru-RU')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(partner)}
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(partner.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {partners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Партнёры не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Редактировать партнёра' : 'Добавить партнёра'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Логин <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                placeholder="partner_login"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Пароль {editingPartner ? '' : <span className="text-red-500">*</span>}
              </label>
              <Input
                type="password"
                required={!editingPartner}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingPartner ? 'Оставьте пустым для сохранения текущего' : 'Введите пароль'}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Наименование <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название компании"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Скидка (%) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                required
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Активен
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
              >
                Отмена
              </Button>
              <Button type="submit">
                {editingPartner ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}