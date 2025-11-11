import { Sparkles } from 'lucide-react';
        export function AiBadge() {
            return (
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-zinc-300">
                            AI-Powered Food Generation
                        </span>
                    </div>
                </div>
            );
        }