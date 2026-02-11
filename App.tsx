
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentRecord, DocumentStatus, FactureData, LigneProduit, AppSettings, UserRole, AIStudio } from './types';
import * as storage from './services/storage';
import * as gemini from './services/gemini';
import { uploadToDrive } from './services/drive';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import VerificationInterface from './components/VerificationInterface';
import AdminPanel from './components/AdminPanel';
import ExportModule from './components/ExportModule';
import CaptureInterface from './components/CaptureInterface';
import Login from './components/Login';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('capture');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [activeAgents, setActiveAgents] = useState<{id: string, fileName: string, agentName: string}[]>([]);
  const [user, setUser] = useState<{name: string, role: UserRole} | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  
  const processingRef = useRef(false);
  const keyRotationIndex = useRef(0);

  const getAIStudio = (): AIStudio | undefined => {
    return (window as any).aistudio;
  };

  useEffect(() => {
    const savedUser = sessionStorage.getItem('comptaflow_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setIsLoggedIn(true);
      setActiveTab(parsed.role === UserRole.ADMIN ? 'dashboard' : 'capture');
    }
    setDocuments(storage.getDocuments());
    setSettings(storage.getSettings());
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.role === UserRole.ADMIN && settings.autoProcess) {
      const interval = setInterval(() => {
        const docs = storage.getDocuments();
        const needsProcessing = docs.some(d => d.status === DocumentStatus.NON_TRAITE);
        if (needsProcessing && !processingRef.current) {
          processQueue(docs);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user, settings.autoProcess]);

  const handleLogin = (role: UserRole, name: string) => {
    const newUser = { name, role };
    setUser(newUser);
    setIsLoggedIn(true);
    sessionStorage.setItem('comptaflow_user', JSON.stringify(newUser));
    setActiveTab(role === UserRole.ADMIN ? 'dashboard' : 'capture');
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('comptaflow_user');
  };

  const handleUpload = useCallback(async (files: FileList | string[]) => {
    const newDocs: DocumentRecord[] = [];
    if (files instanceof FileList) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const promise = new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
        });
        reader.readAsDataURL(file);
        const dataUrl = await promise;
        newDocs.push(createDocRecord(file.name, dataUrl));
      }
    } else {
      files.forEach((dataUrl, idx) => {
        newDocs.push(createDocRecord(`Capture_${Date.now()}_${idx}.jpg`, dataUrl));
      });
    }

    const updatedDocs = [...newDocs, ...documents];
    setDocuments(updatedDocs);
    storage.saveDocuments(updatedDocs);
    
    if (settings.autoProcess && user?.role === UserRole.ADMIN) {
      processQueue(updatedDocs);
    }
  }, [documents, settings, user]);

  const createDocRecord = (fileName: string, imageUrl: string): DocumentRecord => ({
    id: Math.random().toString(36).substr(2, 9),
    driveFileId: 'CLOUD_WAITING',
    fileName,
    status: DocumentStatus.NON_TRAITE,
    uploadDate: new Date().toISOString(),
    imageUrl,
  });

  const getActiveKey = () => {
    if (!settings.apiKeys || settings.apiKeys.length === 0) return process.env.API_KEY || '';
    const key = settings.apiKeys[keyRotationIndex.current % settings.apiKeys.length];
    return key;
  };

  const processQueue = async (docs: DocumentRecord[]) => {
    if (processingRef.current) return;
    processingRef.current = true;
    
    const toProcess = docs.filter(d => d.status === DocumentStatus.NON_TRAITE);
    const concurrency = settings.concurrency || 3;
    const agentsNames = ["Agent Facturation", "Agent Audit", "Agent Fiscalité"];
    
    for (let i = 0; i < toProcess.length; i += concurrency) {
      const batch = toProcess.slice(i, i + concurrency);
      
      await Promise.all(batch.map(async (doc, index) => {
        const agentName = agentsNames[index % agentsNames.length];
        const startTime = Date.now();
        setActiveAgents(prev => [...prev, { id: doc.id, fileName: doc.fileName, agentName }]);
        storage.updateDocumentStatus(doc.id, DocumentStatus.EN_TRAITEMENT);
        setDocuments(storage.getDocuments());

        let retryCount = 0;
        let success = false;

        while (!success && retryCount < Math.max(1, settings.apiKeys.length)) {
          try {
            const result = await gemini.analyzeDocument(doc.imageUrl, {
              apiKey: getActiveKey(),
              modelName: settings.modelName,
              temperature: settings.temperature,
              thinkingBudget: settings.thinkingBudget
            });
            
            let driveId = 'DRIVE_SKIPPED';
            const driveTarget = settings.driveMode === 'script' ? settings.driveScriptUrl : settings.driveToken;
            
            if (driveTarget) {
              driveId = await uploadToDrive(doc.imageUrl, doc.fileName, driveTarget, settings.driveFolderId, settings.driveMode);
            }

            const extractedData: FactureData = {
              joNum: result.document.JO_Num,
              doPiece: result.document.DO_Piece,
              doType: result.document.DO_Type,
              nature: result.document.Nature,
              date: result.document.EC_Date,
              echeance: result.document.EC_Echeance,
              cgNum: result.document.CG_Num,
              ctNum: result.document.CT_Num,
              devise: result.document.EC_Devise,
              libelle: result.document.EC_Libelle,
              refPiece: result.document.EC_RefPiece,
              montantHt: result.lignes_produits.reduce((acc: number, l: any) => acc + (l.EC_Montant || 0), 0),
              montantTtc: result.lignes_produits.reduce((acc: number, l: any) => acc + (l.EC_Montant || 0), 0) * 1.2,
            };

            const lignes: LigneProduit[] = result.lignes_produits.map((l: any, idx: number) => ({
              id: `${doc.id}_l${idx}`,
              nom: l.NOM_PDTS,
              pu: l.EC_PU,
              quantite: l.EC_Quantite,
              montant: l.EC_Montant
            }));

            storage.updateDocumentStatus(doc.id, DocumentStatus.ANALYSE, {
              extractedData,
              lignesProduits: lignes,
              anomalies: (result.anomalies || []).map((a: any, idx: number) => ({ id: `${doc.id}_a${idx}`, ...a, resolu: false })),
              analysisDate: new Date().toISOString(),
              processingTime: Date.now() - startTime,
              driveFileId: driveId
            });

            success = true;

          } catch (error: any) {
            if (error.message === "KEY_FAILURE") {
              keyRotationIndex.current++;
              retryCount++;
              continue;
            }
            storage.updateDocumentStatus(doc.id, DocumentStatus.ERREUR_ANALYSE, { errorLog: error.message });
            break;
          }
        }

        if (!success) {
          const aiStudio = getAIStudio();
          if (aiStudio?.openSelectKey) {
             await aiStudio.openSelectKey();
          }
          storage.updateDocumentStatus(doc.id, DocumentStatus.ERREUR_ANALYSE, {
            errorLog: "Quota épuisé. Configurez de nouvelles clés dans IA CONFIG."
          });
        }

        setActiveAgents(prev => prev.filter(a => a.id !== doc.id));
      }));
      setDocuments(storage.getDocuments());
    }
    processingRef.current = false;
  };

  const handleValidate = (id: string, updatedData: FactureData, updatedLignes: LigneProduit[]) => {
    storage.updateDocumentStatus(id, DocumentStatus.VALIDE, {
      extractedData: updatedData,
      lignesProduits: updatedLignes,
      verificationDate: new Date().toISOString(),
      validatedBy: user?.name
    });
    setDocuments(storage.getDocuments());
  };

  const handleReject = (id: string) => {
    storage.updateDocumentStatus(id, DocumentStatus.NON_TRAITE, {
      extractedData: undefined,
      lignesProduits: [],
      anomalies: [],
      driveFileId: 'CLOUD_WAITING'
    });
    setDocuments(storage.getDocuments());
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  if (!isLoggedIn || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
        onOpenHelp={() => setShowGuide(true)}
      />
      
      <main className="flex-1 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'dashboard' && user.role === UserRole.ADMIN && (
          <Dashboard stats={storage.getStats()} documents={documents} onUpload={handleUpload} isProcessing={activeAgents.length > 0} />
        )}
        {activeTab === 'capture' && (
          <CaptureInterface batchSize={settings.batchSize} onUploadBatch={handleUpload} />
        )}
        {activeTab === 'verification' && (
          <VerificationInterface documents={documents} onValidate={handleValidate} onReject={handleReject} />
        )}
        {activeTab === 'admin' && user.role === UserRole.ADMIN && (
          <AdminPanel settings={settings} onSaveSettings={handleSaveSettings} activeAgents={activeAgents} />
        )}
        {activeTab === 'export' && user.role === UserRole.ADMIN && (
          <ExportModule documents={documents} />
        )}
      </main>

      {/* MODAL DE GUIDE */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest">Guide ComptaFlow AI</h2>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Maîtriser l'automatisation comptable</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
              <section className="space-y-3">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">1</span>
                  Capture & Injection
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Utilisez l'interface <strong>Capture</strong> pour photographier vos factures. Pour une lecture optimale, posez le document à plat sous une lumière vive. L'IA extrait automatiquement les données Sage 100.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px]">2</span>
                  Vérification Humaine
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Rendez-vous dans <strong>Vérification</strong>. L'écran est scindé : l'image originale à gauche et les données IA à droite. Corrigez les champs si nécessaire. Une fois validé, le document est prêt pour l'export.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px]">3</span>
                  Export Sage 100
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Le module <strong>Export</strong> génère un fichier CSV formaté spécifiquement pour l'importateur standard de Sage 100. Un gain de temps de 85% par rapport à la saisie manuelle.
                </p>
              </section>

              <section className="bg-slate-50 p-5 rounded-lg border border-slate-100 space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration IA (Admin)</h4>
                <ul className="text-xs space-y-2 text-slate-600 font-bold">
                  <li className="flex items-start gap-2">
                    <i className="fas fa-circle-check text-blue-500 mt-1"></i>
                    <span><strong>Pool de Clés :</strong> Ajoutez plusieurs clés Gemini pour éviter les limites de quota gratuites.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="fas fa-circle-check text-blue-500 mt-1"></i>
                    <span><strong>Température (0.1) :</strong> Maintenez cette valeur basse pour forcer l'IA à être "mathématique" et non "créative".</span>
                  </li>
                </ul>
              </section>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowGuide(false)}
                className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg hover:bg-blue-600 transition-all"
              >
                Fermer le guide
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeAgents.length > 0 && user.role === UserRole.ADMIN && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <div className="bg-slate-900 text-white rounded-[5px] shadow-2xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-400">
                <i className="fas fa-microchip animate-pulse"></i> Agent Logic ACTIF
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
              {activeAgents.map(agent => (
                <div key={agent.id} className="text-[10px] p-2.5 bg-slate-800/50 rounded-[4px] border border-slate-700">
                  <div className="flex justify-between font-black text-blue-300 uppercase mb-1">
                    <span>{agent.agentName}</span>
                    <i className="fas fa-sync fa-spin text-[8px]"></i>
                  </div>
                  <div className="truncate text-slate-500 italic mb-2">{agent.fileName}</div>
                  <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 animate-progress-ind"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
