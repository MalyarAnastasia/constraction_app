import React, { useState } from 'react';
import DefectsTable from '../components/defectstable';
import DefectFormModal from '../components/defectformmodal';
import { Plus } from 'lucide-react';

export default function Defects({ onEdit, onView }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDefect, setEditingDefect] = useState(null);
    const [updateKey, setUpdateKey] = useState(0);

    const handleNewDefect = () => {
        setEditingDefect(null);
        setIsModalOpen(true);
    };

    const handleEditDefect = (defect) => {
        setEditingDefect(defect);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDefect(null);
    };

    const handleDefectSaved = () => {
        setUpdateKey(prevKey => prevKey + 1);
        handleCloseModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Управление Дефектами</h2>
                    <p className="text-gray-600 mt-2">
                        Отслеживайте и управляйте дефектами в ваших проектах
                    </p>
                </div>
                <button
                    onClick={handleNewDefect}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                >
                    <Plus size={18} />
                    Новый Дефект
                </button>
            </div>
<DefectsTable 
    key={updateKey}
    onEdit={handleEditDefect}
    onView={onView} 
/>

            <DefectFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                initialData={editingDefect}
                onDefectSaved={handleDefectSaved}
            />
        </div>
    );
}