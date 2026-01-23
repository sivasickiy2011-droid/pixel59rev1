import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Users, Mail, Phone, Search, Filter, X, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import AdminLayout from '@/components/AdminLayout';
import { requireAdminAuthHeaders } from '@/utils/adminAuth';

interface Consent {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  cookies: boolean;
  terms: boolean;
  privacy: boolean;
  ipAddress: string;
  createdAt: string;
}

interface ConsentResponse {
  consents: Consent[];
}

const ConsentAdmin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'phone' | 'email' | 'cookies' | 'terms' | 'privacy'>('all');

  const { data, isLoading } = useQuery<ConsentResponse>({
    queryKey: ['consents'],
    queryFn: async () => {
      const response = await fetch('/api/80536dd3-4799-47a9-893a-a756a259460e', {
        headers: requireAdminAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch consents');
      return response.json();
    },
    refetchInterval: 10000
  });

  const consentList = useMemo(() => {
    if (!Array.isArray(data?.consents)) return [];
    return data.consents;
  }, [data?.consents]);

  const filteredConsents = useMemo(() => {
    if (!consentList.length) return [];

    let filtered = consentList;

    if (filterType !== 'all') {
      filtered = filtered.filter(consent => {
        switch (filterType) {
          case 'phone':
            return consent.phone !== null;
          case 'email':
            return consent.email !== null;
          case 'cookies':
            return consent.cookies;
          case 'terms':
            return consent.terms;
          case 'privacy':
            return consent.privacy;
          default:
            return true;
        }
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(consent => 
        consent.fullName.toLowerCase().includes(query) ||
        consent.phone?.toLowerCase().includes(query) ||
        consent.email?.toLowerCase().includes(query) ||
        consent.ipAddress.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [consentList, searchQuery, filterType]);

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

  const exportToExcel = () => {
    const exportData = filteredConsents.map(consent => ({
      'ID': consent.id,
      'ФИО': consent.fullName,
      'Телефон': consent.phone || '',
      'Email': consent.email || '',
      'Cookies': consent.cookies ? 'Да' : 'Нет',
      'Соглашение': consent.terms ? 'Да' : 'Нет',
      'Конфиденциальность': consent.privacy ? 'Да' : 'Нет',
      'IP-адрес': consent.ipAddress,
      'Дата создания': formatDate(consent.createdAt)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Согласия');
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `consents_${timestamp}.xlsx`);
  };

  const exportToCSV = () => {
    const exportData = filteredConsents.map(consent => ({
      'ID': consent.id,
      'ФИО': consent.fullName,
      'Телефон': consent.phone || '',
      'Email': consent.email || '',
      'Cookies': consent.cookies ? 'Да' : 'Нет',
      'Соглашение': consent.terms ? 'Да' : 'Нет',
      'Конфиденциальность': consent.privacy ? 'Да' : 'Нет',
      'IP-адрес': consent.ipAddress,
      'Дата создания': formatDate(consent.createdAt)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `consents_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const totalConsents = filteredConsents.length;
  const withPhone = filteredConsents.filter(c => c.phone).length;
  const withEmail = filteredConsents.filter(c => c.email).length;
  const totalFetched = consentList.length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Согласия пользователей
          </h1>
          <p className="text-gray-400">Управление согласиями на обработку персональных данных</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Всего согласий</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalConsents}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">С телефоном</CardTitle>
              <Phone className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{withPhone}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">С email</CardTitle>
              <Mail className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{withEmail}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <CardTitle className="text-xl text-white">Список согласий</CardTitle>
                  <div className="text-sm text-gray-400">
                  Показано: {totalConsents} {totalFetched !== totalConsents && `из ${totalFetched}`}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={exportToExcel}
                  disabled={filteredConsents.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  onClick={exportToCSV}
                  disabled={filteredConsents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по имени, телефону, email или IP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Filter className="h-5 w-5 text-gray-400 self-center" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="all">Все записи</option>
                    <option value="phone">С телефоном</option>
                    <option value="email">С email</option>
                    <option value="cookies">Cookies</option>
                    <option value="terms">Соглашение</option>
                    <option value="privacy">Конфиденциальность</option>
                  </select>
                </div>
              </div>
              
              {(searchQuery || filterType !== 'all') && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Активные фильтры:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Поиск: "{searchQuery}"
                    </Badge>
                  )}
                  {filterType !== 'all' && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {filterType === 'phone' && 'С телефоном'}
                      {filterType === 'email' && 'С email'}
                      {filterType === 'cookies' && 'Cookies'}
                      {filterType === 'terms' && 'Соглашение'}
                      {filterType === 'privacy' && 'Конфиденциальность'}
                    </Badge>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                    }}
                    className="text-gray-400 hover:text-white transition-colors ml-2"
                  >
                    Сбросить
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredConsents.map((consent) => (
                <div
                  key={consent.id}
                  className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{consent.fullName}</h3>
                        <span className="text-xs text-gray-400">#{consent.id}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {consent.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-300">
                            <Phone className="h-3 w-3" />
                            {consent.phone}
                          </div>
                        )}
                        {consent.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-300">
                            <Mail className="h-3 w-3" />
                            {consent.email}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {consent.cookies && (
                          <Badge variant="default" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            Cookies
                          </Badge>
                        )}
                        {consent.terms && (
                          <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30">
                            Соглашение
                          </Badge>
                        )}
                        {consent.privacy && (
                          <Badge variant="default" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            Конфиденциальность
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                        <span>IP: {consent.ipAddress}</span>
                        <span>{formatDate(consent.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredConsents.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{searchQuery || filterType !== 'all' ? 'Ничего не найдено' : 'Пока нет записей о согласиях'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ConsentAdmin;
