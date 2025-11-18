import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';

export default function DefectsTable({ limit }) {
  const defects = []

  const displayData = limit ? defects.slice(0, limit) : defects;

  const getStatusStyle = (status) => {
      switch(status) {
          case 'In Progress': return 'bg-blue-100 text-blue-700';
          case 'In Review': return 'bg-green-100 text-green-700';
          case 'Closed': return 'bg-gray-100 text-gray-700';
          case 'New': return 'bg-yellow-100 text-yellow-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  const getPriorityStyle = (priority) => {
      switch(priority) {
          case 'High': return 'bg-red-100 text-red-700';
          case 'Medium': return 'bg-orange-100 text-orange-700';
          case 'Low': return 'bg-green-100 text-green-700';
          default: return 'bg-gray-100';
      }
  };

  return (
    <table className="w-full text-left text-sm text-gray-500">
      <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
        <tr>
          <th className="px-6 py-3 font-semibold">ID</th>
          <th className="px-6 py-3 font-semibold">Название</th>
          <th className="px-6 py-3 font-semibold">Проект</th>
          <th className="px-6 py-3 font-semibold">Приоритет</th>
          <th className="px-6 py-3 font-semibold">Назначен</th>
          <th className="px-6 py-3 font-semibold">Срок</th>
          <th className="px-6 py-3 font-semibold">Статус</th>
          <th className="px-6 py-3 font-semibold text-right">Действия</th>
        </tr>
      </thead>
      <tbody>
        {displayData.map((defect) => (
          <tr key={defect.id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 font-medium text-gray-900">{defect.id}</td>
            <td className="px-6 py-4 text-gray-900 font-medium">{defect.title}</td>
            <td className="px-6 py-4">{defect.project}</td>
            <td className="px-6 py-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(defect.priority)}`}>
                    {defect.priority}
                </span>
            </td>
            <td className="px-6 py-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {defect.assignee.charAt(0)}
                </div>
                {defect.assignee}
            </td>
            <td className="px-6 py-4">{defect.date}</td>
            <td className="px-6 py-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(defect.status)}`}>
                    {defect.status}
                </span>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <button className="p-1 hover:text-blue-600 transition-colors"><Eye size={18}/></button>
                    <button className="p-1 hover:text-blue-600 transition-colors"><Edit2 size={18}/></button>
                    <button className="p-1 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}