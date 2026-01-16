import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { migrateSettingsToVault, hasUnmigratedSettings } from '@/utils/migrateSettings';
import { SecureSetting, SecretFormData } from '@/components/secrets/types';
import SecretsVaultToolbar from '@/components/secrets/SecretsVaultToolbar';
import SecretForm from '@/components/secrets/SecretForm';
import SecretsList from '@/components/secrets/SecretsList';

interface SecretsVaultProps {
  isEmbedded?: boolean;
}

const SecretsVault = ({ isEmbedded = false }: SecretsVaultProps) => {
  const [settings, setSettings] = useState<SecureSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMigrationAlert, setShowMigrationAlert] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [copyingSecrets, setCopyingSecrets] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<SecretFormData>({
    key: '',
    value: '',
    category: 'webhooks',
    description: ''
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_auth');
      const url = selectedCategory === 'all' 
        ? '/api/fa56bf24-1e0b-4d49-8511-6befcd962d6f'
        : `/api/fa56bf24-1e0b-4d49-8511-6befcd962d6f?category=${selectedCategory}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Admin-Token': token || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [selectedCategory]);

  useEffect(() => {
    setShowMigrationAlert(hasUnmigratedSettings());
  }, []);

  const handleMigration = async () => {
    setMigrating(true);
    const result = await migrateSettingsToVault();
    setMigrating(false);
    
    if (result.success) {
      setShowMigrationAlert(false);
      await loadSettings();
      alert(result.message);
    } else {
      alert('Ошибка миграции: ' + result.error);
    }
  };

  const handleCopyProjectSecrets = async () => {
    if (!confirm('Скопировать секреты из проектных переменных в хранилище базы данных? Это позволит редактировать их через админ-панель.')) {
      return;
    }

    setCopyingSecrets(true);
    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch('/api/961bcfd3-a4a3-4d7e-b238-7d19be6f98e1', {
        method: 'POST',
        headers: {
          'X-Admin-Token': token || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        await loadSettings();
        alert(`✅ ${result.message}\n\nСкопировано: ${result.copied.join(', ')}\n${result.skipped.length > 0 ? `Пропущено: ${result.skipped.join(', ')}` : ''}`);
      } else {
        const error = await response.text();
        alert('Ошибка копирования: ' + error);
      }
    } catch (error) {
      console.error('Failed to copy secrets:', error);
      alert('Ошибка копирования секретов');
    } finally {
      setCopyingSecrets(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Очистить кеш секретов в backend функциях? Это применит все изменения мгновенно.')) {
      return;
    }

    setClearingCache(true);
    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch('/api/f8daa3d3-22ba-4629-ac39-29eda98d18de', {
        method: 'POST',
        headers: {
          'X-Admin-Token': token || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}\n\n${result.info}`);
      } else {
        const error = await response.text();
        alert('Ошибка: ' + error);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Ошибка очистки кеша');
    } finally {
      setClearingCache(false);
    }
  };

  const handleSave = async () => {
    if (!formData.key || !formData.value) {
      alert('Заполните все обязательные поля');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_auth');
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch('/api/fa56bf24-1e0b-4d49-8511-6befcd962d6f', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || ''
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ key: '', value: '', category: 'webhooks', description: '' });
        setShowAddForm(false);
        setEditingId(null);
        await loadSettings();
        alert(editingId ? 'Секрет успешно обновлён!' : 'Секрет успешно создан!');
      } else {
        const error = await response.json();
        alert('Ошибка: ' + (error.error || 'Не удалось сохранить'));
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
      alert('Ошибка сохранения настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Удалить эту настройку?')) return;

    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch(`/api/fa56bf24-1e0b-4d49-8511-6befcd962d6f?key=${key}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': token || ''
        }
      });

      if (response.ok) {
        await loadSettings();
      }
    } catch (error) {
      console.error('Failed to delete setting:', error);
    }
  };

  const handleEdit = (setting: SecureSetting) => {
    setFormData({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description || ''
    });
    setEditingId(setting.id);
    setShowAddForm(true);
    setShowPassword(true);
  };

  const handleAddNew = () => {
    setShowAddForm(!showAddForm);
    setEditingId(null);
    setShowPassword(false);
    setFormData({ key: '', value: '', category: 'webhooks', description: '' });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setShowPassword(false);
    setFormData({ key: '', value: '', category: 'webhooks', description: '' });
  };

  const content = (
    <div className="space-y-6">
      <Alert className="bg-blue-900/20 border-blue-500/30">
        <Icon name="Info" className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200 text-sm">
          <strong>Как это работает:</strong> Секреты хранятся в зашифрованной БД. Backend функции читают их оттуда (с кешированием). 
          После изменения секрета нажмите <strong>"Очистить кеш"</strong> для мгновенного применения.
        </AlertDescription>
      </Alert>

      {showMigrationAlert && (
        <Alert className="bg-blue-900/30 border-blue-500/50">
          <Icon name="AlertCircle" className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            Обнаружены настройки в старом формате (localStorage). 
            <Button
              onClick={handleMigration}
              disabled={migrating}
              size="sm"
              className="ml-3 bg-blue-600 hover:bg-blue-700"
            >
              {migrating ? 'Переношу...' : 'Перенести в защищённое хранилище'}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <SecretsVaultToolbar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        settingsCount={settings.length}
        clearingCache={clearingCache}
        copyingSecrets={copyingSecrets}
        onClearCache={handleClearCache}
        onCopyProjectSecrets={handleCopyProjectSecrets}
        onAddNew={handleAddNew}
      />

      {showAddForm && (
        <SecretForm
          formData={formData}
          setFormData={setFormData}
          editingId={editingId}
          saving={saving}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <SecretsList
        settings={settings}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Icon name="Lock" className="h-6 w-6" />
          Хранилище секретов
        </CardTitle>
        <CardDescription className="text-gray-400">
          Безопасное хранение вебхуков, API ключей и других конфиденциальных данных с шифрованием
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
};

export default SecretsVault;
