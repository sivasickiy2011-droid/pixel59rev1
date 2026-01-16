import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface VisitData {
  date: string;
  visits: number;
  unique: number;
  pageViews: number;
}

interface TopPage {
  page: string;
  views: number;
}

interface Device {
  type: string;
  count: number;
}

interface Browser {
  name: string;
  count: number;
}

interface AnalyticsData {
  visits: VisitData[];
  today: {
    visits: number;
    unique: number;
  };
  topPages: TopPage[];
  devices: Device[];
  browsers: Browser[];
}

const DEVICE_COLORS = ['#3B82F6', '#10B981', '#F59E0B'];
const BROWSER_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

export default function OwnStatsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/pyapi/70951bfa-3fca-4f90-b41f-449db03fd019?days=14');
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TabsContent value="own-stats" className="space-y-6 mt-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Icon name="Loader2" className="animate-spin text-blue-400 mb-4" size={32} />
              <p className="text-gray-400">Загрузка статистики...</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  if (error || !data) {
    return (
      <TabsContent value="own-stats" className="space-y-6 mt-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="AlertCircle" size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ошибка загрузки</h3>
              <p className="text-gray-400 text-center">{error || 'Не удалось загрузить данные'}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  const totalVisits = data.visits.reduce((sum, item) => sum + item.visits, 0);
  const avgVisits = data.visits.length > 0 ? Math.round(totalVisits / data.visits.length) : 0;

  return (
    <TabsContent value="own-stats" className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-200 mb-1">Сегодня</p>
                <p className="text-3xl font-bold text-white">{data.today.visits}</p>
                <p className="text-xs text-blue-300 mt-1">уникальных: {data.today.unique}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center">
                <Icon name="TrendingUp" size={24} className="text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-200 mb-1">Всего за 14 дней</p>
                <p className="text-3xl font-bold text-white">{totalVisits.toLocaleString()}</p>
                <p className="text-xs text-green-300 mt-1">визитов</p>
              </div>
              <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
                <Icon name="Users" size={24} className="text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200 mb-1">Среднее в день</p>
                <p className="text-3xl font-bold text-white">{avgVisits}</p>
                <p className="text-xs text-purple-300 mt-1">визитов</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
                <Icon name="BarChart3" size={24} className="text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="TrendingUp" size={24} />
            График посещений
          </CardTitle>
          <CardDescription className="text-gray-400">
            Динамика посещений за последние 14 дней
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.visits}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
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
                  name="Посещения"
                  dot={{ fill: '#3B82F6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="unique" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Уникальные"
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="FileText" size={20} />
              Популярные страницы
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topPages.length > 0 ? (
              <div className="space-y-3">
                {data.topPages.map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-sm text-gray-300 font-mono">{page.page}</span>
                    <span className="text-sm font-semibold text-blue-400">{page.views} просмотров</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">Нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="Smartphone" size={20} />
              Устройства
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.devices.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.devices}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.type}: ${entry.count}`}
                    >
                      {data.devices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">Нет данных</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="Globe" size={20} />
              Браузеры
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.browsers.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.browsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
