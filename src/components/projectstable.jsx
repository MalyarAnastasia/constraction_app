import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Loader2, Frown, Package, Eye, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/authcontex';

export default function ProjectsTable({ onEdit, refreshKey }) {
    const { token } = useAuth();
    const [projects, setProjects] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [expandedProject, setExpandedProject] = useState(null);
    const [projectDefects, setProjectDefects] = useState({});

    const fetchProjects = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [projectsResponse, stagesResponse] = await Promise.all([
                fetch('/api/projects', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }),
                fetch('/api/project-stages', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                })
            ]);

            if (!projectsResponse.ok) {
                const errorData = await projectsResponse.json();
                throw new Error(errorData.message || 'Failed to fetch projects.');
            }

            const projectsData = await projectsResponse.json();
            const stagesData = stagesResponse.ok ? await stagesResponse.json() : [];

            console.log("Полученные проекты:", projectsData);
            console.log("Полученные этапы:", stagesData);
            
            setProjects(projectsData);
            setStages(stagesData);

        } catch (err) {
            console.error("Error fetching projects:", err);
            setError(err.message || 'Не удалось загрузить данные о проектах.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchProjects();
        }
    }, [token, refreshKey, fetchProjects]);

    const handleDelete = async (projectId) => {
        setDeleteLoading(true);
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete project.');
            }

            setProjects(projects.filter(p => p.project_id !== projectId));
            
        } catch (err) {
            console.error("Error deleting project:", err);
            setError(err.message || 'Ошибка при удалении проекта.');
        } finally {
            setDeleteLoading(false);
            setDeleteId(null);
        }
    };

    const fetchProjectDefects = async (projectId) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/defects`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (response.ok) {
                const defects = await response.json();
                setProjectDefects(prev => ({
                    ...prev,
                    [projectId]: defects
                }));
            }
        } catch (err) {
            console.error('Ошибка загрузки дефектов:', err);
        }
    };

    const toggleProjectExpansion = (projectId) => {
        if (expandedProject === projectId) {
            setExpandedProject(null);
        } else {
            setExpandedProject(projectId);
            if (!projectDefects[projectId]) {
                fetchProjectDefects(projectId);
            }
        }
    };

    const getStageName = (stageId) => {
        if (!stageId) return 'Не указан';
        const stage = stages.find(s => s.stage_id === stageId);
        return stage ? stage.stage_name : 'Не указан';
    };

    const getStageColor = (stageId) => {
        const stageColors = {
            1: 'bg-blue-100 text-blue-800', 
            2: 'bg-purple-100 text-purple-800',
            3: 'bg-green-100 text-green-800', 
            4: 'bg-yellow-100 text-yellow-800', 
            5: 'bg-gray-100 text-gray-800' 
        };
        return stageColors[stageId] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    if (loading && token) {
        return (
            <div className="flex justify-center items-center p-10 text-blue-600">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span className="font-medium">Загрузка проектов...</span>
            </div>
        );
    }

    if (error && token) {
        return (
            <div className="flex flex-col justify-center items-center p-10 text-red-600 bg-red-50 rounded-xl m-4 border border-red-200">
                <Frown size={36} />
                <span className="mt-2 font-medium">{error}</span>
                <button 
                    onClick={fetchProjects}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }
    
    if (projects.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center p-10 text-gray-500 bg-white rounded-xl m-4 border border-gray-200">
                <Package size={36} />
                <span className="mt-2 font-medium">Проекты не найдены. Создайте свой первый проект!</span>
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
                                Вы уверены, что хотите удалить этот проект?
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
            
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Название</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Описание</th>
                            <th scope="col" className="px-6 py-3">Дата начала</th>
                            <th scope="col" className="px-6 py-3">Дата окончания</th>
                            <th scope="col" className="px-6 py-3">Этап</th>
                            <th scope="col" className="px-6 py-3 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <React.Fragment key={project.project_id}>
                                <tr className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {project.project_name}
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-gray-600">
                                        {project.description || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatDate(project.start_date)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatDate(project.end_date)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStageColor(project.stage_id)}`}>
                                            {getStageName(project.stage_id)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                onClick={() => toggleProjectExpansion(project.project_id)}
                                                title="Просмотреть дефекты"
                                            >
                                                <Eye size={18}/>
                                            </button>
                                            <button 
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                onClick={() => onEdit(project)}
                                                title="Редактировать проект"
                                            >
                                                <Edit2 size={18}/>
                                            </button>
                                            <button 
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                onClick={() => setDeleteId(project.project_id)}
                                                title="Удалить проект"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedProject === project.project_id && (
                                    <tr key={`${project.project_id}-expanded`} className="bg-gray-50">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-900">Дефекты проекта: {project.project_name}</h4>
                                                <button 
                                                    onClick={() => toggleProjectExpansion(project.project_id)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <ChevronUp size={18} />
                                                </button>
                                            </div>
                                            {projectDefects[project.project_id] ? (
                                                projectDefects[project.project_id].length > 0 ? (
                                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">Название</th>
                                                                    <th className="px-4 py-2 text-left">Статус</th>
                                                                    <th className="px-4 py-2 text-left">Приоритет</th>
                                                                    <th className="px-4 py-2 text-left">Дата создания</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {projectDefects[project.project_id].map(defect => (
                                                                    <tr key={defect.defect_id} className="border-t border-gray-100">
                                                                        <td className="px-4 py-2">{defect.title}</td>
                                                                        <td className="px-4 py-2">
                                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                                defect.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                                                                defect.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                                defect.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                                {defect.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                                defect.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                                                defect.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                                                                                'bg-blue-100 text-blue-800'
                                                                            }`}>
                                                                                {defect.priority}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2">{formatDate(defect.created_at)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-sm">Дефекты не найдены</p>
                                                )
                                            ) : (
                                                <div className="flex justify-center items-center py-4">
                                                    <Loader2 className="animate-spin mr-2" size={16} />
                                                    <span className="text-sm text-gray-500">Загрузка дефектов...</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}