
/**
 * Service de communication avec l'API Google Drive
 */

export const uploadToDrive = async (base64Data: string, fileName: string, tokenOrUrl: string, folderId?: string, mode: 'oauth' | 'script' = 'oauth'): Promise<string> => {
  try {
    if (mode === 'script') {
      // MODE SIMPLIFIÉ : Envoi au relais Google Apps Script
      const response = await fetch(tokenOrUrl, {
        method: 'POST',
        mode: 'no-cors', // Important pour Apps Script WebApp
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data.split(',')[1] || base64Data,
          filename: fileName,
          folderId: folderId
        })
      });
      // Note: no-cors ne permet pas de lire la réponse, on assume le succès ou on utilise un ID fictif
      return "SCRIPT_UPLOADED_" + Date.now();
    } else {
      // MODE EXPERT : API REST v3 Directe
      const responseData = await fetch(base64Data);
      const blob = await responseData.blob();

      const metadata = {
        name: fileName,
        mimeType: 'image/jpeg',
        parents: folderId ? [folderId] : []
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', blob);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenOrUrl}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erreur Drive");
      }

      const result = await response.json();
      return result.id;
    }
  } catch (error) {
    console.error("Drive Service Error:", error);
    throw error;
  }
};

export const checkDriveAccess = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
};
