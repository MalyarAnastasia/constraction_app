import React from 'react';
import { Briefcase, Activity, Calendar } from 'lucide-react';
import DefectsTable from '../components/defectstable';

export default function Dashboard({ onEdit }) {
  const stats = [
    { name: 'Total Defects', stat: '1,245', icon: Briefcase, change: '+12%', changeType: 'increase' },
    { name: 'Open Defects', stat: '45', icon: Activity, change: '-4%', changeType: 'decrease' },
    { name: 'Due This Week', stat: '12', icon: Calendar, change: '0%', changeType: 'neutral' },
  ];

  const getChangeStyle = (type) => {
    switch (type) {
        case 'increase': return 'text-green-600';
        case 'decrease': return 'text-red-600';
        default: return 'text-gray-500';
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((item) => (
          <div key={item.name} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500/10 p-3 rounded-full">
                  <item.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{item.stat}</div>
                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeStyle(item.changeType)}`}>
                      {item.change}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Latest Defects</h2>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</a>
        </div>
        
        <DefectsTable limit={5} onEdit={onEdit} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Defects by Status</h2>
              <div className="h-48 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">Chart Placeholder</div>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Priority Distribution</h2>
              <div className="h-48 flex items-center justify-center text-gray-400 border border-dashed rounded-lg">Chart Placeholder</div>
          </div>
      </div>
    </div>
  );
}