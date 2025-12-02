import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, MessageSquare, Paperclip, Download, Trash2, Send, User, Upload } from 'lucide-react';
import { useAuth } from '../context/authcontex';

export default function DefectDetailModal({ isOpen, onClose, defectId }) {
    const { user, token } = useAuth();
    const [defectData, setDefectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('details');
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);
    const [fileUploading, setFileUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const fetchDefectData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch(`/api/defects/${defectId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось загрузить данные дефекта');
            }

            const data = await response.json();
            setDefectData(data);
        } catch (err) {
            console.error('Ошибка загрузки данных дефекта:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [defectId, token]);

    useEffect(() => {
        if (isOpen && defectId) {
            fetchDefectData();
        }
    }, [isOpen, defectId, fetchDefectData]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setCommentLoading(true);
        try {
            const response = await fetch(`/api/defects/${defectId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ comment_text: newComment })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Не удалось добавить комментарий');
            }

            const result = await response.json();
            
            setNewComment('');

            setDefectData(prev => ({
                ...prev,
                comments: [result.comment, ...(prev.comments || [])]
            }));

        } catch (err) {
            console.error('Ошибка добавления комментария:', err);
            setError(err.message);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleFileUpload = async (fileInput) => {
        const file = fileInput.target ? fileInput.target.files[0] : fileInput;
        if (!file) return;

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Файл слишком большой. Максимальный размер: 10MB');
            if (fileInput.target) fileInput.target.value = '';
            return;
        }

        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            setError('Неподдерживаемый тип файла. Разрешены: изображения, PDF, документы, таблицы');
            if (fileInput.target) fileInput.target.value = '';
            return;
        }

        setFileUploading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`/api/defects/${defectId}/attachments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Не удалось загрузить файл');
            }

            setDefectData(prev => ({
                ...prev,
                attachments: [data.attachment, ...(prev.attachments || [])]
            }));

            if (fileInput.target) fileInput.target.value = '';

        } catch (err) {
            console.error('Ошибка загрузки файла:', err);
            setError('Ошибка загрузки файла: ' + err.message);
            
            if (err.message.includes('413')) {
                setError('Файл слишком большой. Максимальный размер: 10MB');
            } else if (err.message.includes('415')) {
                setError('Неподдерживаемый тип файла');
            }
        } finally {
            setFileUploading(false);
        }
    };

    const downloadAttachment = async (attachmentId, fileName) => {
        try {
            const response = await fetch(`/api/attachments/${attachmentId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось скачать файл');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Ошибка скачивания файла:', err);
            setError('Не удалось скачать файл: ' + err.message);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!window.confirm('Вы уверены, что хотите удалить это вложение?')) return;

        try {
            const response = await fetch(`/api/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Не удалось удалить вложение');
            }

            setDefectData(prev => ({
                ...prev,
                attachments: prev.attachments.filter(att => att.attachment_id !== attachmentId)
            }));

        } catch (err) {
            console.error('Ошибка удаления вложения:', err);
            setError(err.message);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            const event = {
                target: {
                    files: [file]
                }
            };
            handleFileUpload(event);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Неизвестно';
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    <div className="flex justify-center items-center p-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Загрузка...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !defectData) {
        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    <div className="p-6 text-center text-red-600">
                        <p>{error || 'Дефект не найден'}</p>
                        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { defect, history = [], comments = [], attachments = [] } = defectData;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{defect.title}</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            ID: {defect.defect_id} | Проект: {defect.project_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                        <X size={24} />
                    </button>
                </div>

                <div className="border-b border-gray-200 bg-gray-50">
                    <nav className="flex -mb-px">
                        {[
                            { id: 'details', name: 'Детали', icon: User },
                            { id: 'history', name: 'История', icon: Clock },
                            { id: 'comments', name: 'Комментарии', icon: MessageSquare },
                            { id: 'attachments', name: 'Вложения', icon: Paperclip }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px]">
                                        {defect.description || 'Описание отсутствует'}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        defect.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                                        defect.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                        defect.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {defect.priority === 'Critical' ? 'Критический' :
                                         defect.priority === 'High' ? 'Высокий' :
                                         defect.priority === 'Medium' ? 'Средний' : 'Низкий'}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        defect.status_name === 'Open' ? 'bg-blue-100 text-blue-800' :
                                        defect.status_name === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                        defect.status_name === 'Resolved' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {defect.status_name}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Назначен</label>
                                    <p className="text-gray-900">{defect.assignee_name || 'Не назначен'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Автор</label>
                                    <p className="text-gray-900">{defect.reporter_name}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
                                    <p className="text-gray-900">
                                        {defect.due_date ? formatDate(defect.due_date) : 'Не установлен'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Создан</label>
                                    <p className="text-gray-900">{formatDate(defect.created_at)}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Обновлен</label>
                                    <p className="text-gray-900">{formatDate(defect.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {history && history.length > 0 ? (
                                history.map(record => (
                                    <div key={record.history_id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-gray-900">{record.changed_by_name}</span>
                                                <span className="text-gray-500 text-sm">{formatDate(record.change_date)}</span>
                                            </div>
                                            <p className="text-gray-700">
                                                Изменено поле <strong>{record.field_name}</strong>: 
                                                <span className="text-red-600 line-through mx-2">{record.old_value || 'пусто'}</span>
                                                → 
                                                <span className="text-green-600 mx-2">{record.new_value || 'пусто'}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">История изменений отсутствует</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="space-y-6">
                            <form onSubmit={handleAddComment} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Введите ваш комментарий..."
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 mb-3"
                                    disabled={commentLoading}
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={commentLoading || !newComment.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {commentLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        Добавить комментарий
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4">
                                {comments && comments.length > 0 ? (
                                    comments.map(comment => (
                                        <div key={comment.comment_id} className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-gray-900">{comment.author_name}</span>
                                                <span className="text-gray-500 text-sm">{formatDate(comment.created_at)}</span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">Комментарии отсутствуют</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'attachments' && (
                        <div className="space-y-4">
                            <div 
                                className={`bg-gray-50 p-4 rounded-lg border-2 ${isDragOver ? 'border-blue-500 border-dashed bg-blue-50' : 'border-gray-200'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Загрузить файл
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        disabled={fileUploading}
                                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        id="file-upload"
                                    />
                                    {fileUploading && (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            <span className="text-sm">Загрузка...</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Перетащите файл сюда или нажмите "Выбрать файл". Максимальный размер: 10MB
                                </p>
                            </div>

                            <div className="space-y-3">
                                {attachments && attachments.length > 0 ? (
                                    attachments.map(attachment => (
                                        <div key={attachment.attachment_id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <Paperclip size={20} className="text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{attachment.file_name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatFileSize(attachment.file_size)} • 
                                                        Загружено {attachment.uploaded_by_name} • {formatDate(attachment.uploaded_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => downloadAttachment(attachment.attachment_id, attachment.file_name)}
                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                    title="Скачать"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                {(user.role === 1 || user.role === 2) && (
                                                    <button
                                                        onClick={() => handleDeleteAttachment(attachment.attachment_id)}
                                                        className="p-1 text-gray-400 hover:text-red-600"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-8">Вложения отсутствуют</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}