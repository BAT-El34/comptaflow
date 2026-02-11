
import { DocumentRecord, DocumentStatus, AppSettings, Stats } from '../types';

const STORAGE_KEY = 'comptaflow_docs';
const SETTINGS_KEY = 'comptaflow_settings';

export const getDocuments = (): DocumentRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveDocuments = (docs: DocumentRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
};

export const updateDocumentStatus = (id: string, status: DocumentStatus, updates: Partial<DocumentRecord> = {}) => {
  const docs = getDocuments();
  const index = docs.findIndex(d => d.id === id);
  if (index !== -1) {
    docs[index] = { ...docs[index], ...updates, status };
    saveDocuments(docs);
  }
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : { 
    batchSize: 10, 
    autoProcess: true, 
    concurrency: 3,
    driveEnabled: false,
    driveMode: 'script',
    driveToken: '',
    driveFolderId: '',
    driveScriptUrl: '',
    apiKeys: [],
    modelName: 'gemini-3-flash-preview',
    temperature: 0.1,
    thinkingBudget: 0
  };
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getStats = (): Stats => {
  const docs = getDocuments();
  const total = docs.length;
  const valid = docs.filter(d => d.status === DocumentStatus.VALIDE).length;
  const error = docs.filter(d => d.status === DocumentStatus.ERREUR_ANALYSE || d.status === DocumentStatus.ERREUR_DRIVE).length;
  const analyzed = docs.filter(d => d.status === DocumentStatus.ANALYSE || d.status === DocumentStatus.VALIDE).length;
  
  const kpiAccuracy = total > 0 ? Math.round(((total - error) / total) * 100) : 0;
  
  const docsWithTime = docs.filter(d => d.processingTime);
  const kpiSpeed = docsWithTime.length > 0 
    ? Math.round(docsWithTime.reduce((acc, d) => acc + (d.processingTime || 0), 0) / docsWithTime.length / 1000)
    : 0;

  const kpiAutonomy = analyzed > 0 ? Math.round((valid / analyzed) * 100) : 0;
  const kpiTimeSaved = valid * 0.15;

  return {
    total,
    valid,
    processing: docs.filter(d => d.status === DocumentStatus.EN_TRAITEMENT || d.status === DocumentStatus.NON_TRAITE).length,
    error,
    analyzed,
    kpiAccuracy,
    kpiSpeed,
    kpiAutonomy,
    kpiTimeSaved
  };
};
