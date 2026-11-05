import React from 'react';
import { Target, Clock, Zap, Award, CheckCircle } from 'lucide-react';

export default function PredictionCard({
  predictions = [],
  holdProgress = 0,
  isHolding = false,
  holdLabel = '',
  confidenceThreshold = 0.80,
  inputType = 'landmarks',
  modelName = 'ISL Neural Engine'
}) {
  const topPrediction = predictions.length > 0 ? predictions[0] : null;
  const isHighConfidence = topPrediction && topPrediction.confidence >= confidenceThreshold;

  // Format confidence percentage
  const formatPercent = (val) => `${(Math.max(0, Math.min(1, val || 0)) * 100).toFixed(1)}%`;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-glass flex flex-col justify-between relative overflow-hidden group">
      {/* Background radial ambient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/15 transition-all" />

      {/* Header of Prediction Card */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Recognition
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Hold {'>'} {(confidenceThreshold * 100).toFixed(0)}% for 1.0s to append
            </p>
          </div>
        </div>

        {/* Input Mode Pill */}
        <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300 flex items-center space-x-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span className="uppercase">{inputType}</span>
        </div>
      </div>

      {/* Hero Prediction Display */}
      <div className="my-6 flex flex-col sm:flex-row items-center justify-around gap-6 relative z-10">
        {/* Large Gesture Display with Circular Hold Progress Ring */}
        <div className="relative flex items-center justify-center">
          {/* SVG Circular Progress Ring */}
          <svg className="w-40 h-40 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="text-white/5"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Hold progress ring */}
            <circle
              cx="80"
              cy="80"
              r="70"
              className="transition-all duration-75"
              strokeWidth="7"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * (isHolding ? holdProgress : 0))}
              strokeLinecap="round"
              stroke="url(#progressGradient)"
              fill="transparent"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="50%" stopColor="#4facfe" />
                <stop offset="100%" stopColor="#7928ca" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Sign Badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
            {topPrediction ? (
              <>
                <span className={`font-black tracking-tight select-none transition-all duration-200 ${
                  topPrediction.label.length > 3 ? 'text-2xl lg:text-3xl' : 'text-5xl lg:text-6xl'
                } ${isHighConfidence ? 'bg-gradient-to-br from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,242,254,0.5)]' : 'text-slate-400'}`}>
                  {topPrediction.label}
                </span>
                <span className={`text-xs font-mono font-bold mt-1 ${
                  isHighConfidence ? 'text-cyan-300' : 'text-slate-500'
                }`}>
                  {formatPercent(topPrediction.confidence)}
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <span className="text-3xl font-light">--</span>
                <span className="text-[10px] uppercase font-mono mt-1">Show Hand</span>
              </div>
            )}
          </div>
        </div>

        {/* Hold Status Meter Card */}
        <div className="flex flex-col justify-center space-y-3 w-full sm:w-48">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hold Timer</span>
              </span>
              <span className={`font-bold ${isHolding ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`}>
                {(holdProgress * 1.0).toFixed(2)}s / 1.0s
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  holdProgress >= 1 
                    ? 'bg-emerald-400 shadow-glow-emerald' 
                    : isHolding 
                      ? 'shimmer-progress shadow-glow-cyan' 
                      : 'bg-transparent'
                }`}
                style={{ width: `${Math.min(100, (isHolding ? holdProgress : 0) * 100)}%` }}
              />
            </div>

            <div className="text-[10px] text-slate-400 font-mono text-center">
              {isHolding ? (
                <span className="text-cyan-300">Locking in "{holdLabel}"...</span>
              ) : topPrediction && !isHighConfidence ? (
                <span className="text-amber-400/80">Needs &ge; 80% confidence</span>
              ) : (
                <span>Hold steady for 1s</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top-3 Predictions Breakdown with Confidence Bars */}
      <div className="space-y-2.5 pt-4 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center space-x-1">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Top-3 Predictions</span>
          </span>
          <span className="font-mono text-[10px]">Confidence</span>
        </div>

        {predictions.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500 font-mono">
            No hands detected in frame
          </div>
        ) : (
          predictions.slice(0, 3).map((pred, index) => {
            const isTop = index === 0;
            const barWidth = Math.max(4, Math.round(pred.confidence * 100));

            return (
              <div
                key={pred.label || index}
                className={`p-2.5 rounded-xl transition-all border ${
                  isTop 
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-white' 
                    : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isTop ? 'bg-cyan-400 text-dark-900' : 'bg-white/10 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-bold tracking-wide">
                      {pred.label}
                    </span>
                  </div>
                  <span className={`font-semibold ${isTop ? 'text-cyan-300' : 'text-slate-400'}`}>
                    {formatPercent(pred.confidence)}
                  </span>
                </div>

                {/* Animated Confidence Bar */}
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      isTop
                        ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-glow-cyan'
                        : 'bg-gradient-to-r from-slate-500 to-slate-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
