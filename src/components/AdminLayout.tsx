import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileCheck, LayoutDashboard, LogOut, Users, BarChart3, FolderKanban, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admin/consents', label: 'Согласия', icon: FileCheck },
    { path: '/admin/partners', label: 'Партнёры', icon: Users },
    { path: '/admin/content', label: 'Контент', icon: FolderKanban },
    { path: '/admin/analytics', label: 'Аналитика и SEO', icon: BarChart3 },
    { path: '/admin/security', label: 'Безопасность', icon: ShieldCheck },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_auth_time');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">На сайт</span>
              </Link>

              <div className="flex items-center gap-2 text-gray-500">
                <LayoutDashboard className="h-5 w-5" />
                <span className="font-semibold">Админ-панель</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${isActive(path)
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
              </div>
              
              <div className="h-8 w-px bg-gray-700" />
              
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;