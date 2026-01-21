import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, Ban, Users } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface BotLog {
  id: number;
  user_agent: string;
  is_blocked: boolean;
  ip_address: string;
  created_at: string;
}

interface BotStats {
  total_attempts: number;
  blocked_count: number;
  allowed_count: number;
  unique_ips: number;
}

interface BotStatsResponse {
  stats: BotStats;
  logs: BotLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface BotAdminProps {
  isEmbedded?: boolean;
}

const BotAdmin = ({ isEmbedded = false }: BotAdminProps) => {
  const { data, isLoading } = useQuery<BotStatsResponse>({
    queryKey: ['bot-stats'],
    queryFn: async () => {
      const response = await fetch('/api/9e365935-6746-496e-8c6f-c4dddd4c655c');
      if (!response.ok) throw new Error('Failed to fetch bot stats');
      return response.json();
    },
    refetchInterval: 10000
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const truncateUserAgent = (ua: string, maxLength = 80) => {
    if (ua.length <= maxLength) return ua;
    return ua.substring(0, maxLength) + '...';
  };

  const loadingContent = (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-700 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    if (isEmbedded) {
      return loadingContent;
    }
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {loadingContent}
        </div>
      </AdminLayout>
    );
  }

  const content = (
    <div className="space-y-8">
      {!isEmbedded && (
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Панель управления ботами
          </h1>
          <p className="text-gray-400">Мониторинг и статистика посещений ботов</p>
        </div>
      )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Всего попыток</CardTitle>
              <Activity className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data?.stats.total_attempts || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Заблокировано</CardTitle>
              <Ban className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{data?.stats.blocked_count || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Разрешено</CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{data?.stats.allowed_count || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Уникальных IP</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{data?.stats.unique_ips || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">История посещений</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {data?.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.is_blocked ? 'destructive' : 'default'}>
                        {log.is_blocked ? 'Заблокирован' : 'Разрешён'}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 font-mono break-all">
                      {truncateUserAgent(log.user_agent)}
                    </p>
                    <p className="text-xs text-gray-500">IP: {log.ip_address}</p>
                  </div>
                </div>
              ))}
              
              {(!data?.logs || data.logs.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Пока нет записей о ботах</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {content}
      </div>
    </AdminLayout>
  );
};

export default BotAdmin;