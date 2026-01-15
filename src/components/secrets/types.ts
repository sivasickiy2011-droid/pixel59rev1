export interface SecureSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretFormData {
  key: string;
  value: string;
  category: string;
  description: string;
}

export interface Category {
  value: string;
  label: string;
}

export const categories: Category[] = [
  { value: 'all', label: 'Все категории' },
  { value: 'webhooks', label: 'Вебхуки' },
  { value: 'analytics', label: 'Аналитика' },
  { value: 'integrations', label: 'Интеграции' },
  { value: 'api_keys', label: 'API ключи' },
  { value: 'general', label: 'Общие' }
];

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    webhooks: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    analytics: 'bg-green-500/20 text-green-300 border-green-500/30',
    integrations: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    api_keys: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    general: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  };
  return colors[category] || colors.general;
};
