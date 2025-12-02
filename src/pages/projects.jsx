import React, { useState, useEffect } from 'react';
import ProjectsTable from '../components/projectstable';
import ProjectFormModal from '../components/projectformmodal';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Projects() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [updateKey, setUpdateKey] = useState(0);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalProjects, setTotalProjects] = useState(0);

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

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1); 
    };

    const totalPages = Math.ceil(totalProjects / pageSize);

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
                currentPage={currentPage}
                pageSize={pageSize}
                onTotalCountChange={setTotalProjects}
            />

            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Показывать:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                        <span className="text-sm text-gray-600">записей</span>
                    </div>
                    <span className="text-sm text-gray-600">
                        Показано {Math.min((currentPage - 1) * pageSize + 1, totalProjects)} - {Math.min(currentPage * pageSize, totalProjects)} из {totalProjects}
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded-lg ${currentPage === pageNum ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                            <span className="text-gray-400">...</span>
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                className={`px-3 py-1 rounded-lg ${currentPage === totalPages ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <ProjectFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                initialData={editingProject}
                onProjectSaved={handleProjectSaved}
            />
        </div>
    );
}