import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface AnalyticsSettings {
  google_analytics_id: string;
  yandex_metrika_id: string;
  yandex_webmaster_user_id: string;
  ai_seo_enabled: boolean;
}

interface MetricsTabProps {
  settings: AnalyticsSettings;
  setSettings: (settings: AnalyticsSettings) => void;
  saving: boolean;
  handleSave: () => void;
}

export default function MetricsTab({ settings, setSettings, saving, handleSave }: MetricsTabProps) {
  return (
    <TabsContent value="metrics" className="space-y-6 mt-6">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="BarChart3" size={24} />
            Подключение аналитики
          </CardTitle>
          <CardDescription className="text-gray-400">
            Интегрируйте Google Analytics и Яндекс.Метрику для отслеживания посещений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="google" className="text-gray-300 flex items-center gap-2 mb-2">
                <Icon name="Globe" size={16} />
                Google Analytics ID
              </Label>
              <Input
                id="google"
                placeholder="G-XXXXXXXXXX или UA-XXXXXXXXX-X"
                value={settings.google_analytics_id}
                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Найдите ID в настройках Google Analytics
              </p>
            </div>

            <div>
              <Label htmlFor="yandex" className="text-gray-300 flex items-center gap-2 mb-2">
                <Icon name="Activity" size={16} />
                Яндекс.Метрика ID
              </Label>
              <Input
                id="yandex"
                placeholder="12345678"
                value={settings.yandex_metrika_id}
                onChange={(e) => setSettings({ ...settings, yandex_metrika_id: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Номер счётчика из панели Яндекс.Метрики
              </p>
            </div>

            <div>
              <Label htmlFor="webmaster" className="text-gray-300 flex items-center gap-2 mb-2">
                <Icon name="FileSearch" size={16} />
                Яндекс.Вебмастер User ID
              </Label>
              <Input
                id="webmaster"
                placeholder="User ID из Яндекс.Вебмастера"
                value={settings.yandex_webmaster_user_id}
                onChange={(e) => setSettings({ ...settings, yandex_webmaster_user_id: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                OAuth токен для получения замечаний от Яндекса
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить настройки
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
