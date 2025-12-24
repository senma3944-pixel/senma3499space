import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const generateVirtualTryOn = async (
  personBase64: string,
  clothingBase64s: string[],
  clothingDesc: string,
  backgroundPrompt: string,
  angles: string[] = ['正面', '左侧45度', '右侧45度', '背面']
): Promise<string> => {
  // Always initialize with the specified environment variable
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: personBase64.split(',')[1] || personBase64,
      },
    }
  ];

  // 添加所有提供的衣服单品图像
  clothingBase64s.forEach((base64) => {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64.split(',')[1] || base64,
      },
    });
  });

  const anglesText = angles.join('、');

  parts.push({
    text: `你是一位顶级AI时尚造型师。
    任务：
    1. 保持人物脸部、发型、体态与第一张图完全一致。
    2. 将衣物替换为后续图片中的款式（${clothingDesc}）。
    3. 背景设定：${backgroundPrompt}。
    4. 构图：在一张图中展示多角度组合：${anglesText}。
    5. 确保光影融合自然，具有商业大片质感。
    
    直接输出生成的图像。`
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    // Iterating through all parts as required by guidelines to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('未检测到生成的图像数据。');
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};