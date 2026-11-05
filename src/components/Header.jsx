import React from 'react';
import { Sparkles, Upload, BookOpen, Layers, Volume2, Cpu, CheckCircle2 } from 'lucide-react';

export default function Header({
  modelInfo,
  onOpenModelModal,
  onOpenGuideModal,
  isCameraActive,
  fps
}) {
  return (
    <header className="border-b border-white/10 glass-panel sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* App Title & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-glow-cyan">
            <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse-subtle" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                Gesture to Text
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ISL Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Indian Sign Language to Real-Time Text & Multilingual Speech
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {/* Active Model Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-cyan-300 text-[11px] max-w-[130px] truncate" title={modelInfo.source}>
              {modelInfo.source}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/40 text-cyan-300 uppercase font-mono">
              {modelInfo.inputType}
            </span>
          </div>

          {/* Camera Status */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-mono">
              {isCameraActive ? `${fps} FPS` : 'Camera Off'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Upload Model Button */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-glow-violet transition-all border border-violet-400/30 active:scale-95"
            title="Upload custom TensorFlow.js model (model.json + .bin + labels.json)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Model</span>
          </button>

          {/* ISL Guide Button */}
          <button
            onClick={onOpenGuideModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium border border-white/15 transition-all active:scale-95"
            title="View Indian Sign Language gesture cheat sheet"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">ISL Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
}
