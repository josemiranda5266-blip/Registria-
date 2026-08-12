import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { StorageEngine } from './lib/storage';
import { ApiClient } from './lib/api';
import { Header } from './components/Header';
import { ChatRAG } from './components/ChatRAG';
import { NormativeLibrary } from './components/NormativeLibrary';
import { ProceduresWizard } from './components/ProceduresWizard';
import { DocumentAnalyzer } from './components/DocumentAnalyzer';
import { CasesAndClients } from './components/CasesAndClients';
import { NormativeRadar } from './components/NormativeRadar';
import { FeeCalculator } from './components/FeeCalculator';
import { OfficialPortals } from './components/OfficialPortals';
import { AdminPanel } from './components/AdminPanel';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [officialOnly, setOfficialOnly] = useState<boolean>(true);
  const [mode, setMode] = useState<'profesional' | 'simple'>('profesional');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(() => StorageEngine.getRole());

  const casesCount = StorageEngine.getCases().length;
  const normsCount = StorageEngine.getNorms().length;

  useEffect(() => {
    // Check existing server session on boot
    ApiClient.getMe().then((user) => {
      if (user) {
        setCurrentUser(user);
        setUserRole(user.role);
      }
    });
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    StorageEngine.setRole(role);
  };

  const handleLogout = () => {
    ApiClient.logout().catch(() => {});
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        officialOnly={officialOnly}
        setOfficialOnly={setOfficialOnly}
        mode={mode}
        setMode={setMode}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        userRole={userRole}
        setUserRole={handleRoleChange}
        casesCount={casesCount}
        normsCount={normsCount}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-10">
        {activeTab === 'chat' && (
          <ChatRAG officialOnly={officialOnly} mode={mode} />
        )}
        {activeTab === 'library' && <NormativeLibrary />}
        {activeTab === 'wizard' && <ProceduresWizard />}
        {activeTab === 'analyzer' && <DocumentAnalyzer />}
        {activeTab === 'cases' && <CasesAndClients />}
        {activeTab === 'radar' && <NormativeRadar />}
        {activeTab === 'calculator' && <FeeCalculator />}
        {activeTab === 'portals' && <OfficialPortals />}
        {activeTab === 'admin' && (
          <AdminPanel userRole={userRole} setUserRole={handleRoleChange} currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-4 text-xs text-center px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p className="font-serif font-bold text-slate-400">REGISTRIA © 2026 — Inteligencia Registral para el Automotor Argentino</p>
          <p className="text-[11px]">
            Herramienta de asistencia profesional. La decisión final corresponde a los Registros Seccionales de la DNRPA.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
