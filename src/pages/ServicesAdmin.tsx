import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import AdminLayout from '@/components/AdminLayout';

interface Service {
  id: number;
  service_id: string;
  category: 'development' | 'promotion' | 'additional';
  title: string;
  description: string;
  price: number;
  is_active: boolean;
  display_order: number;
}

interface ServicesAdminProps {
  isEmbedded?: boolean;
}

const ServicesAdmin = ({ isEmbedded = false }: ServicesAdminProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const categoryLabels = {
    development: 'Разработка',
    promotion: 'Продвижение',
    additional: 'Дополнительные услуги'
  };

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/91a16400-6baa-4748-9387-c7cdad64ce9c');

      if (response.ok) {
        const data = await response.json();
        setServices(data.services);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Не удалось загрузить услуги');
      }
    } catch (err) {
      setError('Ошибка при загрузке услуг');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async () => {
    if (!editingService) return;

    try {
      const method = editingService.id ? 'PUT' : 'POST';
      
      const response = await fetch('/api/91a16400-6baa-4748-9387-c7cdad64ce9c', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingService)
      });

      if (response.ok) {
        await loadServices();
        setIsDialogOpen(false);
        setEditingService(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Не удалось сохранить услугу');
      }
    } catch (err) {
      setError('Ошибка при сохранении услуги');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту услугу?')) return;

    try {
      const response = await fetch('/api/91a16400-6baa-4748-9387-c7cdad64ce9c', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service_id: serviceId })
      });

      if (response.ok) {
        await loadServices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Не удалось удалить услугу');
      }
    } catch (err) {
      setError('Ошибка при удалении услуги');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const response = await fetch('/api/91a16400-6baa-4748-9387-c7cdad64ce9c', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: service.service_id,
          is_active: !service.is_active
        })
      });

      if (response.ok) {
        await loadServices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Не удалось изменить статус услуги');
      }
    } catch (err) {
      setError('Ошибка при изменении статуса');
    }
  };

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const content = (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <Icon name="AlertCircle" size={16} />
          <AlertDescription className="ml-2 text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[280px] bg-gray-800/50 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Все категории</SelectItem>
            <SelectItem value="development">Разработка</SelectItem>
            <SelectItem value="promotion">Продвижение</SelectItem>
            <SelectItem value="additional">Дополнительные услуги</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingService({
                  id: 0,
                  service_id: '',
                  category: 'development',
                  title: '',
                  description: '',
                  price: 0,
                  is_active: true,
                  display_order: 0
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить услугу
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingService?.id ? 'Редактировать услугу' : 'Новая услуга'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Заполните информацию об услуге
              </DialogDescription>
            </DialogHeader>

            {editingService && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID услуги</Label>
                    <Input
                      value={editingService.service_id}
                      onChange={(e) => setEditingService({ ...editingService, service_id: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="corporate"
                    />
                  </div>
                  <div>
                    <Label>Категория</Label>
                    <Select
                      value={editingService.category}
                      onValueChange={(value: any) => setEditingService({ ...editingService, category: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white z-[9999999999]">
                        <SelectItem value="development" className="text-white hover:bg-gray-700 cursor-pointer">Разработка</SelectItem>
                        <SelectItem value="promotion" className="text-white hover:bg-gray-700 cursor-pointer">Продвижение</SelectItem>
                        <SelectItem value="additional" className="text-white hover:bg-gray-700 cursor-pointer">Дополнительные услуги</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Название</Label>
                  <Input
                    value={editingService.title}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Корпоративный сайт"
                  />
                </div>

                <div>
                  <Label>Описание</Label>
                  <Textarea
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    placeholder="Профессиональная платформа для презентации вашей компании"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Цена (₽)</Label>
                    <Input
                      type="number"
                      value={editingService.price}
                      onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label>Порядок отображения</Label>
                    <Input
                      type="number"
                      value={editingService.display_order}
                      onChange={(e) => setEditingService({ ...editingService, display_order: parseInt(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingService(null);
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleSaveService}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" className="animate-spin text-blue-400" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(
            filteredServices.reduce((acc, service) => {
              if (!acc[service.category]) acc[service.category] = [];
              acc[service.category].push(service);
              return acc;
            }, {} as Record<string, Service[]>)
          ).map(([category, categoryServices]) => (
            <Card key={category} className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {categoryServices.length} {categoryServices.length === 1 ? 'услуга' : 'услуг'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryServices.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{service.title}</h3>
                          <span className="text-sm text-gray-400">
                            {service.price.toLocaleString()} ₽
                          </span>
                          {!service.is_active && (
                            <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">
                              Неактивна
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{service.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(service)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Icon name={service.is_active ? "Eye" : "EyeOff"} size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingService(service);
                            setIsDialogOpen(true);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteService(service.service_id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Package" size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Услуги не найдены</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Услуги и продукты</h1>
          <p className="text-gray-400">Управление услугами из калькулятора</p>
        </div>
        {content}
      </div>
    </AdminLayout>
  );
};

export default ServicesAdmin;