import { GoogleGenAI, Type } from "@google/genai";

export const parseReceiptImage = async (base64Image: string): Promise<any> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Detect dynamic MIME type from base64 string
  const mimeTypeMatch = base64Image.match(/^data:(image\/(png|jpeg|jpg|webp));base64,/);
  const detectedMimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

  // 2. Clean base64 data correctly (remove prefix)
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      // Using gemini-flash-latest for robust multimodal extraction
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: detectedMimeType,
                data: cleanBase64
              }
            },
            {
              text: `Analyze this construction material receipt (Nota Toko Bangunan) from Indonesia. 
              
              Tasks:
              1. Extract the Date (YYYY-MM-DD).
              2. Extract all line items. 
                 - Description: Clear material name.
                 - Volume: Numeric quantity.
                 - Unit: e.g., 'sak', 'btg', 'm3', 'rit', 'kg'.
                 - PricePerUnit: Numeric price per item.
                 - TotalPrice: Volume * PricePerUnit.
              
              Return pure JSON and ignore non-material text.`
            }
          ]
        }
      ],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  volume: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  pricePerUnit: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER }
                },
                required: ["description", "volume", "unit", "totalPrice"]
              }
            }
          },
          required: ["date", "items"]
        }
      }
    });

    if (response.text) {
      // Ensure we clean potential markdown backticks if AI doesn't obey responseMimeType perfectly
      const jsonStr = response.text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    }
    return null;

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    // Return null to allow UI to fallback to manual entry
    return null;
  }
};