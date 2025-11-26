import React, { useState } from 'react';
import Sidebar from './components/sidebar';
import Dashboard from './pages/dashboard';
import Defects from './pages/defects';
import Reports from './pages/reports';
import './index.css';
import { AuthProvider, useAuth } from './context/authcontex'; 
import LoginPage from './pages/loginpage';
import DefectFormModal from './components/defectformmodal';
import RegisterPage from './pages/registerpage';
import Projects from './pages/projects';
import DefectDetailModal from './components/defectdetailmodal';

function AppContent() {
  const { isAuthenticated } = useAuth(); 
  
  const [authView, setAuthView] = useState('login'); 
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState(null);
  const [updateKey, setUpdateKey] = useState(0);
  const [detailDefectId, setDetailDefectId] = useState(null);

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

  const handleViewDefect = (defectId) => {
      setDetailDefectId(defectId);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingDefect(null);
  };

  const handleCloseDetailModal = () => {
      setDetailDefectId(null);
  };
  
  const handleDefectSaved = () => {
      setUpdateKey(prevKey => prevKey + 1); 
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard 
          key={`dashboard-${updateKey}`} 
          onEdit={handleEditDefect} 
          onView={handleViewDefect}
        />; 
      case 'defects': 
        return <Defects 
          key={`defects-${updateKey}`} 
          onEdit={handleEditDefect} 
          onView={handleViewDefect}
        />; 
      case 'projects': 
        return <Projects />; 
      case 'reports': 
        return <Reports />;
      case 'team': 
        return <div className="p-10 text-gray-500">Страница Team в разработке...</div>;
      default: 
        return <Dashboard 
          key={`dashboard-${updateKey}`} 
          onEdit={handleEditDefect} 
          onView={handleViewDefect}
        />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
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
      
      <DefectDetailModal
        isOpen={!!detailDefectId}
        onClose={handleCloseDetailModal}
        defectId={detailDefectId}
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