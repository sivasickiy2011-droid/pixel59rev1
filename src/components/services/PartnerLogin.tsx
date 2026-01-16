import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartner } from '@/contexts/PartnerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export default function PartnerLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPartner, login, logout, discountPercent, partnerName } = usePartner();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    // Проверка на админ-логин
    if (loginValue === 'suser') {
      try {
        const response = await fetch('/pyapi/fcfd14ca-b5b0-4e96-bd94-e4db4df256d5', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        });

        if (response.ok) {
          localStorage.setItem('admin_auth', password);
          localStorage.setItem('admin_auth_time', Date.now().toString());
          
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          
          setLoginValue('');
          setPassword('');
          setError('');
          setShowLogin(false);
          setIsHovered(false);
          
          navigate('/admin/bots');
          setIsLoading(false);
          return;
        } else {
          setError('Неверный пароль администратора');
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        setError('Ошибка подключения к серверу');
        setIsLoading(false);
        return;
      }
    }
    
    // Обычный партнёрский вход
    const success = await login(loginValue, password);
    
    if (success) {
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      setLoginValue('');
      setPassword('');
      setError('');
      setShowLogin(false);
      setIsHovered(false);
    } else {
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      setError('Неверный логин или пароль');
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  if (isAdminRoute) {
    return null;
  }

  if (showLogin) {
    return (
      <div 
        className="fixed lg:top-4 lg:right-4 bottom-4 left-4 right-4 lg:bottom-auto lg:left-auto z-[99999999] bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 border-2 border-primary/20 lg:w-72 w-auto animate-in lg:slide-in-from-right slide-in-from-bottom"
        onMouseLeave={() => {
          if (!isLoading) {
            setShowLogin(false);
            setError('');
            setLoginValue('');
            setPassword('');
          }
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icon name="Users" size={20} />
            Партнерский вход
          </h3>
          <Button
            onClick={() => {
              setShowLogin(false);
              setError('');
              setLoginValue('');
              setPassword('');
            }}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <Icon name="X" size={16} />
          </Button>
        </div>
        
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Логин"
            value={loginValue}
            onChange={(e) => {
              setLoginValue(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            autoFocus
          />
          
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyPress={handleKeyPress}
            className={error ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          
          {error && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}
          
          <Button onClick={handleLogin} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Вход...
              </>
            ) : (
              <>
                <Icon name="LogIn" size={16} className="mr-2" />
                Войти
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed lg:top-4 lg:right-0 lg:bottom-auto bottom-4 left-0 lg:left-auto z-[99999999] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        onClick={() => {
          if (isPartner) {
            logout();
          } else {
            setShowLogin(true);
          }
        }}
        className={`
          ${isPartner ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} 
          text-white shadow-lg 
          lg:rounded-l-full lg:rounded-r-none rounded-r-full rounded-l-none
          lg:pr-4 lg:pl-4 pr-2 pl-2
          transition-all duration-300 ease-out text-sm
          ${isHovered ? 'lg:translate-x-0 translate-x-0' : 'lg:translate-x-[calc(100%-48px)] -translate-x-[calc(100%-60px)]'}
        `}
        size="sm"
      >
        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 flex items-center ${isHovered ? 'w-auto opacity-100' : 'lg:w-0 lg:opacity-0 w-auto opacity-100'}`}>
          {isPartner ? `${partnerName} (${discountPercent}%)` : 'Вход для партнеров'}
        </span>
        <Icon name={isPartner ? "BadgeCheck" : "Users"} size={20} className="flex-shrink-0 ml-2" />
      </Button>
    </div>
  );
}