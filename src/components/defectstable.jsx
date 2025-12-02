import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Loader2, Frown, Eye, Download, Filter, X } from 'lucide-react';
import { useAuth } from '../context/authcontex';

export default function DefectsTable({ onEdit, onView, refreshKey, currentPage, pageSize, onTotalCountChange }) {
    const { token } = useAuth();
    const [defects, setDefects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status_id: '',
        assignee_id: '',
        project_id: '',
        priority: '',
        reporter_id: ''
    });
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const PRIORITY_OPTIONS = {
        'Low': 'Низкий',
        'Medium': 'Средний',
        'High': 'Высокий',
        'Critical': 'Критический'
    };

    const fetchDefects = useCallback(async (filterParams = {}) => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
                ...filterParams
            });

            Object.entries(filterParams).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(`/api/defects?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch defects.');
            }

            const data = await response.json();
            
            if (data.defects !== undefined) {
                setDefects(data.defects);
                setTotalCount(data.totalCount || 0);
                onTotalCountChange(data.totalCount || 0);
            } else {
                setDefects(data);
                setTotalCount(data.length || 0);
                onTotalCountChange(data.length || 0);
            }

        } catch (err) {
            setError(err.message || 'Не удалось загрузить данные о дефектах.');
        } finally {
            setLoading(false);
        }
    }, [token, currentPage, pageSize, onTotalCountChange]);

    const fetchFilterData = useCallback(async () => {
        if (!token) return;
        
        try {
            const [projectsRes, usersRes, statusesRes] = await Promise.all([
                fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/defect-statuses', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (projectsRes.ok) {
                const projectsData = await projectsRes.json();
                setProjects(projectsData);
            }
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUsers(usersData);
            }
            if (statusesRes.ok) {
                const statusesData = await statusesRes.json();
                setStatuses(statusesData);
            }
        } catch (err) {
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchDefects(filters);
            fetchFilterData();
        }
    }, [token, refreshKey, fetchDefects, fetchFilterData, currentPage, pageSize]);

    useEffect(() => {
        if (token) {
            const timeoutId = setTimeout(() => {
                fetchDefects(filters);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [filters, token, fetchDefects, currentPage, pageSize]);

    const handleDelete = async (defectId) => {
        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/defects/${defectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete defect.');
            }

            setDefects(defects.filter(d => d.defect_id !== defectId));
            setTotalCount(prev => prev - 1);
            onTotalCountChange(totalCount - 1);
            
        } catch (err) {
            setError(err.message || 'Ошибка при удалении дефекта.');
        } finally {
            setDeleteLoading(false);
            setDeleteId(null);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            status_id: '',
            assignee_id: '',
            project_id: '',
            priority: '',
            reporter_id: ''
        });
    };

    const handleExport = async () => {
        try {
            const response = await fetch('/api/export/defects', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export defects');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'defects_export.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            setError('Ошибка при экспорте данных');
        }
    };

    const getPriorityColor = (priority) => {
        return priority === 'Critical' ? 'bg-red-100 text-red-800' :
               priority === 'High' ? 'bg-orange-100 text-orange-800' :
               priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
               'bg-green-100 text-green-800';
    };

    const getStatusColor = (statusName) => {
        return statusName === 'Open' ? 'bg-blue-100 text-blue-800' :
               statusName === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
               statusName === 'Resolved' ? 'bg-green-100 text-green-800' :
               statusName === 'Closed' ? 'bg-gray-100 text-gray-800' :
               statusName === 'На проверке' ? 'bg-purple-100 text-purple-800' :
               'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const getPriorityLabel = (priority) => {
        return PRIORITY_OPTIONS[priority] || priority;
    };

    const getProjectName = (defect) => {
        return defect.project_name || 
               defect.project?.project_name || 
               defect.project_id?.project_name ||
               'Не указан';
    };

    const getStatusName = (defect) => {
        return defect.status_name || 
               defect.status?.status_name || 
               defect.status_id?.status_name ||
               'Не назначен';
    };

    const getAssigneeName = (defect) => {
        return defect.assignee_name || 
               defect.assignee?.username || 
               defect.assigned_to?.username ||
               defect.assignee_id?.username ||
               'Не назначен';
    };

    const getReporterName = (defect) => {
        return defect.reporter_name || 
               defect.reporter?.username || 
               defect.created_by?.username ||
               defect.reporter_id?.username ||
               'Не указан';
    };

    if (loading && token) {
        return (
            <div className="flex justify-center items-center p-10 text-blue-600">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span className="font-medium">Загрузка дефектов...</span>
            </div>
        );
    }

    if (error && token) {
        return (
            <div className="flex flex-col justify-center items-center p-10 text-red-600 bg-red-50 rounded-xl m-4 border border-red-200">
                <Frown size={36} />
                <span className="mt-2 font-medium">{error}</span>
                <button 
                    onClick={() => fetchDefects(filters)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <>
            {deleteId && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                        <div className="p-6 text-center">
                            <Trash2 size={48} className="text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">Подтвердите удаление</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Вы уверены, что хотите удалить этот дефект?
                            </p>
                            <div className="flex justify-center gap-4 mt-6">
                                <button 
                                    onClick={() => setDeleteId(null)} 
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                                    disabled={deleteLoading}
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteId)} 
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Удаление...' : 'Удалить'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showFilters && (
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">Фильтры</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Сбросить
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                            <select
                                value={filters.status_id}
                                onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">Все статусы</option>
                                {statuses.map(status => (
                                    <option key={status.status_id} value={status.status_id}>
                                        {status.status_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange('priority', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">Все приоритеты</option>
                                {Object.entries(PRIORITY_OPTIONS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Проект</label>
                            <select
                                value={filters.project_id}
                                onChange={(e) => handleFilterChange('project_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">Все проекты</option>
                                {projects.map(project => (
                                    <option key={project.project_id} value={project.project_id}>
                                        {project.project_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Назначен</label>
                            <select
                                value={filters.assignee_id}
                                onChange={(e) => handleFilterChange('assignee_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">Все исполнители</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Автор</label>
                            <select
                                value={filters.reporter_id}
                                onChange={(e) => handleFilterChange('reporter_id', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                            >
                                <option value="">Все авторы</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Отслеживайте и управляйте дефектами в ваших проектах
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                        Найдено: {totalCount} дефектов
                    </span>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                showFilters 
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Filter size={16} />
                            Фильтры
                            {Object.values(filters).some(v => v) && (
                                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {Object.values(filters).filter(v => v).length}
                                </span>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download size={16} />
                        Экспорт CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-medium">ID</th>
                                <th scope="col" className="px-6 py-4 font-medium">ЗАГОЛОВОК</th>
                                <th scope="col" className="px-6 py-4 font-medium">ПРОЕКТ</th>
                                <th scope="col" className="px-6 py-4 font-medium">ПРИОРИТЕТ</th>
                                <th scope="col" className="px-6 py-4 font-medium">СТАТУС</th>
                                <th scope="col" className="px-6 py-4 font-medium">НАЗНАЧЕН</th>
                                <th scope="col" className="px-6 py-4 font-medium">СОЗДАН</th>
                                <th scope="col" className="px-6 py-4 font-medium text-right">ДЕЙСТВИЯ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {defects.map((defect) => {
                                return (
                                    <tr key={defect.defect_id} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            #{defect.defect_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-md">
                                                <div className="font-medium text-gray-900">
                                                    {defect.title}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700 font-medium">
                                                {getProjectName(defect)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getPriorityColor(defect.priority)}`}>
                                                {getPriorityLabel(defect.priority)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(getStatusName(defect))}`}>
                                                {getStatusName(defect)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">
                                                {getAssigneeName(defect)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 text-sm">
                                                {formatDate(defect.created_at)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                                                    onClick={() => onView(defect.defect_id)}
                                                    title="Просмотреть детали"
                                                >
                                                    <Eye size={18}/>
                                                </button>
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                                    onClick={() => onEdit(defect)}
                                                    title="Редактировать дефект"
                                                >
                                                    <Edit2 size={18}/>
                                                </button>
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                                    onClick={() => setDeleteId(defect.defect_id)}
                                                    title="Удалить дефект"
                                                >
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {defects.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50">
                        <Frown size={48} className="mx-auto mb-4 text-gray-400" />
                        <div className="font-medium text-gray-600">Дефекты не найдены</div>
                        <div className="text-sm text-gray-500 mt-1">
                            {Object.values(filters).some(v => v) 
                                ? 'Попробуйте изменить параметры фильтрации' 
                                : 'Создайте первый дефект для начала работы'
                            }
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}