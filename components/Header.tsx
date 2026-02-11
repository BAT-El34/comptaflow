
import React, { useState } from 'react';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { name: string; role: UserRole };
  onLogout: () => void;
  onOpenHelp?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, user, onLogout, onOpenHelp }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allTabs = [
    { id: 'dashboard', label: 'DASHBOARD', icon: 'fa-chart-line', roles: [UserRole.ADMIN] },
    { id: 'capture', label: 'CAPTURE', icon: 'fa-camera', roles: [UserRole.ADMIN, UserRole.USER] },
    { id: 'verification', label: 'VÉRIFICATION', icon: 'fa-check-double', roles: [UserRole.ADMIN, UserRole.USER] },
    { id: 'admin', label: 'IA CONFIG', icon: 'fa-robot', roles: [UserRole.ADMIN] },
    { id: 'export', label: 'EXPORT SAGE', icon: 'fa-file-export', roles: [UserRole.ADMIN] },
  ];

  const visibleTabs = allTabs.filter(tab => tab.roles.includes(user.role));

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          
          <div className="flex items-center gap-4 lg:gap-8">
            {/* BURGER MENU BUTTON (MOBILE) */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded-[5px] transition-all"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-sm`}></i>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-[5px] flex items-center justify-center text-white shrink-0">
                <i className="fas fa-file-invoice text-xs"></i>
              </div>
              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                COMPTAFLOW <span className="text-blue-600">AI</span>
              </span>
            </div>

            {/* DESKTOP NAV */}
            <nav className="hidden lg:flex space-x-1">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-[5px] ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <i className={`fas ${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenHelp}
              className="w-9 h-9 flex items-center justify-center rounded-[5px] text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all shadow-sm group mr-2"
              title="Centre d'aide"
            >
              <i className="fas fa-question text-[11px] animate-pulse"></i>
            </button>
            <div className="text-right hidden sm:block border-r border-slate-100 pr-4">
              <p className="text-[10px] font-bold text-slate-900 leading-none mb-1 uppercase tracking-tighter">{user.name}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-blue-500 leading-none">{user.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="w-9 h-9 flex items-center justify-center rounded-[5px] text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 transition-all shadow-sm group"
              title="Déconnexion"
            >
              <i className="fas fa-power-off text-[11px] group-hover:scale-110 transition-transform"></i>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE NAV PANEL */}
      <div className={`fixed top-14 left-0 w-64 h-[calc(100vh-56px)] bg-white border-r border-slate-200 z-40 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-1">
          <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 mt-2">Navigation Système</p>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-[5px] ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-[4px] flex items-center justify-center ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                <i className={`fas ${tab.icon} text-[10px]`}></i>
              </div>
              {tab.label}
              {activeTab === tab.id && <i className="fas fa-chevron-right ml-auto text-[8px] opacity-60"></i>}
            </button>
          ))}

          <div className="pt-6 mt-6 border-t border-slate-100 px-3">
             <div className="p-4 bg-slate-50 rounded-[5px] border border-slate-100">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Session active</p>
                <p className="text-[10px] font-bold text-slate-900 truncate">{user.name}</p>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <button 
                    onClick={onLogout}
                    className="w-full text-center text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
