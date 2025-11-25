import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontex';
import { 
    AlertTriangle, CheckCircle, Clock, TrendingUp, 
    Package, Bug, ArrowUpRight, ArrowDownRight,
    RefreshCw, Users, Calendar, FileText
} from 'lucide-react';

export default function Dashboard({ onEdit, onView }) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [recentDefects, setRecentDefects] = useState([]);
    const [timeRange, setTimeRange] = useState('week');

    useEffect(() => {
        fetchDashboardData();
    }, [token, timeRange]);

    const fetchDashboardData = async () => {
        if (!token) return;

        try {
            setLoading(true);
            
            const queryParams = new URLSearchParams();
            if (timeRange !== 'all') queryParams.append('timeRange', timeRange);

            const [statsResponse, defectsResponse] = await Promise.all([
                fetch(`/api/dashboard/stats?${queryParams}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`/api/dashboard/recent-defects?${queryParams}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!statsResponse.ok || !defectsResponse.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const [statsData, defectsData] = await Promise.all([
                statsResponse.json(),
                defectsResponse.json()
            ]);

            setStats(statsData);
            setRecentDefects(defectsData);

        } catch (err) {
            console.error('Error fetching dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        return priority === 'Critical' ? 'bg-red-100 text-red-800' :
               priority === 'High' ? 'bg-orange-100 text-orange-800' :
               priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
               'bg-green-100 text-green-800';
    };

    const getStatusColor = (statusName) => {
        return statusName === 'Новая' ? 'bg-blue-100 text-blue-800' :
               statusName === 'В работе' ? 'bg-yellow-100 text-yellow-800' :
               statusName === 'На проверке' ? 'bg-purple-100 text-purple-800' :
               statusName === 'Закрыта' ? 'bg-green-100 text-green-800' :
               'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPriorityLabel = (priority) => {
        return priority === 'Critical' ? 'Критический' :
               priority === 'High' ? 'Высокий' :
               priority === 'Medium' ? 'Средний' : 'Низкий';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и фильтры */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Обзор системы</h2>
                    <p className="text-gray-600 mt-2">
                        Ключевые метрики и последние активности
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm bg-white"
                    >
                        <option value="week">За неделю</option>
                        <option value="month">За месяц</option>
                        <option value="quarter">За квартал</option>
                        <option value="year">За год</option>
                        <option value="all">За все время</option>
                    </select>

                    <button
                        onClick={fetchDashboardData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <RefreshCw size={16} />
                        Обновить
                    </button>
                </div>
            </div>

            {/* Ключевые метрики */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Всего дефектов"
                    value={stats.totalDefects || 0}
                    change={stats.defectsChange || 0}
                    description="За выбранный период"
                    icon={<Bug className="text-blue-600" size={24} />}
                    color="blue"
                />
                <MetricCard
                    title="Открытые дефекты"
                    value={stats.openDefects || 0}
                    change={stats.openChange || 0}
                    description="Требуют внимания"
                    icon={<AlertTriangle className="text-orange-600" size={24} />}
                    color="orange"
                />
                <MetricCard
                    title="Завершенные"
                    value={stats.resolvedDefects || 0}
                    change={stats.resolvedChange || 0}
                    description="Успешно решены"
                    icon={<CheckCircle className="text-green-600" size={24} />}
                    color="green"
                />
                <MetricCard
                    title="Среднее время решения"
                    value={`${stats.avgResolutionTime || 0} дней`}
                    change={stats.timeChange || 0}
                    description="От создания до закрытия"
                    icon={<Clock className="text-purple-600" size={24} />}
                    color="purple"
                />
            </div>

            {/* Основной контент */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Последние дефекты */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Последние дефекты</h3>
                        <FileText size={20} className="text-gray-400" />
                    </div>
                    
                    <div className="space-y-4">
                        {recentDefects.slice(0, 8).map((defect) => (
                            <div 
                                key={defect.defect_id}
                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                                onClick={() => onView(defect.defect_id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                            {defect.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            #{defect.defect_id} • {defect.project_name}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(defect.priority)}`}>
                                            {getPriorityLabel(defect.priority)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(defect.status_name)}`}>
                                        {defect.status_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatDate(defect.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        
                        {recentDefects.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Bug size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Нет дефектов за выбранный период</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Статистика по проектам и статусам */}
                <div className="space-y-6">
                    {/* Статистика по проектам */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Активность по проектам</h3>
                            <Package size={20} className="text-gray-400" />
                        </div>
                        
                        <div className="space-y-4">
                            {stats.defectsByProject && stats.defectsByProject.length > 0 ? (
                                stats.defectsByProject.map((project) => (
                                    <div key={project.project_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Package size={18} className="text-blue-600" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-gray-900 text-sm truncate">
                                                    {project.project_name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {project.defect_count} дефектов
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900 text-sm">
                                                {Math.round((project.defect_count / stats.totalDefects) * 100)}%
                                            </div>
                                            <div className="text-xs text-gray-500">от общего числа</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    Нет данных по проектам
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Распределение по статусам */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Распределение по статусам</h3>
                            <TrendingUp size={20} className="text-gray-400" />
                        </div>
                        
                        <div className="space-y-3">
                            {stats.defectsByStatus && stats.defectsByStatus.length > 0 ? (
                                stats.defectsByStatus.map((status) => (
                                    <div key={status.status_name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${
                                                status.status_name === 'Новая' ? 'bg-blue-500' :
                                                status.status_name === 'В работе' ? 'bg-yellow-500' :
                                                status.status_name === 'На проверке' ? 'bg-purple-500' :
                                                status.status_name === 'Закрыта' ? 'bg-green-500' : 'bg-gray-500'
                                            }`}></div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {status.status_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">{status.count}</span>
                                            <span className="text-xs text-gray-500">
                                                ({Math.round((status.count / stats.totalDefects) * 100)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    Нет данных по статусам
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, description, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
        green: 'bg-green-50 border-green-200 hover:border-green-300',
        orange: 'bg-orange-50 border-orange-200 hover:border-orange-300',
        purple: 'bg-purple-50 border-purple-200 hover:border-purple-300'
    };

    const changeColor = change > 0 ? 'text-green-600 bg-green-50' : change < 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50';
    const ChangeIcon = change > 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    {icon}
                </div>
                {change !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeColor}`}>
                        <ChangeIcon size={14} />
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
            </div>
            
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
                {description && (
                    <p className="text-xs text-gray-500 mt-2">{description}</p>
                )}
            </div>
        </div>
    );
}

