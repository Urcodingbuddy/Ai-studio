import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function POST(req: Request) {
  try {
    const {
      prompt,
      dishName,
      numberOfImages = 1,
      aspectRatio = "1:1",
      guidanceScale = 7.5,
      foodMode = false,
      enhancePrompt = true,
      referenceImages = [],
    } = await req.json();
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Gemini API key missing" },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: async () => {},
        },
      }
    );

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error("Auth Error:", userErr);
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    let enhancedPrompt = prompt.trim();

   if (enhancePrompt) {
  try {
    const context = foodMode
      ? "Enhance this prompt for professional restaurant food photography — focus on realistic lighting, texture, plating, and depth."
      : "Enhance this prompt for high-quality, visually detailed, photorealistic imagery.";

    const enhancement = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are an image-prompt enhancement engine.

RULES:
1. Output ONLY the enhanced prompt text.
2. No explanations, no bullet points, no markdown.
3. No assistant-style tone.
4. No commentary.
5. 200–800 characters only.
6. Pure descriptive visual prompt.
7. Must NOT wrap the output in quotes.
8. Must NOT say "Here is your enhanced prompt".

CONTEXT:
${context}

USER PROMPT:
"${prompt}"

RETURN ONLY THE ENHANCED PROMPT:
`
            }
          ]
        }
      ]
    });

    // ----------------------------------------
    // FIX: cast to any so TS stops complaining
    // ----------------------------------------
    const out =
      (enhancement as any).output_text ??
      (enhancement as any).candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join(" ");

    if (out && typeof out === "string") {
      enhancedPrompt = out.trim();
    }
  } catch (err) {
    console.warn("Prompt enhancement failed, fallback to original prompt");
  }
}


    const basePrompt = foodMode
      ? `Restaurant-style photograph of ${
          dishName || "a dish"
        } — ${enhancedPrompt}`
      : enhancedPrompt;

    const imageParts: any[] = [{ text: basePrompt }];
    for (const img of referenceImages) {
      if (typeof img === "string" && img.startsWith("data:image/")) {
        const [meta, base64Data] = img.split(",");
        const mimeType =
          meta.match(/data:(image\/[a-zA-Z+]+);base64/)?.[1] || "image/png";
        imageParts.push({
          inlineData: { mimeType, data: base64Data },
        });
      }
    }

    const response = await ai.models.generateImages({
      model: "imagen-4.0-ultra-generate-001",
      prompt: basePrompt,
      config: {
        numberOfImages,
        aspectRatio,
        guidanceScale,
        imageSize: "2K",
        ...(imageParts.length > 1 ? { references: imageParts } : {}), // attach refs only if available
      },
    });

    if (!response?.generatedImages?.length) {
      return NextResponse.json(
        { success: false, error: "Image generation failed" },
        { status: 500 }
      );
    }

    const publicUrls: string[] = [];
    for (let i = 0; i < response.generatedImages.length; i++) {
      const imgBytes = response.generatedImages[i]?.image?.imageBytes;
      if (!imgBytes) continue;

      const buffer = Buffer.from(imgBytes, "base64");
      const filePath = `${user.id}/${Date.now()}_${i + 1}.png`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from("generations")
        .upload(filePath, buffer, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: pub } = supabaseAdmin.storage
        .from("generations")
        .getPublicUrl(filePath);
      if (pub?.publicUrl) publicUrls.push(pub.publicUrl);
    }

    let recipe: string | null = null;
    let ingredients: string | null = null;

    if (foodMode && dishName) {
      try {
        const recipeRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Create a professional & highly detailed recipe for ${dishName}.
Format exactly as:
Ingredients:
- item 1
- item 2
Recipe:
1. step 1
2. step 2`,
                },
              ],
            },
          ],
        });

        const text =
          (recipeRes as any).output_text ??
          (recipeRes as any).candidates?.[0]?.content?.parts
            ?.map((p: any) => p.text)
            .join("\n") ??
          "";

        const ingMatch = text.match(
          /Ingredients:\s*([\s\S]*?)(?:\nRecipe:|$)/i
        );
        const recMatch = text.match(/Recipe:\s*([\s\S]*?)$/i);

        ingredients = ingMatch?.[1]?.trim() || null;
        recipe = recMatch?.[1]?.trim() || text.trim();
      } catch {
        console.warn("Recipe generation failed — continuing without recipe");
      }
    }

    try {
      await supabaseAdmin.from("generations").insert([
        {
          user_id: user.id,
          original_prompt: prompt,
          enhanced_prompt: enhancedPrompt,
          model: "imagen-4.0-ultra-generate-001",
          image_path: publicUrls.join(","),
          visibility: "private",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn("Database insert failed:", err);
    }

    return NextResponse.json({
      success: true,
      images: publicUrls,
      enhancedPrompt,
      recipe,
      ingredients,
      message: `Generated ${publicUrls.length} image(s) successfully.`,
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
