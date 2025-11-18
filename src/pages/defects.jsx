import React from 'react';
import { Download } from 'lucide-react';
import DefectsTable from '../components/defectstable';

export default function Defects() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                <option>Все статусы</option>
                <option>Новый</option>
                <option>В процесск</option>
            </select>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                <option>Все приоритеты</option>
                <option>Высокий</option>
                <option>Средний</option>
            </select>
        </div>
        <button className="flex items-center gap-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 font-medium rounded-lg text-sm px-4 py-2">
            <Download size={16} />
            Экспорт
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DefectsTable />
      </div>
    </div>
  );
}