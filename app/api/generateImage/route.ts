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

    // Enhance prompt if enabled
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
                  text: `You are an image-prompt enhancement engine.

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

RETURN ONLY THE ENHANCED PROMPT:`,
                },
              ],
            },
          ],
        });

        const text = enhancement.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join(" ");

        if (text && typeof text === "string") {
          enhancedPrompt = text.trim();
        }
      } catch (err) {
        console.warn("Prompt enhancement failed, using original prompt");
      }
    }

    // Build final prompt
    const finalPrompt = foodMode
      ? `Restaurant-style photograph of ${dishName || "a dish"} — ${enhancedPrompt}`
      : enhancedPrompt;

    // Prepare content parts with reference images if provided
    const contentParts: any[] = [{ text: finalPrompt }];
    
    for (const img of referenceImages) {
      if (typeof img === "string" && img.startsWith("data:image/")) {
        const [meta, base64Data] = img.split(",");
        const mimeType =
          meta.match(/data:(image\/[a-zA-Z+]+);base64/)?.[1] || "image/png";
        contentParts.push({
          inlineData: { mimeType, data: base64Data },
        });
      }
    }

    const publicUrls: string[] = [];

    // Generate images (one at a time for multiple variations)
    for (let i = 0; i < numberOfImages; i++) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: contentParts,
      });

      // Extract image from response parts
      const responseParts = response.candidates?.[0]?.content?.parts || [];
      
      for (const part of responseParts) {
        if (part.inlineData?.data) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          const filePath = `${user.id}/${Date.now()}_${i + 1}.png`;

          const { error: uploadErr } = await supabaseAdmin.storage
            .from("generations")
            .upload(filePath, buffer, { contentType: "image/png", upsert: true });

          if (uploadErr) {
            console.error("Upload error:", uploadErr);
            continue;
          }

          const { data: pub } = supabaseAdmin.storage
            .from("generations")
            .getPublicUrl(filePath);

          if (pub?.publicUrl) {
            publicUrls.push(pub.publicUrl);
          }
        }
      }
    }

    if (publicUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Image generation failed" },
        { status: 500 }
      );
    }

    let recipe: string | null = null;
    let ingredients: string | null = null;

    // Generate recipe if in food mode
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

        const text = recipeRes.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join("\n") ?? "";

        const ingMatch = text.match(/Ingredients:\s*([\s\S]*?)(?:\nRecipe:|$)/i);
        const recMatch = text.match(/Recipe:\s*([\s\S]*?)$/i);

        ingredients = ingMatch?.[1]?.trim() || null;
        recipe = recMatch?.[1]?.trim() || text.trim();
      } catch {
        console.warn("Recipe generation failed — continuing without recipe");
      }
    }

    // Save to database
    try {
      await supabaseAdmin.from("generations").insert([
        {
          user_id: user.id,
          original_prompt: prompt,
          enhanced_prompt: enhancedPrompt,
          model: "gemini-2.5-flash-image",
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