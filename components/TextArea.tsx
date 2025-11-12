"use client";

import { useRef, useState } from "react";
import {
  ChefHat,
  Sparkles,
  Loader2,
  Wand2,
  Plus,
  AlertCircle,
  Check,
  ChevronUp,
} from "lucide-react";

const CUISINE_TYPES = [
  { id: "italian", name: "Italian", emoji: "🇮🇹" },
  { id: "mexican", name: "Mexican", emoji: "🇲🇽" },
  { id: "japanese", name: "Japanese", emoji: "🇯🇵" },
  { id: "indian", name: "Indian", emoji: "🇮🇳" },
  { id: "chinese", name: "Chinese", emoji: "🇨🇳" },
  { id: "american", name: "American", emoji: "🇺🇸" },
  { id: "french", name: "French", emoji: "🇫🇷" },
  { id: "thai", name: "Thai", emoji: "🇹🇭" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
];

interface PromptInputProps {
  prompt: string;
  setPrompt: (v: string) => void;
  referenceImages: string[];
  setReferenceImages: (v: string[]) => void;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  setAspectRatio: (v: "1:1" | "3:4" | "4:3" | "9:16" | "16:9") => void;
  showAspectRatio: boolean;
  setShowAspectRatio: (v: boolean) => void;
  numberOfImages: number;
  setNumberOfImages: (v: number) => void;
  foodMode: boolean;
  setFoodMode: (v: boolean) => void;
  enhancePrompt: boolean;
  setEnhancePrompt: (v: boolean) => void;
  selectedCuisine: string;
  setSelectedCuisine: (v: string) => void;
  loading: boolean;
  error: string | null;
  success: boolean;
  onGenerate: () => void;
}

export default function TextArea({
  prompt,
  setPrompt,
  referenceImages,
  setReferenceImages,
  aspectRatio,
  setAspectRatio,
  showAspectRatio,
  setShowAspectRatio,
  numberOfImages,
  setNumberOfImages,
  foodMode,
  setFoodMode,
  enhancePrompt,
  setEnhancePrompt,
  selectedCuisine,
  setSelectedCuisine,
  loading,
  error,
  success,
  onGenerate,
}: PromptInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => fileInputRef.current?.click();
const [showVariations, setShowVariations] = useState(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReferenceImages([
            ...referenceImages,
            event.target.result as string,
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
<div className="rounded-2xl bg-zinc-900/70 backdrop-blur-xl shadow-lg transition-all duration-300">
  {/* Top Section */}
<div className="flex flex-col gap-3 px-4 py-4">
  {/* Image previews above the plus icon */}
  {referenceImages.length > 0 && (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pb-1">
      {referenceImages.map((src, i) => (
        <div
          key={i}
          className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 group shrink-0"
        >
          <img
            src={src}
            alt={`ref-${i}`}
            className="object-cover w-full h-full"
          />
          <button
            onClick={() =>
              setReferenceImages(referenceImages.filter((_, idx) => idx !== i))
            }
            className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Upload + Textarea + Wand */}
  <div className="flex items-start gap-3">
    {/* Upload Button */}
    <div className="flex items-start">
      <button
        onClick={handleFileUpload}
        className="p-2 hover:bg-zinc-800 rounded-lg transition shrink-0"
        title="Upload image"
      >
        <Plus className="w-5 h-5 text-white" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>

    {/* Textarea — expands to fill available space */}
    <div className="flex-1 flex items-center">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your image..."
        disabled={loading}
        rows={1}
        className="w-full bg-transparent text-base text-zinc-200 outline-none resize-none placeholder:text-zinc-500 disabled:opacity-50 px-3 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent scrollbar-thumb-rounded-full"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            onGenerate();
          }
        }}
        style={{ height: "auto", minHeight: "40px" }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = `${Math.min(target.scrollHeight, 360)}px`;
        }}
      />
    </div>

    {/* Wand Icon */}
    <div className="flex items-center">
      <button
        onClick={() => setEnhancePrompt(!enhancePrompt)}
        className={`p-2 rounded-lg transition shrink-0 ${
          enhancePrompt
            ? "bg-purple-500/20 text-purple-400"
            : "hover:bg-zinc-800 text-zinc-400"
        }`}
        title="Toggle Enhance Prompt"
      >
        <Wand2 className="w-5 h-5" />
      </button>
    </div>
    </div>


  </div>
{/* Bottom Controls */}
<div className="flex items-center justify-between px-4 pb-4">
  <div className="flex items-center gap-2">
    {/* Aspect Ratio */}
    <div className="relative">
      <button
        onClick={() => setShowAspectRatio(!showAspectRatio)}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg bg-transparent backdrop-blur-md border border-white/10 hover:border-white/20 transition text-sm text-white/80 flex items-center gap-1"
      >
        <span>{aspectRatio}</span>
        <ChevronUp className="w-4 h-4" />
      </button>

      {showAspectRatio && (
        <div className="absolute bottom-full left-0 mb-1 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden z-50 min-w-[100px]">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => {
                setAspectRatio(ratio.value as any);
                setShowAspectRatio(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition ${
                aspectRatio === ratio.value
                  ? "bg-white/10 text-white"
                  : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Variations (image count) as popover */}
    <div className="relative">
  <button
    onClick={() => setShowVariations(!showVariations)}
    disabled={loading}
    className="px-3 py-1.5 rounded-lg bg-transparent backdrop-blur-md border border-white/10 hover:border-white/20 transition text-sm text-white/80 flex items-center gap-1"
  >
    <span>{numberOfImages}V</span>
    <ChevronUp className="w-4 h-4" />
  </button>

  {showVariations && (
    <div className="absolute bottom-full left-0 mb-1 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg overflow-hidden z-50 min-w-[100px]">
      {[1, 2, 3, 4].map((n) => (
        <button
          key={n}
          onClick={() => {
            setNumberOfImages(n);
            setShowVariations(false);
          }}
          className={`w-full flex px-2 py-2 text-left text-sm transition ${
            numberOfImages === n
              ? "bg-white/10 text-white"
              : "text-zinc-300 hover:bg-white/5"
          }`}
        >
          {n} Variations
        </button>
      ))}
    </div>
  )}
</div>

    {/* Food Mode */}
    <button
      onClick={() => setFoodMode(!foodMode)}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-md border transition flex items-center gap-2 ${
        foodMode
          ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
          : "bg-transparent border-white/10 text-white/70 hover:border-white/20"
      }`}
    >
      <ChefHat className="w-4 h-4" />
      <span>Food Mode</span>
    </button>
  </div>

  {/* Generate Button */}
  <button
    onClick={onGenerate}
    disabled={loading || !prompt.trim()}
    className="px-5 py-2 rounded-full bg-white cursor-pointer disabled:cursor-auto disabled:text-[#5F5F5F] disabled:bg-[#1f1f1f] text-black text-sm font-medium flex items-center gap-2 transition"
  >
    {loading ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Generating</span>
      </>
    ) : (
      <>
        <Sparkles className="w-4 h-4" />
        <span>Generate</span>
      </>
    )}
  </button>
</div>


      {/* Cuisine Selector */}
      {foodMode && (
        <div className="px-6 pb-6 border-t border-zinc-800 pt-4">
          <label className="text-xs font-medium text-zinc-400 mb-3 block">
            Cuisine Type
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {CUISINE_TYPES.map((cuisine) => (
              <button
                key={cuisine.id}
                onClick={() => setSelectedCuisine(cuisine.id)}
                disabled={loading}
                className={`p-3 rounded-xl border transition-all ${
                  selectedCuisine === cuisine.id
                    ? "border-orange-500 bg-orange-500/20"
                    : "border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800"
                }`}
              >
                <div className="text-2xl">{cuisine.emoji}</div>
                <div className="text-[10px] mt-1 text-zinc-400">
                  {cuisine.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
          <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <p className="text-sm text-green-200">Successfully generated!</p>
        </div>
      )}
    </div>
  );
}
