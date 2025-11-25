import React, { useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useAuth } from '../context/authcontex';
import { Download, TrendingUp, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Reports() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [timeRange, setTimeRange] = useState('month');
    const [projectFilter, setProjectFilter] = useState('all');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReportsData();
    }, [token, timeRange, projectFilter]);

    const fetchReportsData = async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError(null);
            
            const queryParams = new URLSearchParams();
            if (timeRange !== 'all') queryParams.append('timeRange', timeRange);
            if (projectFilter !== 'all') queryParams.append('project_id', projectFilter);

            const response = await fetch(`/api/reports/defects-stats?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch reports data: ${response.status}`);
            }

            const data = await response.json();
            
            const processedData = {
                ...data,
                defectsByStatus: data.defectsByStatus?.map(item => ({
                    ...item,
                    value: parseInt(item.value) || 0
                })) || [],
                defectsByPriority: data.defectsByPriority?.map(item => ({
                    ...item,
                    value: parseInt(item.value) || 0
                })) || [],
                defectsByProject: data.defectsByProject?.map(item => ({
                    ...item,
                    defect_count: parseInt(item.defect_count) || 0
                })) || [],
                defectsTrend: data.defectsTrend?.map(item => ({
                    ...item,
                    count: parseInt(item.count) || 0
                })) || [],
                assigneeEfficiency: data.assigneeEfficiency?.map(item => ({
                    ...item,
                    resolved_count: parseInt(item.resolved_count) || 0,
                    open_count: parseInt(item.open_count) || 0
                })) || [],
                resolutionTimeByPriority: data.resolutionTimeByPriority?.map(item => ({
                    ...item,
                    avg_days: parseFloat(item.avg_days) || 0
                })) || []
            };

            console.log('📊 Processed data for charts:', processedData);
            setStats(processedData);

        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.message || 'Не удалось загрузить данные отчетов');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            
            const queryParams = new URLSearchParams();
            if (timeRange !== 'all') queryParams.append('timeRange', timeRange);
            if (projectFilter !== 'all') queryParams.append('project_id', projectFilter);
            queryParams.append('format', 'csv');

            const response = await fetch(`/api/reports/export?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = `defects_report_${timeRange}.csv`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[1];
                }
            }
            
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error('Error exporting report:', err);
            setError('Ошибка при экспорте отчета');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-red-600">
                <AlertTriangle size={48} className="mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ошибка загрузки отчетов</h3>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchReportsData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <RefreshCw size={16} />
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и фильтры */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Аналитические Отчеты</h2>
                    <p className="text-gray-600 mt-2">
                        Статистика и аналитика по дефектам и проектам
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 text-sm"
                    >
                        <option value="week">За неделю</option>
                        <option value="month">За месяц</option>
                        <option value="quarter">За квартал</option>
                        <option value="year">За год</option>
                        <option value="all">За все время</option>
                    </select>

                    <button
                        onClick={fetchReportsData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
                    icon={<AlertTriangle className="text-blue-600" size={24} />}
                    color="blue"
                />
                <MetricCard
                    title="Открытые"
                    value={stats.openDefects || 0}
                    icon={<Clock className="text-orange-600" size={24} />}
                    color="orange"
                />
                <MetricCard
                    title="Исправленные"
                    value={stats.resolvedDefects || 0}
                    icon={<CheckCircle className="text-green-600" size={24} />}
                    color="green"
                />
                <MetricCard
                    title="Среднее время решения"
                    value={`${stats.avgResolutionTime || 0}д`}
                    icon={<TrendingUp className="text-purple-600" size={24} />}
                    color="purple"
                />
            </div>

            {/* Графики */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Распределение по статусам */}
                {stats.defectsByStatus && stats.defectsByStatus.length > 0 ? (
                    <ChartCard title="Дефекты по статусам">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.defectsByStatus}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ status_name, value }) => 
                                        `${status_name}: ${value}`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats.defectsByStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                ) : (
                    <ChartCard title="Дефекты по статусам">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Нет данных для отображения
                        </div>
                    </ChartCard>
                )}

                {/* Распределение по приоритетам */}
                {stats.defectsByPriority && stats.defectsByPriority.length > 0 ? (
                    <ChartCard title="Дефекты по приоритетам">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.defectsByPriority}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="priority" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                ) : (
                    <ChartCard title="Дефекты по приоритетам">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Нет данных для отображения
                        </div>
                    </ChartCard>
                )}

                {/* Дефекты по проектам */}
                {stats.defectsByProject && stats.defectsByProject.length > 0 ? (
                    <ChartCard title="Дефекты по проектам">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.defectsByProject}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="project_name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="defect_count" fill="#00C49F" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                ) : (
                    <ChartCard title="Дефекты по проектам">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Нет данных для отображения
                        </div>
                    </ChartCard>
                )}

                {/* Тренд создания дефектов */}
                {stats.defectsTrend && stats.defectsTrend.length > 0 ? (
                    <ChartCard title="Динамика создания дефектов">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.defectsTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#FF8042" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                ) : (
                    <ChartCard title="Динамика создания дефектов">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Нет данных для отображения
                        </div>
                    </ChartCard>
                )}

                {/* Эффективность исправления */}
                {stats.assigneeEfficiency && stats.assigneeEfficiency.length > 0 ? (
                    <ChartCard title="Эффективность исправления по исполнителям">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.assigneeEfficiency}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="assignee_name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="resolved_count" fill="#0088FE" name="Исправлено" />
                                <Bar dataKey="open_count" fill="#FFBB28" name="Открытые" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                ) : (
                    <ChartCard title="Эффективность исправления по исполнителям">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Нет данных для отображения
                        </div>
                    </ChartCard>
                )}

                {/* Время решения по приоритетам */}
                {stats.resolutionTimeByPriority && stats.resolutionTimeByPriority.length > 0 ? (
                    <ChartCard title="Среднее время решения (дни)">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.resolutionTimeByPriority}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="priority" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="avg_days" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                ) : (
                    <ChartCard title="Среднее время решения (дни)">
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Нет данных для отображения
                        </div>
                    </ChartCard>
                )}
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        orange: 'bg-orange-50 border-orange-200',
        purple: 'bg-purple-50 border-purple-200'
    };

    return (
        <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} transition-transform hover:scale-105`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            {children}
        </div>
    );
}