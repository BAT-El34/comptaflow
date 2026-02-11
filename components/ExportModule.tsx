
import React from 'react';
import { DocumentRecord, DocumentStatus } from '../types';
import { SAGE_CSV_HEADERS } from '../constants';

interface ExportModuleProps {
  documents: DocumentRecord[];
}

const ExportModule: React.FC<ExportModuleProps> = ({ documents }) => {
  const readyToExport = documents.filter(d => d.status === DocumentStatus.VALIDE);

  const generateCSV = () => {
    let csvRows = [SAGE_CSV_HEADERS.join(',')];
    readyToExport.forEach(doc => {
      const data = doc.extractedData;
      if (!data) return;
      doc.lignesProduits?.forEach(ligne => {
        const row = [data.joNum, data.doPiece, data.doType, data.nature, data.date, `"${ligne.nom}"`, ligne.pu, ligne.quantite, ligne.montant, data.echeance || '', data.cgNum, data.ctNum, 'D', `"${data.libelle}"`, data.refPiece || '', data.devise, '', '', data.date.split('/')[0], '707000'];
        csvRows.push(row.join(','));
      });
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAGE_EXPORT_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-10 rounded-[5px] border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[5px] border border-blue-100 flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-file-export text-xl"></i>
        </div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Génération Import Sage 100</h2>
        <p className="text-[11px] font-bold text-slate-500 uppercase mb-8">
          Queue d'export : <span className="text-blue-600">{readyToExport.length} documents certifiés</span>
        </p>

        <button 
          onClick={generateCSV}
          disabled={readyToExport.length === 0}
          className="w-full px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[5px] hover:bg-blue-600 disabled:bg-slate-200 transition-all shadow-lg"
        >
          Télécharger le lot CSV
        </button>
      </div>

      {readyToExport.length > 0 && (
        <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contenu du lot</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-slate-400 text-[8px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Réf Pièce</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Certifié par</th>
                  <th className="px-6 py-3 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {readyToExport.map((doc) => (
                  <tr key={doc.id} className="text-[10px] font-bold text-slate-700">
                    <td className="px-6 py-3 font-mono">{doc.extractedData?.doPiece}</td>
                    <td className="px-6 py-3 uppercase">{doc.extractedData?.date}</td>
                    <td className="px-6 py-3 uppercase opacity-60 italic">{doc.validatedBy}</td>
                    <td className="px-6 py-3 text-right font-black">{doc.extractedData?.montantTtc.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportModule;
