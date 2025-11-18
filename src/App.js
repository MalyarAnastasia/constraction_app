import React, { useState } from 'react';
import Sidebar from './components/sidebar';
import Header from './components/header';
import Dashboard from './pages/dashboard';
import Defects from './pages/defects';
import './index.css';
import { AuthProvider, useAuth } from './context/authcontex'; 
import LoginPage from './pages/loginpage';
import DefectFormModal from './components/defectformmodal';
import RegisterPage from './pages/registerpage';

function AppContent() {
  const { isAuthenticated } = useAuth(); 
  
  const [authView, setAuthView] = useState('login'); 
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState(null);
  const [updateKey, setUpdateKey] = useState(0);

  if (!isAuthenticated) {
    if (authView === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    } else {

      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

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
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard key={`dashboard-${updateKey}`} onEdit={handleEditDefect} />; 
      case 'defects': return <Defects key={`defects-${updateKey}`} onEdit={handleEditDefect} />; 
      case 'projects': return <div className="p-10 text-gray-500">Страница Projects в разработке...</div>;
      case 'reports': return <div className="p-10 text-gray-500">Страница Reports в разработке...</div>;
      case 'team': return <div className="p-10 text-gray-500">Страница Team в разработке...</div>;
      default: return <Dashboard key={`dashboard-${updateKey}`} onEdit={handleEditDefect} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header title={activeTab} onNewDefectClick={handleNewDefect} />
        <main className="flex-1 overflow-y-auto p-8">
            {renderContent()}
        </main>
      </div>
      <DefectFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={editingDefect} 
        onDefectSaved={handleDefectSaved} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}