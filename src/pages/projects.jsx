import React, { useState } from 'react';
import ProjectsTable from '../components/projectstable';
import ProjectFormModal from '../components/projectformmodal';
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
        handleCloseModal();
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
                refreshKey={updateKey}
                onEdit={handleEditProject} 
            />

            <ProjectFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                initialData={editingProject}
                onProjectSaved={handleProjectSaved}
            />
            
        </div>
    );
}