
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mapping des entrées (accepte le pseudo ou le mail)
    const normalizedUser = username.toLowerCase();
    
    if ((normalizedUser === 'admin' || normalizedUser === 'admin@comptaflow.ai') && password === 'admin123') {
      onLogin(UserRole.ADMIN, 'Jean Administrateur');
    } else if ((normalizedUser === 'user' || normalizedUser === 'user@comptaflow.ai') && password === 'user123') {
      onLogin(UserRole.USER, 'Marc Opérateur');
    } else {
      setError('Identifiants incorrects.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-[5px] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 bg-blue-700 text-center text-white relative">
          <div className="w-16 h-16 bg-white/10 rounded-[5px] flex items-center justify-center mx-auto mb-4 border border-white/20">
            <i className="fas fa-file-invoice text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold tracking-tight">ComptaFlow AI</h2>
          <p className="text-blue-200 text-xs opacity-80 uppercase tracking-widest font-semibold mt-1">Authentification</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-[5px] flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Identifiant / Email</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="ex: admin@comptaflow.ai"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[5px] text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-blue-600 text-white text-xs font-bold rounded-[5px] shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            Se connecter <i className="fas fa-chevron-right text-[10px]"></i>
          </button>

          {/* SECTION COMPTES DE TEST */}
          <div className="pt-6 mt-6 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Accès de démonstration</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-100 flex justify-between items-center group">
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Administrateur</p>
                  <p className="text-xs font-mono text-slate-600">admin@comptaflow.ai</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Pass</p>
                  <p className="text-xs font-mono font-bold text-slate-700">admin123</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-green-600 uppercase">Utilisateur</p>
                  <p className="text-xs font-mono text-slate-600">user@comptaflow.ai</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Pass</p>
                  <p className="text-xs font-mono font-bold text-slate-700">user123</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center opacity-40">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">© 2025 ComptaFlow AI - Enterprise Edition</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
