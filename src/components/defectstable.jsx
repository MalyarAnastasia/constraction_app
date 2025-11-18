import React, { useState, useEffect } from 'react'; 
import { Eye, Edit2, Trash2, Loader2, Frown, X } from 'lucide-react';
import { useAuth } from '../context/authcontex'; 

export default function DefectsTable({ limit, onEdit }) { 
  const { token } = useAuth();
  
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null); 

  const getPriorityStyle = (priority) => {
      switch (priority) {
          case 'High': return 'bg-red-100 text-red-800';
          case 'Medium': return 'bg-yellow-100 text-yellow-800';
          case 'Low': return 'bg-green-100 text-green-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  const getStatusStyle = (status) => {
      switch (status) {
          case 'New': return 'bg-blue-100 text-blue-800';
          case 'In Progress': return 'bg-purple-100 text-purple-800';
          case 'In Review': return 'bg-orange-100 text-orange-800';
          case 'Closed': return 'bg-gray-100 text-gray-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  async function fetchDefects() {
      if (!token) {
          setLoading(false);
          return;
      } 

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/defects', {
            headers: {
                'Authorization': `Bearer ${token}`, 
            }
        }); 
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch defects. Server returned error.');
        }

        const data = await response.json();
        setDefects(data); 

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Не удалось загрузить данные о дефектах. Проверьте соединение и аутентификацию.");
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    if (token) {
        fetchDefects();
    }
  }, [token, limit]); 

  const handleDelete = async (id) => {
    if (!token) return;
    setLoading(true);

    try {
        const response = await fetch(`/api/defects/${id}`, {
            method: 'DELETE', 
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete defect.');
        }

        await fetchDefects(); 
        setDeleteId(null); 
    } catch (error) {
        console.error("Error deleting defect:", error);
        setError(`Ошибка при удалении: ${error.message}`); 
    } finally {
        setLoading(false);
    }
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
      <div className="flex flex-col justify-center items-center p-10 text-red-600 bg-red-50 rounded-lg m-4 border border-red-200">
        <Frown size={36} />
        <span className="mt-2 font-medium">{error}</span>
      </div>
    );
  }

  const displayData = limit ? defects.slice(0, limit) : defects;

  return (
    <>
      {deleteId && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
                <div className="p-6 text-center">
                    <Trash2 size={48} className="text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Вы уверены, что хотите удалить дефект DT-{deleteId}? Это действие необратимо.
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
                            {loading ? 'Удаление...' : 'Удалить навсегда'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      <table className="w-full text-left text-sm text-gray-500">
        <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Title</th>
                <th scope="col" className="px-6 py-3">Project</th>
                <th scope="col" className="px-6 py-3">Priority</th>
                <th scope="col" className="px-6 py-3">Assigned To</th>
                <th scope="col" className="px-6 py-3">Due Date</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
        </thead>
        <tbody>
            {displayData.map((defect) => (
                <tr key={defect.id} className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{`DT-${defect.id}`}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium truncate max-w-xs">{defect.title}</td>
                    <td className="px-6 py-4">{defect.project_name || 'N/A'}</td> 
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(defect.priority)}`}>
                            {defect.priority}
                        </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {defect.assigned_to ? defect.assigned_to.charAt(0) : 'U'}
                        </div>
                        {defect.assigned_to || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4">{defect.due_date ? new Date(defect.due_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(defect.status)}`}>
                            {defect.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="View"><Eye size={18}/></button>

                            <button 
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                onClick={() => onEdit(defect)} 
                                title="Edit"
                            >
                                <Edit2 size={18}/>
                            </button>

                            <button 
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                onClick={() => setDeleteId(defect.id)} 
                                title="Delete"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}