import React from 'react';
import { Search, Plus } from 'lucide-react';

export default function Header({ title }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 flex-shrink-0">
      <h1 className="text-2xl font-bold text-gray-800 capitalize">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Найти..." 
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus size={18} />
          Новый дефект
        </button>
      </div>
    </header>
  );
}