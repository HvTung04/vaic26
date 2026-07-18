import { useState } from 'react';
import { Zap, Sparkles, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/input';

export interface AIQuestionForgeProps {
  onGenerate: (sourceText: string) => void;
  isGenerating?: boolean;
  lastGeneratedCount?: number;
}

export function AIQuestionForge({ onGenerate, isGenerating, lastGeneratedCount }: AIQuestionForgeProps) {
  const [sourceText, setSourceText] = useState('');

  return (
    <div className="rounded-bento-lg bg-gradient-to-br from-[#6B3FCB] via-[#5B33C4] to-[#3A1F8F] p-6 text-white shadow-floating">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <Zap className="h-4 w-4" />
        </div>
        <h3 className="font-serif text-lg font-semibold">AI Question Forge</h3>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-white/75">
        Generate rigorous exam questions based on your curriculum tags or specific text snippets.
      </p>
      <Textarea
        rows={3}
        placeholder="Paste lesson summary or topic..."
        value={sourceText}
        onChange={(e) => setSourceText(e.target.value)}
        className="mb-4 border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
      />
      <button
        type="button"
        onClick={() => onGenerate(sourceText)}
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-lime py-3 text-sm font-bold text-[#3F5300] transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isGenerating ? 'Generating...' : 'Generate 5 Questions'}
      </button>
      {Boolean(lastGeneratedCount) && !isGenerating && (
        <p className="mt-3 text-center text-xs text-lime">
          {lastGeneratedCount} new questions added to your bank.
        </p>
      )}
    </div>
  );
}
