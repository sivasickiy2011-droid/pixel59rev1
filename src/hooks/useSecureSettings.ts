import { useState, useEffect, useCallback } from 'react';

const API_URL = '/pyapi/fa56bf24-1e0b-4d49-8511-6befcd962d6f';

interface SecureSetting {
  id: number;
  key: string;
  value: string;
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useSecureSettings(category?: string) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_auth');
      const url = category 
        ? `${API_URL}?category=${category}`
        : API_URL;
      
      const response = await fetch(url, {
        headers: {
          'X-Admin-Token': token || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        const settingsMap: Record<string, string> = {};
        
        (data.settings || []).forEach((setting: SecureSetting) => {
          settingsMap[setting.key] = setting.value;
        });
        
        setSettings(settingsMap);
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const getSetting = useCallback((key: string): string | undefined => {
    return settings[key];
  }, [settings]);

  const setSetting = useCallback(async (
    key: string,
    value: string,
    settingCategory: string = 'general',
    description?: string
  ): Promise<boolean> => {
    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || ''
        },
        body: JSON.stringify({
          key,
          value,
          category: settingCategory,
          description
        })
      });

      if (response.ok) {
        await loadSettings();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save setting:', err);
      return false;
    }
  }, [loadSettings]);

  const deleteSetting = useCallback(async (key: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('admin_auth');
      const response = await fetch(`${API_URL}?key=${key}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': token || ''
        }
      });

      if (response.ok) {
        await loadSettings();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete setting:', err);
      return false;
    }
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    getSetting,
    setSetting,
    deleteSetting,
    reload: loadSettings
  };
}

export function useSecureSetting(key: string, category?: string) {
  const { settings, loading, error, setSetting, reload } = useSecureSettings(category);
  const value = settings[key];

  const updateValue = useCallback(async (
    newValue: string,
    settingCategory: string = category || 'general',
    description?: string
  ) => {
    return await setSetting(key, newValue, settingCategory, description);
  }, [key, category, setSetting]);

  return {
    value,
    loading,
    error,
    updateValue,
    reload
  };
}
