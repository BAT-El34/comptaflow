
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { checkDriveAccess } from '../services/drive';

interface AdminPanelProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  activeAgents: {id: string, fileName: string, agentName: string}[];
}

const HelpIcon = ({ text, title }: { text: string, title?: string }) => (
  <div className="group relative inline-block ml-1">
    <i className="fas fa-circle-exclamation text-blue-500 cursor-help text-[11px] hover:scale-110 transition-transform"></i>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-[10px] font-medium rounded-lg shadow-2xl z-50 leading-relaxed border border-slate-700 animate-in fade-in zoom-in duration-200">
      {title && <p className="font-black text-blue-400 uppercase mb-1 border-b border-white/10 pb-1 tracking-widest">{title}</p>}
      <p className="opacity-90">{text}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ settings, onSaveSettings, activeAgents }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newKey, setNewKey] = useState('');
  const [isDriveValid, setIsDriveValid] = useState<boolean | null>(null);
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  useEffect(() => {
    if (localSettings.driveMode === 'oauth' && localSettings.driveToken) validateDrive(localSettings.driveToken);
  }, []);

  const validateDrive = async (token: string) => {
    const valid = await checkDriveAccess(token);
    setIsDriveValid(valid);
  };

  const addKey = () => {
    if (newKey.trim() && !localSettings.apiKeys.includes(newKey.trim())) {
      setLocalSettings({
        ...localSettings,
        apiKeys: [...localSettings.apiKeys, newKey.trim()]
      });
      setNewKey('');
    }
  };

  const removeKey = (index: number) => {
    const updated = localSettings.apiKeys.filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, apiKeys: updated });
  };

  const handleSaveAll = () => {
    onSaveSettings(localSettings);
  };

  const scriptCode = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var folder = DriveApp.getFolderById(data.folderId || "ID_DU_DOSSIER");
  var decoded = Utilities.base64Decode(data.image);
  var blob = Utilities.newBlob(decoded, "image/jpeg", data.filename);
  var file = folder.createFile(blob);
  return ContentService.createTextOutput(JSON.stringify({id: file.getId()})).setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Poste de Commandement</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Infrastructures Cloud & Orchestration IA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* MULTI-KEY MANAGEMENT */}
          <div className="bg-white border border-slate-200 rounded-[5px] p-6 shadow-sm">
             <div className="flex justify-between items-start mb-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <i className="fas fa-key text-blue-500"></i> Pool de Clés API Gemini
                 <HelpIcon 
                    title="Rotation des clés"
                    text="Le système utilise un algorithme de 'Round Robin'. Si une clé atteint son quota (429) ou expire, l'agent passe automatiquement à la suivante. Idéal pour traiter des lots de +50 factures simultanément." 
                 />
               </h3>
             </div>
             
             <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="password"
                    placeholder="Coller une nouvelle clé API..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-[5px] px-3 py-2 text-xs font-mono outline-none focus:border-blue-500"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                  <button 
                    onClick={addKey}
                    className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-[5px] hover:bg-blue-600 transition-all"
                  >
                    Ajouter
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {localSettings.apiKeys.length === 0 && (
                    <p className="text-[9px] text-slate-400 italic font-bold">Aucune clé enregistrée (Utilise la clé système par défaut)</p>
                  )}
                  {localSettings.apiKeys.map((key, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-[4px] group">
                      <span className="text-[10px] font-mono text-slate-500">••••••••{key.slice(-6)}</span>
                      <button onClick={() => removeKey(idx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fas fa-trash-alt text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* LLM CONFIG (Simplified for brevity as already present) */}
          <div className="bg-white border border-slate-200 rounded-[5px] p-6 shadow-sm">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <i className="fas fa-sliders text-indigo-500"></i> Configuration du Moteur IA
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase flex items-center justify-between mb-3">
                        Niveau de "Sérieux"
                        <HelpIcon 
                          title="Température LLM"
                          text="0.1 (Strict) : L'IA ne s'éloigne pas du texte brut. Recommandé pour la comptabilité." 
                        />
                      </label>
                      <input 
                        type="range" min="0" max="1" step="0.1"
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        value={localSettings.temperature}
                        onChange={(e) => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
                      />
                      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mt-2">
                        <span>Expert (0.1)</span>
                        <span>Interprète (1.0)</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase flex items-center justify-between mb-3">
                        Moteur Logique
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setLocalSettings({...localSettings, modelName: 'gemini-3-flash-preview'})}
                          className={`py-2 rounded-[5px] text-[9px] font-black uppercase border transition-all ${localSettings.modelName === 'gemini-3-flash-preview' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}
                        >
                          Gemini 3 Flash
                        </button>
                        <button 
                          onClick={() => setLocalSettings({...localSettings, modelName: 'gemini-3-pro-preview'})}
                          className={`py-2 rounded-[5px] text-[9px] font-black uppercase border transition-all ${localSettings.modelName === 'gemini-3-pro-preview' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}
                        >
                          Gemini 3 Pro
                        </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* DRIVE SYNC - UPDATED FOR NO-OAUTH SOLUTION */}
          <div className="bg-white border border-slate-200 rounded-[5px] p-6 shadow-sm">
             <div className="flex justify-between items-start mb-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <i className="fab fa-google-drive text-green-600"></i> Archivage Cloud Drive
                 <HelpIcon 
                    title="Solution gratuite"
                    text="Choisissez 'Mode Script' pour une configuration sans jeton compliqué en utilisant un relais Google Apps Script." 
                 />
               </h3>
               <div className="flex bg-slate-100 p-1 rounded-[5px]">
                  <button 
                    onClick={() => setLocalSettings({...localSettings, driveMode: 'script'})}
                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-[3px] transition-all ${localSettings.driveMode === 'script' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Mode Script (Relais)
                  </button>
                  <button 
                    onClick={() => setLocalSettings({...localSettings, driveMode: 'oauth'})}
                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-[3px] transition-all ${localSettings.driveMode === 'oauth' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Mode Expert (OAuth)
                  </button>
               </div>
             </div>
             
             <div className="grid grid-cols-1 gap-6">
                {localSettings.driveMode === 'script' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-[5px] flex items-start gap-4">
                      <i className="fas fa-magic text-blue-500 mt-1"></i>
                      <div className="space-y-2">
                         <p className="text-[10px] font-bold text-blue-900 uppercase">Configuration sans authentification (Conseillé)</p>
                         <p className="text-[9px] text-blue-700 leading-relaxed font-medium italic">
                           Permet d'envoyer les factures vers votre Drive sans configurer Google Cloud. 
                           <button onClick={() => setShowScriptGuide(true)} className="ml-1 text-blue-600 underline font-black">Voir comment faire (2 min)</button>
                         </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">URL du Script WebApp</label>
                        <input 
                          type="text"
                          placeholder="https://script.google.com/macros/s/..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-[5px] px-3 py-2 text-xs font-mono outline-none"
                          value={localSettings.driveScriptUrl || ''}
                          onChange={(e) => setLocalSettings({...localSettings, driveScriptUrl: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">ID du Dossier Destination</label>
                        <input 
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 rounded-[5px] px-3 py-2 text-xs font-mono outline-none"
                          placeholder="1z-XXXXX..."
                          value={localSettings.driveFolderId || ''}
                          onChange={(e) => setLocalSettings({...localSettings, driveFolderId: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">OAuth Token (Bearer)</label>
                      <input 
                        type="password"
                        className="w-full bg-slate-50 border border-slate-200 rounded-[5px] px-3 py-2 text-xs font-mono outline-none"
                        value={localSettings.driveToken || ''}
                        onChange={(e) => setLocalSettings({...localSettings, driveToken: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Dossier ID</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-[5px] px-3 py-2 text-xs font-mono outline-none"
                        value={localSettings.driveFolderId || ''}
                        onChange={(e) => setLocalSettings({...localSettings, driveFolderId: e.target.value})}
                      />
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[5px] border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Contrôle des Flux</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-[5px] border border-slate-100">
                <span className="text-[9px] font-black text-slate-600 uppercase">Auto-Processing</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={localSettings.autoProcess} onChange={() => setLocalSettings({...localSettings, autoProcess: !localSettings.autoProcess})} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Simultanéité (Agents)</label>
                  <span className="text-[10px] font-black text-blue-600">{localSettings.concurrency}</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  value={localSettings.concurrency}
                  onChange={(e) => setLocalSettings({...localSettings, concurrency: parseInt(e.target.value)})}
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={handleSaveAll}
                  className="w-full py-3 bg-slate-900 text-white text-[9px] font-black rounded-[5px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                >
                  Appliquer la configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL GUIDE SCRIPT */}
      {showScriptGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
               <h3 className="text-sm font-black uppercase tracking-widest">Guide Relais Google Drive</h3>
               <button onClick={() => setShowScriptGuide(false)} className="opacity-60 hover:opacity-100">
                  <i className="fas fa-times"></i>
               </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
               <div className="space-y-2">
                 <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">1. Créer le relais</p>
                 <p className="text-xs text-slate-600 font-medium leading-relaxed">Allez sur <a href="https://script.google.com" target="_blank" className="text-blue-500 underline">script.google.com</a>, cliquez sur "Nouveau projet" et collez le code suivant :</p>
                 <pre className="bg-slate-50 p-3 rounded border border-slate-200 text-[10px] font-mono text-slate-700 overflow-x-auto whitespace-pre">
                   {scriptCode}
                 </pre>
               </div>
               
               <div className="space-y-2">
                 <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">2. Déployer</p>
                 <ul className="text-xs text-slate-600 font-medium space-y-2 list-disc pl-4">
                   <li>Cliquez sur <strong>"Déployer"</strong> (en haut à droite) > <strong>"Nouvel envoi"</strong>.</li>
                   <li>Type : <strong>"Application Web"</strong>.</li>
                   <li>Exécuter en tant que : <strong>"Moi"</strong>.</li>
                   <li>Qui a accès : <strong>"Tout le monde"</strong>.</li>
                 </ul>
               </div>

               <div className="space-y-2">
                 <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">3. Copier l'URL</p>
                 <p className="text-xs text-slate-600 font-medium">Une fois déployé, copiez l'<strong>URL de l'application Web</strong> et collez-la dans le champ "URL du Script" de ComptaFlow.</p>
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
               <button onClick={() => setShowScriptGuide(false)} className="px-6 py-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-[5px]">J'ai compris</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
