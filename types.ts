
export enum DocumentStatus {
  NON_TRAITE = 'non_traité',
  EN_TRAITEMENT = 'en_traitement',
  ANALYSE = 'analysé',
  VERIFIE = 'vérifié',
  VALIDE = 'validé',
  EXPORTED = 'exporté',
  ERREUR_ANALYSE = 'erreur_analyse',
  ERREUR_DRIVE = 'erreur_drive'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export enum AnomalieImpact {
  CRITIQUE = 'critique',
  MOYEN = 'moyen',
  FAIBLE = 'faible'
}

export interface Anomalie {
  id: string;
  type: string;
  description: string;
  impact: AnomalieImpact;
  resolu: boolean;
}

export interface LigneProduit {
  id: string;
  nom: string;
  pu: number;
  quantite: number;
  montant: number;
  tva?: number;
}

export interface FactureData {
  joNum: string;
  doPiece: string;
  doType: number;
  nature: string;
  date: string;
  echeance: string | null;
  cgNum: string;
  ctNum: string;
  devise: string;
  libelle: string;
  refPiece?: string;
  montantHt: number;
  montantTtc: number;
}

export interface DocumentRecord {
  id: string;
  driveFileId: string;
  fileName: string;
  status: DocumentStatus;
  uploadDate: string;
  analysisDate?: string;
  verificationDate?: string;
  validatedBy?: string;
  imageUrl: string; 
  extractedData?: FactureData;
  lignesProduits?: LigneProduit[];
  anomalies?: Anomalie[];
  errorLog?: string;
  processingTime?: number;
}

export interface AppSettings {
  batchSize: number;
  autoProcess: boolean;
  concurrency: number;
  // Drive Config
  driveEnabled: boolean;
  driveMode: 'oauth' | 'script';
  driveToken?: string;
  driveFolderId?: string;
  driveScriptUrl?: string; // URL du WebApp Google Apps Script
  // LLM Config
  apiKeys: string[];
  modelName: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  temperature: number; 
  thinkingBudget: number;
}

export interface Stats {
  total: number;
  valid: number;
  processing: number;
  error: number;
  analyzed: number;
  kpiAccuracy: number;
  kpiSpeed: number;
  kpiAutonomy: number;
  kpiTimeSaved: number;
}

export interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}
