import React, { useState } from 'react';
import { Space, Delete, Trash2, Copy, Check, MessageSquare, CornerDownLeft } from 'lucide-react';

export default function SentenceBox({
  sentence = '',
  onAddSpace,
  onBackspace,
  onClear,
  lastAddedSign = null
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!sentence) return;
    try {
      await navigator.clipboard.writeText(sentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const wordCount = sentence.trim().length > 0 ? sentence.trim().split(/\s+/).length : 0;
  const charCount = sentence.length;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-glass flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Translated Sentence
            </h2>
            <p className="text-[11px] text-slate-400">
              Signs automatically append when held for 1s
            </p>
          </div>
        </div>

        {/* Counters & Last Sign */}
        <div className="flex items-center space-x-2">
          {lastAddedSign && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono animate-bounce">
              + Added "{lastAddedSign}"
            </span>
          )}
          <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars
          </span>
        </div>
      </div>

      {/* Main Sentence Text Area */}
      <div className="min-h-[110px] p-4 rounded-2xl bg-dark-900/80 border border-white/10 text-slate-100 font-medium text-lg lg:text-xl leading-relaxed flex items-center relative overflow-y-auto max-h-[180px]">
        {sentence ? (
          <div className="w-full break-words">
            <span>{sentence}</span>
            <span className="inline-block w-2.5 h-5 ml-1 bg-cyan-400 animate-pulse align-middle shadow-glow-cyan" />
          </div>
        ) : (
          <div className="text-slate-500 italic text-base flex items-center space-x-2">
            <span>Awaiting signs from camera...</span>
            <span className="inline-block w-2 h-4 bg-cyan-400/50 animate-pulse" />
          </div>
        )}
      </div>

      {/* Action Controls: Space, Backspace, Clear, Copy */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Space Button */}
          <button
            onClick={onAddSpace}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-all active:scale-95 shadow-sm"
            title="Append space between words"
          >
            <Space className="w-3.5 h-3.5 text-cyan-400" />
            <span>Space</span>
          </button>

          {/* Backspace Button */}
          <button
            onClick={onBackspace}
            disabled={sentence.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-semibold border border-white/10 transition-all active:scale-95 shadow-sm"
            title="Remove last character"
          >
            <Delete className="w-3.5 h-3.5 text-amber-400" />
            <span>Backspace</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={onClear}
            disabled={sentence.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 disabled:pointer-events-none text-red-300 text-xs font-semibold border border-red-500/20 transition-all active:scale-95 shadow-sm"
            title="Clear the entire text"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Clear</span>
          </button>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={sentence.length === 0}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all active:scale-95 shadow-glow-cyan/30"
          title="Copy sentence to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
