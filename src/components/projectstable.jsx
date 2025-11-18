import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2, Frown, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * @param {function} onEdit 
 */
export default function ProjectsTable({ onEdit }) {
    const { token } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    async function fetchProjects() {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch projects.');
            }

            const data = await response.json();
            const mockProjects = [
                { id: 1, name: 'DeepSite Web Platform', key: 'DSW', description: 'Основная платформа для отслеживания дефектов.', lead: 'Иванов И.', status: 'Active', members: 12 },
                { id: 2, name: 'Mobile App iOS/Android', key: 'DMA', description: 'Разработка мобильного приложения.', lead: 'Петрова А.', status: 'Active', members: 5 },
                { id: 3, name: 'Internal API Services', key: 'API', description: 'Разработка бэкенд сервисов и микросервисов.', lead: 'Сидоров К.', status: 'Maintenance', members: 3 },
            ];
            setProjects(data.length > 0 ? data : mockProjects);

        } catch (err) {
            console.error("Error fetching projects:", err);
            setError("Не удалось загрузить данные о проектах. Проверьте соединение.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) {
            fetchProjects();
        }
    }, [token]);

    const handleDelete = async (id) => {
        setLoading(true);
        console.log(`Deleting project with ID: ${id}`);
        
        setProjects(projects.filter(p => p.id !== id));
        setDeleteId(null);
        setLoading(false);
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
                                Вы уверены, что хотите удалить проект {deleteId}?
                            </p>
                            <div className="flex justify-center gap-4 mt-6">
                                <button 
                                    onClick={() => setDeleteId(null)} 
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                                    disabled={loading}
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteId)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Удаление...' : 'Удалить'}
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
                            <th scope="col" className="px-6 py-3">Key</th>
                            <th scope="col" className="px-6 py-3">Project Name</th>
                            <th scope="col" className="px-6 py-3 hidden sm:table-cell">Lead</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Members</th>
                            <th scope="col" className="px-6 py-3 hidden md:table-cell">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project.id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-blue-600">{project.key}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {project.name}
                                    <p className="text-xs text-gray-400 truncate max-w-xs block sm:hidden">{project.description}</p>
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">{project.lead}</td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="font-semibold text-gray-800">{project.members}</span>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                            onClick={() => onEdit(project)}
                                            title="Edit Project"
                                        >
                                            <Edit2 size={18}/>
                                        </button>
                                        <button 
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            onClick={() => setDeleteId(project.name)}
                                            title="Delete Project"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}