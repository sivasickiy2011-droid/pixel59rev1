import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle, XCircle, Activity, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface LoginLog {
  id: number;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: string;
}

interface LoginStats {
  total_attempts: number;
  success_count: number;
  failed_count: number;
}

interface LoginLogsResponse {
  logs: LoginLog[];
  stats: LoginStats;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface LoginHistoryProps {
  isEmbedded?: boolean;
}

const LoginHistory = ({ isEmbedded = false }: LoginHistoryProps) => {
  const { data, isLoading } = useQuery<LoginLogsResponse>({
    queryKey: ['admin-login-logs'],
    queryFn: async () => {
      const response = await fetch('/pyapi/4ea0202f-2619-4cf6-bc32-78c81e7beab3');
      if (!response.ok) throw new Error('Failed to fetch login logs');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
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
            История входов
          </h1>
          <p className="text-gray-400">Мониторинг попыток входа в админ-панель</p>
        </div>
      )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <CardTitle className="text-sm font-medium text-gray-300">Успешных</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{data?.stats.success_count || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Неудачных</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{data?.stats.failed_count || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">Лог попыток входа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {data?.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={log.success ? 'default' : 'destructive'}
                        className={log.success ? 'bg-green-500/20 text-green-300 border-green-500/30' : ''}
                      >
                        {log.success ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Успешный вход
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Неудачная попытка
                          </>
                        )}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-300">
                        <span className="text-gray-500">IP:</span> {log.ip_address}
                      </p>
                      <p className="text-xs text-gray-400 font-mono break-all">
                        {truncateUserAgent(log.user_agent)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!data?.logs || data.logs.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Пока нет записей о входах</p>
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

export default LoginHistory;