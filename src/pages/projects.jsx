import React, { useState } from 'react';
import ProjectsTable from '../components/projectstable';
import ProjectFormModal from '../components/ProjectFormModal'; 
import { Plus } from 'lucide-react';

export default function Projects() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [updateKey, setUpdateKey] = useState(0); 

    const handleNewProject = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
    };

    const handleProjectSaved = () => {
        setUpdateKey(prevKey => prevKey + 1); 
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <h2 className="text-3xl font-extrabold text-gray-900">Управление Проектами</h2>
                <button
                    onClick={handleNewProject}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                >
                    <Plus size={18} />
                    Новый Проект
                </button>
            </div>

            <p className="text-gray-600">
                Создайте и управляйте проектами, чтобы организовать свои дефекты и задачи.
            </p>

            <ProjectsTable 
                key={updateKey} 
                onEdit={handleEditProject} 
            />
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">{editingProject ? 'Редактировать Проект' : 'Создать Новый Проект'}</h3>
                        <p className="text-gray-600 mb-6">
                            Здесь будет форма для создания/редактирования проекта.
                        </p>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleCloseModal} 
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Закрыть (Временно)
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}