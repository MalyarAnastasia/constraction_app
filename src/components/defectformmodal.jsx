import React, { useState, useEffect } from 'react';
import { X, Bug, Save, Loader2, Package } from 'lucide-react';
import { useAuth } from '../context/authcontex';

const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Низкий' },
    { value: 'Medium', label: 'Средний' },
    { value: 'High', label: 'Высокий' },
    { value: 'Critical', label: 'Критический' }
];

export default function DefectFormModal({ isOpen, onClose, initialData, onDefectSaved }) {
    const { user, token } = useAuth();
    const isEditing = !!initialData;
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: PRIORITY_OPTIONS[0].value,
        status_id: '',
        project_id: '',
        assignee_id: '',
        due_date: ''
    });

    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState('');

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        
        if (dateString.includes('T')) {
            return dateString.split('T')[0];
        }
        
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch (e) {
            console.warn('Invalid date format:', dateString);
        }
        
        return '';
    };

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            if (!token) return;

            try {
                setDataLoading(true);
                setError('');
                
                const [projectsRes, usersRes, statusesRes] = await Promise.all([
                    fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/defect-statuses', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!projectsRes.ok) throw new Error('Failed to fetch projects');
                if (!usersRes.ok) throw new Error('Failed to fetch users');
                if (!statusesRes.ok) throw new Error('Failed to fetch statuses');

                const [projectsData, usersData, statusesData] = await Promise.all([
                    projectsRes.json(),
                    usersRes.json(),
                    statusesRes.json()
                ]);

                setProjects(projectsData);
                
                const validUsers = usersData.filter(user => user.id);
                setUsers(validUsers);
                
                setStatuses(statusesData);

                if (initialData) {
                    setFormData({
                        title: initialData.title || '',
                        description: initialData.description || '',
                        priority: initialData.priority || PRIORITY_OPTIONS[0].value,
                        status_id: initialData.status_id ? initialData.status_id.toString() : (statusesData[0]?.status_id.toString() || ''),
                        project_id: initialData.project_id ? initialData.project_id.toString() : '',
                        assignee_id: initialData.assignee_id ? initialData.assignee_id.toString() : '',
                        due_date: formatDateForInput(initialData.due_date)
                    });
                } else {
                    setFormData({
                        title: '',
                        description: '',
                        priority: PRIORITY_OPTIONS[0].value,
                        status_id: statusesData[0]?.status_id.toString() || '',
                        project_id: '',
                        assignee_id: '',
                        due_date: ''
                    });
                }

            } catch (err) {
                console.error('Data fetching error:', err);
                setError('Не удалось загрузить данные.');
            } finally {
                setDataLoading(false);
            }
        };
        
        fetchData();
    }, [isOpen, initialData, token]);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                title: '',
                description: '',
                priority: PRIORITY_OPTIONS[0].value,
                status_id: '',
                project_id: '',
                assignee_id: '',
                due_date: ''
            });
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.title.trim()) {
            setError('Пожалуйста, введите заголовок дефекта.');
            setLoading(false);
            return;
        }

        if (!formData.project_id) {
            setError('Пожалуйста, выберите проект для дефекта.');
            setLoading(false);
            return;
        }

        if (!formData.status_id) {
            setError('Пожалуйста, выберите статус дефекта.');
            setLoading(false);
            return;
        }

        const method = isEditing ? 'PUT' : 'POST';
        const defectId = initialData?.defect_id;
        const url = isEditing ? `/api/defects/${defectId}` : '/api/defects';

        const submitData = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            status_id: parseInt(formData.status_id),
            project_id: parseInt(formData.project_id),
            assignee_id: formData.assignee_id ? parseInt(formData.assignee_id) : null,
            due_date: formData.due_date || null
        };

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} defect.`);
            }

            const responseData = await response.json();
            onDefectSaved(responseData);
            onClose();

        } catch (err) {
            console.error('Ошибка:', err);
            setError(err.message || 'Произошла ошибка при сохранении дефекта.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl sticky top-0">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Bug size={24} className="text-red-600" />
                        {isEditing ? 'Редактирование Дефекта' : 'Создание Нового Дефекта'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {error && (
                        <div className="p-3 text-sm bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Project Selection */}
                    <div>
                        <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Package size={16} /> Проект <span className="text-red-500">*</span>
                        </label>
                        {dataLoading ? (
                             <div className="flex items-center gap-2 text-gray-500 p-2 border border-gray-200 rounded-lg bg-gray-50">
                                 <Loader2 className="animate-spin" size={16} /> Загрузка данных...
                             </div>
                        ) : projects.length > 0 ? (
                            <select
                                name="project_id"
                                id="project_id"
                                value={formData.project_id}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                            >
                                <option value="">-- Выберите проект --</option>
                                {projects.map(project => (
                                    <option key={`project-${project.project_id}`} value={project.project_id}>
                                        {project.project_name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-sm text-yellow-600 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                Проекты не найдены. Пожалуйста, создайте проект на странице "Projects".
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Заголовок Дефекта <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                            placeholder="Короткое описание проблемы"
                        />
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <textarea
                            name="description"
                            id="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            disabled={loading}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                            placeholder="Подробное описание проблемы, шаги воспроизведения..."
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                            <select
                                name="priority"
                                id="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                            >
                                {PRIORITY_OPTIONS.map(priority => (
                                    <option key={`priority-${priority.value}`} value={priority.value}>
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status_id" className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                            <select
                                name="status_id"
                                id="status_id"
                                value={formData.status_id}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                            >
                                <option value="">-- Выберите статус --</option>
                                {statuses.map(status => (
                                    <option key={`status-${status.status_id}`} value={status.status_id}>
                                        {status.status_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label htmlFor="assignee_id" className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
                        <select
                            name="assignee_id"
                            id="assignee_id"
                            value={formData.assignee_id}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                        >
                            <option value="">-- Не назначен --</option>
                            {users.filter(user => user.id).map(user => (
                                <option key={`user-${user.id}`} value={user.id}>
                                    {user.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">Срок выполнения</label>
                        <input
                            type="date"
                            name="due_date"
                            id="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                        />
                    </div>

                    {/* Footer / Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button 
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading || dataLoading}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isEditing ? 'Сохранить Дефект' : 'Создать Дефект'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}