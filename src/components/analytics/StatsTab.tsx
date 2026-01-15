import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsSettings {
  google_analytics_id: string;
  yandex_metrika_id: string;
  yandex_webmaster_user_id: string;
  yandex_metrika_token: string;
  ai_seo_enabled: boolean;
}

interface VisitData {
  date: string;
  visits: number;
}

interface StatsTabProps {
  settings: AnalyticsSettings;
  setSettings: (settings: AnalyticsSettings) => void;
  visitData: VisitData[];
  loadingVisits: boolean;
  onSaveToken: () => void;
}

export default function StatsTab({ settings, setSettings, visitData, loadingVisits, onSaveToken }: StatsTabProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveToken = async () => {
    setSavingToken(true);
    setSaveSuccess(false);
    setSaveError('');
    
    try {
      await onSaveToken();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError('Ошибка подключения. Проверьте токен.');
      setTimeout(() => setSaveError(''), 5000);
    } finally {
      setSavingToken(false);
    }
  };

  return (
    <TabsContent value="stats" className="space-y-6 mt-6">
      {!settings.yandex_metrika_id ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="TrendingUp" size={24} />
              Посещаемость сайта
            </CardTitle>
            <CardDescription className="text-gray-400">
              Статистика посещений за последние 14 дней
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="BarChart3" size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Подключите Яндекс.Метрику</h3>
              <p className="text-gray-400 text-center max-w-md mb-6">
                Добавьте ID счётчика Яндекс.Метрики во вкладке "Метрики", чтобы видеть статистику посещений
              </p>
              <Button
                onClick={() => {
                  const metricsTab = document.querySelector('[value="metrics"]') as HTMLElement;
                  metricsTab?.click();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Icon name="Settings" size={16} className="mr-2" />
                Настроить метрики
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !settings.yandex_metrika_token ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="Key" size={24} />
              Подключение к API Яндекс.Метрики
            </CardTitle>
            <CardDescription className="text-gray-400">
              Для получения статистики посещений необходим OAuth токен
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="metrika-token" className="text-gray-300 flex items-center gap-2 mb-2">
                <Icon name="Lock" size={16} />
                OAuth токен Яндекс.Метрики
              </Label>
              <Input
                id="metrika-token"
                type="password"
                placeholder="y0_AgAAAAABcD...XyZ123"
                value={settings.yandex_metrika_token}
                onChange={(e) => setSettings({ ...settings, yandex_metrika_token: e.target.value })}
                className="bg-gray-900/50 border-gray-700 text-white font-mono"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Info" size={18} className="text-blue-400" />
                    <h4 className="text-sm font-semibold text-blue-300">Как получить токен?</h4>
                  </div>
                  
                  {showInstructions ? (
                    <div className="space-y-3 text-sm text-gray-300">
                      <ol className="list-decimal list-inside space-y-2 ml-2">
                        <li>
                          Перейдите по ссылке:{' '}
                          <a 
                            href="https://oauth.yandex.ru/authorize?response_type=token&client_id=6c6f8f0e8fb540f3bd90a0aa3e9ffb75"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            Получить токен
                          </a>
                        </li>
                        <li>Нажмите "Разрешить" (войдите в аккаунт Яндекса, если потребуется)</li>
                        <li>
                          После разрешения вас перенаправит на страницу с адресом типа:
                          <code className="block mt-1 p-2 bg-gray-900 rounded text-xs break-all">
                            https://oauth.yandex.ru/verification_code?...#access_token=<span className="text-yellow-400">ВАШТОКЕНЗДЕСЬ</span>&token_type=bearer...
                          </code>
                        </li>
                        <li>
                          Скопируйте всё после <code className="text-yellow-400">access_token=</code> и до следующего <code>&</code>
                        </li>
                        <li>Вставьте токен в поле выше и сохраните</li>
                      </ol>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInstructions(false)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      >
                        <Icon name="ChevronUp" size={16} className="mr-1" />
                        Свернуть инструкцию
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInstructions(true)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-0"
                    >
                      <Icon name="ChevronDown" size={16} className="mr-1" />
                      Показать инструкцию
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
                <Icon name="CheckCircle2" size={20} className="text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-300 mb-1">Токен успешно сохранен!</h4>
                  <p className="text-xs text-green-400/80">Подключение к Яндекс.Метрике установлено. Загружаем данные...</p>
                </div>
              </div>
            )}

            {saveError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <Icon name="AlertCircle" size={20} className="text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-300 mb-1">Ошибка подключения</h4>
                  <p className="text-xs text-red-400/80">{saveError}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleSaveToken}
              disabled={!settings.yandex_metrika_token || savingToken}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              {savingToken ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Проверка токена...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить токен
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="TrendingUp" size={24} />
              Посещаемость сайта
            </CardTitle>
            <CardDescription className="text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>Статистика посещений за последние 14 дней</span>
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Подключено
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings({ ...settings, yandex_metrika_token: '' })}
                className="text-gray-400 hover:text-gray-300 text-xs"
              >
                <Icon name="Key" size={14} className="mr-1" />
                Изменить токен
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVisits ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Icon name="Loader2" className="animate-spin text-blue-400 mb-4" size={32} />
                <p className="text-gray-400">Загрузка данных из Яндекс.Метрики...</p>
              </div>
            ) : visitData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                  <Icon name="BarChart3" size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Нет данных</h3>
                <p className="text-gray-400 text-center max-w-md">
                  Данные появятся после накопления статистики в Яндекс.Метрике
                </p>
              </div>
            ) : (
              <>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="visits" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">Всего посещений</p>
                    <p className="text-2xl font-bold text-white">
                      {visitData.reduce((sum, item) => sum + item.visits, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">Среднее в день</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(visitData.reduce((sum, item) => sum + item.visits, 0) / visitData.length).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">Пиковый день</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.max(...visitData.map(item => item.visits)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}