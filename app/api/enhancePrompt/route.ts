import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Enhance this prompt for detailed, visually rich image generation, and the output must be plain text and min limit is 200 chars max is 800: ${prompt}`,
            },
          ],
        },
      ],
    });

    const enhanced = res.text || prompt;
    return NextResponse.json({ enhanced });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Prompt enhancement failed" }, { status: 500 });
  }
}
