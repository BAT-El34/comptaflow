
import { GoogleGenAI } from "@google/genai";
import { PROMPT_COMPTABLE } from "../constants";

export interface AnalysisConfig {
  apiKey: string;
  modelName: string;
  temperature: number;
  thinkingBudget: number;
}

export const analyzeDocument = async (base64Image: string, config: AnalysisConfig) => {
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    
    const genConfig: any = {
      temperature: config.temperature,
      responseMimeType: "application/json"
    };

    // Le thinkingBudget n'est applicable que si > 0
    if (config.thinkingBudget > 0) {
      genConfig.thinkingConfig = { thinkingBudget: config.thinkingBudget };
    }

    const response = await ai.models.generateContent({
      model: config.modelName,
      contents: [
        {
          parts: [
            { text: PROMPT_COMPTABLE },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(',')[1] || base64Image
              }
            }
          ]
        }
      ],
      config: genConfig
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide du moteur IA");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Erreur Moteur IA:", error);
    
    // Codes d'erreur spécifiques pour déclencher la rotation
    const errorMsg = error.message?.toLowerCase() || "";
    if (
      errorMsg.includes("429") || 
      errorMsg.includes("quota") || 
      errorMsg.includes("requested entity was not found") || 
      errorMsg.includes("api_key") ||
      errorMsg.includes("invalid")
    ) {
      throw new Error("KEY_FAILURE");
    }
    
    throw error;
  }
};
