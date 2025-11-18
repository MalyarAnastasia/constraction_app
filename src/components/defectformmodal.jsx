import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '../context/authcontex'; 

export default function DefectFormModal({ isOpen, onClose, initialData, onDefectSaved }) {
  const { token } = useAuth();
  
  const isEditMode = !!initialData;
  const initialDate = new Date().toISOString().substring(0, 10);

  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    priority: 'Low',
    status: 'New',
    project_name: '',
    assigned_to: 'John Doe',
    due_date: initialDate,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const dateValue = initialData?.due_date ? initialData.due_date.substring(0, 10) : initialDate;
      
      setFormData(initialData ? { ...initialData, due_date: dateValue } : {
        title: '',
        description: '',
        priority: 'Low',
        status: 'New',
        project_name: '',
        assigned_to: 'John Doe',
        due_date: initialDate,
      });
      setMessage('');
    }
  }, [isOpen, initialData]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
        setMessage("Ошибка: Пользователь не аутентифицирован.");
        return;
    }

    setLoading(true);
    setMessage('');
    
    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `/api/defects/${initialData.id}` : '/api/defects'; 

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, 
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `${isEditMode ? 'Редактирование' : 'Создание'} дефекта не удалось.`);
        }

        const savedDefect = await response.json();
        
        setMessage(`Дефект успешно ${isEditMode ? 'обновлен' : 'создан'}!`);
        
        onDefectSaved(savedDefect); 

        setTimeout(() => {
            onClose();
        }, 1500);

    } catch (error) {
        console.error(`Error ${method} defect:`, error);
        setMessage(`Ошибка: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100">

        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {isEditMode ? <><Edit size={24}/> Edit Defect: DT-{initialData.id}</> : 'Create New Defect'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Short description of the problem"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Detailed steps to reproduce or impact analysis"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                name="priority"
                id="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              >
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                name="due_date"
                id="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">Project Name</label>
              <input
                type="text"
                name="project_name"
                id="project_name"
                value={formData.project_name}
                onChange={handleChange}
                placeholder="e.g. Riverfront Towers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">Assigned To</label>
              <input
                type="text"
                name="assigned_to"
                id="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <p className={`text-sm font-medium ${message.startsWith('Ошибка') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
            </p>
            
            <div className="flex gap-3">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Defect')}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}