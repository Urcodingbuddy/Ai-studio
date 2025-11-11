import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const response = await ai.models.generateContent({
  model: "gemini-2.0-pro",
  contents: [
    {
      role: "user",
      parts: [
        {
          text: `Enhance this prompt for detailed, visually rich image generation: ${prompt}`,
        },
      ],
    },
  ],
});

export const enhancedText = response.text;
