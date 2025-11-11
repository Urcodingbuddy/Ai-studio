"use client";
import TextArea from "@/components/TextArea";
import { useState, useRef } from "react";
import { Sparkles, Download, Wand2 } from "lucide-react";

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<
    "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
  >("1:1");
  const [foodMode, setFoodMode] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState("italian");
  const [showAspectRatio, setShowAspectRatio] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  async function onGenerate() {
    if (!prompt.trim()) {
      setError("Please describe your image");
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);
    setImages([]);
    setRecipe(null);
    setIngredients(null);
    setEnhancedPrompt("");

    try {
      const res = await fetch("/api/generateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          dishName: foodMode ? prompt.split(",")[0].trim() : "Generated Image",
          numberOfImages,
          aspectRatio,
          foodMode,
          enhancePrompt,
          cuisineType: selectedCuisine,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation failed");
      }

      setImages(Array.isArray(data.images) ? data.images : []);
      setEnhancedPrompt(data.enhancedPrompt || "");

      if (foodMode) {
        setRecipe(data.recipe ?? null);
        setIngredients(data.ingredients ?? null);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadImage(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }

  return (
    <div>
      <TextArea
        prompt={prompt}
        setPrompt={setPrompt}
        referenceImages={referenceImages}
        setReferenceImages={setReferenceImages}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        showAspectRatio={showAspectRatio}
        setShowAspectRatio={setShowAspectRatio}
        numberOfImages={numberOfImages}
        setNumberOfImages={setNumberOfImages}
        foodMode={foodMode}
        setFoodMode={setFoodMode}
        enhancePrompt={enhancePrompt}
        setEnhancePrompt={setEnhancePrompt}
        selectedCuisine={selectedCuisine}
        setSelectedCuisine={setSelectedCuisine}
        loading={loading}
        error={error}
        success={success}
        onGenerate={onGenerate}
      />
      {/* Results Section */}
      {images.length > 0 && (
        <div className="space-y-6">
          {/* Enhanced Prompt Display */}
          {enhancedPrompt && enhancePrompt && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                Enhanced Prompt
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {enhancedPrompt}
              </p>
            </div>
          )}

          {/* Images Grid */}
          <div
            className={`grid gap-4 ${
              images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {images.map((url, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900"
              >
                <img
                  src={url}
                  alt={`Generated ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Variation {i + 1}
                    </span>
                    <button
                      onClick={() =>
                        downloadImage(
                          url,
                          `generation_${Date.now()}_${i + 1}.png`
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-zinc-200 transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {foodMode && (ingredients || recipe) && (
            <div className="grid md:grid-cols-2 gap-4">
              {ingredients && (
                <div className="rounded-2xl border border-zinc-800 bg-linear-to-br from-orange-500/10 to-zinc-900 p-6">
                  <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
                    🥗 Ingredients
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-sans">
                    {ingredients}
                  </pre>
                </div>
              )}
              {recipe && (
                <div className="rounded-2xl border border-zinc-800 bg-linear-to-br from-pink-500/10 to-zinc-900 p-6">
                  <h3 className="text-lg font-semibold text-pink-400 mb-4 flex items-center gap-2">
                    👨‍🍳 Recipe
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-sans">
                    {recipe}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {loading && images.length === 0 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-blue-500 animate-spin mb-6" />
          <p className="text-lg font-medium text-zinc-300">
            Creating your image...
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            This may take a few moments
          </p>
        </div>
      )}
    </div>
  );
}
