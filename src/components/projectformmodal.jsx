import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Package } from 'lucide-react';
import { useAuth } from '../context/authcontex';

export default function ProjectFormModal({ isOpen, onClose, initialData, onProjectSaved }) {
    const { token } = useAuth();
    const isEditing = !!initialData && !!initialData.project_id;
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        stage_id: ''
    });
    
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStages = async () => {
            try {
                const response = await fetch('/api/project-stages', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStages(data);
                }
            } catch (err) {
                console.error('Ошибка загрузки этапов:', err);
            }
        };

        if (isOpen && token) {
            fetchStages();
        }
    }, [isOpen, token]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.project_name || '',
                description: initialData.description || '',
                start_date: initialData.start_date || '',
                end_date: initialData.end_date || '',
                stage_id: initialData.stage_id || ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                stage_id: stages.length > 0 ? stages[0].stage_id : ''
            });
        }
    }, [initialData, stages]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const method = isEditing ? 'PUT' : 'POST';
        const projectId = initialData?.project_id;

        if (isEditing && !projectId) {
            setError("Ошибка редактирования: Отсутствует ID проекта.");
            setLoading(false);
            return;
        }

        const url = isEditing ? `/api/projects/${projectId}` : '/api/projects';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    start_date: formData.start_date || null,
                    end_date: formData.end_date || null,
                    stage_id: formData.stage_id || null
                }),
            });

            if (!response.ok) {
                let errorMessage = `Не удалось ${isEditing ? 'обновить' : 'создать'} проект. Статус: ${response.status}`;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('Детали ошибки:', errorData);
                } catch (parseError) {
                    console.error('Ошибка парсинга ответа:', parseError);
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Успешный ответ:', result);
            
            onProjectSaved();

        } catch (err) {
            console.error("Catch Block Error:", err);
            setError(err.message || 'Произошла ошибка при сохранении проекта.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all">
                
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl sticky top-0">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package size={24} className="text-blue-600" />
                        {isEditing ? 'Редактирование Проекта' : 'Создание Нового Проекта'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {error && (
                        <div className="p-3 text-sm bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Название Проекта *</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Например: DeepSite Web Platform"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                        <textarea
                            name="description"
                            id="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Краткое описание целей и содержания проекта..."
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                            <input
                                type="date"
                                name="start_date"
                                id="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                            <input
                                type="date"
                                name="end_date"
                                id="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="stage_id" className="block text-sm font-medium text-gray-700 mb-1">Этап проекта *</label>
                        <select
                            name="stage_id"
                            id="stage_id"
                            value={formData.stage_id}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="">Выберите этап</option>
                            {stages.map(stage => (
                                <option key={stage.stage_id} value={stage.stage_id}>
                                    {stage.stage_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button 
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isEditing ? 'Сохранить Изменения' : 'Создать Проект'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}