import { useState, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface ChangePasswordProps {
  isEmbedded?: boolean;
}

const ChangePassword = ({ isEmbedded = false }: ChangePasswordProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newHash, setNewHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setNewHash('');

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setError('Новый пароль должен быть не менее 8 символов');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/743e5e24-86d0-4a6a-90ac-c71d80a5b822?action=change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setNewHash(data.new_hash);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Ошибка при смене пароля');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(newHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const content = (
    <div className="space-y-6">
      {!isEmbedded && (
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Смена пароля
          </h1>
          <p className="text-gray-400">Измените пароль администратора</p>
        </div>
      )}

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Key className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Изменить пароль</CardTitle>
                <CardDescription className="text-gray-400">
                  Введите текущий пароль и новый пароль
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-gray-300">
                  Текущий пароль
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-300">
                  Новый пароль
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-300">
                  Подтвердите новый пароль
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-500/10 border-green-500/30 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Пароль успешно изменён! Скопируйте новый хеш ниже и добавьте его в секреты проекта.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Изменение...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Изменить пароль
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {newHash && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl text-white">Новый хеш пароля</CardTitle>
              <CardDescription className="text-gray-400">
                Скопируйте этот хеш и обновите секрет ADMIN_PASSWORD_HASH в настройках проекта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900/70 border border-gray-700 rounded-lg p-4 text-sm text-green-400 font-mono overflow-x-auto">
                  {newHash}
                </pre>
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Копировать
                    </>
                  )}
                </Button>
              </div>

              <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Важно:</strong> После копирования хеша, откройте настройки секретов проекта и обновите значение секрета <code className="bg-gray-900/50 px-2 py-1 rounded">ADMIN_PASSWORD_HASH</code> на новый хеш. Только после этого новый пароль вступит в силу.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {content}
      </div>
    </AdminLayout>
  );
};

export default ChangePassword;