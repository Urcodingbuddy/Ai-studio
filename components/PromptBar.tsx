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
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
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
    </div>
  );
}
