
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Stats, DocumentRecord, DocumentStatus } from '../types';

interface DashboardProps {
  stats: Stats;
  documents: DocumentRecord[];
  onUpload: (files: FileList) => void;
  isProcessing: boolean;
}

const HelpTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1">
    <i className="fas fa-circle-exclamation text-slate-300 cursor-help text-[9px]"></i>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-40 p-2 bg-slate-900 text-white text-[8px] font-bold rounded shadow-xl z-50 leading-relaxed border border-slate-700">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, documents, onUpload, isProcessing }) => {
  const chartData = [
    { name: 'NON TRAITÉ', value: documents.filter(d => d.status === DocumentStatus.NON_TRAITE).length, color: '#94a3b8' },
    { name: 'IA ANALYSE', value: stats.analyzed, color: '#3b82f6' },
    { name: 'CERTIFIÉ SAGE', value: stats.valid, color: '#10b981' },
    { name: 'ERREURS', value: stats.error, color: '#ef4444' },
  ];

  const systemHealth = Math.round((stats.kpiAccuracy + stats.kpiAutonomy) / 2);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-3 rounded-[5px] flex items-center justify-between border border-slate-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">System Status: {isProcessing ? 'Processing' : 'Idle'}</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Health:</span>
             <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${systemHealth}%` }}></div>
             </div>
             <span className="text-[10px] font-bold text-blue-400">{systemHealth}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Poste de Supervision Automatisé</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Monitoring des flux multi-agents SAGE 100</p>
        </div>
        <div className="flex gap-2">
          <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-[5px] shadow-sm transition-all ${isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600'}`}>
            <i className="fas fa-microchip mr-2"></i>
            Injecter Nouveau Flux
            <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onUpload(e.target.files)} disabled={isProcessing} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          kpiId="KPI 1"
          label="Précision IA" 
          value={`${stats.kpiAccuracy}%`} 
          desc="Taux de réussite sans erreur" 
          icon="fa-crosshairs" 
          color="text-blue-500" 
          help="Pourcentage de factures ayant passé l'analyse IA sans échec critique de lecture."
        />
        <KPICard 
          kpiId="KPI 2"
          label="Vélocité Moy." 
          value={`${stats.kpiSpeed}s`} 
          desc="Temps de réponse par agent" 
          icon="fa-tachometer-alt" 
          color="text-amber-500" 
          help="Moyenne du temps de traitement (IA + Cloud) pour un document unique."
        />
        <KPICard 
          kpiId="KPI 3"
          label="Indice Autonomie" 
          value={`${stats.kpiAutonomy}%`} 
          desc="Docs validés sans retouche" 
          icon="fa-brain" 
          color="text-indigo-500" 
          help="Ratio de documents validés par l'humain sans aucune modification des champs extraits."
        />
        <KPICard 
          kpiId="KPI 4"
          label="Gain Opérationnel" 
          value={`${stats.kpiTimeSaved.toFixed(1)}h`} 
          desc="Temps administratif économisé" 
          icon="fa-stopwatch" 
          color="text-green-500" 
          help="Estimation du temps total gagné par rapport à une saisie manuelle (basé sur 10min/facture)."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[5px] border border-slate-200 shadow-sm relative overflow-hidden">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <i className="fas fa-project-diagram text-blue-500"></i> Analytics Flux de Production
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '5px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="value" radius={[1, 1, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[5px] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Console Log d'Agents</h3>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
            {documents.length === 0 && (
              <div className="py-20 text-center opacity-10">
                <i className="fas fa-layer-group text-4xl mb-3"></i>
                <p className="text-[10px] font-black uppercase tracking-widest font-mono">Standby - No Data</p>
              </div>
            )}
            {documents.slice(0, 20).map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-[5px] border border-slate-50 hover:bg-slate-50 transition-colors group">
                <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 border ${getStatusBorder(doc.status)} ${getStatusBg(doc.status)}`}>
                  <i className={`fas ${getStatusIcon(doc.status)} text-[10px]`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tighter">{doc.fileName}</p>
                  <p className="text-[8px] text-slate-400 font-bold font-mono uppercase">{new Date(doc.uploadDate).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ kpiId, label, value, desc, icon, color, help }: any) => (
  <div className="bg-white p-5 rounded-[5px] border border-slate-200 shadow-sm hover:border-blue-500/50 transition-all group relative overflow-hidden">
    <div className="flex justify-between items-start mb-3">
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">{kpiId}</span>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight flex items-center">
          {label}
          <HelpTooltip text={help} />
        </span>
      </div>
      <i className={`fas ${icon} ${color} text-xs`}></i>
    </div>
    <p className="text-3xl font-black text-slate-900 tracking-tighter mb-1 font-mono">{value}</p>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{desc}</p>
  </div>
);

const getStatusBg = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.NON_TRAITE: return 'bg-slate-50 text-slate-400';
    case DocumentStatus.EN_TRAITEMENT: return 'bg-blue-50 text-blue-500';
    case DocumentStatus.VALIDE: return 'bg-green-50 text-green-500';
    case DocumentStatus.ERREUR_ANALYSE: return 'bg-red-50 text-red-500';
    default: return 'bg-slate-50 text-slate-400';
  }
};

const getStatusBorder = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.NON_TRAITE: return 'border-slate-100';
    case DocumentStatus.EN_TRAITEMENT: return 'border-blue-100';
    case DocumentStatus.VALIDE: return 'border-green-100';
    case DocumentStatus.ERREUR_ANALYSE: return 'border-red-100';
    default: return 'border-slate-100';
  }
};

const getStatusIcon = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.NON_TRAITE: return 'fa-clock';
    case DocumentStatus.EN_TRAITEMENT: return 'fa-sync fa-spin';
    case DocumentStatus.VALIDE: return 'fa-shield-check';
    case DocumentStatus.ERREUR_ANALYSE: return 'fa-exclamation-triangle';
    default: return 'fa-file-invoice';
  }
};

export default Dashboard;
