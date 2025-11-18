import React from 'react';
import { LayoutDashboard, FolderKanban, Bug, FileBarChart, Users, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'defects', label: 'Defects', icon: Bug },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
          D
        </div>
        <span className="text-xl font-bold text-gray-800">DeepSite</span>
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
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-gray-900 rounded-lg text-sm font-medium">
          <Settings size={20} />
          Settings
        </button>
        
        <div className="mt-4 flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
              JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500 truncate">Project Manager</p>
          </div>
          <LogOut size={16} className="text-gray-400 cursor-pointer hover:text-red-500"/>
        </div>
      </div>
    </div>
  );
}