import React from 'react';
import { Bug, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import StatCard from '../components/statcard';
import DefectsTable from '../components/defectstable';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Неустраненные дефекты" value="24" icon={Bug} colorClass="bg-blue-100 text-blue-600" />
        <StatCard title="Закончить в течении недели" value="8" icon={CheckCircle} colorClass="bg-green-100 text-green-600" />
        <StatCard title="Срок истек" value="3" icon={Clock} colorClass="bg-yellow-100 text-yellow-600" />
        <StatCard title="Высокий приоритет" value="5" icon={AlertTriangle} colorClass="bg-red-100 text-red-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Недавние дефекты</h2>
          <button className="text-blue-600 text-sm font-medium hover:underline">Посмотреть все</button>
        </div>
        <div className="overflow-x-auto">
            <DefectsTable limit={5} /> 
        </div>
      </div>
    </div>
  );
}