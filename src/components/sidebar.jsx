import React from 'react';
import { LayoutDashboard, FolderKanban, Bug, FileBarChart, LogOut } from 'lucide-react';
import { useAuth } from '../context/authcontex'; 

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth(); 

  const menuItems = [
    { id: 'dashboard', label: 'Доска', icon: LayoutDashboard },
    { id: 'projects', label: 'Проекты', icon: FolderKanban },
    { id: 'defects', label: 'Дефекты', icon: Bug },
    { id: 'reports', label: 'Отчеты', icon: FileBarChart },
  ];

  const getUserInitials = () => {
    if (!user || !user.username) return 'Г';
    return user.username.split(' ').map(name => name[0]).join('').toUpperCase();
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          C
        </div>
        <span className="text-xl font-bold text-gray-800">Constraction</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-1">
        <div className="mt-4 flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user ? user.username : 'Гость'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user ? 'Пользователь' : 'Войдите в систему'}
            </p>
          </div>
          <button 
            onClick={logout}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Выйти"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}