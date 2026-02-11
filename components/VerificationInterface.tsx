
import React, { useState, useEffect } from 'react';
import { DocumentRecord, DocumentStatus, FactureData, LigneProduit, AnomalieImpact } from '../types';

interface VerificationInterfaceProps {
  documents: DocumentRecord[];
  onValidate: (id: string, updatedData: FactureData, updatedLignes: LigneProduit[]) => void;
  onReject: (id: string) => void;
}

const HelpIconMini = ({ title, text }: { title: string, text: string }) => (
  <div className="group relative inline-block ml-1">
    <i className="fas fa-circle-exclamation text-blue-400 cursor-help text-[9px] hover:text-blue-600"></i>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-[8px] font-bold rounded shadow-xl z-50 leading-relaxed border border-slate-700">
      <p className="text-blue-400 uppercase mb-1 border-b border-white/10 pb-1">{title}</p>
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const VerificationInterface: React.FC<VerificationInterfaceProps> = ({ documents, onValidate, onReject }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [editableDoc, setEditableDoc] = useState<FactureData | null>(null);
  const [editableLignes, setEditableLignes] = useState<LigneProduit[]>([]);

  const queue = documents.filter(d => d.status === DocumentStatus.ANALYSE || d.status === DocumentStatus.VERIFIE);
  const currentDoc = queue[currentIndex];

  useEffect(() => {
    if (currentDoc) {
      setEditableDoc(currentDoc.extractedData || null);
      setEditableLignes(currentDoc.lignesProduits || []);
    }
  }, [currentDoc]);

  if (!currentDoc) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[5px] border border-dashed border-slate-300 p-8 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-[5px] flex items-center justify-center mb-4 border border-slate-100">
          <i className="fas fa-check-circle text-slate-300 text-2xl"></i>
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">File d'attente vide</h3>
        <p className="text-[11px] text-slate-500 font-bold uppercase mt-2">Tous les documents ont été traités</p>
      </div>
    );
  }

  const handleFieldChange = (field: keyof FactureData, value: any) => {
    if (editableDoc) setEditableDoc({ ...editableDoc, [field]: value });
  };

  const handleLigneChange = (id: string, field: keyof LigneProduit, value: any) => {
    setEditableLignes(editableLignes.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      <div className="flex justify-between items-center bg-white p-3 rounded-[5px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="bg-slate-900 text-white px-2 py-1 rounded-[3px] text-[9px] font-black uppercase tracking-widest">
            DOC {currentIndex + 1} / {queue.length}
          </span>
          <div className="h-4 w-px bg-slate-200"></div>
          <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate max-w-xs">
            {currentDoc.fileName}
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={currentIndex === 0} 
            onClick={() => setCurrentIndex(i => i - 1)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-30 border border-slate-100 rounded-[5px]"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <button 
            disabled={currentIndex === queue.length - 1} 
            onClick={() => setCurrentIndex(i => i + 1)}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-30 border border-slate-100 rounded-[5px]"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
        {/* Visualizer */}
        <div className="lg:w-1/2 bg-slate-800 rounded-[5px] overflow-hidden relative flex items-center justify-center border border-slate-700">
          <div className="absolute top-4 left-4 z-10 flex gap-1">
            <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center rounded-[5px] transition-all">
              <i className="fas fa-search-plus text-xs"></i>
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center rounded-[5px] transition-all">
              <i className="fas fa-search-minus text-xs"></i>
            </button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center rounded-[5px] transition-all">
              <i className="fas fa-undo text-xs"></i>
            </button>
          </div>
          <div 
            className="transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              backgroundImage: `url(${currentDoc.imageUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '95%',
              height: '95%'
            }}
          />
        </div>

        {/* Editor Form */}
        <div className="lg:w-1/2 bg-white rounded-[5px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-2">Données de Facturation</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <EditorField label="N° Facture" value={editableDoc?.doPiece || ''} onChange={(val: string) => handleFieldChange('doPiece', val)} 
                  helpTitle="Numéro de pièce" helpText="Identifiant unique de la facture utilisé pour le rapprochement bancaire." />
                
                <EditorField label="Date" value={editableDoc?.date || ''} onChange={(val: string) => handleFieldChange('date', val)} 
                  helpTitle="Date d'émission" helpText="Date de création de la facture par le fournisseur." />
                
                <EditorField label="Code Tiers" value={editableDoc?.ctNum || ''} onChange={(val: string) => handleFieldChange('ctNum', val)} 
                  helpTitle="CT Num" helpText="Code du compte client ou fournisseur dans le plan tiers de Sage 100." />
                
                <EditorField label="Journal" value={editableDoc?.joNum || ''} onChange={(val: string) => handleFieldChange('joNum', val)} 
                  helpTitle="JO Num" helpText="Code du journal comptable (ex: AC pour Achats, VE pour Ventes)." />
                
                <EditorField label="Total HT (€)" type="number" value={editableDoc?.montantHt || 0} onChange={(val: string) => handleFieldChange('montantHt', parseFloat(val))} 
                  helpTitle="Montant HT" helpText="Somme des produits sans la taxe sur la valeur ajoutée." />
                
                <EditorField label="Total TTC (€)" type="number" value={editableDoc?.montantTtc || 0} onChange={(val: string) => handleFieldChange('montantTtc', parseFloat(val))} 
                  helpTitle="Montant TTC" helpText="Montant total à payer incluant toutes les taxes." />
              </div>
            </div>

            {currentDoc.anomalies && currentDoc.anomalies.length > 0 && (
              <div className="p-4 rounded-[5px] bg-amber-50 border border-amber-100 space-y-2">
                <h4 className="text-[9px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <i className="fas fa-exclamation-triangle"></i> Détections IA
                </h4>
                {currentDoc.anomalies.map((ano) => (
                  <div key={ano.id} className="text-[11px] font-bold text-amber-900 bg-white/80 p-2 border border-amber-200 rounded-[5px] flex items-start gap-3">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${ano.impact === AnomalieImpact.CRITIQUE ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                    {ano.description}
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-50 pb-2">Lignes de Pièce</h3>
              <div className="space-y-3">
                {editableLignes.map((ligne) => (
                  <div key={ligne.id} className="p-3 rounded-[5px] border border-slate-100 bg-slate-50/50 space-y-3">
                    <input 
                      className="w-full text-[11px] font-black bg-transparent border-none focus:ring-0 p-0 text-slate-800 uppercase tracking-tight"
                      value={ligne.nom}
                      onChange={(e) => handleLigneChange(ligne.id, 'nom', e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <EditorFieldMini label="P.U" value={ligne.pu} onChange={(val: string) => handleLigneChange(ligne.id, 'pu', parseFloat(val))} />
                      <EditorFieldMini label="QTÉ" value={ligne.quantite} onChange={(val: string) => handleLigneChange(ligne.id, 'quantite', parseFloat(val))} />
                      <EditorFieldMini label="TOTAL" value={ligne.montant} disabled />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
            <button 
              onClick={() => onReject(currentDoc.id)}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-500 rounded-[5px] hover:bg-white hover:text-red-600 transition-all"
            >
              Rejeter
            </button>
            <button 
              onClick={() => {
                if(editableDoc) onValidate(currentDoc.id, editableDoc, editableLignes);
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-[5px] hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2"
            >
              Valider & Archiver <i className="fas fa-check"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorField = ({ label, value, onChange, type = "text", disabled = false, helpTitle, helpText }: any) => (
  <div className="space-y-1">
    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block pl-0.5 flex items-center">
      {label}
      {helpTitle && <HelpIconMini title={helpTitle} text={helpText} />}
    </label>
    <input 
      type={type}
      className="w-full text-xs font-bold border border-slate-200 rounded-[5px] bg-slate-50/30 py-2 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

const EditorFieldMini = ({ label, value, onChange, type = "number", disabled = false }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[7px] font-black text-slate-400 uppercase tracking-tighter block pl-0.5">{label}</label>
    <input 
      type={type}
      className="w-full text-[10px] font-black h-8 border border-slate-200 rounded-[5px] px-2 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-all outline-none"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      disabled={disabled}
    />
  </div>
);

export default VerificationInterface;
