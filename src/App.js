import React, { useState } from 'react';
import Sidebar from './components/sidebar';
import Header from './components/header';
import Dashboard from './pages/dashboard';
import Defects from './pages/defects';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'Панель': return <Dashboard />;
      case 'Дефекты': return <Defects />;
      case 'Проекты': return <div className="p-10 text-gray-500"></div>;
      case 'Отчеты': return <div className="p-10 text-gray-500"></div>;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header title={activeTab} />
        
        <main className="flex-1 overflow-y-auto p-8">
            {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;