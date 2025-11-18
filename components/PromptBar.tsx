"use client";
import TextArea from "@/components/TextArea";
import { useState } from "react";

export default function PromptBar({
  loading,
  setLoading,
}: {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<
    "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
  >("1:1");
  const [foodMode, setFoodMode] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState("italian");
  const [showAspectRatio, setShowAspectRatio] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    if (!prompt.trim()) {
      setError("Please describe your image");
      return;
    }

    const currentPrompt = prompt;
    setPrompt("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generateImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentPrompt,
          dishName: foodMode
            ? currentPrompt.split(",")[0].trim()
            : "Generated Image",
          numberOfImages,
          aspectRatio,
          foodMode,
          enhancePrompt,
          cuisineType: selectedCuisine,
          referenceImages,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation failed");
      }

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
        onGenerate={onGenerate}
      />
    </div>
  );
}